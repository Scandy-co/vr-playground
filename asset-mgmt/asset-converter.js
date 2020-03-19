/**
 * source inspiration:
 * https://gist.github.com/donmccurdy/9f094575c1f1a48a2ddda513898f6496
 */
const fs = require("fs")
const gltfPipeline = require("gltf-pipeline")

// fix XMLHttpRequest and document issues for three.js on node
var XMLHttpRequest = require("xhr2")
global.XMLHttpRequest = XMLHttpRequest

const Canvas = require("canvas")
const { Blob, FileReader } = require("vblob")
const THREE = require("three")

// Patch global scope to imitate browser environment.
global.window = global
global.Blob = Blob
global.FileReader = FileReader
global.THREE = THREE
global.document = {
  createElement: nodeName => {
    if (nodeName !== "canvas") throw new Error(`Cannot create node ${nodeName}`)
    const canvas = new Canvas(256, 256)
    // This isn't working — currently need to avoid toBlob(), so export to embedded .gltf not .glb.
    // canvas.toBlob = function () {
    //   return new Blob([this.toBuffer()]);
    // };
    return canvas
  }
}

const STLLoader = require("three-stl-loader")(THREE)
const GLTFExporter = require("three-gltf-exporter")

const commandLineArgs = require("command-line-args")

const fileUtils = require("./fileUtils")

const optionDefinitions = [
  { name: "verbose", alias: "v", type: Boolean },
  { name: "input", alias: "i", type: String },
  { name: "output", alias: "o", type: String }
]

const options = commandLineArgs(optionDefinitions)

const loadSTL = input_path => {
  var loader = new STLLoader()
  let bin = fs.readFileSync(input_path, "binary")
  geometry = loader.parse(bin)
  var material = new THREE.MeshStandardMaterial()
  var mesh = new THREE.Mesh(geometry, material)
  return mesh
}

const loadMesh = input_path => {
  let input_mesh = null
  const ext = fileUtils.getFileExtension(input_path)
  if (ext == "stl") {
    console.log("loading stl from ", input_path)
    input_mesh = loadSTL(input_path)
  }

  return input_mesh
}

const exportMesh = (output_path, input) => {
  const ext = fileUtils.getFileExtension(output_path)
  if (ext == "gltf" || ext == "glb") {
    var gltfExporter = new GLTFExporter()

    return new Promise((resolve, reject) => {
      try {
        gltfExporter.parse(input, async content => {
          const gltfOptions = {
            dracoOptions: {
              compressionLevel: 7
            }
          }
          if (ext == "glb") {
            const processed = await gltfPipeline.gltfToGlb(content, gltfOptions)
            content = processed.glb
          }
          console.log(`saving to: `, output_path)
          fs.writeFileSync(output_path, content)
          resolve(output_path)
        })
      } catch (e) {
        reject(e)
      }
    })
  }
}

let input_path = options["input"]
let output_path = options["output"]

console.log(`going to convert ${input_path} to ${output_path}`)
let input_mesh = loadMesh(input_path)
console.log("loaded mesh ", input_path)
exportMesh(output_path, input_mesh)
  .then(() => {
    console.log("ok")
  })
  .catch(e => {
    console.log(e)
  })
