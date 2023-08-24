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

class Fish extends Phaser.GameObjects.Triangle {
  constructor(scene, x, y) {
    super(scene, x, y, 0, 4, 16, 0, 16, 8, hexColors.green, 0.8);

    this.name = "fish";

    // Steering forces
    this.fAlign = new Vector2();
    this.fCohere = new Vector2();
    this.fContain = new Vector2();
    this.fSeparate = new Vector2();
    this.fWander = new Vector2();

    // Positions
    this.pCohere = new Vector2();
    this.pContain = new Vector2();
    this.pWander = new Vector2();

    // Areas
    this.separateCirc = new Circle();
    this.nearCirc = new Circle();
    this.wanderCirc = new Circle();

    // Debug draw
    this.debugWanderCirc = new Circle();

    const { world } = this.scene.physics;

    this.wanderHost = scene.add.zone(0, 0, 1, 1);
    world.enableBody(this.wanderHost);
    this.wanderBody = this.wanderHost.body;

    this.once("destroy", this.onDestroy, this);
  }

  onDestroy() {
    this.wanderHost.destroy();
    this.wanderHost = null;
    this.wanderBody = null;
  }

  align(bodies, fAlign) {
    fAlign.reset();

    if (bodies.length === 0) return fAlign;

    const dBody = new Vector2();
    const vBody = new Vector2();
    const vSum = new Vector2();

    let productSum = 0;

    for (const body of bodies) {
      this.distanceTo(body.center, dBody);

      const product = dBody.dot(this.body.velocity) / dBody.length();

      if (product <= 0) continue;

      productSum += product;

      vBody.copy(body.velocity).scale(product);

      vSum.add(vBody);
    }

    if (vSum.equals(ZERO)) return fAlign;

    vSum.scale(1 / productSum);

    this.steer(vSum, fAlign);

    return fAlign;
  }

  flee(pTarget, fFlee) {
    this.distanceFrom(pTarget, fFlee);

    // Desired velocity.
    fFlee.setLength(options.maxSpeed);

    return this.steer(fFlee, fFlee);
  }

  cohere(bodies, fCohere) {
    fCohere.reset();

    if (bodies.length === 0) return fCohere;

    getAvg(bodies.map(getBodyCenter), this.pCohere);

    return this.seek(this.pCohere, fCohere);
  }

  distanceFrom(pTarget, dFrom) {
    return dFrom.copy(this.body.center).subtract(pTarget);
  }

  distanceTo(pTarget, dTo) {
    return dTo.copy(pTarget).subtract(this.body.center);
  }

  draw(graphic) {
    const {
      acceleration,
      align,
      cohere,
      contain,
      nearRange,
      separate,
      separateRange,
      velocity,
      wander,
      wanderRadius
    } = debugOptions;

    if (align) {
      this.drawSteer(graphic, this.fAlign, hexColors.yellow);
    }

    if (cohere) {
      this.drawSteer(graphic, this.fCohere, hexColors.yellow);
      this.drawPoint(graphic, this.pCohere, hexColors.yellow);
    }

    if (contain) {
      this.drawSteer(graphic, this.fContain, hexColors.red);
      this.drawPoint(graphic, this.pContain, hexColors.red);
    }

    if (separate) {
      this.drawSteer(graphic, this.fSeparate, hexColors.yellow);
    }

    if (nearRange) {
      this.drawCircle(graphic, this.nearCirc, hexColors.gray);
    }

    if (separateRange) {
      this.drawCircle(graphic, this.separateCirc, hexColors.gray);
    }

    if (wander) {
      this.drawSteer(graphic, this.fWander, hexColors.fuchsia);
      this.drawCircle(graphic, this.debugWanderCirc, hexColors.fuchsia);
    }

    if (velocity) {
      this.drawSteer(graphic, this.body.velocity, hexColors.lime);
    }

    if (acceleration) {
      this.drawSteer(graphic, this.body.acceleration, hexColors.red);
    }
  }

  drawCircle(graphic, circle, color) {
    graphic.lineStyle(1, color).strokeCircleShape(circle);
  }

  drawLine(graphic, line, color) {
    graphic.lineStyle(1, color).strokeLineShape(line);
  }

  drawPoint(graphic, point, color) {
    graphic.fillStyle(color).fillPointShape(point, 3);
  }

  drawRect(graphic, rect, color) {
    graphic.lineStyle(1, color).strokeRectShape(rect);
  }

  drawSteer(graphic, fSteer, color) {
    const { x, y } = this.body.center;

    graphic.lineStyle(1, color).lineBetween(x, y, x + fSteer.x, y + fSteer.y);
  }

  drawVector(graphic, vector, x, y, color) {
    graphic.lineStyle(1, color).lineBetween(x, y, x + vector.x, y + vector.y);
  }

