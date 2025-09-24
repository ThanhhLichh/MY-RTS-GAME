import { MeleeSoldier, RangedSoldier, Healer, Cavalry, DragonKnight } from "../entities/Soldier.js";


export class Building {
  constructor(scene, x, y, width, height, color, name) {
    this.scene = scene;
    this.x = x;
    this.y = y;
    this.name = name || "Building";
    this.isDestroyed = false;

    // HP mặc định
    this.maxHp = 100;
    this.hp = this.maxHp;

    // Vẽ công trình
    this.sprite = scene.add.rectangle(x, y, width, height, color);
    scene.physics.add.existing(this.sprite);
    this.sprite.body.setImmovable(true);
    this.sprite.setInteractive({ useHandCursor: true });

    // Label tên công trình
    // this.label = scene.add.text(x - width / 2, y - height / 2 - 15, this.name, {
    //   fontSize: "10px",
    //   color: "#fff",
    // });

    // Thanh máu
    this.hpBarBg = scene.add.rectangle(x, y - height / 2 - 5, width, 4, 0x000000).setDepth(10);
    this.hpBar = scene.add.rectangle(x, y - height / 2 - 5, width, 4, 0xff0000).setDepth(11);

    this.hpBarVisibleUntil = 0; // thời gian cần hiển thị thanh máu
    this.hpBar.setVisible(false);
    this.hpBarBg.setVisible(false);
  }

  takeDamage(amount) {
  if (this.isDestroyed) return;

  this.hp -= amount;
  if (this.hp <= 0) {
    this.hp = 0;
    this.destroy();
  } else {
    this.updateHpBar();

    // 👉 Hiện thanh máu trong 3 giây kể từ lúc bị tấn công
    const now = this.scene.time.now;
    this.hpBar.setVisible(true);
    this.hpBarBg.setVisible(true);
    this.hpBarVisibleUntil = now + 3000; // 3 giây
  }
}


  updateHpBar() {
  if (this.hpBar) {
    const ratio = Phaser.Math.Clamp(this.hp / this.maxHp, 0, 1);
    const width = this.hpBarWidth || this.hpBar.width;
    this.hpBar.width = width * ratio;
  }
}





  destroy() {
  if (this.isDestroyed) return;
  this.isDestroyed = true;
  this.sprite.destroy();
  if (this.label) this.label.destroy();
  if (this.hpBar) this.hpBar.destroy();
  if (this.hpBarBg) this.hpBarBg.destroy();

  // 🧹 Xoá khỏi các mảng quản lý
  if (this.scene.houses?.includes(this)) {
    this.scene.houses = this.scene.houses.filter(b => b !== this);
  }
  if (this.scene.towers?.includes(this)) {
    this.scene.towers = this.scene.towers.filter(b => b !== this);
  }
  if (this.scene.barracks?.includes(this)) {
    this.scene.barracks = this.scene.barracks.filter(b => b !== this);
  }

  if (this.scene.mainHouse === this) {
    this.scene.mainHouse = null;
  }
}


  update(time) {
  if (this.hpBar && this.hpBarVisibleUntil > 0) {
    if (time > this.hpBarVisibleUntil) {
      this.hpBar.setVisible(false);
      this.hpBarBg.setVisible(false);
      this.hpBarVisibleUntil = 0;
    }
  }
}
}




