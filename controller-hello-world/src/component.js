
AFRAME.registerComponent("input-listen", {
  init: function() {
    // Declaration and initialization of flag
    // which explains grip button is pressed or not.
    // "this.el" reffers ctlR or L in this function
    this.el.grip = false

    // Called when trigger is pressed
    this.el.addEventListener("triggerdown", function(e) {
      // "this" refers ctlR or L in this function
      var point = this.object3D.getWorldPosition()

      // txt.setAttribute("value",point.x.toFixed(2)+","+point.y.toFixed(2)+","+point.z.toFixed(2));

      // Creating ball entity.
      var ball = document.createElement("a-sphere")
      ball.setAttribute("class", "ball")
      ball.setAttribute("scale", "0.2 0.2 0.2")
      ball.setAttribute("position", point)
      ball.setAttribute("dynamic-body", "shape: sphere; sphereRadius:0.2; ")

      // Getting raycaster which was attached to ctrlR or L
      var dir = this.getAttribute("raycaster").direction

      // Setting shoot direction and speed
      var force = new THREE.Vector3(dir.x, dir.y, dir.z)
      force.multiplyScalar(2000)
      ball.force = this.object3D.localToWorld(force)

      // Instantiate ball entity in a-scene
      var scene = document.querySelector("a-scene")
      scene.appendChild(ball)

      // shoot "ball" after physics information getting ready.
      ball.addEventListener("body-loaded", function(e) {
        // "this" reffers ball entity in this function
        var p = this.object3D.position
        // this.velocity was calculated before this function is called.
        var f = this.force
        this.body.applyForce(
          new CANNON.Vec3(f.x, f.y, f.z),
          new CANNON.Vec3(p.x, p.y, p.z)
        )
      })
    })

    // Grip Pressed
    this.el.addEventListener("gripdown", function(e) {
      // Setting grip flag as true.
      this.grip = true
    })

    // Grip Released
    this.el.addEventListener("gripup", function(e) {
      // Setting grip flag as false.
      this.grip = false
    })

    // Raycaster intersected with something.
    this.el.addEventListener("raycaster-intersection", function(e) {
      // Store first selected object as selectedObj
      this.selectedObj = e.detail.els[0]
    })
    // Raycaster intersection is finished.
    this.el.addEventListener("raycaster-intersection-cleared", function(e) {
      // Clear information of selectedObj
      this.selectedObj = null
    })

    // A-button Pressed
    this.el.addEventListener("abuttondown", function(e) {
      // Aqurire all ball entities which are instantiated in a-scene
      var els = document.querySelectorAll(".ball")
      // Destroy all ball entities
      for (var i = 0; i < els.length; i++) {
        els[i].parentNode.removeChild(els[i])
      }
    })

    // X-button Pressed
    this.el.addEventListener("xbuttondown", function(e) {
      // Start pointing position to teleport
      this.emit("teleportstart")
    })

    // X-button Released
    this.el.addEventListener("xbuttonup", function(e) {
      // Jump to pointed position
      this.emit("teleportend")
    })

    // console.log(this);
  },

  // called evry frame.
  tick: function() {
    if (!this.el.selectedObj) {
      return
    }
    if (!this.el.grip) {
      return
    }
    // Getting raycaster component which is attatched to ctlR or L
    // this.el means entity of ctlR or L in this function.
    var ray = this.el.getAttribute("raycaster").direction
    // setting tip of raycaster as 1.1m forward of controller.
    var p = new THREE.Vector3(ray.x, ray.y, ray.z)
    p.normalize()
    p.multiplyScalar(1.2)
    // Convert local position into world coordinate.
    this.el.object3D.localToWorld(p)
    // Move selected object to follow the tip of raycaster.
    this.el.selectedObj.object3D.position.set(p.x, p.y, p.z)
  }
})
