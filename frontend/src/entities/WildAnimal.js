export class WildAnimal {
  constructor(scene, x, y) {
    this.scene = scene;
    this.sprite = scene.add.circle(x, y, 14, 0x964b00); // nâu
    scene.physics.add.existing(this.sprite);
    this.sprite.body.setCollideWorldBounds(true);

    this.faction = "enemy";   // 👈 thêm faction
    this.hp = 50;
    this.speed = 20; // chậm
    this.wanderCooldown = 0;
  }

  update(time) {
    if (!this.sprite || !this.sprite.body) return; // ✅ tránh lỗi khi đã destroy

    if (time > this.wanderCooldown) {
      const angle = Phaser.Math.FloatBetween(0, Math.PI * 2);
      const dx = Math.cos(angle) * this.speed;
      const dy = Math.sin(angle) * this.speed;
      this.sprite.body.setVelocity(dx, dy);
      this.wanderCooldown = time + Phaser.Math.Between(2000, 4000); // đổi hướng sau 2-4s
    }
  }

  takeDamage(amount) {
    this.hp -= amount;
    if (this.hp <= 0) {
      if (this.sprite) this.sprite.destroy();

      // Xóa khỏi mảng animals (chứ không phải units)
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