export class MainHouse extends Building {
  constructor(scene, x, y) {
    // super(...) bỏ qua vì ta sẽ vẽ ảnh riêng
    super(scene, x, y, 0, 0, 0x000000, "Main House");

    this.maxHp = 300;
    this.hp = this.maxHp;
    this.visionRange = 300;

    // 🔁 Xoá sprite cũ (nếu có)
    this.sprite.destroy();

    // 🏰 Vẽ ảnh nhà chính
    this.sprite = scene.add.image(x, y, "main-house").setOrigin(0.5).setScale(0.8);
    scene.physics.add.existing(this.sprite);
    this.sprite.body.setImmovable(true);

    // 🧱 Chỉnh hitbox
    const w = this.sprite.displayWidth;
    const h = this.sprite.displayHeight;
    this.sprite.body.setSize(w * 0.9, h * 0.9);
    this.sprite.body.setOffset(-w * 0.45, -h * 0.45);

    // 📛 Label
    // this.label = scene.add.text(x - w / 2, y - h / 2 - 15, this.name, {
    //   fontSize: "10px",
    //   color: "#fff",
    // });

    // ❤️ Thanh máu
    this.hpBarBg = scene.add.rectangle(x, y - h / 2 - 5, w, 4, 0x000000).setDepth(10);
    this.hpBar = scene.add.rectangle(x, y - h / 2 - 5, w, 4, 0xff0000).setDepth(11);

    // Ẩn thanh máu mặc định
    this.hpBar.setVisible(false);
    this.hpBarBg.setVisible(false);

    this.hpBarWidth = w;
  }
}


export class House extends Building {
  constructor(scene, x, y) {
    super(scene, x, y, 0, 0, 0x000000, "House");

    this.maxHp = 100;
    this.hp = this.maxHp;
    this.visionRange = 150;

    this.sprite.destroy();

    this.sprite = scene.add.image(x, y, "house").setOrigin(0.5).setScale(0.8);
    scene.physics.add.existing(this.sprite);
    this.sprite.body.setImmovable(true);

    const w = this.sprite.displayWidth;
    const h = this.sprite.displayHeight;
    this.sprite.body.setSize(w * 0.8, h * 0.8);
    this.sprite.body.setOffset(-w * 0.4, -h * 0.4);

    // this.label = scene.add.text(x - w / 2, y - h / 2 - 15, this.name, {
    //   fontSize: "10px",
    //   color: "#fff",
    // });

    this.hpBarBg = scene.add.rectangle(x, y - h / 2 - 5, w, 4, 0x000000).setDepth(10);
    this.hpBar = scene.add.rectangle(x, y - h / 2 - 5, w, 4, 0xff0000).setDepth(11);

    // Ẩn mặc định
    this.hpBar.setVisible(false);
    this.hpBarBg.setVisible(false);
    this.hpBarWidth = w;
    
  }
}

export class Barracks extends Building {
  constructor(scene, x, y) {
    super(scene, x, y, 0, 0, 0x000000, "Barracks");

    this.maxHp = 150;
    this.hp = this.maxHp;
    this.visionRange = 150;
    this.spawnQueue = [];
    this.isSpawning = false;
    this.spawnDelays = {
  melee: 3000,
  ranged: 3000,
  healer: 3000,
  cavalry: 5000,
  dragon: 5000,
};


    // ❌ Xoá sprite cũ
    this.sprite.destroy();
    // 📦 Container chứa các phần tử hiển thị progress
this.spawnProgressBg = this.scene.add.rectangle(this.x, this.y - 45, 50, 8)
  .setStrokeStyle(1, 0xffffff)
  .setFillStyle(0x000000, 0.4) // nền đen mờ
  .setVisible(false);


this.spawnProgressBar = this.scene.add.rectangle(this.x - 25, this.y - 45, 0, 8, 0x00ff00)
  .setOrigin(0, 0.5)
  .setDepth(101)
  .setVisible(false);

this.spawnLabel = this.scene.add.text(this.x, this.y - 60, "", {
  fontSize: "12px",
  color: "#fff",
  fontStyle: "bold",
  stroke: "#000",
  strokeThickness: 3,
})
  .setOrigin(0.5)
  .setDepth(101)
  .setVisible(false);



    // 🏗️ Sprite ảnh
    this.sprite = scene.add.image(x, y, "barracks").setOrigin(0.5).setScale(0.8);
    scene.physics.add.existing(this.sprite);
    this.sprite.body.setImmovable(true);

    // 📐 Hitbox vật lý (vừa khớp hình ảnh)
    const w = this.sprite.displayWidth;
    const h = this.sprite.displayHeight;
    this.sprite.body.setSize(w * 0.8, h * 0.8);
    this.sprite.body.setOffset(-w * 0.4, -h * 0.4);

    // ✅ Tương tác click CHỈ CHO SPRITE nhà
    this.sprite.setInteractive({ useHandCursor: true });
    this.sprite.on("pointerdown", (pointer) => {
      pointer.event.stopPropagation(); // ⚠️ Ngăn click lan ra ngoài
      if (this.scene.showBarracksMenu) {
        this.scene.showBarracksMenu(this);
      }
    });

    // 🏷️ Label
    // this.label = scene.add.text(x - w / 2, y - h / 2 - 15, this.name, {
    //   fontSize: "10px",
    //   color: "#fff",
    // });

    // ❤️ Thanh máu – đặt gần đỉnh nhà, không quá cao
    const barWidth = w * 0.8;
    const barX = x;
    const barY = y - h / 2 + 8; // thấp hơn so với -h/2 - 5

    this.hpBarBg = scene.add.rectangle(barX, barY, barWidth, 4, 0x000000).setDepth(10);
    this.hpBar = scene.add.rectangle(barX, barY, barWidth, 4, 0xff0000).setDepth(11);

    this.hpBar.setVisible(false);
    this.hpBarBg.setVisible(false);

    // ❌ Không cho tương tác thanh máu
    this.hpBar.disableInteractive();
    this.hpBarBg.disableInteractive();

    this.hpBarWidth = barWidth;
    
  }

