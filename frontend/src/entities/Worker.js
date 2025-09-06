export default class Worker {
  constructor(scene, x, y) {
    this.scene = scene;
    this.sprite = scene.add.circle(x, y, 10, 0xffff00);
    scene.physics.add.existing(this.sprite);
    this.sprite.body.setCollideWorldBounds(true);

    this.harvestTask = null;
    this.target = null;
    this.targetResource = null;
    this.resources = null;
    this.onUpdate = null;

    // 👉 thêm hệ thống vận chuyển
    this.carry = { wood: 0, stone: 0, gold: 0, meat: 0 };
    this.capacity = 10; // tối đa mang được
    this.state = "idle"; // idle | harvesting | returning
    this.home = this.scene.mainHouse; // Main House
    this.lastHarvestNode = null; // nhớ node để quay lại
  }

  moveTo(x, y) {
    this.cancelHarvest();
    this.target = { x, y };
    this.scene.physics.moveTo(this.sprite, x, y, 100);
    this.state = "moving";
  }

  commandHarvest(node, resources, onUpdate) {
    this.cancelHarvest();
    this.targetResource = node;
    this.target = { x: node.x, y: node.y };
    this.scene.physics.moveTo(this.sprite, node.x, node.y, 100);

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
        this.sprite.x,
        this.sprite.y,
        this.target.x,
        this.target.y
      );
      if (dist < 5) {
        this.sprite.body.setVelocity(0);
        this.target = null;
        this.state = "idle";
      }
    }

    // Đang khai thác
    if (this.targetResource && this.state === "harvesting") {
      const node = this.targetResource;
      const dist = Phaser.Math.Distance.Between(
        this.sprite.x,
        this.sprite.y,
        node.x,
        node.y
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
                // 👉 về nhà nộp tài nguyên
                this.cancelHarvest();
                this.scene.physics.moveTo(this.sprite, this.home.x, this.home.y, 100);
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
        this.sprite.x,
        this.sprite.y,
        this.home.x,
        this.home.y
      );
      if (dist < 50) {
        this.sprite.body.setVelocity(0);
        this.depositResources();
        console.log("📦 Worker deposited resources!");

        // Quay lại node cũ
        if (this.lastHarvestNode) {
          this.commandHarvest(this.lastHarvestNode, this.resources, this.onUpdate);
        } else {
          this.state = "idle";
        }
      }
    }
  }
}
