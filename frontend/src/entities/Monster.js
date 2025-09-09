export class Monster {
  constructor(scene, x, y) {
    this.scene = scene;

    // 👹 Sprite quái với animation
    this.sprite = scene.add.sprite(x, y, "quai_0");
    this.sprite.play("quai_walk"); // animation đi bộ
    scene.physics.add.existing(this.sprite);
    this.sprite.body.setCollideWorldBounds(true);

    this.faction = "enemy";
    this.hp = 200;
    this.maxHp = 200;

    // Chiến đấu
    this.attackRange = 40;
    this.attackCooldown = 1500;
    this.lastAttack = 0;
    this.target = null;

    // 📍 Ghi nhớ vị trí hang
    this.homeX = x;
    this.homeY = y;
    this.aggroRange = 150;
    this.leashRange = 250;
    this.speed = 40;

    // 🟥 Thanh máu
    this.healthBarBg = scene.add.rectangle(x, y - 20, 32, 5, 0x555555).setDepth(1);
    this.healthBar = scene.add.rectangle(x, y - 20, 32, 5, 0xff0000).setDepth(2);
  }

  update(time) {
    if (!this.sprite || !this.sprite.body) return;

    // Update thanh máu
    this.healthBarBg.setPosition(this.sprite.x, this.sprite.y - 20);
    this.healthBar.setPosition(this.sprite.x, this.sprite.y - 20);
    this.healthBar.width = (this.hp / this.maxHp) * 32;

    // Check chết
    if (this.hp <= 0) {
      this.die();
      return;
    }

    // Nếu có target nhưng đã chết thì reset
    if (this.target && this.target.hp <= 0) {
      this.target = null;
    }

    // Nếu có target còn sống
    if (this.target) {
      const distToTarget = Phaser.Math.Distance.Between(
        this.sprite.x, this.sprite.y,
        this.target.sprite.x, this.target.sprite.y
      );
      const distFromHome = Phaser.Math.Distance.Between(
        this.sprite.x, this.sprite.y,
        this.homeX, this.homeY
      );

      if (distFromHome > this.leashRange) {
        this.target = null;
      }
      else if (distToTarget <= this.attackRange) {
        this.sprite.body.setVelocity(0);

        if (time > this.lastAttack + this.attackCooldown) {
          this.target.takeDamage ? this.target.takeDamage(15) : this.target.hp -= 15;
          console.log("👹 Monster hit! Target HP:", this.target.hp);
          this.lastAttack = time;
        }
      } else {
        this.scene.physics.moveTo(this.sprite, this.target.sprite.x, this.target.sprite.y, this.speed);
        this.sprite.setFlipX(this.sprite.body.velocity.x < 0);
        if (!this.sprite.anims.isPlaying) {
          this.sprite.play("quai_walk");
        }
      }
    }

    // Nếu không có target → tìm mới hoặc quay về hang
    if (!this.target) {
      const candidate = this.scene.units.find(
        u => u.faction === "player" &&
          u.hp > 0 &&
          Phaser.Math.Distance.Between(this.sprite.x, this.sprite.y, u.sprite.x, u.sprite.y) < this.aggroRange
      );

      if (candidate) {
        this.target = candidate;
      } else {
        const distHome = Phaser.Math.Distance.Between(this.sprite.x, this.sprite.y, this.homeX, this.homeY);
        if (distHome > 5) {
          this.scene.physics.moveTo(this.sprite, this.homeX, this.homeY, this.speed);
          this.sprite.setFlipX(this.sprite.body.velocity.x < 0);
          if (!this.sprite.anims.isPlaying) {
            this.sprite.play("quai_walk");
          }
        } else {
          this.sprite.body.setVelocity(0);
        }
      }
    }
  }

  takeDamage(amount) {
    this.hp -= amount;
    if (this.hp <= 0) {
      this.die();
    }
  }

  die() {
    if (!this.sprite.active) return;
    this.sprite.destroy();
    this.healthBar.destroy();
    this.healthBarBg.destroy();

    const idx = this.scene.monsters.indexOf(this);
    if (idx !== -1) this.scene.monsters.splice(idx, 1);

    // Loot
    this.scene.resources.meat += Phaser.Math.Between(10, 20);
    this.scene.resources.gold += Phaser.Math.Between(20, 40);
    this.scene.events.emit("updateHUD", this.scene.resources);
  }
}
