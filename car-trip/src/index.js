// AFRAME first!
require("aframe")

require("aframe-extras")
require("super-hands")
require("aframe-physics-system")
require("aframe-physics-extras")
require("aframe-teleport-controls")

function requireAll(req) {
  req.keys().forEach(req)
}
requireAll(require.context("./components/", true, /\.js$/))

require("./scene.html")
