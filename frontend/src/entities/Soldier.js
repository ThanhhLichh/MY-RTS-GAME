export class MeleeSoldier {
  constructor(scene, x, y, faction = "player") {
    this.scene = scene;

    // ⚔️ Sprite thay vì rectangle
    this.sprite = scene.add.sprite(x, y, "canchien_0");
    this.sprite.play("canchien_walk");
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
    this.autoAttackEnabled = (faction === "enemy");

    // 🩸 Thanh máu
    this.hpBarBg = scene.add.rectangle(x, y - 14, 20, 3, 0x555555).setOrigin(0.5);
    this.hpBar = scene.add.rectangle(x, y - 14, 20, 3, 0x00ff00).setOrigin(0.5);
  }

  moveTo(x, y) {
  if (!this.sprite.active) return;

  // 🚫 Không cho MeleeSoldier đi vào biển
  if (this.scene.isWater(x, y)) {
    console.log("❌ Soldier không thể đi vào biển!");
    return;
  }

  this.moveTarget = { x, y };
  this.target = null; // 👉 ngắt tấn công

  if (this.faction === "enemy") {
    this.autoAttackEnabled = false;
  }

  this.scene.physics.moveTo(this.sprite, x, y, this.speed);
  this.sprite.setFlipX(x < this.sprite.x);
  this.sprite.play("canchien_walk", true);
}


  attack(target) {
    this.target = target;
    this.moveTarget = null;
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

  updateHpBar() {
    this.hpBarBg.setPosition(this.sprite.x, this.sprite.y - 14);
    this.hpBar.setPosition(this.sprite.x, this.sprite.y - 14);
    this.hpBar.width = (this.hp / this.maxHp) * 20;
    this.hpBar.fillColor = this.hp > this.maxHp * 0.3 ? 0x00ff00 : 0xff0000;
  }

  update(time) {
    if (!this.sprite.active) return;

    // 1. Di chuyển
    if (this.moveTarget) {
      const dist = Phaser.Math.Distance.Between(
        this.sprite.x, this.sprite.y,
        this.moveTarget.x, this.moveTarget.y
      );
      if (dist < 5) {
        this.sprite.body.setVelocity(0);
        this.sprite.anims.stop();
        this.sprite.setTexture("canchien_0"); // đứng yên
        this.moveTarget = null;

        if (this.faction === "enemy") {
          this.autoAttackEnabled = true;
        }
      }
    }

    // 2. Tấn công target
    if (this.target && this.target.hp > 0) {
      const dist = Phaser.Math.Distance.Between(
        this.sprite.x, this.sprite.y,
        this.target.sprite.x, this.target.sprite.y
      );

      if (dist > this.attackRange) {
        this.scene.physics.moveTo(this.sprite, this.target.sprite.x, this.target.sprite.y, this.speed);
        this.sprite.setFlipX(this.target.sprite.x < this.sprite.x);
        if (!this.sprite.anims.isPlaying) {
          this.sprite.play("canchien_walk");
        }
      } else {
        this.sprite.body.setVelocity(0);
        this.sprite.anims.stop();
        this.sprite.setTexture("canchien_0");
        if (time > this.lastAttack + this.attackCooldown) {
          this.target.takeDamage ? this.target.takeDamage(10) : (this.target.hp -= 10);
          this.lastAttack = time;
        }
      }
    }

    // 3. Auto attack – lính player
    if (this.faction === "player" && !this.target && !this.moveTarget) {
      const enemies = this.scene.units.filter(u => u.faction === "enemy" && u.hp > 0);
      for (const enemy of enemies) {
        const dist = Phaser.Math.Distance.Between(this.sprite.x, this.sprite.y, enemy.sprite.x, enemy.sprite.y);
        if (dist < this.attackRange + 10) {
          this.attack(enemy);
          break;
        }
      }
    }

    // 4. Auto attack – lính enemy
    if (this.faction === "enemy" && !this.target && this.autoAttackEnabled) {
      const players = this.scene.units.filter(u => u.faction === "player" && u.hp > 0);
      for (const p of players) {
        const dist = Phaser.Math.Distance.Between(this.sprite.x, this.sprite.y, p.sprite.x, p.sprite.y);
        if (dist < this.attackRange + 10) {
          this.attack(p);
          return;
        }
      }

      // Attack building nếu không có lính
      const structures = [
        ...this.scene.houses,
        this.scene.mainHouse,
        ...this.scene.towers
      ];

      for (const building of structures) {
        if (!building || building.isDestroyed) continue;
        const dist = Phaser.Math.Distance.Between(this.sprite.x, this.sprite.y, building.x, building.y);
        if (dist < this.attackRange + 10) {
          this.target = {
            sprite: { x: building.x, y: building.y },
            hp: building.hp,
            takeDamage: (amount) => building.takeDamage(amount)
          };
          break;
        }
      }
    }

    // 5. Chết
    if (this.hp <= 0) {
      this.destroy();
    }

    // 6. Cập nhật thanh máu
    this.updateHpBar();
  }
}

export class RangedSoldier {
  constructor(scene, x, y, faction = "player") {
    this.scene = scene;

    // 🏹 Sprite thay vì rectangle
    this.sprite = scene.add.sprite(x, y, "danhxa_0");
    this.sprite.play("danhxa_walk");
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
    this.autoAttackEnabled = (faction === "enemy");

    // HP bar
    this.hpBarBg = scene.add.rectangle(x, y - 14, 20, 3, 0x555555).setOrigin(0.5);
    this.hpBar = scene.add.rectangle(x, y - 14, 20, 3, 0x00ff00).setOrigin(0.5);
  }

  moveTo(x, y) {
  if (!this.sprite.active) return;

  // 🚫 Không cho RangedSoldier đi vào biển
  if (this.scene.isWater(x, y)) {
    console.log("❌ Ranged không thể đi vào biển!");
    return;
  }

  this.moveTarget = { x, y };
  this.target = null;

  if (this.faction === "enemy") {
    this.autoAttackEnabled = false;
  }

  this.scene.physics.moveTo(this.sprite, x, y, this.speed);
  this.sprite.setFlipX(x < this.sprite.x);
  this.sprite.play("danhxa_walk", true);
}


  attack(target) {
    this.target = target;
    this.moveTarget = null;
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

  updateHpBar() {
    this.hpBarBg.setPosition(this.sprite.x, this.sprite.y - 14);
    this.hpBar.setPosition(this.sprite.x, this.sprite.y - 14);
    this.hpBar.width = (this.hp / this.maxHp) * 20;
    this.hpBar.fillColor = this.hp > this.maxHp * 0.3 ? 0x00ff00 : 0xff0000;
  }

  shootProjectile(target) {
    const arrow = this.scene.add.rectangle(this.sprite.x, this.sprite.y, 6, 2, 0xffffff);
    this.scene.physics.add.existing(arrow);
    this.scene.physics.moveTo(arrow, target.sprite.x, target.sprite.y, 200);

    this.scene.time.delayedCall(1000, () => arrow.destroy());

    this.scene.physics.add.overlap(arrow, target.sprite, () => {
      if (target.hp <= 0) return;
      if (target.takeDamage) {
        target.takeDamage(8);
      } else {
        target.hp -= 8;
        if (target.hp <= 0) target.sprite.destroy();
      }
      console.log("🏹 Arrow hit! Target HP:", target.hp);
      arrow.destroy();
    });
  }

  update(time) {
    if (!this.sprite.active) return;

    // 1. Di chuyển
    if (this.moveTarget) {
      const dist = Phaser.Math.Distance.Between(
        this.sprite.x, this.sprite.y,
        this.moveTarget.x, this.moveTarget.y
      );
      if (dist < 5) {
        this.sprite.body.setVelocity(0);
        this.sprite.anims.stop();
        this.sprite.setTexture("danhxa_0"); // đứng yên
        this.moveTarget = null;

        if (this.faction === "enemy") {
          this.autoAttackEnabled = true;
        }
      }
    }

    // 2. Tấn công
    if (this.target && this.target.hp > 0) {
      const dist = Phaser.Math.Distance.Between(
        this.sprite.x, this.sprite.y,
        this.target.sprite.x, this.target.sprite.y
      );

      if (dist > this.attackRange) {
        this.scene.physics.moveTo(this.sprite, this.target.sprite.x, this.target.sprite.y, this.speed);
      } else {
        this.sprite.body.setVelocity(0);
        this.sprite.anims.stop();
        this.sprite.setTexture("danhxa_0");
        if (time > this.lastAttack + this.attackCooldown) {
          this.shootProjectile(this.target);
          this.lastAttack = time;
        }
      }
    }

    // 3. Auto attack – player
if (this.faction === "player" && !this.target && !this.moveTarget) {
  const enemies = [
    ...this.scene.units.filter(u => u.faction === "enemy" && u.hp > 0),
    ...this.scene.ships.filter(s => s.faction === "enemy" && s.hp > 0) // 🚢 thêm tàu
  ];
  for (const enemy of enemies) {
    const dist = Phaser.Math.Distance.Between(this.sprite.x, this.sprite.y, enemy.sprite.x, enemy.sprite.y);
    if (dist < this.attackRange + 10) {
      this.attack(enemy);
      break;
    }
  }
}

// 4. Auto attack – enemy
if (this.faction === "enemy" && !this.target && this.autoAttackEnabled) {
  const players = [
    ...this.scene.units.filter(u => u.faction === "player" && u.hp > 0),
    ...this.scene.ships.filter(s => s.faction === "player" && s.hp > 0) // 🚢 thêm tàu
  ];
  for (const p of players) {
    const dist = Phaser.Math.Distance.Between(this.sprite.x, this.sprite.y, p.sprite.x, p.sprite.y);
    if (dist < this.attackRange + 10) {
      this.attack(p);
      return;
    }
  }

  // Nếu không có lính → tấn công công trình
  const structures = [
    ...this.scene.houses,
    this.scene.mainHouse,
    ...this.scene.towers,
    ...this.scene.shipyards   // 🚢 có thể bắn cả xưởng tàu
  ];
  for (const building of structures) {
    if (!building || building.isDestroyed) continue;
    const dist = Phaser.Math.Distance.Between(this.sprite.x, this.sprite.y, building.x, building.y);
    if (dist < this.attackRange + 10) {
      this.target = {
        sprite: { x: building.x, y: building.y },
        hp: building.hp,
        takeDamage: (amount) => building.takeDamage(amount)
      };
      break;
    }
  }
}


    // 5. Chết
    if (this.hp <= 0) {
      this.destroy();
    }

    // 6. Update HP bar
    this.updateHpBar();
  }
}

export class Healer {
  constructor(scene, x, y, faction = "player") {
    this.scene = scene;

    // ✨ Sprite thay vì rectangle
    this.sprite = scene.add.sprite(x, y, "healer_0");
    this.sprite.play("healer_walk");
    scene.physics.add.existing(this.sprite);
    this.sprite.body.setCollideWorldBounds(true);

    this.type = "healer";
    this.faction = faction;
    this.alive = true;

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
  if (!this.sprite.active) return;

  // 🚫 Không cho Healer đi vào biển
  if (this.scene.isWater(x, y)) {
    console.log("❌ Healer không thể đi vào biển!");
    return;
  }

  this.target = null;
  this.moveTarget = { x, y };
  this.scene.physics.moveTo(this.sprite, x, y, this.speed);
  this.sprite.setFlipX(x < this.sprite.x);
  this.sprite.play("healer_walk", true);
}


  updateHpBar() {
    if (!this.hpBar || !this.hpBarBg) return;
    this.hpBarBg.setPosition(this.sprite.x, this.sprite.y - 14);
    this.hpBar.setPosition(this.sprite.x, this.sprite.y - 14);
    this.hpBar.width = (this.hp / this.maxHp) * 20;
    this.hpBar.fillColor = this.hp > this.maxHp * 0.3 ? 0x00ff00 : 0xff0000;
  }

  takeDamage(amount) {
    if (!this.alive) return;
    this.hp -= amount;
    if (this.hp < 0) this.hp = 0;
    this.updateHpBar();

    if (this.hp <= 0) {
      this.destroy();
    }
  }

  destroy() {
    if (!this.alive) return;
    this.alive = false;

    if (this.sprite) this.sprite.destroy();
    if (this.hpBar) this.hpBar.destroy();
    if (this.hpBarBg) this.hpBarBg.destroy();

    const idx = this.scene.units.indexOf(this);
    if (idx !== -1) this.scene.units.splice(idx, 1);
  }

  heal(ally) {
    if (!this.alive || !ally || ally.hp <= 0) return;
    const healAmount = 10;
    ally.hp = Math.min(ally.maxHp, ally.hp + healAmount);

    if (ally.updateHpBar) ally.updateHpBar();

    // 🌟 Hiệu ứng heal (text bay lên)
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
    if (!this.alive) return;

    // 1. Di chuyển
    if (this.moveTarget) {
      const dist = Phaser.Math.Distance.Between(
        this.sprite.x, this.sprite.y,
        this.moveTarget.x, this.moveTarget.y
      );
      if (dist < 5) {
        this.sprite.body.setVelocity(0);
        this.sprite.anims.stop();
        this.sprite.setTexture("healer_0"); // đứng yên
        this.moveTarget = null;
      }
    }

    // 2. Tìm ally để heal
    if (!this.target || this.target.hp <= 0 || this.target.hp >= this.target.maxHp) {
      this.target = this.scene.units.find(
        u => u.faction === this.faction && u.hp > 0 && u.hp < u.maxHp && u !== this
      );
    }

    // 3. Heal target
    if (this.target && this.target.hp > 0 && this.target.hp < this.target.maxHp) {
      const dist = Phaser.Math.Distance.Between(
        this.sprite.x, this.sprite.y,
        this.target.sprite.x, this.target.sprite.y
      );

      if (dist > this.healRange) {
        this.scene.physics.moveTo(this.sprite, this.target.sprite.x, this.target.sprite.y, this.speed);
      } else {
        this.sprite.body.setVelocity(0);
        this.sprite.anims.stop();
        this.sprite.setTexture("healer_0");
        if (time > this.lastHeal + this.healCooldown) {
          this.heal(this.target);
          this.lastHeal = time;
        }
      }
    }

    // 4. Chết
    if (this.hp <= 0) {
      this.destroy();
    }

    // 5. Cập nhật thanh máu
    this.updateHpBar();
  }
}

export class Cavalry {
  constructor(scene, x, y, faction = "player") {
    this.scene = scene;
    this.sprite = scene.add.sprite(x, y, "kybinh_0");
    this.sprite.setDepth(10); // ✅ Đảm bảo hiển thị trên thuyền
    this.sprite.play("kybinh_ride");
    scene.physics.add.existing(this.sprite);
    this.sprite.body.setCollideWorldBounds(true);

    this.type = "cavalry";
    this.faction = faction;

    this.hp = 180;
    this.maxHp = 180;
    this.attackRange = 30;
    this.attackCooldown = 1000;
    this.lastAttack = 0;
    this.damage = 25;

    this.speed = 120; // nhanh hơn lính thường

    this.target = null;
    this.moveTarget = null;

    // HP bar
    this.hpBarBg = scene.add.rectangle(x, y - 22, 28, 4, 0x555555).setOrigin(0.5);
    this.hpBar = scene.add.rectangle(x, y - 22, 28, 4, 0x00ff00).setOrigin(0.5);
  }

  moveTo(x, y) {
  if (!this.sprite.active) return;

  // 🚫 Không cho Cavalry đi vào biển
  if (this.scene.isWater(x, y)) {
    console.log("❌ Cavalry không thể đi vào biển!");
    return;
  }

  this.target = null;
  this.moveTarget = { x, y };
  this.scene.physics.moveTo(this.sprite, x, y, this.speed);
  this.sprite.setFlipX(x < this.sprite.x);
  this.sprite.play("kybinh_ride", true);
}

  attack(target) {
    this.target = target;
    this.moveTarget = null;
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

  updateHpBar() {
    this.hpBarBg.setPosition(this.sprite.x, this.sprite.y - 22);
    this.hpBar.setPosition(this.sprite.x, this.sprite.y - 22);
    this.hpBar.width = (this.hp / this.maxHp) * 28;
    this.hpBar.fillColor = this.hp > this.maxHp * 0.3 ? 0x00ff00 : 0xff0000;
  }

  update(time) {
    if (!this.sprite.active) return;

    // Di chuyển
    if (this.moveTarget) {
      const dist = Phaser.Math.Distance.Between(
        this.sprite.x, this.sprite.y,
        this.moveTarget.x, this.moveTarget.y
      );
      if (dist < 5) {
        this.sprite.body.setVelocity(0);
        this.sprite.anims.stop();
        this.sprite.setTexture("kybinh_0");
        this.moveTarget = null;
      }
    }

    // Tấn công
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
          this.target.takeDamage ? this.target.takeDamage(this.damage) : (this.target.hp -= this.damage);
          this.lastAttack = time;
          console.log("🐎 Cavalry hit!");
        }
      }
    }

    this.updateHpBar();
  }
}

