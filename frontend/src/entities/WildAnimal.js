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

  // ✅ Nếu đến lúc đổi hướng → tạo chuyển động mới
  if (time > this.wanderCooldown) {
    const angle = Phaser.Math.FloatBetween(0, Math.PI * 2);
    const dx = Math.cos(angle) * this.speed;
    const dy = Math.sin(angle) * this.speed;

    this.sprite.body.setVelocity(dx, dy);

    // ✅ Flip sprite khi quay trái/phải (cho sinh động)
    this.sprite.setFlipX(dx < 0);

    // ✅ Gọi lại animation nếu chưa chạy
    if (!this.sprite.anims.isPlaying) {
      this.sprite.play("nai_walk");
    }

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
