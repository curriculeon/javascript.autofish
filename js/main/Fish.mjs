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