export class DragonKnight {
  constructor(scene, x, y, faction = "player") {
    this.scene = scene;
    this.sprite = scene.add.sprite(x, y, "dragon_knight_0").setScale(1.5);
    this.sprite.play("dragon_knight_fly");
    scene.physics.add.existing(this.sprite);
    this.sprite.body.setCollideWorldBounds(true);

    this.type = "dragon_knight";
    this.faction = faction;

    this.hp = 220;
    this.maxHp = 220;
    this.attackRange = 40;
    this.attackCooldown = 1200;
    this.lastAttack = 0;
    this.damage = 35;
    this.speed = 100;

    this.target = null;
    this.moveTarget = null;
    this.autoAttackEnabled = (faction === "enemy");

    this.hpBarBg = scene.add.rectangle(x, y - 25, 32, 4, 0x555555).setOrigin(0.5);
    this.hpBar = scene.add.rectangle(x, y - 25, 32, 4, 0x00ff00).setOrigin(0.5);
  }

  moveTo(x, y) {
    if (!this.sprite.active) return;
    this.target = null;
    this.moveTarget = { x, y };
    this.scene.physics.moveTo(this.sprite, x, y, this.speed);
    this.sprite.setFlipX(x < this.sprite.x);
    this.sprite.play("dragon_knight_fly", true);
  }

