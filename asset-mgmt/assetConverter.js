/**
 * source inspiration:
 * https://gist.github.com/donmccurdy/9f094575c1f1a48a2ddda513898f6496
 */
const fs = require("fs")
const path = require("path")

const gltfPipeline = require("gltf-pipeline")
const commandLineArgs = require("command-line-args")

// fix XMLHttpRequest and document issues for three.js on node
// var XMLHttpRequest = require("xhr2")
// global.XMLHttpRequest = XMLHttpRequest

const atob = require("atob")
const { Blob, FileReader } = require("vblob")
const { Image } = require("image-js")
const THREE = require("three")

// Patch global scope to imitate browser environment.
global.atob = atob
global.window = global
global.Blob = Blob
global.FileReader = FileReader
global.THREE = THREE
// Do we enable canvas?
// const Canvas = require("canvas")
const Canvas = false
global.document = {
  createElementNS: (namespaceURI, qualifiedName) => {
    if (qualifiedName == "img") {
      const img = new Image()
      img.removeEventListener = (name, fn) => {
        // console.log(`img.removeEventListener(${name},${fn})`)
      }
      img.addEventListener = (name, fn) => {
        // console.log(`img.addEventListener(${name},${fn})`)
        setTimeout(fn, 10)
      }
      return img
    }
    throw new Error(`Cannot create node ${qualifiedName}`)
  },
  createElement: nodeName => {
    if (!Canvas || nodeName !== "canvas")
      throw new Error(`Cannot create node ${nodeName}`)
    const canvas = new Canvas(256, 256)
    // This isn't working — currently need to avoid toBlob(), so export to embedded .gltf not .glb.
    // canvas.toBlob = function () {
    //   return new Blob([this.toBuffer()]);
    // };
    return canvas
  }
}
/**
 * The Node.js filesystem API ('fs') returns a Buffer instance, which may be a
 * view into a larger buffer. Because GLTFLoader parsing expects a raw
 * ArrayBuffer, we make a trimmed copy of the original here.
 *
 * @param  {Buffer} buffer
 * @return {ArrayBuffer}
 */
const trimBuffer = buffer =>
  buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength)

// GLTFLoader is more efficient with access to a TextDecoder instance, which is
// in the global namespace in the browser.
global.TextDecoder = require("util").TextDecoder

// requires will add these to the THREE namespace
require("three/examples/js/loaders/STLLoader")
require("three/examples/js/loaders/PLYLoader")
require("three/examples/js/loaders/OBJLoader")
require("three/examples/js/loaders/MTLLoader")
require("three/examples/js/loaders/GLTFLoader")
require("three/examples/js/exporters/STLExporter")
require("three/examples/js/exporters/OBJExporter")
require("three/examples/js/exporters/PLYExporter")
require("three/examples/js/exporters/GLTFExporter")

// Custom-built version of DRACOLoader, for Node.js.
const NodeDRACOLoader = require("./NodeDRACOLoader.js")

// GLTFLoader prefetches the decoder module, when Draco is needed, to speed up
// parsing later. This isn't necessary for our custom decoder, so set the
// method to a no-op.
THREE.DRACOLoader.getDecoderModule = () => {}

const VALID_EXTS = ["stl", "obj", "ply", "glb", "gltf"]

const optionDefinitions = [
  { name: "verbose", alias: "v", type: Boolean },
  { name: "input", alias: "i", type: String },
  { name: "output", alias: "o", type: String },
  { name: "texture", type: String, help: "Texture map file" },
  { name: "material", type: String, help: "Material file for .obj files" },
  {
    name: "draco",
    alias: "c",
    help: "Draco compression GLTF/GLB. Defaults to 0 (off)",
    type: Number,
    default: 0
  }
]

const fileUtils = require("./fileUtils")

const options = commandLineArgs(optionDefinitions)

