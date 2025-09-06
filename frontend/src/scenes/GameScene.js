import Worker from "../entities/Worker.js";
import ResourceNode from "../entities/ResourceNode.js";
import { MeleeSoldier, RangedSoldier, Healer } from "../entities/Soldier.js";
import { MainHouse, House, Barracks, Tower } from "../entities/Building.js";
import { WildAnimal } from "../entities/WildAnimal.js";
import { Monster } from "../entities/Monster.js";

export default class GameScene extends Phaser.Scene {
  constructor() {
    super("GameScene");
    this.resources = {
      food: 0,   // dân số đang dùng
      cap: 500,   // giới hạn dân số
      wood: 500,
      stone: 500,
      gold: 500,
      meat: 500,
    };

    // Danh sách entity
    this.workers = [];
    this.houses = [];
    this.units = []; // soldiers
    this.resourcesNodes = [];

    // Selection
    this.selectedUnits = [];
    this.isDragging = false;
    this.dragStart = null;
    this.selectionRect = null;

    // Barracks
    this.activeBarracks = null;
    this.barracksMenu = null;

    // Build mode
    this.buildingPreview = null;
    this.buildingType = null;
    this.skipNextPointerDown = false;

    this.towers = [];

    this.monsters = [];
    this.animals = [];

    this.hoveredTarget = null; // kẻ địch hoặc thú được hover


  }