  attack(target) {
    this.target = target;
    this.moveTarget = null;
  }

  takeDamage(amount) {
    this.hp -= amount;
    if (this.hp <= 0) {
      this.destroy();
    }
    this.updateHpBar();
  }

  destroy() {
    this.sprite.destroy();
    this.hpBar.destroy();
    this.hpBarBg.destroy();
    const idx = this.scene.units.indexOf(this);
    if (idx !== -1) this.scene.units.splice(idx, 1);
  }

  updateHpBar() {
    this.hpBarBg.setPosition(this.sprite.x, this.sprite.y - 25);
    this.hpBar.setPosition(this.sprite.x, this.sprite.y - 25);
    this.hpBar.width = (this.hp / this.maxHp) * 32;
    this.hpBar.fillColor = this.hp > this.maxHp * 0.3 ? 0x00ff00 : 0xff0000;
  }

  update(time) {
    if (!this.sprite.active) return;

    // Di chuyển
    if (this.moveTarget) {
      const dist = Phaser.Math.Distance.Between(this.sprite.x, this.sprite.y, this.moveTarget.x, this.moveTarget.y);
      if (dist < 5) {
        this.sprite.body.setVelocity(0);
        this.sprite.anims.stop();
        this.sprite.setTexture("dragon_knight_0");
        this.moveTarget = null;
      }
    }

    // Tấn công target
    if (this.target && this.target.hp > 0) {
      const dist = Phaser.Math.Distance.Between(this.sprite.x, this.sprite.y, this.target.sprite.x, this.target.sprite.y);
      if (dist > this.attackRange) {
        this.scene.physics.moveTo(this.sprite, this.target.sprite.x, this.target.sprite.y, this.speed);
      } else {
        this.sprite.body.setVelocity(0);
        if (time > this.lastAttack + this.attackCooldown) {
          this.target.takeDamage ? this.target.takeDamage(this.damage) : this.target.hp -= this.damage;
          this.lastAttack = time;
        }
      }
    }

    // 👤 Auto attack – lính player
    if (this.faction === "player" && !this.target && !this.moveTarget) {
      const enemies = this.scene.units.filter(u => u.faction === "enemy" && u.hp > 0);
      for (const enemy of enemies) {
        const dist = Phaser.Math.Distance.Between(this.sprite.x, this.sprite.y, enemy.sprite.x, enemy.sprite.y);
        if (dist < this.attackRange + 10) {
          this.attack(enemy);
          break;
        }
      }
    }

    // 🧟 Auto attack – lính enemy
    if (this.faction === "enemy" && !this.target && this.autoAttackEnabled) {
      const players = this.scene.units.filter(u => u.faction === "player" && u.hp > 0);
      for (const p of players) {
        const dist = Phaser.Math.Distance.Between(this.sprite.x, this.sprite.y, p.sprite.x, p.sprite.y);
        if (dist < this.attackRange + 10) {
          this.attack(p);
          return;
        }
      }

      // 🔥 Tấn công công trình nếu không còn lính
      const structures = [
        ...this.scene.houses,
        this.scene.mainHouse,
        ...this.scene.towers
      ];
      for (const building of structures) {
        if (!building || building.isDestroyed) continue;
        const dist = Phaser.Math.Distance.Between(this.sprite.x, this.sprite.y, building.x, building.y);
        if (dist < this.attackRange + 10) {
          this.target = {
            sprite: { x: building.x, y: building.y },
            hp: building.hp,
            takeDamage: (amount) => building.takeDamage(amount)
          };
          break;
        }
      }
    }

    this.updateHpBar();
  }
}








