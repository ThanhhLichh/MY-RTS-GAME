// ================== Transport Ship ==================
export class TransportShip {
  constructor(scene, x, y, faction = "player") {
    this.scene = scene;
    this.sprite = scene.add.sprite(x, y, "choquan_0"); // idle frame
    scene.physics.add.existing(this.sprite);
    this.sprite.body.setCollideWorldBounds(true);

    this.type = "transportShip";
    this.faction = faction;
    this.isShip = true;

    this.hp = 100;
    this.maxHp = 100;
    this.speed = 70;

    this.capacity = 6;
    this.passengers = [];

    this.moveTarget = null;

    // Thanh máu
    this.hpBarBg = scene.add.rectangle(x, y - 22, 40, 4, 0x555555).setOrigin(0.5);
    this.hpBar = scene.add.rectangle(x, y - 22, 40, 4, 0x00ff00).setOrigin(0.5);
  }

  moveTo(x, y) {
    if (!this.sprite.active) return;
    if (!this.scene.isWater(x, y)) return;

    this.moveTarget = { x, y };
    this.scene.physics.moveTo(this.sprite, x, y, this.speed);
    this.sprite.setFlipX(x < this.sprite.x);
    this.sprite.play("choquan_sail", true);
  }

  // TransportShip trong Ship.js
loadUnit(unit) {
  if (this.passengers.length < this.capacity) {
    this.passengers.push(unit);

    // Ẩn sprite và vô hiệu hóa va chạm
    unit.sprite.setVisible(false);
    unit.sprite.body.enable = false;

    // 👉 Ẩn thanh máu
    if (unit.hpBar) unit.hpBar.setVisible(false);
    if (unit.hpBarBg) unit.hpBarBg.setVisible(false);

    // Xóa unit ra khỏi danh sách active
    const idx = this.scene.units.indexOf(unit);
    if (idx !== -1) this.scene.units.splice(idx, 1);

    return true;
  }
  return false;
}


  unloadUnits(x, y) {
  // 👉 Lọc bỏ lính đã chết (sprite đã bị destroy)
  this.passengers = this.passengers.filter(u => u.sprite && u.sprite.active);

  this.passengers.forEach(u => {
    u.sprite.setVisible(true);

    // Nếu body mất thì thêm lại
    if (!u.sprite.body) {
      this.scene.physics.add.existing(u.sprite);
    } else {
      u.sprite.body.enable = true;
    }

    // Hiện lại thanh máu nếu có
    if (u.hpBar) u.hpBar.setVisible(true);
    if (u.hpBarBg) u.hpBarBg.setVisible(true);

    // Đặt vị trí
    u.sprite.x = x + Phaser.Math.Between(-20, 20);
    u.sprite.y = y + Phaser.Math.Between(-20, 20);

    this.scene.units.push(u);
  });

  this.passengers = [];
}



  update(time) {
    if (!this.sprite.active) return;

    if (this.moveTarget) {
      const dist = Phaser.Math.Distance.Between(this.sprite.x, this.sprite.y, this.moveTarget.x, this.moveTarget.y);
      if (dist < 5) {
        this.sprite.body.setVelocity(0);
        this.moveTarget = null;

        this.sprite.anims.stop();
        this.sprite.setTexture("choquan_0"); // idle frame
      }
    }

    this.updateHpBar();
  }

  updateHpBar() {
    this.hpBarBg.setPosition(this.sprite.x, this.sprite.y - 22);
    this.hpBar.setPosition(this.sprite.x, this.sprite.y - 22);
    this.hpBar.width = (this.hp / this.maxHp) * 40;
  }

  takeDamage(amount) {
  this.hp -= amount;
  if (this.hp < 0) this.hp = 0;
  this.updateHpBar();
  if (this.hp <= 0) this.destroy();
}

destroy() {
  if (this.sprite) this.sprite.destroy();
  if (this.hpBar) this.hpBar.destroy();
  if (this.hpBarBg) this.hpBarBg.destroy();

  // Xóa khỏi danh sách ships trong scene
  const idx = this.scene.ships.indexOf(this);
  if (idx !== -1) this.scene.ships.splice(idx, 1);
}

}

// ================== Fishing Boat ==================
export class FishingBoat {
  constructor(scene, x, y, faction = "player") {
    this.scene = scene;
    this.sprite = scene.add.sprite(x, y, "danhca_0"); // idle frame
    scene.physics.add.existing(this.sprite);
    this.sprite.body.setCollideWorldBounds(true);

    this.type = "fishingBoat";
    this.faction = faction;
    this.isShip = true;

    this.hp = 80;
    this.maxHp = 80;
    this.speed = 60;

    this.cargo = 0;
    this.maxCargo = 20;

    this.targetFish = null;
    this.moveTarget = null;

    this.hpBarBg = scene.add.rectangle(x, y - 20, 35, 4, 0x555555).setOrigin(0.5);
    this.hpBar = scene.add.rectangle(x, y - 20, 35, 4, 0x00ff00).setOrigin(0.5);
  }

  moveTo(x, y) {
    if (!this.scene.isWater(x, y)) return;

    this.moveTarget = { x, y };
    this.scene.physics.moveTo(this.sprite, x, y, this.speed);
    this.sprite.setFlipX(x < this.sprite.x);
    this.sprite.play("danhca_sail", true);
  }

  harvest(fishNode) {
    this.targetFish = fishNode;
  }

  deliver(shipyard) {
    if (this.cargo > 0) {
      this.scene.resources.meat += this.cargo;
      this.cargo = 0;
      this.scene.events.emit("updateHUD", this.scene.resources);
    }
  }

