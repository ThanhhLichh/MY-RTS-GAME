import Phaser from "phaser";
import GameScene from "./scenes/GameScene.js";
import UIScene from "./scenes/UIScene.js";

const config = {
  type: Phaser.AUTO,
  width: window.innerWidth,
  height: window.innerHeight,
  backgroundColor: "#1e1e1e",
  physics: { default: "arcade" },
  scene: [GameScene, UIScene],

  // 👇 Thêm phần scale để căn giữa
  scale: {
    mode: Phaser.Scale.FIT,          // tự co cho vừa khung
    autoCenter: Phaser.Scale.CENTER_BOTH, // căn giữa cả ngang dọc
  },
};

new Phaser.Game(config);