  spawnUnit(type, scene, resources) {
  const cost = {
    melee: { gold: 20, food: 1 },
    ranged: { wood: 20, food: 1 },
    healer: { gold: 30, food: 1 },
    cavalry: { gold: 60, wood: 30, food: 1 },
    dragon: { gold: 80, wood: 40, food: 1 },
  };

  const c = cost[type];
  if (!c) return;

  const enough =
    (c.gold === undefined || resources.gold >= c.gold) &&
    (c.wood === undefined || resources.wood >= c.wood) &&
    (resources.food < resources.cap);

  if (!enough) {
    console.log("❌ Not enough resources for", type);
    return;
  }

  // Trừ tài nguyên ngay khi vào hàng đợi
  if (c.gold) resources.gold -= c.gold;
  if (c.wood) resources.wood -= c.wood;
  resources.food += 1;

  scene.events.emit("updateHUD", resources);
  this.spawnQueue.push(type);

  if (!this.isSpawning) this.processSpawnQueue(scene, resources);
}
processSpawnQueue(scene, resources) {
  if (this.spawnQueue.length === 0) {
    this.isSpawning = false;

    // Ẩn progress UI
    this.spawnProgressBg.setVisible(false);
    this.spawnProgressBar.setVisible(false);
    this.spawnLabel.setVisible(false);

    return;
  }

  this.isSpawning = true;
  const type = this.spawnQueue.shift();
  const x = this.x + 60;
  const y = this.y;

  // 🧠 Bắt đầu hiển thị progress bar
  this.spawnProgressBg.setVisible(true);
  this.spawnProgressBar.setVisible(true);
  this.spawnProgressBar.width = 0;

  const emojiMap = {
  melee: "⚔️",
  ranged: "🏹",
  healer: "🧝",
  cavalry: "🐎",
  dragon: "🐉",
};

const labelText = `${emojiMap[type] || "⏳"} Training ${type.charAt(0).toUpperCase() + type.slice(1)}...`;
this.spawnLabel.setText(labelText);

  this.spawnLabel.setVisible(true);

  const total = this.spawnDelays[type] || 3000; // mặc định 3s nếu không có

  let elapsed = 0;

  const progressTimer = scene.time.addEvent({
    delay: 50,
    loop: true,
    callback: () => {
      elapsed += 50;
      const percent = Phaser.Math.Clamp(elapsed / total, 0, 1);
      this.spawnProgressBar.width = 50 * percent;

      if (percent >= 1) {
        progressTimer.remove();

        let unit = null;
        switch (type) {
          case "melee": unit = new MeleeSoldier(scene, x, y); break;
          case "ranged": unit = new RangedSoldier(scene, x, y); break;
          case "healer": unit = new Healer(scene, x, y); break;
          case "cavalry": unit = new Cavalry(scene, x, y); break;
          case "dragon": unit = new DragonKnight(scene, x, y); break;
        }

        if (unit) scene.units.push(unit);

        // Ẩn progress UI
        this.spawnProgressBg.setVisible(false);
        this.spawnProgressBar.setVisible(false);
        this.spawnLabel.setVisible(false);

        this.processSpawnQueue(scene, resources); // gọi tiếp
      }
    },
  });
}

}



