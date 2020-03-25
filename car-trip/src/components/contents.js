AFRAME.registerComponent("contents", {
  multiple: true,
  init: function() {
    let files = [
      "blue-chest.ply.glb",
      // "charlie-decimated.ply.glb",
      "crosstrek-back-seat-down-decimated.ply.glb",
      // "crosstrek-backset-decimated.ply.glb",
      "crosstrek-trunk-decimated.ply.glb",
      "food-box.ply.glb",
      "ice-chest.ply.glb",
      "suite-case.ply.glb",
      "suite-case.ply.glb"
    ]

    let radius = 2
    let step = (files.length / Math.PI) * 2
    let theta = 0
    this.modelElTemplate = document.getElementById("template-model").cloneNode()
    this.parentElTemplate = document
      .getElementById("template-contents")
      .cloneNode()
    document.getElementById("template-model").remove()
    document.getElementById("template-contents").remove()
    for (const file of files) {
      const modelEl = this.modelElTemplate.cloneNode()
      const parentEl = this.parentElTemplate.cloneNode()
      modelEl.setAttribute("src", `./assets/car-trip/${file}`)
      parentEl.appendChild(modelEl)
      parentEl.setAttribute("id", `contents-${file}-${theta}`)

      let x, y, z
      x = radius * Math.cos(theta * step)
      z = radius * Math.sin(theta * step)
      y = 1.5
      parentEl.setAttribute("position", `${x} ${y} ${z}`)
      setTimeout(() => {
        this.el.sceneEl.append(parentEl)
      }, theta * 3000)
      console.log(`append: ${file}`)
      theta++
    }
  },
  remove: function() {
    for (const el of document.getElementsByClassName("contents")) {
      el.remove()
    }
    this.el.sceneEl.append(this.modelElTemplate)
    this.el.sceneEl.append(this.parentElTemplate)
  }
})
