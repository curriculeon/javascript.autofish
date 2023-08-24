/* global colors, Phaser, Tweakpane */

const TIMESCALE = 1;
const ZOOM = 1;
const PHYSICS_STEPS_PER_SEC = 60;
const DEBUG = false;
const DEBUG_PHYSICS = false;

const options = {
  alignWeight: 0.8,
  cohereWeight: 0.4,
  containRadius: 512,
  containTime: 1,
  containWeight: 0.8,
  maxForce: 120,
  maxSpeed: 60,
  nearRange: 60,
  quantity: 100,
  separateRange: 15,
  separateWeight: 0.2,
  wanderRadius: 0.25,
  wanderSpeed: 360,
  wanderStrength: 0.5,
  wanderWeight: 1
};

const debugOptions = {
  acceleration: false,
  align: true,
  cohere: true,
  contain: true,
  nearRange: false,
  separate: true,
  separateRange: false,
  velocity: false,
  wander: true,
  wanderRadius: true
};

const { hexColors } = colors;

const RandomAngle = Phaser.Math.Angle.Random;
const FloatBetween = Phaser.Math.FloatBetween;
const RotateTo = Phaser.Math.RotateTo;
const DegToRad = Phaser.Math.DegToRad;
const Remove = Phaser.Utils.Array.Remove;
const Vector2 = Phaser.Math.Vector2;
const Circle = Phaser.Geom.Circle;
const Line = Phaser.Geom.Line;
const ZERO = Phaser.Math.Vector2.ZERO;

const bodyIsEnabled = function (body) {
  return body.enable === true;
};

const bodyIsFish = function (body) {
  return body.gameObject.name === "fish";
};

const getBodyCenter = function (body) {
  return body.center;
};

const getAvg = function (vectors, out) {
  out.reset();

  for (const v of vectors) {
    out.add(v);
  }

  out.scale(1 / vectors.length);

  return out;
};

const projectBody = function (body, time, pOut) {
  const { center, velocity } = body;

  return pOut.set(center.x + time * velocity.x, center.y + time * velocity.y);
};

Phaser.Geom.Line.prototype.setFromPoints = function (a, b) {
  this.setTo(a.x, a.y, b.x, b.y);
};

Phaser.Geom.Line.prototype.setEmpty = function () {
  this.setTo(0, 0, 0, 0);
};


new Phaser.Game({
  backgroundColor: hexColors.navy,
  scene: Scene,
  audio: {
    disableAudio: true
  },
  input: {
    mouse: false,
    touch: false
  },
  physics: {
    default: "arcade",
    arcade: {
      debug: DEBUG_PHYSICS,
      fps: PHYSICS_STEPS_PER_SEC,
      timeScale: TIMESCALE,
      useTree: true
    }
  },
  scale: {
    width: 1024,
    height: 1024,
    // mode: Phaser.Scale.FIT,
    // max: { width: 1024, height: 1024 },
    // min: { width: 512, height: 512 },
  }
});