export class Tower extends Building {
  constructor(scene, x, y) {
    super(scene, x, y, 0, 0, 0x000000, "Tower");

    this.maxHp = 120;
    this.hp = this.maxHp;
    this.visionRange = 150;
    


    this.sprite.destroy();

    this.sprite = scene.add.image(x, y, "tower").setOrigin(0.5).setScale(0.8);
    scene.physics.add.existing(this.sprite);
    this.sprite.body.setImmovable(true);

    const w = this.sprite.displayWidth;
    const h = this.sprite.displayHeight;
    this.sprite.body.setSize(w * 0.8, h * 0.8);
    this.sprite.body.setOffset(-w * 0.4, -h * 0.4);

    // this.label = scene.add.text(x - w / 2, y - h / 2 - 15, this.name, {
    //   fontSize: "10px",
    //   color: "#fff",
    // });

    this.hpBarBg = scene.add.rectangle(x, y - h / 2 - 5, w, 4, 0x000000).setDepth(10);
    this.hpBar = scene.add.rectangle(x, y - h / 2 - 5, w, 4, 0xff0000).setDepth(11);

    this.hpBar.setVisible(false);
    this.hpBarBg.setVisible(false);
    this.hpBarWidth = w; // cần thiết cho updateHpBar


    this.attackRange = 120;
    this.attackCooldown = 1000;
    this.lastAttack = 0;
  }






  update(time) {
    super.update(time);
    if (this.isDestroyed) return;

    const enemy = this.scene.units.find(
      u =>
        u.faction === "enemy" &&
        u.hp > 0 &&
        Phaser.Math.Distance.Between(this.x, this.y, u.sprite.x, u.sprite.y) < this.attackRange
    );

    if (enemy && time - this.lastAttack > this.attackCooldown) {
      this.lastAttack = time;
      enemy.hp -= 15;

      const line = this.scene.add.line(
        0, 0, this.x, this.y, enemy.sprite.x, enemy.sprite.y, 0xff0000
      )
        .setLineWidth(2)
        .setDepth(100)
        .setAlpha(0.7)
        .setOrigin(0);

      this.scene.time.delayedCall(200, () => line.destroy());
    }
  }
}

export class Shipyard extends Building {
  constructor(scene, x, y) {
    super(scene, x, y, 0, 0, 0x000000, "Shipyard");

    this.maxHp = 200;
    this.hp = this.maxHp;
    this.visionRange = 200;
    this.x = x;                  // ✅ Quan trọng
    this.y = y;
    this.type = "shipyard";   
    

    this.sprite.destroy();

    // 🛠 Sprite Xưởng
    this.sprite = scene.add.image(x, y, "shipyard").setOrigin(0.5).setScale(0.8);
    scene.physics.add.existing(this.sprite);
    this.sprite.body.setImmovable(true);

    const w = this.sprite.displayWidth;
    const h = this.sprite.displayHeight;
    this.sprite.body.setSize(w * 0.8, h * 0.8);
    this.sprite.body.setOffset(-w * 0.4, -h * 0.4);

    // 👉 Thêm interactive để mở menu
    this.sprite.setInteractive({ useHandCursor: true });
    this.sprite.on("pointerdown", (pointer) => {
      pointer.event.stopPropagation();
      if (this.scene.showShipyardMenu) {
        this.scene.showShipyardMenu(this);
      }
    });

    // ❤️ Thanh máu
    this.hpBarBg = scene.add.rectangle(x, y - h / 2 - 5, w, 4, 0x000000).setDepth(10);
    this.hpBar = scene.add.rectangle(x, y - h / 2 - 5, w, 4, 0xff0000).setDepth(11);

    this.hpBar.setVisible(false);
    this.hpBarBg.setVisible(false);
    this.hpBarWidth = w;
   
      
  }
}



