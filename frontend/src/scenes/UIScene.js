export default class UIScene extends Phaser.Scene {
  constructor() {
    super("UIScene");
  }

  create() {
    this.scene.bringToTop(); // luôn nằm trên cùng

    const gameScene = this.scene.get("GameScene");

    // HUD text (cố định góc trái trên)
    this.hudText = this.add.text(10, 10, "", {
      fontSize: "16px",
      color: "#fff",
    }).setScrollFactor(0);

    // 👂 Lắng nghe sự kiện updateHUD từ GameScene
    gameScene.events.on("updateHUD", (resources) => {
      this.updateHUD(resources);
    });
    this.updateHUD(gameScene.resources);

    // ===== Build Menu (góc phải dưới, cố định) =====
    const menuWidth = 320;   // tăng chiều rộng cho đủ 4 nút
    const menuHeight = 80;
    const menuX = this.scale.width - menuWidth - 20;
    const menuY = this.scale.height - menuHeight - 20;

    this.add.rectangle(menuX, menuY, menuWidth, menuHeight, 0x333333)
      .setOrigin(0).setStrokeStyle(2, 0x555555).setScrollFactor(0);

    // Button House
    const houseBtn = this.add.circle(menuX + 40, menuY + 40, 24, 0x444444)
      .setInteractive({ useHandCursor: true }).setScrollFactor(0);
    this.add.text(houseBtn.x - 14, houseBtn.y - 16, "🏠", { fontSize: "22px", color: "#fff" }).setScrollFactor(0);
    this.add.text(houseBtn.x - 18, houseBtn.y + 18, "Nhà", { fontSize: "11px", color: "#fff" }).setScrollFactor(0);
    houseBtn.on("pointerdown", () => {
      this.events.emit("build", "House");
    });

    // Button Barracks
    const barracksBtn = this.add.circle(menuX + 120, menuY + 40, 24, 0x444444)
      .setInteractive({ useHandCursor: true }).setScrollFactor(0);
    this.add.text(barracksBtn.x - 14, barracksBtn.y - 16, "🏰", { fontSize: "22px", color: "#fff" }).setScrollFactor(0);
    this.add.text(barracksBtn.x - 30, barracksBtn.y + 18, "Barracks", { fontSize: "11px", color: "#fff" }).setScrollFactor(0);
    barracksBtn.on("pointerdown", () => {
      this.events.emit("build", "Barracks");
    });

    // Button Tower
    const towerBtn = this.add.circle(menuX + 200, menuY + 40, 24, 0x888888)
      .setInteractive({ useHandCursor: true }).setScrollFactor(0);
    this.add.text(towerBtn.x - 14, towerBtn.y - 16, "🗼", { fontSize: "22px", color: "#fff" }).setScrollFactor(0);
    this.add.text(towerBtn.x - 20, towerBtn.y + 18, "Tower", { fontSize: "11px", color: "#fff" }).setScrollFactor(0);
    towerBtn.on("pointerdown", () => {
      this.events.emit("build", "Tower");
    });

    // 🚢 Button Shipyard
    const shipyardBtn = this.add.circle(menuX + 280, menuY + 40, 24, 0x5555aa)
      .setInteractive({ useHandCursor: true }).setScrollFactor(0);
    this.add.text(shipyardBtn.x - 14, shipyardBtn.y - 16, "🚢", { fontSize: "22px", color: "#fff" }).setScrollFactor(0);
    this.add.text(shipyardBtn.x - 28, shipyardBtn.y + 18, "Shipyard", { fontSize: "11px", color: "#fff" }).setScrollFactor(0);
    shipyardBtn.on("pointerdown", () => {
      this.events.emit("build", "Shipyard");
    });
  }

  // Hàm cập nhật HUD
  updateHUD(resources) {
    this.hudText.setText(
      `Food: ${resources.food}/${resources.cap} | Wood: ${resources.wood} | Stone: ${resources.stone} | Gold: ${resources.gold} | Meat: ${resources.meat}`
    );
  }
}
