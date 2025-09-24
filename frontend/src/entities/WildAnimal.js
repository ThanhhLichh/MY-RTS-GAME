export class WildAnimal {
  constructor(scene, x, y) {
    this.scene = scene;

    // 🦌 Dùng sprite nai thay vì hình tròn
    this.sprite = scene.add.sprite(x, y, "nai_0");
    this.sprite.play("nai_walk"); // animation
    this.sprite.setDepth(10); // để hiện trên cây/đá nếu cần

    scene.physics.add.existing(this.sprite);
    this.sprite.body.setCollideWorldBounds(true);

    this.faction = "enemy"; // 👈 gán phe enemy
    this.hp = 50;
    this.speed = 20; // tốc độ di chuyển
    this.wanderCooldown = 0;
  }

  update(time) {
  if (!this.sprite || !this.sprite.body) return;

  if (time > this.wanderCooldown) {
    const angle = Phaser.Math.FloatBetween(0, Math.PI * 2);
    const dx = Math.cos(angle) * this.speed;
    const dy = Math.sin(angle) * this.speed;

    const newX = this.sprite.x + dx;
    const newY = this.sprite.y + dy;

    // 🔒 Check nhiều điểm quanh sprite để tránh mép nước
    const nearWater =
      this.scene.isWater(newX, newY) ||
      this.scene.isWater(newX + 20, newY) ||
      this.scene.isWater(newX - 20, newY) ||
      this.scene.isWater(newX, newY + 20) ||
      this.scene.isWater(newX, newY - 20);

    if (nearWater) {
      // 🚫 Nếu gặp biển → đứng lại và thử hướng khác nhanh hơn
      this.sprite.body.setVelocity(0, 0);
      this.wanderCooldown = time + 200; // 0.2s sau random lại
      if (time > this.wanderCooldown) {
  let tried = 0;
  let moved = false;

  while (tried < 5 && !moved) {
    const angle = Phaser.Math.FloatBetween(0, Math.PI * 2);
    const dx = Math.cos(angle) * this.speed;
    const dy = Math.sin(angle) * this.speed;

    const newX = this.sprite.x + dx;
    const newY = this.sprite.y + dy;

    const nearWater =
      this.scene.isWater(newX, newY) ||
      this.scene.isWater(newX + 20, newY) ||
      this.scene.isWater(newX - 20, newY) ||
      this.scene.isWater(newX, newY + 20) ||
      this.scene.isWater(newX, newY - 20);

    if (!nearWater) {
      this.sprite.body.setVelocity(dx, dy);
      this.sprite.setFlipX(dx < 0);
      if (!this.sprite.anims.isPlaying) this.sprite.play("nai_walk");
      this.wanderCooldown = time + Phaser.Math.Between(2000, 4000);
      moved = true;
    }

    tried++;
  }

  if (!moved) {
    this.sprite.body.setVelocity(0, 0);
    this.wanderCooldown = time + 200;
  }
}

    }

    // ✅ Cho di chuyển
    this.sprite.body.setVelocity(dx, dy);

    // ✅ Flip sprite khi quay trái/phải
    this.sprite.setFlipX(dx < 0);

    // ✅ Gọi lại animation nếu chưa chạy
    if (!this.sprite.anims.isPlaying) {
      this.sprite.play("nai_walk");
    }

    // Thời gian tới lần wander tiếp theo
    this.wanderCooldown = time + Phaser.Math.Between(2000, 4000);
  }
}




  takeDamage(amount) {
    this.hp -= amount;
    if (this.hp <= 0) {
      if (this.sprite) this.sprite.destroy();

      // Xoá khỏi danh sách thú rừng
      const idx = this.scene.animals.indexOf(this);
      if (idx !== -1) this.scene.animals.splice(idx, 1);

      // Rớt loot
      this.scene.resources.meat += Phaser.Math.Between(3, 7);
      if (Math.random() < 0.3) {
        this.scene.resources.gold += Phaser.Math.Between(2, 5);
      }
      this.scene.events.emit("updateHUD", this.scene.resources);
    }
  }
}
