export class Building {
  constructor(scene, x, y, width, height, color, name) {
    this.scene = scene;
    this.x = x;
    this.y = y;
    this.name = name || "Building";
    this.isDestroyed = false;

    // HP mặc định
    this.maxHp = 100;
    this.hp = this.maxHp;

    // Vẽ công trình
    this.sprite = scene.add.rectangle(x, y, width, height, color);
    scene.physics.add.existing(this.sprite);
    this.sprite.body.setImmovable(true);
    this.sprite.setInteractive({ useHandCursor: true });

    // Label tên công trình
    this.label = scene.add.text(x - width / 2, y - height / 2 - 15, this.name, {
      fontSize: "10px",
      color: "#fff",
    });

    // Thanh máu
    this.hpBarBg = scene.add.rectangle(x, y - height / 2 - 5, width, 4, 0x000000).setDepth(10);
    this.hpBar = scene.add.rectangle(x, y - height / 2 - 5, width, 4, 0xff0000).setDepth(11);
  }

  takeDamage(amount) {
    if (this.isDestroyed) return;
    this.hp -= amount;
    if (this.hp <= 0) {
      this.hp = 0;
      this.destroy();
    } else {
      this.updateHpBar();
    }
  }

  updateHpBar() {
    if (this.hpBar && this.hpBarBg) {
      const ratio = Phaser.Math.Clamp(this.hp / this.maxHp, 0, 1);
      this.hpBar.width = this.hpBarBg.width * ratio;
    }
  }

  destroy() {
    if (this.isDestroyed) return;
    this.isDestroyed = true;
    this.sprite.destroy();
    if (this.label) this.label.destroy();
    if (this.hpBar) this.hpBar.destroy();
    if (this.hpBarBg) this.hpBarBg.destroy();
  }
}

export class MainHouse extends Building {
  constructor(scene, x, y) {
    super(scene, x, y, 60, 60, 0x0077ff, "Main House");
    this.maxHp = 300;
    this.hp = this.maxHp;
    this.updateHpBar();
  }
}

export class House extends Building {
  constructor(scene, x, y) {
    super(scene, x, y, 40, 40, 0xff8800, "House");
    this.maxHp = 100;
    this.hp = this.maxHp;
    this.updateHpBar();
  }
}

export class Barracks extends Building {
  constructor(scene, x, y) {
    super(scene, x, y, 50, 50, 0x4444ff, "Barracks");
    this.maxHp = 150;
    this.hp = this.maxHp;
    this.updateHpBar();

    // Click để mở menu sinh lính
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
    this.maxHp = 120;
    this.hp = this.maxHp;
    this.updateHpBar();

    this.attackRange = 120;
    this.attackCooldown = 1000;
    this.lastAttack = 0;
  }

  update(time) {
    if (this.isDestroyed) return;

    const enemy = this.scene.units.find(
      u =>
        u.faction === "enemy" &&
        u.hp > 0 &&
        Phaser.Math.Distance.Between(this.x, this.y, u.sprite.x, u.sprite.y) < this.attackRange
    );

    if (enemy && time - this.lastAttack > this.attackCooldown) {
      this.lastAttack = time;
      enemy.hp -= 15;

      // Vẽ tia đạn
      const line = this.scene.add.line(
        0, 0, this.x, this.y, enemy.sprite.x, enemy.sprite.y, 0xff0000
      )
        .setLineWidth(2)
        .setDepth(100)
        .setAlpha(0.7)
        .setOrigin(0);

      this.scene.time.delayedCall(200, () => line.destroy());
    }
  }
}