  overlap(rect, includeDynamic, includeStatic) {
    const bodies = this.scene.physics.overlapRect(
      rect.x,
      rect.y,
      rect.width,
      rect.height,
      includeDynamic,
      includeStatic
    );

    Remove(bodies, this.body);

    return bodies;
  }

  overlapCirc(circ, includeDynamic, includeStatic) {
    const bodies = this.scene.physics.overlapCirc(
      circ.x,
      circ.y,
      circ.radius,
      includeDynamic,
      includeStatic
    );

    Remove(bodies, this.body);

    return bodies;
  }

  overlapPoint(point, includeDynamic, includeStatic) {
    const bodies = this.scene.physics.overlapRect(
      point.x,
      point.y,
      1,
      1,
      includeDynamic,
      includeStatic
    );

    Remove(bodies, this.body);

    return bodies;
  }

  seek(pTarget, fSeek) {
    // Distance to target.
    this.distanceTo(pTarget, fSeek);

    // Desired velocity.
    fSeek.scale(PHYSICS_STEPS_PER_SEC);

    // Steering force.
    return this.steer(fSeek, fSeek);
  }

  separate(bodies, fSeparate) {
    fSeparate.reset();

    if (bodies.length === 0) return fSeparate;

    // Distance to each body. Recycled.
    const dBody = new Vector2();

    // Separation force to each body. Recycled.
    const fBody = new Vector2();

    for (const body of bodies) {
      this.distanceFrom(body.center, dBody);

      const len = dBody.length();

      if (len === 0) continue;

      fBody.copy(dBody).setLength(1 / len);

      fSeparate.add(fBody);
    }

    // Maximum force.
    fSeparate.setLength(options.maxForce);

    return fSeparate;
  }

  // Calculate a steering force for the desired velocity.
  steer(vDesired, fSteer) {
    return fSteer
      .copy(vDesired)
      .limit(options.maxSpeed)
      .subtract(this.body.velocity)
      .limit(options.maxForce);
  }

  contain(fContain) {
    const { globe } = this.scene;

    fContain.reset();

    projectBody(this.body, options.containTime, this.pContain);

    if (Circle.ContainsPoint(globe, this.pContain)) {
      return fContain;
    }

    this.seek(globe, fContain);

    return fContain;
  }

  wander(fWander) {
    const { x, y } = this.body.center;
    const { maxForce, wanderStrength } = options;
    const wanderRadius = maxForce * options.wanderRadius;

    fWander.reset();

    const distance = wanderStrength * (maxForce - wanderRadius);

    this.pWander.setToPolar(DegToRad(this.wanderBody.rotation), wanderRadius);

    fWander.copy(this.pWander);
    fWander.x += distance;
    fWander.rotate(this.body.angle);
    fWander.limit(maxForce);

    this.debugWanderCirc.radius = wanderRadius;
    RotateTo(this.debugWanderCirc, x, y, this.body.angle, distance);

    return fWander;
  }

  update() {
    const { acceleration, angle, center } = this.body;

    this.rotation = angle;

    this.body.maxSpeed = options.maxSpeed;

    this.wanderBody.maxAngular = options.wanderSpeed;
    this.wanderBody.angularVelocity = FloatBetween(
      -options.wanderSpeed,
      options.wanderSpeed
    );

    this.nearCirc.setTo(center.x, center.y, options.nearRange);

    this.separateCirc.setTo(center.x, center.y, options.separateRange);

    const nearBodies = this.overlapCirc(this.nearCirc).filter(bodyIsFish);

    const separateBodies = this.overlapCirc(this.separateCirc).filter(
      bodyIsFish
    );

    this.fAlign.reset();
    this.fCohere.reset();
    this.fContain.reset();
    this.fSeparate.reset();
    this.fWander.reset();

    this.align(nearBodies, this.fAlign);
    this.cohere(nearBodies, this.fCohere);
    this.contain(this.fContain);
    this.separate(separateBodies, this.fSeparate);
    this.wander(this.fWander);

    this.fAlign.scale(options.alignWeight);
    this.fCohere.scale(options.cohereWeight);
    this.fContain.scale(options.containWeight);
    this.fSeparate.scale(options.separateWeight);
    this.fWander.scale(options.wanderWeight);

    acceleration.reset();
    acceleration.add(this.fAlign);
    acceleration.add(this.fCohere);
    acceleration.add(this.fContain);
    acceleration.add(this.fSeparate);
    acceleration.add(this.fWander);
    acceleration.limit(options.maxForce);
  }
}