  create() {

    const worldWidth = 3000;
    const worldHeight = 3000;
    this.cameras.main.setBounds(0, 0, worldWidth, worldHeight);
    this.physics.world.setBounds(0, 0, worldWidth, worldHeight);

    this.isPanning = false;
    this.panStart = null;
    this.cameraStart = null;

    this.input.mouse.disableContextMenu();

    // Main House
    this.mainHouse = new MainHouse(this, 400, 300);

    // Bật UIScene
    this.scene.launch("UIScene");

    // HUD ban đầu
    this.events.emit("updateHUD", this.resources);

    this.scene.get("UIScene").events.on("build", (type) => {
    if (!this.buildingPreview) {
      this.startBuildMode(type);
    }});

    // Spawn tài nguyên ngẫu nhiên
    this.spawnResources();

//     // Spawn thử 1 Tower
//     this.tower = new Tower(this, 600, 300);
//     this.towers.push(this.tower); // Đúng mảng!

// // Spawn 1 lính địch melee để test
//     const enemy = new MeleeSoldier(this, 800, 300, "enemy");
//     enemy.sprite.setFillStyle(0x00ff00); // tô xanh lá để phân biệt địch
//     this.units.push(enemy);

// // Cho lính địch tự động đi về phía tower
//     enemy.moveTo(600, 300);

    // Spawn Worker (Q)
    this.input.keyboard.on("keydown-Q", () => {
      if (this.resources.food < this.resources.cap) {
        const worker = new Worker(this, 400, 400);
        this.workers.push(worker);
        this.resources.food += 1;
        this.events.emit("updateHUD", this.resources);
      }
    });

    // Pointer events
 // 🖱 Pointer Down
this.input.on("pointerdown", (pointer) => {
  // Bắt đầu kéo bản đồ bằng chuột phải
  if (pointer.rightButtonDown() && !this.buildingPreview) {
    this.isPanning = true;
    this.panStart = { x: pointer.x, y: pointer.y };
    this.cameraStart = { x: this.cameras.main.scrollX, y: this.cameras.main.scrollY };
  }

  // Nếu đang build
  if (this.buildingPreview) {
    if (this.skipNextPointerDown) {
      this.skipNextPointerDown = false;
      return;
    }
    if (pointer.leftButtonDown()) {
      this.placeBuilding(pointer.worldX, pointer.worldY);
    } else if (pointer.rightButtonDown()) {
      this.cancelBuildMode();
    }
    return; // thoát luôn
  }

  // Chuột trái → chọn lính
  if (pointer.leftButtonDown()) {
    this.isDragging = true;
    this.dragStart = { x: pointer.worldX, y: pointer.worldY };
    if (this.selectionRect) this.selectionRect.destroy();
    this.selectionRect = this.add.rectangle(pointer.worldX, pointer.worldY, 1, 1, 0x00aaff, 0.2)
      .setStrokeStyle(1, 0x00aaff)
      .setOrigin(0);
  }

  // Chuột phải → ra lệnh
  if (pointer.rightButtonDown() && this.selectedUnits.length > 0) {
    if (this.hoveredTarget) {
      // Nếu hover quái/thú → tấn công
      this.selectedUnits.forEach((unit) => {
        if (unit.attack) unit.attack(this.hoveredTarget);
      });
    } else {
      // Nếu không thì thử xem có tài nguyên không
      const targetNode = this.resourcesNodes.find(
        (n) =>
          Phaser.Math.Distance.Between(pointer.worldX, pointer.worldY, n.x, n.y) < 20
      );

      this.selectedUnits.forEach((unit, i) => {
        if (unit.commandHarvest && targetNode) {
          // Worker → khai thác
          unit.commandHarvest(targetNode, this.resources, () => {
            this.events.emit("updateHUD", this.resources);
          });
        } else if (unit.moveTo) {
          // Soldier/Worker → di chuyển
          unit.moveTo(pointer.worldX + i * 10, pointer.worldY + i * 10);
        }
      });
    }
  }
});


// 🖱 Pointer Move
this.input.on("pointermove", (pointer) => {
  // Reset hover cũ
  if (this.hoveredTarget) {
    this.hoveredTarget.sprite.setStrokeStyle();
    this.hoveredTarget = null;
  }

  // Check xem có quái/thú nào gần chuột không
  const enemy = [...this.monsters, ...this.animals].find(
    (e) =>
      Phaser.Math.Distance.Between(pointer.worldX, pointer.worldY, e.sprite.x, e.sprite.y) < 25
  );
  if (enemy) {
    this.hoveredTarget = enemy;
    enemy.sprite.setStrokeStyle(2, 0xff0000); // highlight đỏ
  }

  // Nếu đang kéo bản đồ
  if (this.isPanning && this.panStart) {
    const dx = pointer.x - this.panStart.x;
    const dy = pointer.y - this.panStart.y;
    this.cameras.main.scrollX = Phaser.Math.Clamp(
      this.cameraStart.x - dx,
      0,
      worldWidth - this.cameras.main.width / this.cameras.main.zoom
    );
    this.cameras.main.scrollY = Phaser.Math.Clamp(
      this.cameraStart.y - dy,
      0,
      worldHeight - this.cameras.main.height / this.cameras.main.zoom
    );
  }

  // Ghost build
  if (this.buildingPreview) {
    this.buildingPreview.x = pointer.worldX;
    this.buildingPreview.y = pointer.worldY;
    this.buildingPreview.fillColor = this.isValidPosition(pointer.worldX, pointer.worldY)
      ? 0x00ff00
      : 0xff0000;
  }

  // Selection box
  if (this.isDragging && this.selectionRect) {
    const x = Math.min(this.dragStart.x, pointer.worldX);
    const y = Math.min(this.dragStart.y, pointer.worldY);
    const w = Math.abs(pointer.worldX - this.dragStart.x);
    const h = Math.abs(pointer.worldY - this.dragStart.y);
    this.selectionRect.setPosition(x, y);
    this.selectionRect.setSize(w, h);
  }
});


// 🖱 Pointer Up
this.input.on("pointerup", (pointer) => {
  // Dừng kéo map
  if (this.isPanning) {
    this.isPanning = false;
    this.panStart = null;
    this.cameraStart = null;
  }

  // Dừng chọn lính
  if (this.isDragging && this.selectionRect) {
    const x = this.selectionRect.x;
    const y = this.selectionRect.y;
    const w = this.selectionRect.width;
    const h = this.selectionRect.height;

    if (w < 5 && h < 5) {
      // Click nhỏ → chọn 1 unit
      this.selectedUnits = [];
      const clicked = [...this.workers, ...this.units].find(
        (u) =>
          Phaser.Math.Distance.Between(pointer.worldX, pointer.worldY, u.sprite.x, u.sprite.y) < 15
      );
      if (clicked) {
        this.selectedUnits = [clicked];
      }
    } else {
      // Drag select → chọn nhiều unit
      this.selectedUnits = [...this.workers, ...this.units].filter((u) => {
        const ux = u.sprite.x;
        const uy = u.sprite.y;
        return ux >= x && ux <= x + w && uy >= y && uy <= y + h;
      });
    }

    this.selectionRect.destroy();
    this.selectionRect = null;
    this.isDragging = false;
  }
});



    this.input.on("pointermove", (pointer) => {

      // Reset hover cũ
if (this.hoveredTarget) {
  this.hoveredTarget.sprite.setStrokeStyle(); // bỏ viền
  this.hoveredTarget = null;
}

// Kiểm tra có quái/thú nào gần chuột không
const enemy = [...this.monsters, ...this.animals].find(
  (e) =>
    Phaser.Math.Distance.Between(pointer.worldX, pointer.worldY, e.sprite.x, e.sprite.y) < 25
);

if (enemy) {
  this.hoveredTarget = enemy;
  enemy.sprite.setStrokeStyle(2, 0xff0000); // highlight đỏ
}

      if (this.isPanning && this.panStart) {
    const dx = pointer.x - this.panStart.x;
    const dy = pointer.y - this.panStart.y;
    this.cameras.main.scrollX = Phaser.Math.Clamp(this.cameraStart.x - dx, 0, worldWidth - this.cameras.main.width / this.cameras.main.zoom);
    this.cameras.main.scrollY = Phaser.Math.Clamp(this.cameraStart.y - dy, 0, worldHeight - this.cameras.main.height / this.cameras.main.zoom);
  }
      // Ghost build
      if (this.buildingPreview) {
        this.buildingPreview.x = pointer.worldX;
        this.buildingPreview.y = pointer.worldY;
        this.buildingPreview.fillColor = this.isValidPosition(pointer.worldX, pointer.worldY) ? 0x00ff00 : 0xff0000;
      }
      // Selection box
      if (this.isDragging && this.selectionRect) {
        const x = Math.min(this.dragStart.x, pointer.worldX);
        const y = Math.min(this.dragStart.y, pointer.worldY);
        const w = Math.abs(pointer.worldX - this.dragStart.x);
        const h = Math.abs(pointer.worldY - this.dragStart.y);
        this.selectionRect.setPosition(x, y);
        this.selectionRect.setSize(w, h);
      }
    });

    this.input.on("pointerup", (pointer) => {
      if (this.isPanning) {
    this.isPanning = false;
    this.panStart = null;
    this.cameraStart = null;
  }
      if (this.isDragging && this.selectionRect) {
        const x = this.selectionRect.x;
        const y = this.selectionRect.y;
        const w = this.selectionRect.width;
        const h = this.selectionRect.height;

        if (w < 5 && h < 5) {
          // Click nhỏ -> chọn 1 unit gần nhất
          this.selectedUnits = [];
          const clicked = [...this.workers, ...this.units].find(
            (u) => Phaser.Math.Distance.Between(pointer.worldX, pointer.worldY, u.sprite.x, u.sprite.y) < 15
          );
          if (clicked) {
            this.selectedUnits = [clicked];
          }
        } else {
          // Drag select -> chọn nhiều unit
          this.selectedUnits = [...this.workers, ...this.units].filter(u => {
            const ux = u.sprite.x;
            const uy = u.sprite.y;
            return ux >= x && ux <= x + w && uy >= y && uy <= y + h;
          });
        }

        this.selectionRect.destroy();
        this.selectionRect = null;
        this.isDragging = false;
      }
    });

   this.input.on('wheel', (pointer, gameObjects, deltaX, deltaY, deltaZ) => {
  let zoom = this.cameras.main.zoom;
  zoom -= deltaY * 0.001;
  zoom = Phaser.Math.Clamp(zoom, 0.5, 2);
  this.cameras.main.setZoom(zoom);
}); 
  }

