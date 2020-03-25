/* global AFRAME, THREE */
const inherit = AFRAME.utils.extendDeep
const physicsCore = require("super-hands/reaction_components/prototypes/physics-grab-proto.js")
const buttonsCore = require("super-hands/reaction_components/prototypes/buttons-proto.js")
// new object with all core modules
const base = inherit({}, physicsCore, buttonsCore)
AFRAME.registerComponent(
  "grabbabily",
  inherit(base, {
    schema: {
      maxGrabbers: { type: "int", default: NaN },
      invert: { default: false },
      suppressY: { default: false }
    },
    init: function() {
      this.GRABBED_STATE = "grabbed"
      this.GRAB_EVENT = "grab-start"
      this.UNGRAB_EVENT = "grab-end"
      this.grabbed = false
      this.grabbers = []
      this.constraints = new Map()
      this.deltaPositionIsValid = false
      this.grabDistance = undefined
      this.grabDirection = { x: 0, y: 0, z: -1 }
      this.grabOffset = { x: 0, y: 0, z: 0 }
      // persistent object speeds up repeat setAttribute calls
      this.destPosition = { x: 0, y: 0, z: 0 }
      this.deltaPosition = new THREE.Vector3()
      this.targetPosition = new THREE.Vector3()
      this.grabOffsetMatrix = new THREE.Matrix4()
      this.parentOffsetMatrix = new THREE.Matrix4()
      this.physicsInit()

      this.el.addEventListener(this.GRAB_EVENT, e => this.start(e))
      this.el.addEventListener(this.UNGRAB_EVENT, e => this.end(e))
    },
    update: function() {
      this.physicsUpdate()
      this.xFactor = this.data.invert ? -1 : 1
      this.zFactor = this.data.invert ? -1 : 1
      this.yFactor = (this.data.invert ? -1 : 1) * !this.data.suppressY
    },
    tick: (function() {
      const grabeeMatrix = new window.THREE.Matrix4()
      const ignoreScale = new window.THREE.Vector3()
      return function() {
        if (this.grabber && this.grabbed) {
          grabeeMatrix.multiplyMatrices(
            this.grabber.object3D.matrixWorld,
            this.grabOffsetMatrix
          )
          grabeeMatrix.multiplyMatrices(this.parentOffsetMatrix, grabeeMatrix)
          // using decomp over direct Object3D.matrix manipulation
          // keeps in sync with other A-Frame components
          grabeeMatrix.decompose(
            this.el.object3D.position,
            this.el.object3D.quaternion,
            // let stretchable manage scale
            ignoreScale
          )
        }
      }
    })(),
    remove: function() {
      this.el.removeEventListener(this.GRAB_EVENT, this.start)
      this.el.removeEventListener(this.UNGRAB_EVENT, this.end)
      this.physicsRemove()
    },
    start: function(evt) {
      if (evt.defaultPrevented || !this.startButtonOk(evt)) {
        return
      }
      // room for more grabbers?
      const grabAvailable =
        !Number.isFinite(this.data.maxGrabbers) ||
        this.grabbers.length < this.data.maxGrabbers

      if (this.grabbers.indexOf(evt.detail.hand) === -1 && grabAvailable) {
        if (!evt.detail.hand.object3D) {
          console.warn("grabbable entities must have an object3D")
          return
        }

        this.grabbers.push(evt.detail.hand)
        // initiate physics if available, otherwise manual
        if (!this.physicsStart(evt) && !this.grabber) {
          this.grabber = evt.detail.hand
          this.resetGrabber()
        }
        // notify super-hands that the gesture was accepted
        if (evt.preventDefault) {
          evt.preventDefault()
        }
        this.grabbed = true
        this.el.addState(this.GRABBED_STATE)
      }
    },
    end: function(evt) {
      const handIndex = this.grabbers.indexOf(evt.detail.hand)
      if (evt.defaultPrevented || !this.endButtonOk(evt)) {
        return
      }
      this.resetGrabber()
      this.grabbed = false
      this.el.removeState(this.GRABBED_STATE)
      if (evt.preventDefault) {
        evt.preventDefault()
      }
    },
    resetGrabber: function() {
      if (!this.grabber) {
        return false
      }
      this.grabber.object3D.updateMatrixWorld()
      this.el.object3D.parent.updateMatrixWorld()
      // save difference between grabber world matrix and grabee world matrix
      this.grabOffsetMatrix
        .getInverse(this.grabber.object3D.matrixWorld)
        .multiply(this.el.object3D.matrixWorld)
      // save difference between grabee world and local matrices
      this.parentOffsetMatrix.getInverse(this.el.object3D.parent.matrixWorld)
      return true
    },
  })
)