const loadMesh = async input_path => {
  let input_mesh = null
  const ext = fileUtils.getFileExtension(input_path)

  let loader = null
  var mesh = null
  var geometry = null
  var material = new THREE.MeshStandardMaterial()

  console.log("loading mesh from ", input_path)
  if (ext == "gltf" || ext == "glb") {
    // gltfPipeline loader wants a string
    let bin = fs.readFileSync(input_path)
    let gltf = {}
    const parentDir = path.dirname(input_path)
    const opts = {
      separateTextures: true,
      resourceDirectory: parentDir
    }
    if (ext == "gltf") {
      const results = await gltfPipeline.processGltf(JSON.parse(bin), opts)
      gltf = results.gltf
    } else if (ext == "glb") {
      const results = await gltfPipeline.glbToGltf(bin, opts)
      gltf = results.gltf
    }
    // GLTFLoader.parse wants a string or "magic" data
    gltf = JSON.stringify(gltf)
    console.log("processed to gltf from gltf-pipeline")

    loader = new THREE.GLTFLoader()
    // Patch the DracoLoader for our node use case
    loader.setDRACOLoader(new NodeDRACOLoader())

    const prom = new Promise((resolve, reject) => {
      loader.parse(
        gltf,
        "",
        threeGLTF => {
          // console.log("loaded threeGLTF", threeGLTF)
          // const group = new THREE.Group()
          // for (const child in threeGLTF.scene.children) {
          //   group.add(child)
          // }
          return resolve(threeGLTF.scene)
        },
        reject
      )
    })
    mesh = await prom
  } else {
    // All these loaders want binary data
    let bin = fs.readFileSync(input_path, "binary")

    if (ext == "stl") {
      loader = new THREE.STLLoader()
    } else if (ext == "ply") {
      loader = new THREE.PLYLoader()
    } else if (ext == "obj") {
      loader = new THREE.OBJLoader()
      mtlLoader = new THREE.MTLLoader()
      let mtlPath = options.material
      if (mtlPath) {
        let mtlBin = fs.readFileSync(mtlPath, "binary")
        material = mtlLoader.parse(mtlBin)
      }
    }

    geometry = loader.parse(bin)
    mesh = new THREE.Mesh(geometry, material)
  }

  return mesh
}

const exportMesh = async (output_path, input) => {
  const ext = fileUtils.getFileExtension(output_path)
  return new Promise((resolve, reject) => {
    const onDone = async content => {
      console.log("onDone got content")
      const gltfOptions = {}
      if (options.draco > 0) {
        gltfOptions["dracoOptions"] = {
          compressionLevel: options.draco
        }
      }
      if (ext == "glb") {
        const processed = await gltfPipeline.gltfToGlb(content, gltfOptions)
        content = processed.glb
      }
      if (ext == "gltf") {
        const processed = await gltfPipeline.processGltf(content, gltfOptions)
        content = JSON.stringify(processed.gltf)
      }
      fs.writeFileSync(output_path, content)
      resolve(output_path)
    }
    try {
      console.log(`saving to: `, output_path)
      var exporter = null
      if (ext == "gltf" || ext == "glb") {
        const opts = {
          binary: false
        }
        exporter = new THREE.GLTFExporter()
        exporter.parse(input, onDone, opts)
      } else if (ext == "ply") {
        exporter = new THREE.PLYExporter()
        onDone(exporter.parse(input))
      } else if (ext == "stl") {
        exporter = new THREE.STLExporter()
        // For some reason STL does not have onDone
        onDone(exporter.parse(input))
      } else if (ext == "obj") {
        exporter = new THREE.OBJExporter()
        // For some reason OBJ does not have onDone
        onDone(exporter.parse(input))
      }
    } catch (e) {
      console.log("error creating export", e)
      reject(e)
    }
  })
}

let input_path = options["input"]
let output_path = options["output"]

if (!VALID_EXTS.includes(fileUtils.getFileExtension(input_path))) {
  console.error(`${input_path} is not a valid extension`)
  return -1
}

if (!VALID_EXTS.includes(fileUtils.getFileExtension(output_path))) {
  console.error(`${output_path} is not a valid extension`)
  return -1
}

console.log(`going to convert ${input_path} to ${output_path}`)
loadMesh(input_path)
  .then(input_mesh => {
    console.log("loaded mesh ", input_path)
    return exportMesh(output_path, input_mesh)
  })
  .then(() => {
    console.log("ok")
  })
  .catch(e => {
    console.log("caught error", e)
  })