  // Build mode
  startBuildMode(type) {
  this.buildingType = type;
  let size = 40;
  if (type === "Barracks") size = 50;
  if (type === "Tower") size = 36;
  const pointer = this.input.activePointer;
  const x = pointer ? pointer.worldX : 400;
  const y = pointer ? pointer.worldY : 300;
  this.buildingPreview = this.add.rectangle(x, y, size, size, 0x00ff00, 0.5);
}

  isValidPosition(x, y) {
    const tooCloseHouse = this.houses.find(b => Phaser.Math.Distance.Between(x, y, b.x, b.y) < 50);
    if (tooCloseHouse) return false;

    if (Phaser.Math.Distance.Between(x, y, this.mainHouse.x, this.mainHouse.y) < 70) return false;

    const tooCloseResource = this.resourcesNodes.find(r => Phaser.Math.Distance.Between(x, y, r.x, r.y) < 50);
    if (tooCloseResource) return false;

    return true;
  }

  placeBuilding(x, y) {
  if (!this.isValidPosition(x, y)) {
    console.log("⚠️ Invalid position!");
    this.cancelBuildMode();
    return;
  }

  if (this.buildingType === "House" && this.resources.wood >= 50) {
    this.resources.wood -= 50;
    const house = new House(this, x, y);
    this.houses.push(house);
    this.resources.cap += 5; // Thêm dòng này: mỗi nhà tăng 5 cap
    this.events.emit("updateHUD", this.resources);
  } else if (this.buildingType === "Barracks" && this.resources.wood >= 100 && this.resources.stone >= 50) {
    this.resources.wood -= 100;
    this.resources.stone -= 50;
    const barracks = new Barracks(this, x, y);
    this.houses.push(barracks);
    this.events.emit("updateHUD", this.resources);
  } else if (this.buildingType === "Tower" && this.resources.stone >= 80) {
    this.resources.stone -= 80;
    const tower = new Tower(this, x, y);
    if (!this.towers) this.towers = [];
    this.towers.push(tower);
    this.events.emit("updateHUD", this.resources);
  } else {
    console.log("❌ Not enough resources to build", this.buildingType);
  }

  this.cancelBuildMode();
}

