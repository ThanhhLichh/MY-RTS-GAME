export class MeleeSoldier {
  constructor(scene, x, y, faction = "player") {
    this.scene = scene;
    this.sprite = scene.add.rectangle(x, y, 16, 16, 0x990000);
    scene.physics.add.existing(this.sprite);
    this.sprite.body.setCollideWorldBounds(true);

    this.type = "melee";
    this.faction = faction;   // 👈 Thêm faction

    this.speed = 80;
    this.attackRange = 20;
    this.attackCooldown = 1000;
    this.lastAttack = 0;

    this.target = null;
    this.moveTarget = null;
    this.hp = 50;
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

  update(time) {
    // Nếu có toạ độ để đi
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

    // Nếu có target kẻ địch
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
    this.target.takeDamage(10);  // Gọi đúng hàm của quái/thú
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
    this.sprite.destroy();
    // Xóa khỏi mảng units
    const idx = this.scene.units.indexOf(this);
    if (idx !== -1) this.scene.units.splice(idx, 1);
  }
  }
}

export class RangedSoldier {
  constructor(scene, x, y, faction = "player") {
    this.scene = scene;
    this.sprite = scene.add.rectangle(x, y, 16, 16, 0x000099);
    scene.physics.add.existing(this.sprite);
    this.sprite.body.setCollideWorldBounds(true);

    this.type = "ranged";
    this.faction = faction;   // 👈 Thêm faction

    this.speed = 80;
    this.attackRange = 120;
    this.attackCooldown = 1200;
    this.lastAttack = 0;

    this.target = null;
    this.moveTarget = null;
    this.hp = 35;
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

  shootProjectile(target) {
    const bullet = this.scene.add.circle(this.sprite.x, this.sprite.y, 4, 0xffffff);
    this.scene.physics.add.existing(bullet);
    this.scene.physics.moveTo(bullet, target.sprite.x, target.sprite.y, 200);

    // Va chạm
    this.scene.time.delayedCall(1000, () => {
      bullet.destroy();
    });

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
    // Di chuyển tới điểm click
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

    // Nếu có target
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
    this.sprite.destroy();
    // Xóa khỏi mảng units
    const idx = this.scene.units.indexOf(this);
    if (idx !== -1) this.scene.units.splice(idx, 1);
  }
  }
}
