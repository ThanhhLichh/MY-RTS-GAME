export class MeleeSoldier {
  constructor(scene, x, y, faction = "player") {
    this.scene = scene;
    this.sprite = scene.add.rectangle(x, y, 16, 16, 0x990000);
    scene.physics.add.existing(this.sprite);
    this.sprite.body.setCollideWorldBounds(true);

    this.type = "melee";
    this.faction = faction;

    this.speed = 80;
    this.attackRange = 20;
    this.attackCooldown = 1000;
    this.lastAttack = 0;

    this.hp = 50;
    this.maxHp = 50;

    this.target = null;
    this.moveTarget = null;

    // 🩸 Thanh máu
    this.hpBarBg = scene.add.rectangle(x, y - 14, 20, 3, 0x555555).setOrigin(0.5);
    this.hpBar = scene.add.rectangle(x, y - 14, 20, 3, 0x00ff00).setOrigin(0.5);
  }

  moveTo(x, y) {
    this.target = null;
    this.moveTarget = { x, y };
    this.scene.physics.moveTo(this.sprite, x, y, this.speed);
  }

  attack(target) {
    this.target = target;
    this.moveTarget = null;
  }

  takeDamage(amount) {
    this.hp -= amount;
    if (this.hp < 0) this.hp = 0;
    this.updateHpBar();

    if (this.hp <= 0) {
      this.destroy();
    }
  }

  updateHpBar() {
    if (!this.hpBar || !this.hpBarBg) return;
    this.hpBarBg.setPosition(this.sprite.x, this.sprite.y - 14);
    this.hpBar.setPosition(this.sprite.x, this.sprite.y - 14);
    this.hpBar.width = (this.hp / this.maxHp) * 20;
    this.hpBar.fillColor = this.hp > this.maxHp * 0.3 ? 0x00ff00 : 0xff0000; // xanh > đỏ
  }

  destroy() {
    this.sprite.destroy();
    this.hpBar.destroy();
    this.hpBarBg.destroy();

    const idx = this.scene.units.indexOf(this);
    if (idx !== -1) this.scene.units.splice(idx, 1);
  }

  update(time) {
    if (this.moveTarget) {
      const dist = Phaser.Math.Distance.Between(
        this.sprite.x, this.sprite.y,
        this.moveTarget.x, this.moveTarget.y
      );
      if (dist < 5) {
        this.sprite.body.setVelocity(0);
        this.moveTarget = null;
      }
    }

    if (this.target && this.target.hp > 0) {
      const dist = Phaser.Math.Distance.Between(
        this.sprite.x, this.sprite.y,
        this.target.sprite.x, this.target.sprite.y
      );
      if (dist > this.attackRange) {
        this.scene.physics.moveTo(this.sprite, this.target.sprite.x, this.target.sprite.y, this.speed);
      } else {
        this.sprite.body.setVelocity(0);
        if (time > this.lastAttack + this.attackCooldown) {
          if (this.target.takeDamage) {
            this.target.takeDamage(10);
          } else {
            this.target.hp -= 10;
            if (this.target.hp <= 0) this.target.sprite.destroy();
          }
          console.log("⚔️ Melee hit! Target HP:", this.target.hp);
          this.lastAttack = time;
        }
      }
    }

    if (this.hp <= 0 && this.sprite.active) {
      this.destroy();
    }

    this.updateHpBar();
  }
}

export class RangedSoldier {
  constructor(scene, x, y, faction = "player") {
    this.scene = scene;
    this.sprite = scene.add.rectangle(x, y, 16, 16, 0x000099);
    scene.physics.add.existing(this.sprite);
    this.sprite.body.setCollideWorldBounds(true);

    this.type = "ranged";
    this.faction = faction;

    this.speed = 80;
    this.attackRange = 120;
    this.attackCooldown = 1200;
    this.lastAttack = 0;

    this.hp = 35;
    this.maxHp = 35;

    this.target = null;
    this.moveTarget = null;

    // 🩸 Thanh máu
    this.hpBarBg = scene.add.rectangle(x, y - 14, 20, 3, 0x555555).setOrigin(0.5);
    this.hpBar = scene.add.rectangle(x, y - 14, 20, 3, 0x00ff00).setOrigin(0.5);
  }

  moveTo(x, y) {
    this.target = null;
    this.moveTarget = { x, y };
    this.scene.physics.moveTo(this.sprite, x, y, this.speed);
  }

  attack(target) {
    this.target = target;
    this.moveTarget = null;
  }

  takeDamage(amount) {
    this.hp -= amount;
    if (this.hp < 0) this.hp = 0;
    this.updateHpBar();

    if (this.hp <= 0) {
      this.destroy();
    }
  }

  updateHpBar() {
    if (!this.hpBar || !this.hpBarBg) return;
    this.hpBarBg.setPosition(this.sprite.x, this.sprite.y - 14);
    this.hpBar.setPosition(this.sprite.x, this.sprite.y - 14);
    this.hpBar.width = (this.hp / this.maxHp) * 20;
    this.hpBar.fillColor = this.hp > this.maxHp * 0.3 ? 0x00ff00 : 0xff0000;
  }

  destroy() {
    this.sprite.destroy();
    this.hpBar.destroy();
    this.hpBarBg.destroy();

    const idx = this.scene.units.indexOf(this);
    if (idx !== -1) this.scene.units.splice(idx, 1);
  }

