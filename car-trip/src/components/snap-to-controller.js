AFRAME.registerComponent('snap-to-controller', {
  init: function () {
    var el = this.el
    el.addEventListener('xbuttondown', function (e) {
      console.log(e)
      // el.setAttribute('animation', {
      //   property: 'position',
      //   from: el.object3D.position,  // Forgot if you need to serialize this to string.
      //   to: toEl.object3D.position,
      //   dur: 500
      // });
    })
    el.addEventListener('xbuttonup', function (e) {
      console.log(e)
      // el.setAttribute('collision-filter', {collisionForces: false})
    })
  }
});