  showBarracksMenu(barracks) {
    if (this.barracksMenu) {
      this.barracksMenu.destroy(true);
      this.barracksMenu = null;
    }

    this.activeBarracks = barracks;
    const menuX = barracks.x + 70;
    const menuY = barracks.y;

    this.barracksMenu = this.add.container(menuX, menuY);

// Nền đủ cao cho 3 nút
const bg = this.add.rectangle(0, 0, 120, 130, 0x333333);
this.barracksMenu.add(bg);

// ⚔️ Melee
const meleeBtn = this.add.rectangle(0, -40, 110, 25, 0x444444).setInteractive();
const meleeText = this.add.text(-25, -48, "⚔️ Melee", { fontSize: "12px", color: "#fff" });
this.barracksMenu.add(meleeBtn).add(meleeText);
meleeBtn.on("pointerdown", () => this.spawnMelee());

// 🏹 Ranged
const rangedBtn = this.add.rectangle(0, 0, 110, 25, 0x444444).setInteractive();
const rangedText = this.add.text(-30, -8, "🏹 Ranged", { fontSize: "12px", color: "#fff" });
this.barracksMenu.add(rangedBtn).add(rangedText);
rangedBtn.on("pointerdown", () => this.spawnRanged());

// 💚 Healer
const healerBtn = this.add.rectangle(0, 40, 110, 25, 0x444444).setInteractive();
const healerText = this.add.text(-25, 32, "💚 Healer", { fontSize: "12px", color: "#fff" });
this.barracksMenu.add(healerBtn).add(healerText);
healerBtn.on("pointerdown", () => this.spawnHealer());

// ✖ Close button trên góc phải
const closeBtn = this.add.text(50, -60, "✖", { fontSize: "16px", color: "#fff" }).setInteractive();
closeBtn.setDepth(1);
closeBtn.on("pointerdown", () => {
  this.barracksMenu.destroy(true);
  this.barracksMenu = null;
  this.activeBarracks = null;
});
this.barracksMenu.add(closeBtn);

  }

  spawnMelee() {
    if (this.resources.food < this.resources.cap && this.resources.gold >= 30) {
      this.resources.food += 1;
      this.resources.gold -= 20;
      const unit = new MeleeSoldier(this, this.activeBarracks.x + 60, this.activeBarracks.y);
      this.units.push(unit);
      this.events.emit("updateHUD", this.resources);
      this.barracksMenu.destroy(true);
      this.barracksMenu = null;
    } else {
      console.log("❌ Not enough resources for Melee");
    }
  }