  update(time) {
    if (this.moveTarget) {
      const dist = Phaser.Math.Distance.Between(this.sprite.x, this.sprite.y, this.moveTarget.x, this.moveTarget.y);
      if (dist < 5) {
        this.sprite.body.setVelocity(0);
        this.moveTarget = null;

        this.sprite.anims.stop();
        this.sprite.setTexture("danhca_0"); // idle
      }
    }

    this.updateHpBar();
  }

  updateHpBar() {
    this.hpBarBg.setPosition(this.sprite.x, this.sprite.y - 20);
    this.hpBar.setPosition(this.sprite.x, this.sprite.y - 20);
    this.hpBar.width = (this.hp / this.maxHp) * 35;
  }

  takeDamage(amount) {
  this.hp -= amount;
  if (this.hp < 0) this.hp = 0;
  this.updateHpBar();
  if (this.hp <= 0) this.destroy();
}

destroy() {
  if (this.sprite) this.sprite.destroy();
  if (this.hpBar) this.hpBar.destroy();
  if (this.hpBarBg) this.hpBarBg.destroy();

  // Xóa khỏi danh sách ships trong scene
  const idx = this.scene.ships.indexOf(this);
  if (idx !== -1) this.scene.ships.splice(idx, 1);
}

}


// ================== Warship ==================
export class Warship {
  constructor(scene, x, y, faction = "player") {
    this.scene = scene;
    this.sprite = scene.add.sprite(x, y, "tauchien_0"); // idle
    scene.physics.add.existing(this.sprite);
    this.sprite.body.setCollideWorldBounds(true);

    this.type = "warship";
    this.faction = faction;
    this.isShip = true;

    this.hp = 20;
    this.maxHp = 200;
    this.speed = 65;
    this.attackRange = 200;
    this.attackCooldown = 2000;
    this.lastAttack = 0;

    this.target = null;
    this.moveTarget = null;

    this.hpBarBg = scene.add.rectangle(x, y - 28, 45, 5, 0x555555).setOrigin(0.5);
    this.hpBar = scene.add.rectangle(x, y - 28, 45, 5, 0x00ff00).setOrigin(0.5);
  }

  moveTo(x, y) {
  if (!this.scene.isWater(x, y)) return;

  // 🚫 Khi có lệnh move mới thì bỏ target
  this.target = null;

  this.moveTarget = { x, y };
  this.scene.physics.moveTo(this.sprite, x, y, this.speed);
  this.sprite.setFlipX(x < this.sprite.x);
  this.sprite.play("tauchien_sail", true);
}


  attack(target, time) {
    if (time < this.lastAttack + this.attackCooldown) return;
    this.lastAttack = time;

    const cannon = this.scene.add.rectangle(this.sprite.x, this.sprite.y, 6, 6, 0xff0000);
    this.scene.physics.add.existing(cannon);
    this.scene.physics.moveTo(cannon, target.sprite.x, target.sprite.y, 250);

    this.scene.physics.add.overlap(cannon, target.sprite, () => {
      if (cannon.active) {
        if (target.hp > 0) {
          target.takeDamage ? target.takeDamage(20) : (target.hp -= 20);
        }
        cannon.destroy();
      }
    });

    this.scene.time.delayedCall(1500, () => {
      if (cannon.active) cannon.destroy();
    });
  }

  update(time) {
  if (!this.sprite.active) return;

  // Nếu đang có moveTarget → bỏ qua attack (chỉ move)
  if (this.moveTarget) {
    const dist = Phaser.Math.Distance.Between(
      this.sprite.x, this.sprite.y,
      this.moveTarget.x, this.moveTarget.y
    );
    if (dist < 5) {
      this.sprite.body.setVelocity(0);
      this.moveTarget = null;
      this.sprite.anims.stop();
      this.sprite.setTexture("tauchien_0"); // idle
    }
    this.updateHpBar();
    return; // ✅ không attack khi đang move
  }

  // Auto acquire target
  if (!this.target || this.target.hp <= 0) {
    const candidates = [
      ...this.scene.units,
      ...this.scene.ships,
      ...this.scene.monsters,
      ...this.scene.animals,
    ].filter(u => u.faction !== this.faction && u.hp > 0);

    this.target = candidates.find(u =>
      Phaser.Math.Distance.Between(this.sprite.x, this.sprite.y, u.sprite.x, u.sprite.y) < this.attackRange
    ) || null;
  }

  if (this.target) {
    const dist = Phaser.Math.Distance.Between(this.sprite.x, this.sprite.y, this.target.sprite.x, this.target.sprite.y);
    if (dist < this.attackRange) {
      this.sprite.body.setVelocity(0);
      this.attack(this.target, time);
    } else {
      this.target = null;
    }
  }

  this.updateHpBar();
}


  updateHpBar() {
    this.hpBarBg.setPosition(this.sprite.x, this.sprite.y - 28);
    this.hpBar.setPosition(this.sprite.x, this.sprite.y - 28);
    this.hpBar.width = (this.hp / this.maxHp) * 45;
  }

  takeDamage(amount) {
  this.hp -= amount;
  if (this.hp < 0) this.hp = 0;
  this.updateHpBar();
  if (this.hp <= 0) this.destroy();
}

destroy() {
  if (this.sprite) this.sprite.destroy();
  if (this.hpBar) this.hpBar.destroy();
  if (this.hpBarBg) this.hpBarBg.destroy();

  // Xóa khỏi danh sách ships trong scene
  const idx = this.scene.ships.indexOf(this);
  if (idx !== -1) this.scene.ships.splice(idx, 1);
}

}