class Scene extends Phaser.Scene {
  create() {
    this.cameras.main
      .setBounds(-512, -512, 1024, 1024)
      .setZoom(ZOOM)
      .centerOn(0, 0);

    this.physics.world.setBounds(-512, -512, 1024, 1024);

    this.globe = new Circle(0, 0, options.containRadius);

    this.add
      .image(0, 0, "__WHITE")
      .setDisplaySize(this.scale.width, this.scale.height)
      .setTint(hexColors.blue, hexColors.blue, hexColors.navy, hexColors.navy)
      .setVisible(this.renderer.type === Phaser.WEBGL);

    this.fishes = this.physics.add.group({ runChildUpdate: true });

    let q = options.quantity;
    while (q-- > 0) {
      this.createFish(0, 0);
    }

    this.debugGraphic = this.add.graphics().setAlpha(1).setVisible(DEBUG);

    // Calculate the body angles.

    this.physics.world.step(0);

    // Pane

    const pane = new Tweakpane.Pane({ title: "Options" });
    
    pane.expanded = false;

    const fishFolder = pane.addFolder({ title: "🐠 Fish" });
    const steeringFolder = pane.addFolder({ title: "🌊 Steering Forces" });
    const worldFolder = pane.addFolder({ title: "⚓️ World" });

    fishFolder.addInput(options, "containRadius", {
      min: 64,
      max: 512,
      step: 64
    });
    fishFolder.addInput(options, "containTime", { min: 0, max: 3, step: 0.1 });
    fishFolder.addInput(options, "maxForce", { min: 30, max: 300, step: 10 });
    fishFolder.addInput(options, "maxSpeed", { min: 60, max: 300, step: 10 });
    fishFolder.addInput(options, "nearRange", { min: 5, max: 120, step: 5 });
    fishFolder.addInput(options, "quantity", { min: 1, max: 100, step: 1 });
    fishFolder.addInput(options, "separateRange", { min: 5, max: 60, step: 5 });
    fishFolder.addInput(options, "wanderRadius", {
      min: 0,
      max: 0.5,
      step: 0.05
    });
    fishFolder.addInput(options, "wanderSpeed", { min: 0, max: 360, step: 5 });
    fishFolder.addInput(options, "wanderStrength", {
      min: 0,
      max: 1,
      step: 0.1
    });

    steeringFolder.addInput(options, "alignWeight", {
      min: 0,
      max: 1,
      step: 0.1
    });
    steeringFolder.addInput(options, "cohereWeight", {
      min: 0,
      max: 1,
      step: 0.1
    });
    steeringFolder.addInput(options, "containWeight", {
      min: 0,
      max: 1,
      step: 0.1
    });
    steeringFolder.addInput(options, "separateWeight", {
      min: 0,
      max: 1,
      step: 0.1
    });
    steeringFolder.addInput(options, "wanderWeight", {
      min: 0,
      max: 1,
      step: 0.1
    });

    worldFolder.addInput(this.physics.world, "timeScale", {
      min: 0.1,
      max: 10,
      step: 0.1
    });
    worldFolder.addInput(this.cameras.main, "zoom", {
      min: 0.25,
      max: 5,
      step: 0.25
    });

    const debugFolder = pane.addFolder({ title: "🔮 Debug" });

    debugFolder.addInput(this.debugGraphic, "visible", { label: "show debug" });
    debugFolder.addSeparator();

    for (const key in debugOptions) {
      debugFolder.addInput(debugOptions, key);
    }
    
    pane.addButton({ title: "Follow" }).on("click", () => {
      this.followFirstFish();
    });

    pane.addButton({ title: "Unfollow" }).on("click", () => {
      this.unfollow();
      this.cameras.main.centerOn(0, 0);
    });

    pane.addButton({ title: "Restart" }).on("click", () => {
      this.scene.restart();
    });

    pane.containerElem_.style.width = "320px";

    this.events.once("shutdown", () => {
      pane.dispose();
    });
  }

  update() {
    this.physics.world.wrap(this.fishes);

    this.globe.radius = options.containRadius;

    this.debugGraphic.clear();

    this.debugGraphic
      .lineStyle(1, hexColors.aqua)
      .strokeCircleShape(this.globe);

    if (this.debugGraphic.visible) {
      for (const fish of this.fishes.getChildren()) {
        if (fish.active) {
          fish.draw(this.debugGraphic);
        }
      }
    }
  }

  createFish(x, y) {
    const fish = new Fish(this, x, y);

    this.fishes.add(fish, true);

    fish.body.velocity.setToPolar(RandomAngle(), 1);

    return fish;
  }

  followFirstFish() {
    this.cameras.main.startFollow(this.fishes.getFirstAlive(), false);
  }

  unfollow() {
    this.cameras.main.stopFollow();
  }

  restart() {
    this.scene.restart();
  }
}

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