  shootProjectile(target) {
    const bullet = this.scene.add.circle(this.sprite.x, this.sprite.y, 4, 0xffffff);
    this.scene.physics.add.existing(bullet);
    this.scene.physics.moveTo(bullet, target.sprite.x, target.sprite.y, 200);

    this.scene.time.delayedCall(1000, () => bullet.destroy());

    this.scene.physics.add.overlap(bullet, target.sprite, () => {
      if (target.takeDamage) {
        target.takeDamage(8);
      } else {
        target.hp -= 8;
        if (target.hp <= 0) target.sprite.destroy();
      }
      console.log("🏹 Arrow hit! Target HP:", target.hp);
      bullet.destroy();
    });
  }

  update(time) {
    if (this.moveTarget) {
      const dist = Phaser.Math.Distance.Between(
        this.sprite.x, this.sprite.y,
        this.moveTarget.x, this.moveTarget.y
      );
      if (dist < 5) {
        this.sprite.body.setVelocity(0);
        this.moveTarget = null;
      }
    }

    if (this.target && this.target.hp > 0) {
      const dist = Phaser.Math.Distance.Between(
        this.sprite.x, this.sprite.y,
        this.target.sprite.x, this.target.sprite.y
      );
      if (dist > this.attackRange) {
        this.scene.physics.moveTo(this.sprite, this.target.sprite.x, this.target.sprite.y, this.speed);
      } else {
        this.sprite.body.setVelocity(0);
        if (time > this.lastAttack + this.attackCooldown) {
          this.shootProjectile(this.target);
          this.lastAttack = time;
        }
      }
    }

    if (this.hp <= 0 && this.sprite.active) {
      this.destroy();
    }

    this.updateHpBar();
  }
}


export class Healer {
  constructor(scene, x, y, faction = "player") {
    this.scene = scene;
    this.sprite = scene.add.rectangle(x, y, 16, 16, 0x00ffcc); // xanh ngọc
    scene.physics.add.existing(this.sprite);
    this.sprite.body.setCollideWorldBounds(true);

    this.type = "healer";
    this.faction = faction;

    this.speed = 70;
    this.healRange = 120;
    this.healCooldown = 1500;
    this.lastHeal = 0;

    this.hp = 30;
    this.maxHp = 30;

    this.target = null;
    this.moveTarget = null;

    // 🩸 Thanh máu
    this.hpBarBg = scene.add.rectangle(x, y - 14, 20, 3, 0x555555).setOrigin(0.5);
    this.hpBar = scene.add.rectangle(x, y - 14, 20, 3, 0x00ff00).setOrigin(0.5);
  }

  moveTo(x, y) {
    this.target = null;
    this.moveTarget = { x, y };
    this.scene.physics.moveTo(this.sprite, x, y, this.speed);
  }

  updateHpBar() {
    this.hpBarBg.setPosition(this.sprite.x, this.sprite.y - 14);
    this.hpBar.setPosition(this.sprite.x, this.sprite.y - 14);
    this.hpBar.width = (this.hp / this.maxHp) * 20;
    this.hpBar.fillColor = this.hp > this.maxHp * 0.3 ? 0x00ff00 : 0xff0000;
  }

  takeDamage(amount) {
    this.hp -= amount;
    if (this.hp < 0) this.hp = 0;
    this.updateHpBar();

    if (this.hp <= 0) this.destroy();
  }

  destroy() {
    this.sprite.destroy();
    this.hpBar.destroy();
    this.hpBarBg.destroy();
    const idx = this.scene.units.indexOf(this);
    if (idx !== -1) this.scene.units.splice(idx, 1);
  }

  heal(ally) {
    if (!ally || ally.hp <= 0) return;
    const healAmount = 10;
    ally.hp = Math.min(ally.maxHp, ally.hp + healAmount);

    // 🌟 Update thanh máu ngay
    if (ally.updateHpBar) ally.updateHpBar();

    // 🌟 Hiệu ứng heal
    const healText = this.scene.add.text(
      ally.sprite.x, ally.sprite.y - 20,
      `+${healAmount}`, 
      { fontSize: "12px", color: "#00ff00", fontStyle: "bold" }
    ).setOrigin(0.5);

    this.scene.tweens.add({
      targets: healText,
      y: ally.sprite.y - 40,
      alpha: 0,
      duration: 800,
      onComplete: () => healText.destroy()
    });

    console.log("💚 Healed ally:", ally.hp);
  }

  update(time) {
    // Di chuyển
    if (this.moveTarget) {
      const dist = Phaser.Math.Distance.Between(
        this.sprite.x, this.sprite.y,
        this.moveTarget.x, this.moveTarget.y
      );
      if (dist < 5) {
        this.sprite.body.setVelocity(0);
        this.moveTarget = null;
      }
    }

    // Tìm ally cần heal (bao gồm cả healer khác, trừ chính nó)
    if (!this.target || this.target.hp <= 0 || this.target.hp >= this.target.maxHp) {
      this.target = this.scene.units.find(
        u => u.faction === "player" && u.hp > 0 && u.hp < u.maxHp && u !== this
      );
    }

    // Heal nếu có target
    if (this.target && this.target.hp > 0 && this.target.hp < this.target.maxHp) {
      const dist = Phaser.Math.Distance.Between(
        this.sprite.x, this.sprite.y,
        this.target.sprite.x, this.target.sprite.y
      );

      if (dist > this.healRange) {
        this.scene.physics.moveTo(this.sprite, this.target.sprite.x, this.target.sprite.y, this.speed);
      } else {
        this.sprite.body.setVelocity(0);
        if (time > this.lastHeal + this.healCooldown) {
          this.heal(this.target);
          this.lastHeal = time;
        }
      }
    }

    this.updateHpBar();
  }
}



