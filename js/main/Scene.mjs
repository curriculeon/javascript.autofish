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