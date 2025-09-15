export default class Worker {
  constructor(scene, x, y) {
    this.scene = scene;

    // 👷 Sprite thay vì circle
    this.sprite = scene.add.sprite(x, y, "dan_0");
    this.sprite.play("dan_walk"); // animation mặc định
    scene.physics.add.existing(this.sprite);
    this.sprite.body.setCollideWorldBounds(true);

    this.type = "worker";  
    this.isShip = false;

    this.harvestTask = null;
    this.target = null;
    this.targetResource = null;
    this.resources = null;
    this.onUpdate = null;

    // 👉 hệ thống vận chuyển
    this.carry = { wood: 0, stone: 0, gold: 0, meat: 0 };
    this.capacity = 10;
    this.state = "idle"; // idle | moving | harvesting | returning
    this.home = this.scene.mainHouse;
    this.lastHarvestNode = null;
  }

  moveTo(x, y) {
  this.cancelHarvest();

  // Nếu đang trên đường về nộp tài nguyên thì nộp luôn
  if (this.state === "returning") {
    this.depositResources();
    this.lastHarvestNode = null;
  }

  // 🚫 Không cho Worker đi vào nước
  if (this.scene.isWater(x, y)) {
    console.log("❌ Worker không thể đi vào biển!");
    return;
  }

  this.target = { x, y };
  this.scene.physics.moveTo(this.sprite, x, y, 100);
  this.sprite.setFlipX(x < this.sprite.x);
  this.sprite.play("dan_walk", true);

  this.state = "moving";
}


  commandHarvest(node, resources, onUpdate) {
    this.cancelHarvest();
    this.targetResource = node;
    this.target = { x: node.x, y: node.y };
    this.scene.physics.moveTo(this.sprite, node.x, node.y, 100);
    this.sprite.setFlipX(node.x < this.sprite.x);
    this.sprite.play("dan_walk", true);

    this.resources = resources;
    this.onUpdate = onUpdate;
    this.lastHarvestNode = node;
    this.state = "harvesting";
  }

  cancelHarvest() {
    if (this.harvestTask) {
      this.harvestTask.remove();
      this.harvestTask = null;
    }
    this.targetResource = null;
  }

  depositResources() {
    for (let key in this.carry) {
      this.resources[key] += this.carry[key];
      this.carry[key] = 0;
    }
    if (this.onUpdate) this.onUpdate();
  }

  carryTotal() {
    return Object.values(this.carry).reduce((a, b) => a + b, 0);
  }

  update() {
    if (!this.sprite.active) return;

    // Di chuyển đến mục tiêu click
    if (this.target && this.state === "moving") {
      const dist = Phaser.Math.Distance.Between(
        this.sprite.x, this.sprite.y,
        this.target.x, this.target.y
      );
      if (dist < 5) {
        this.sprite.body.setVelocity(0);
        this.sprite.anims.stop();
        this.sprite.setTexture("dan_0"); // đứng yên
        this.target = null;
        this.state = "idle";
      }
    }

    // Đang khai thác
    if (this.targetResource && this.state === "harvesting") {
      const node = this.targetResource;
      const dist = Phaser.Math.Distance.Between(
        this.sprite.x, this.sprite.y,
        node.x, node.y
      );
      if (dist < 20) {
        this.sprite.body.setVelocity(0);
        this.targetResource = null;

        this.harvestTask = this.scene.time.addEvent({
          delay: 2000,
          callback: () => {
            if (this.carryTotal() < this.capacity) {
              const type = node.harvest ? node.harvest() : node.type;
              if (type) {
                if (type === "tree") this.carry.wood++;
                if (type === "stone") this.carry.stone++;
                if (type === "gold") this.carry.gold++;
                if (type === "fish") this.carry.meat++;
              }
              console.log("🪓 Worker carry:", this.carry);

              if (this.carryTotal() >= this.capacity) {
                this.cancelHarvest();
                this.scene.physics.moveTo(this.sprite, this.home.x, this.home.y, 100);
                this.sprite.setFlipX(this.home.x < this.sprite.x);
                this.sprite.play("dan_walk", true);
                this.state = "returning";
              }
            }
          },
          loop: true,
        });
      }
    }

    // Về nhà nộp
    if (this.state === "returning") {
      const dist = Phaser.Math.Distance.Between(
        this.sprite.x, this.sprite.y,
        this.home.x, this.home.y
      );
      if (dist < 50) {
        this.sprite.body.setVelocity(0);
        this.sprite.anims.stop();
        this.sprite.setTexture("dan_0");
        this.depositResources();
        console.log("📦 Worker deposited resources!");

        if (this.lastHarvestNode) {
          this.commandHarvest(this.lastHarvestNode, this.resources, this.onUpdate);
        } else {
          this.state = "idle";
        }
      }
    }
  }
}
