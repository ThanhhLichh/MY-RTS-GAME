export default class ResourceNode {
  constructor(scene, x, y, type, textureOrColor) {
    this.scene = scene;
    this.type = type;
    this.x = x;
    this.y = y;

    // 🎨 Nếu là string thì coi là texture key
    if (typeof textureOrColor === "string") {
      this.sprite = scene.add.image(x, y, textureOrColor).setOrigin(0.5).setScale(0.7);

      // ✅ Add physics body sau khi scale
      scene.physics.add.existing(this.sprite);
      this.sprite.body.setImmovable(true);

      // 🧱 Set hitbox kích thước phù hợp theo scale
      const width = this.sprite.displayWidth;
      const height = this.sprite.displayHeight;
      this.sprite.body.setSize(width, height); // full size = ảnh
      this.sprite.body.setOffset(-width / 2, -height / 2); // căn giữa

    } else {
      // Fallback nếu không có ảnh (debug)
      if (type === "fish") {
        this.sprite = scene.add.circle(x, y, 20, textureOrColor);
      } else {
        this.sprite = scene.add.rectangle(x, y, 30, 30, textureOrColor);
      }
      scene.physics.add.existing(this.sprite);
      this.sprite.body.setImmovable(true);
    }

    // 🔢 Số lượng resource tuỳ loại
    if (type === "tree") {
      this.amount = Phaser.Math.Between(20, 50);
    } else if (type === "stone") {
      this.amount = Phaser.Math.Between(100, 150);
    } else if (type === "gold") {
      this.amount = Phaser.Math.Between(150, 2000);
    } else if (type === "fish") {
      this.amount = Phaser.Math.Between(90, 140);
    } else {
      this.amount = Phaser.Math.Between(20, 50);
    }
  }

  harvest() {
    if (this.amount > 0) {
      this.amount--;
      if (this.amount <= 0) {
        this.sprite.destroy();
      }
      return this.type;
    }
    return null;
  }
}