  spawnRanged() {
    if (this.resources.food < this.resources.cap && this.resources.wood >= 40) {
      this.resources.food += 1;
      this.resources.wood -= 20;
      const unit = new RangedSoldier(this, this.activeBarracks.x + 60, this.activeBarracks.y);
      this.units.push(unit);
      this.events.emit("updateHUD", this.resources);
      this.barracksMenu.destroy(true);
      this.barracksMenu = null;
    } else {
      console.log("❌ Not enough resources for Ranged");
    }
  }
  spawnHealer() {
  if (this.resources.food < this.resources.cap && this.resources.gold >= 40) {
    this.resources.food += 1;
    this.resources.gold -= 30;
    const unit = new Healer(this, this.activeBarracks.x + 60, this.activeBarracks.y);
    this.units.push(unit);
    this.events.emit("updateHUD", this.resources);
    this.barracksMenu.destroy(true);
    this.barracksMenu = null;
  } else {
    console.log("❌ Not enough resources for Healer");
  }
}


  spawnResourceClusters(type, color, clusterCount, clusterSize, clusterRadius, safeRadius, cx = null, cy = null) {
  const width = this.physics.world.bounds.width;
  const height = this.physics.world.bounds.height;

  let spawnedClusters = 0, tries = 0;

  while (spawnedClusters < clusterCount && tries < 500) {
    tries++;

    // Nếu có cx, cy thì dùng nó làm tâm
    const centerX = cx !== null ? cx : Phaser.Math.Between(80, width - 80);
    const centerY = cy !== null ? cy : Phaser.Math.Between(80, height - 80);

    if (!this.isValidSpawn(centerX, centerY, safeRadius * 2)) continue;

    let placed = 0, clusterTries = 0;
    while (placed < clusterSize && clusterTries < 200) {
      clusterTries++;
      const angle = Phaser.Math.FloatBetween(0, Math.PI * 2);
      const dist = Phaser.Math.Between(20, clusterRadius);
      const x = centerX + Math.cos(angle) * dist;
      const y = centerY + Math.sin(angle) * dist;

      if (this.isValidSpawn(x, y, safeRadius)) {
        this.resourcesNodes.push(new ResourceNode(this, x, y, type, color));
        placed++;
      }
    }

    if (placed > 0) spawnedClusters++;
  }
}


