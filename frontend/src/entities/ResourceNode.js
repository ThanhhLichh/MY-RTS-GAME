export default class ResourceNode {
  constructor(scene, x, y, type, color) {
    this.scene = scene;
    this.type = type;

    // 🎨 Hình dạng hiển thị
    if (type === "fish") {
      this.sprite = scene.add.circle(x, y, 20, color);
    } else {
      this.sprite = scene.add.rectangle(x, y, 30, 30, color);
    }

    scene.physics.add.existing(this.sprite);
    this.sprite.body.setImmovable(true);

    this.x = x;
    this.y = y;

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
