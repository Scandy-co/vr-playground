AFRAME.registerComponent("input-listen", {
  init: function() {
    // A-button Pressed
    this.el.addEventListener("abuttondown", function(e) {
      // Start pointing position to teleport
      this.emit("teleportstart")
    })

    // X-button Released
    this.el.addEventListener("abuttonup", function(e) {
      // Jump to pointed position
      this.emit("teleportend")
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
  tick: function() {}
})