  spawnResources() {
  const nearHouseRatio = 0.5; // 70% spawn gần nhà
  const totalTrees = 25;
  const totalGold = 8;
  const totalStone = 10;
  const totalLakes = 7;   // số hồ cá

  // Hàm spawn theo vùng
  const randomNearHouse = (distMin, distMax) => {
    const angle = Phaser.Math.FloatBetween(0, Math.PI * 2);
    const dist = Phaser.Math.Between(distMin, distMax);
    return {
      x: this.mainHouse.x + Math.cos(angle) * dist,
      y: this.mainHouse.y + Math.sin(angle) * dist
    };
  };

  // Spawn cây
  for (let i = 0; i < totalTrees; i++) {
    let pos = (Math.random() < nearHouseRatio)
      ? randomNearHouse(80, 400)
      : { x: Phaser.Math.Between(80, this.physics.world.bounds.width - 80),
          y: Phaser.Math.Between(80, this.physics.world.bounds.height - 80) };
    this.spawnResourceClusters("tree", 0x228B22, 1, Phaser.Math.Between(5, 10), 60, 40, pos.x, pos.y);
  }

  // Spawn vàng
  for (let i = 0; i < totalGold; i++) {
    let pos = (Math.random() < nearHouseRatio)
      ? randomNearHouse(100, 450)
      : { x: Phaser.Math.Between(80, this.physics.world.bounds.width - 80),
          y: Phaser.Math.Between(80, this.physics.world.bounds.height - 80) };
    this.spawnResourceClusters("gold", 0xffd700, 1, Phaser.Math.Between(2, 4), 50, 50, pos.x, pos.y);
  }

  // Spawn đá
  for (let i = 0; i < totalStone; i++) {
    let pos = (Math.random() < nearHouseRatio)
      ? randomNearHouse(100, 450)
      : { x: Phaser.Math.Between(80, this.physics.world.bounds.width - 80),
          y: Phaser.Math.Between(80, this.physics.world.bounds.height - 80) };
    this.spawnResourceClusters("stone", 0xaaaaaa, 1, Phaser.Math.Between(2, 4), 50, 50, pos.x, pos.y);
  }

  // Spawn hồ cá 🐟
for (let i = 0; i < totalLakes; i++) {
  let pos, valid = false;
  let tries = 0;

  // thử nhiều lần cho đến khi tìm được vị trí hợp lệ
  while (!valid && tries < 100) {
    tries++;
    pos = (Math.random() < nearHouseRatio)
      ? randomNearHouse(150, 500)
      : {
          x: Phaser.Math.Between(200, this.physics.world.bounds.width - 200),
          y: Phaser.Math.Between(200, this.physics.world.bounds.height - 200)
        };

    // kiểm tra tránh gần MainHouse + tránh đè node cũ
    valid = this.isValidSpawn(pos.x, pos.y, 150);
  }

  if (!valid) continue; // bỏ qua nếu không tìm thấy chỗ

  // Vẽ hồ
  const lake = this.add.circle(pos.x, pos.y, 80, 0x1e90ff, 0.5);
  lake.setDepth(-1);

  // Thả cá
  const fishCount = Phaser.Math.Between(6, 12);
  for (let j = 0; j < fishCount; j++) {
    const angle = Phaser.Math.FloatBetween(0, Math.PI * 2);
    const dist = Phaser.Math.Between(10, 70);
    const x = pos.x + Math.cos(angle) * dist;
    const y = pos.y + Math.sin(angle) * dist;

    // kiểm tra từng con cá không đè
    if (this.isValidSpawn(x, y, 20)) {
      this.resourcesNodes.push(new ResourceNode(this, x, y, "fish", 0x00ffff));
    }
  }
}
  // Spawn bãi quái (hang quái)
// Spawn bãi quái (hang quái)
for (let i = 0; i < 3; i++) {
  let x, y, valid = false, tries = 0;

  // tìm vị trí hợp lệ
  while (!valid && tries < 100) {
    tries++;
    x = Phaser.Math.Between(600, 2500);
    y = Phaser.Math.Between(600, 2500);
    valid = this.isValidSpawn(x, y, 200); // tránh đè lên tài nguyên/nhà
  }

  if (!valid) continue; // bỏ qua nếu không tìm được chỗ

  // Vẽ hang
  this.add.circle(x, y, 40, 0x222222);

  for (let j = 0; j < 3; j++) {
    let mx, my, ok = false, t = 0;
    while (!ok && t < 50) {
      t++;
      mx = x + Phaser.Math.Between(-50, 50);
      my = y + Phaser.Math.Between(-50, 50);
      ok = this.isValidSpawn(mx, my, 40);
    }
    if (!ok) continue;
    const monster = new Monster(this, mx, my);
    this.monsters.push(monster);
  }
}

// Spawn thú rừng
for (let i = 0; i < 10; i++) {
  let x, y, valid = false, tries = 0;
  while (!valid && tries < 100) {
    tries++;
    x = Phaser.Math.Between(200, 2800);
    y = Phaser.Math.Between(200, 2800);
    valid = this.isValidSpawn(x, y, 100);
  }
  if (!valid) continue;
  const animal = new WildAnimal(this, x, y);
  this.animals.push(animal);
}


  }



  isValidSpawn(x, y, safeRadius = 50) {
    if (Phaser.Math.Distance.Between(x, y, this.mainHouse.x, this.mainHouse.y) < 120) return false;
    return !this.resourcesNodes.some(n => Phaser.Math.Distance.Between(x, y, n.x, n.y) < safeRadius);
  }

  cancelBuildMode() {
    if (this.buildingPreview) {
      this.buildingPreview.destroy();
      this.buildingPreview = null;
      this.buildingType = null;
    }
  }

  update(time, delta) {
    this.workers.forEach(w => w.update());
    this.units.forEach(u => u.update(time));
    this.monsters.forEach(m => m.update(time));
    this.animals.forEach(a => a.update(time));
    if (this.towers) this.towers.forEach(t => t.update(time));

    // Highlight selected
    [...this.workers, ...this.units].forEach(u => {
      if (this.selectedUnits.includes(u)) {
        u.sprite.setStrokeStyle(2, 0xffff00);
      } else {
        u.sprite.setStrokeStyle();
      }
    });
  }
}
