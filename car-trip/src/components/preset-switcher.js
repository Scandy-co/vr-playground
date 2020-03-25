AFRAME.registerComponent('preset-switcher', {
  init: function () {
    var el = this.el;
    var presets = ['forest', 'default', 'contact', 'egypt', 'checkerboard', 'goaland', 'yavapai', 'goldmine', 'threetowers', 'poison', 'arches', 'tron', 'japan', 'dream', 'volcano', 'starry', 'osiris'];
    var preset = 0;

    window.addEventListener('keydown', function (evt) {
      if (evt.keyCode == 32) {
        nextPreset(1);
      }
    });

    el.addEventListener('xbuttondown', function (evt) {
      console.log('x button pressed!')
      nextPreset(1);
    })

    document.querySelector('.nextPreset').addEventListener('click', function () {
      console.log('next preset clicked!')
      nextPreset(1);
    });

    function nextPreset(dir) {
      if (preset === 0 && dir === -1) {
        preset = presets.length - 1;
      }
      else {
        preset = (preset + dir) % presets.length;
      }
      document.querySelector('h1').innerHTML = presets[preset];
      el.setAttribute('environment', {preset: presets[preset]});
    };
  }
});