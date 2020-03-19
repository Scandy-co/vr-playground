/**
 * source inspiration:
 * https://gist.github.com/donmccurdy/9f094575c1f1a48a2ddda513898f6496
 */
const fs = require("fs")
const gltfPipeline = require("gltf-pipeline")
const commandLineArgs = require("command-line-args")

// fix XMLHttpRequest and document issues for three.js on node
// var XMLHttpRequest = require("xhr2")
// global.XMLHttpRequest = XMLHttpRequest

const atob = require("atob")
const { Blob, FileReader } = require("vblob")
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

require("three/examples/js/loaders/STLLoader")
require("three/examples/js/loaders/PLYLoader")
require("three/examples/js/loaders/OBJLoader")
require("three/examples/js/loaders/MTLLoader")
require("three/examples/js/loaders/GLTFLoader")
require("three/examples/js/exporters/STLExporter")
require("three/examples/js/exporters/OBJExporter")
require("three/examples/js/exporters/PLYExporter")
require("three/examples/js/exporters/GLTFExporter")

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
  let bin = fs.readFileSync(input_path)

  console.log("loading mesh from ", input_path)
  if (ext == "gltf" || ext == "glb") {
    let gltf = {}
    if (ext == "gltf") {
      const results = await gltfPipeline.processGltf(bin)
      gltf = results.gltf
    } else if (ext == "glb") {
      const results = await gltfPipeline.glbToGltf(bin)
      gltf = results.gltf
    }
    gltf["asset"] = {
      version: 1
    }
    gltf = JSON.stringify(gltf)

    loader = new THREE.GLTFLoader()
    const prom = new Promise((resolve, reject) => {
      loader.parse(
        gltf,
        input_path,
        _gltf => {
          // console.log("loaded _gltf", _gltf)
          return resolve(_gltf.scene)
        },
        reject
      )
    })
    mesh = await prom
  } else {
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
