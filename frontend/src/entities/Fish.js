export default class Fish {
  constructor(scene, x, y) {
    this.scene = scene;
    this.x = x;
    this.y = y;
    this.type = "fish";
    this.frame = 0;

    // 🐟 Sprite cá
    this.sprite = scene.add.image(x, y, "fish_0").setOrigin(0.5).setScale(0.7);
    scene.physics.add.existing(this.sprite);
    this.sprite.body.setImmovable(true);

    // 🎞️ Chuyển frame ảnh mỗi 200ms
    this.timer = scene.time.addEvent({
      delay: 200,
      loop: true,
      callback: this.updateFrame,
      callbackScope: this
    });

    // 🧱 Hitbox vật lý
    const width = this.sprite.displayWidth;
    const height = this.sprite.displayHeight;
    this.sprite.body.setSize(width, height);
    this.sprite.body.setOffset(-width / 2, -height / 2);

    // 🔢 Số lượng cá
    this.amount = Phaser.Math.Between(90, 140);

    // 🧭 Tọa độ trung tâm bơi và góc quay
    this.centerX = x;
    this.centerY = y;
    this.angle = Phaser.Math.FloatBetween(0, Math.PI * 2);  // ngẫu nhiên
    this.radius = Phaser.Math.Between(5, 15); // bán kính bơi
    this.speed = Phaser.Math.FloatBetween(0.0008, 0.001);


    // ⏱️ Gọi updateMovement mỗi frame
    scene.events.on("update", this.updateMovement, this);
  }

  updateFrame() {
    this.frame = (this.frame + 1) % 4;
    this.sprite.setTexture(`fish_${this.frame}`);
  }

  updateMovement(time, delta) {
    this.angle += this.speed * delta;

    const offsetX = Math.cos(this.angle) * this.radius;
    const offsetY = Math.sin(this.angle) * this.radius;

    this.sprite.x = this.centerX + offsetX;
    this.sprite.y = this.centerY + offsetY;
  }

  harvest() {
    if (this.amount > 0) {
      this.amount--;
      if (this.amount <= 0) {
        this.sprite.destroy();
        this.timer.remove();
        this.scene.events.off("update", this.updateMovement, this); // cleanup
      }
      return this.type;
    }
    return null;
  }
}
