AFRAME.registerComponent('foo', {
  init: function() {
     this.target = document.querySelector("#target")
  },
  tick: function(t, dt) {
     var currentPosition = this.el.object3D.position;
     var distanceToTarget = currentPosition.distanceTo(target.object3D.position);
     if (distanceToTarget < 1) return;

     var targetPos = this.el.object3D.worldToLocal(target.object3D.position.clone())
     var distance = dt*this.data.speed / 4000;      
     this.el.object3D.translateOnAxis(targetPos, distance);
  }
});