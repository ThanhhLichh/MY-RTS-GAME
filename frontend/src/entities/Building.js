export class Building {
  constructor(scene, x, y, width, height, color, name) {
    this.scene = scene;
    this.x = x;
    this.y = y;

    // Tạo sprite
    this.sprite = scene.add.rectangle(x, y, width, height, color);
    scene.physics.add.existing(this.sprite);
    this.sprite.body.setImmovable(true);
    this.sprite.setInteractive({ useHandCursor: true });

    // Label
    this.label = scene.add.text(x - width / 2, y - height / 2 - 15, name || "", {
      fontSize: "10px",
      color: "#fff",
    });
  }

  destroy() {
    this.sprite.destroy();
    if (this.label) this.label.destroy();
  }
}

export class MainHouse extends Building {
  constructor(scene, x, y) {
    super(scene, x, y, 60, 60, 0x0077ff, "Main House");
  }
}

export class House extends Building {
  constructor(scene, x, y) {
    super(scene, x, y, 40, 40, 0xff8800, "House");
  }
}

export class Barracks extends Building {
  constructor(scene, x, y) {
    super(scene, x, y, 50, 50, 0x4444ff, "Barracks");

    // 👇 Click vào Barracks thì gọi GameScene.showBarracksMenu
    this.sprite.on("pointerdown", () => {
      if (this.scene.showBarracksMenu) {
        this.scene.showBarracksMenu(this);
      }
    });
  }
}

export class Tower extends Building {
  constructor(scene, x, y) {
    super(scene, x, y, 36, 36, 0x888888, "Tower");
    this.attackRange = 120;
    this.attackCooldown = 1000; // ms
    this.lastAttack = 0;
  }

  update(time) {
  // Tìm unit địch (faction !== "player")
  const enemy = this.scene.units.find(
    u =>
      u.faction === "enemy" && // 👈 chỉ bắn enemy
      u.hp > 0 &&
      Phaser.Math.Distance.Between(this.x, this.y, u.sprite.x, u.sprite.y) < this.attackRange
  );

  if (enemy && time - (this.lastAttack || 0) > this.attackCooldown) {
    this.lastAttack = time;
    enemy.hp -= 15;

    // Hiệu ứng bắn
    const line = this.scene.add.line(
      0, 0, this.x, this.y, enemy.sprite.x, enemy.sprite.y, 0xff0000
    ).setLineWidth(2).setDepth(100).setAlpha(0.7).setOrigin(0);

    this.scene.time.delayedCall(200, () => line.destroy());
  }
}
}
