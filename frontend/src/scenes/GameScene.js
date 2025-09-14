import Worker from "../entities/Worker.js";
import ResourceNode from "../entities/ResourceNode.js";
import { MeleeSoldier, RangedSoldier, Healer, Cavalry } from "../entities/Soldier.js";
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

    this.fog = null;
    this.fogData = null; // mảng 2D lưu trạng thái fog
    this.fogCellSize = 32;
    this.exploredData = null;
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

    preload() {
    this.load.image("tile_grass", "assets/map/tile_grass.png");
    this.load.image("tile_water", "assets/map/tile_water.png");
    this.load.image("tile_sand", "assets/map/tile_sand.png");
    // Resource textures
    this.load.image("tree1", "assets/resources/tree1.png");
    this.load.image("tree2", "assets/resources/tree2.png");
    this.load.image("tree3", "assets/resources/tree3.png");
    this.load.image("tree4", "assets/resources/tree4.png");
    this.load.image("gold", "assets/resources/gold.png");
    this.load.image("rock", "assets/resources/rock.png");
    this.load.image("fish", "assets/resources/fish.png");
    this.load.image("main-house", "assets/buildings/main-house.png"); // đường dẫn tới ảnh
    this.load.image("house", "assets/buildings/house.png");
    this.load.image("barracks", "assets/buildings/barracks.png");
    this.load.image("tower", "assets/buildings/tower.png");
    for (let i = 0; i < 4; i++) {
    this.load.image(`nai_${i}`, `assets/enemies/nai_${i}.png`);
  }

    for (let i = 0; i < 4; i++) {
  this.load.image(`quai_${i}`, `assets/enemies/quai_${i}.png`);
}
  this.load.image("hangquai", "assets/enemies/hangquai_0.png");

  for (let i = 0; i < 4; i++) {
  this.load.image(`dan_${i}`, `assets/units/dan_${i}.png`);
}

  for (let i = 0; i < 4; i++) {
  this.load.image(`canchien_${i}`, `assets/units/canchien_${i}.png`);
}

  for (let i = 0; i < 4; i++) {
  this.load.image(`danhxa_${i}`, `assets/units/danhxa_${i}.png`);
}

  for (let i = 0; i < 4; i++) {
  this.load.image(`healer_${i}`, `assets/units/healer_${i}.png`);
}
  for (let i = 0; i < 4; i++) {
  this.load.image(`kybinh_${i}`, `assets/units/kybinh_${i}.png`);
}






  }

  create() {

    const worldWidth = 3072;
    const worldHeight = 3072;
    this.cameras.main.setBounds(0, 0, worldWidth, worldHeight);
    this.physics.world.setBounds(0, 0, worldWidth, worldHeight);

    
    // this.highlightGraphics = this.add.graphics();
    // this.highlightGraphics.setDepth(9999); // nổi lên trên

    const tileSize = 64;
    // 🌱 Vẽ nền map bằng tile_grass
// mới
const grassCols = Math.floor(worldWidth / tileSize);
const grassRows = Math.floor(worldHeight / tileSize);


this.mapData = [];
for (let y = 0; y < grassRows; y++) {
  this.mapData[y] = [];
  for (let x = 0; x < grassCols; x++) {
    let type = "land";
    // mới
if (x <= 3 || y <= 3 || x >= grassCols - 4 || y >= grassRows - 4) {
  type = "water";
}
    this.mapData[y][x] = type;

    const texture = type === "land" ? "tile_grass" : "tile_water";
    this.add.image(x * tileSize, y * tileSize, texture)
      .setOrigin(0)
      .setDepth(-1000);
  }
}


    // Sau khi setBounds:
  const cols = Math.ceil(worldWidth / this.fogCellSize);
  const rows = Math.ceil(worldHeight / this.fogCellSize);
  this.fogData = [];
  for (let y = 0; y < rows; y++) {
    this.fogData[y] = [];
    for (let x = 0; x < cols; x++) {
      this.fogData[y][x] = 1; // 1 = fog, 0 = đã khám phá
    }
  }

  this.exploredData = [];
  for (let y = 0; y < rows; y++) {
  this.exploredData[y] = [];
  for (let x = 0; x < cols; x++) {
    this.exploredData[y][x] = 0; // 0 = chưa từng khám phá, 1 = đã từng khám phá
  }}

  

  // Tạo graphics phủ fog
  this.fog = this.add.graphics();
  this.fog.setDepth(9999);

    this.isPanning = false;
    this.panStart = null;
    this.cameraStart = null;

    this.input.mouse.disableContextMenu();

    // Main House
    this.mainHouse = new MainHouse(this, 400, 300);

     this.revealFog(this.mainHouse.x, this.mainHouse.y, 180);

    // Bật UIScene
    this.scene.launch("UIScene");

    // HUD ban đầu
    this.events.emit("updateHUD", this.resources);

    this.scene.get("UIScene").events.on("build", (type) => {
    if (!this.buildingPreview) {
      this.startBuildMode(type);
    }});

    this.anims.create({
    key: "nai_walk",
    frames: [
      { key: "nai_0" },
      { key: "nai_1" },
      { key: "nai_2" },
      { key: "nai_3" }
    ],
    frameRate: 6,
    repeat: -1
  });

  this.anims.create({
  key: "quai_walk",
  frames: [
    { key: "quai_0" },
    { key: "quai_1" },
    { key: "quai_2" },
    { key: "quai_3" }
  ],
  frameRate: 6, // tốc độ khung hình
  repeat: -1,   // lặp vô hạn
});

// // Cho lính địch tự động đi về phía tower
//     enemy.moveTo(600, 300);
this.anims.create({
  key: "canchien_walk",
  frames: [
    { key: "canchien_0" },
    { key: "canchien_1" },
    { key: "canchien_2" },
    { key: "canchien_3" }
  ],
  frameRate: 6,
  repeat: -1
});

this.anims.create({
  key: "danhxa_walk",
  frames: [
    { key: "danhxa_0" },
    { key: "danhxa_1" },
    { key: "danhxa_2" },
    { key: "danhxa_3" }
  ],
  frameRate: 6,
  repeat: -1
});

this.anims.create({
  key: "healer_walk",
  frames: [
    { key: "healer_0" },
    { key: "healer_1" },
    { key: "healer_2" },
    { key: "healer_3" }
  ],
  frameRate: 6,
  repeat: -1
});

this.anims.create({
  key: "kybinh_ride",
  frames: [
    { key: "kybinh_0" },
    { key: "kybinh_1" },
    { key: "kybinh_2" },
    { key: "kybinh_3" }
  ],
  frameRate: 6,
  repeat: -1
});





    this.anims.create({
  key: "dan_walk",
  frames: [
    { key: "dan_0" },
    { key: "dan_1" },
    { key: "dan_2" },
    { key: "dan_3" }
  ],
  frameRate: 6, // tốc độ bước chân
  repeat: -1    // lặp vô hạn
});


    // Spawn tài nguyên ngẫu nhiên
    this.spawnResources();

    // // Spawn thử 1 Tower
    // this.tower = new Tower(this, 600, 300);
    // this.towers.push(this.tower); // Đúng mảng!

// Spawn 1 lính địch melee để test
  //   const enemy = new MeleeSoldier(this, 800, 300, "enemy");
    
  //  this.units.push(enemy);

  //  //sinh lính đánh xa
  //   const enemy2 = new RangedSoldier(this, 800, 400, "enemy");
  //   this.units.push(enemy2);


    //tạo animation cho thú rừng
    // 📌 Tạo animation chuyển động cho nai
 
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
// 🔴 Highlight đỏ khi hover quái/thú rừng
this.input.on("pointermove", (pointer) => {
  // Bỏ tint đối tượng đang hover trước đó (nếu có)
  if (this.hoveredTarget?.sprite?.clearTint) {
    this.hoveredTarget.sprite.clearTint();
  }
  this.hoveredTarget = null;

  // Tìm enemy gần con trỏ
  const enemy = [...this.monsters, ...this.animals].find((e) =>
    Phaser.Math.Distance.Between(pointer.worldX, pointer.worldY, e.sprite.x, e.sprite.y) < 25
  );

  // Nếu có → tô đỏ
  if (enemy && enemy.sprite?.setTint) {
    this.hoveredTarget = enemy;
    enemy.sprite.setTint(0xff0000);
  }

  // Kéo camera khi chuột phải
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

  // Ghost build (nếu đang đặt nhà)
  if (this.buildingPreview) {
    this.buildingPreview.x = pointer.worldX;
    this.buildingPreview.y = pointer.worldY;
    this.buildingPreview.fillColor = this.isValidPosition(pointer.worldX, pointer.worldY)
      ? 0x00ff00
      : 0xff0000;
  }

  // Selection box khi drag
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




   this.input.on('wheel', (pointer, gameObjects, deltaX, deltaY, deltaZ) => {
  let zoom = this.cameras.main.zoom;
  zoom -= deltaY * 0.001;
  zoom = Phaser.Math.Clamp(zoom, 0.5, 2);
  this.cameras.main.setZoom(zoom);
}); 
  }


  revealFog(x, y, radius = 120) {
  const cellSize = this.fogCellSize;
  const cols = this.fogData[0].length;
  const rows = this.fogData.length;
  const cx = Math.floor(x / cellSize);
  const cy = Math.floor(y / cellSize);
  const rCell = Math.ceil(radius / cellSize);

  for (let dy = -rCell; dy <= rCell; dy++) {
    for (let dx = -rCell; dx <= rCell; dx++) {
      const nx = cx + dx;
      const ny = cy + dy;
      if (
        nx >= 0 && nx < cols &&
        ny >= 0 && ny < rows &&
        (dx * dx + dy * dy) * cellSize * cellSize < radius * radius
      ) {
        this.fogData[ny][nx] = 0; // mở fog hiện tại
        this.exploredData[ny][nx] = 1; // đánh dấu đã từng khám phá
      }
    }
  }
}
  drawFog() {
  const cellSize = this.fogCellSize;
  this.fog.clear();
  for (let y = 0; y < this.fogData.length; y++) {
    for (let x = 0; x < this.fogData[0].length; x++) {
      if (this.fogData[y][x] === 1 && this.exploredData[y][x] === 0) {
        // Chưa từng khám phá: phủ đen hoàn toàn
        this.fog.fillStyle(0x222222, 1);
        this.fog.fillRect(x * cellSize, y * cellSize, cellSize, cellSize);
      } else if (this.fogData[y][x] === 1 && this.exploredData[y][x] === 1) {
        // Đã khám phá nhưng không còn tầm nhìn: phủ xám mờ
        this.fog.fillStyle(0x444444, 0.7);
        this.fog.fillRect(x * cellSize, y * cellSize, cellSize, cellSize);
      }
      // Nếu fogData[y][x] === 0 thì không phủ gì (đang có tầm nhìn)
    }
  }
}

  resetFog() {
  for (let y = 0; y < this.fogData.length; y++) {
    for (let x = 0; x < this.fogData[0].length; x++) {
      this.fogData[y][x] = 1; // Mặc định tất cả là fog
    }
  }
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

    if (this.isWater(x, y)) {
  if (this.buildingType !== "Shipyard") {
    return false;
  }
}

    // Kiểm tra vùng sương mù (fog)
    const cellSize = this.fogCellSize;
    const cx = Math.floor(x / cellSize);
    const cy = Math.floor(y / cellSize);
    if (this.fogData && this.fogData[cy] && this.fogData[cy][cx] === 1) return false; // còn fog thì không cho xây

    return true;
}

isWater(x, y) {
  const tileSize = 64;
  const gx = Math.floor(x / tileSize);
  const gy = Math.floor(y / tileSize);
  return this.mapData[gy] && this.mapData[gy][gx] === "water";
}

  placeBuilding(x, y) {
  if (!this.isValidPosition(x, y)) {
    console.log("⚠️ Invalid position!");
    this.cancelBuildMode();
    return;
  }

  let building = null;

  switch (this.buildingType) {
    case "House":
      if (this.resources.wood >= 50) {
        this.resources.wood -= 50;
        building = new House(this, x, y);
        this.houses.push(building);
        this.resources.cap += 5; // mỗi nhà tăng 5 cap
      } else {
        console.log("❌ Not enough wood for House.");
      }
      break;

    case "Barracks":
      if (this.resources.wood >= 100 && this.resources.stone >= 50) {
        this.resources.wood -= 100;
        this.resources.stone -= 50;
        building = new Barracks(this, x, y);
        this.houses.push(building); // nếu bạn có mảng riêng thì đổi thành this.barracks
      } else {
        console.log("❌ Not enough resources for Barracks.");
      }
      break;

    case "Tower":
      if (this.resources.stone >= 80) {
        this.resources.stone -= 80;
        building = new Tower(this, x, y);
        if (!this.towers) this.towers = [];
        this.towers.push(building);
      } else {
        console.log("❌ Not enough stone for Tower.");
      }
      break;

    default:
      console.log("⚠️ Unknown building type:", this.buildingType);
      break;
  }

  if (building) {
    this.events.emit("updateHUD", this.resources);
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

  // Nền đủ cao cho 4 nút
  const bg = this.add.rectangle(0, 0, 120, 170, 0x333333);
  this.barracksMenu.add(bg);

  // ⚔️ Melee
  const meleeBtn = this.add.rectangle(0, -60, 110, 25, 0x444444).setInteractive();
  const meleeText = this.add.text(-25, -68, "⚔️ Melee", { fontSize: "12px", color: "#fff" });
  this.barracksMenu.add(meleeBtn).add(meleeText);
  meleeBtn.on("pointerdown", () => this.spawnMelee());

  // 🏹 Ranged
  const rangedBtn = this.add.rectangle(0, -20, 110, 25, 0x444444).setInteractive();
  const rangedText = this.add.text(-30, -28, "🏹 Ranged", { fontSize: "12px", color: "#fff" });
  this.barracksMenu.add(rangedBtn).add(rangedText);
  rangedBtn.on("pointerdown", () => this.spawnRanged());

  // 💚 Healer
  const healerBtn = this.add.rectangle(0, 20, 110, 25, 0x444444).setInteractive();
  const healerText = this.add.text(-25, 12, "💚 Healer", { fontSize: "12px", color: "#fff" });
  this.barracksMenu.add(healerBtn).add(healerText);
  healerBtn.on("pointerdown", () => this.spawnHealer());

  // 🐎 Cavalry
  const cavalryBtn = this.add.rectangle(0, 60, 110, 25, 0x444444).setInteractive();
  const cavalryText = this.add.text(-30, 52, "🐎 Cavalry", { fontSize: "12px", color: "#fff" });
  this.barracksMenu.add(cavalryBtn).add(cavalryText);
  cavalryBtn.on("pointerdown", () => this.spawnCavalry());

  // ✖ Close button
  const closeBtn = this.add.text(50, -80, "✖", { fontSize: "16px", color: "#fff" }).setInteractive();
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

  spawnCavalry() {
  if (this.resources.food < this.resources.cap && this.resources.gold >= 60 && this.resources.wood >= 30) {
    this.resources.food += 1;
    this.resources.gold -= 60;
    this.resources.wood -= 30;

    const unit = new Cavalry(this, this.activeBarracks.x + 60, this.activeBarracks.y);
    this.units.push(unit);

    this.events.emit("updateHUD", this.resources);
    this.barracksMenu.destroy(true);
    this.barracksMenu = null;
  } else {
    console.log("❌ Not enough resources for Cavalry");
  }
}



  spawnResourceClusters(type, textureKey, clusterCount, clusterSize, clusterRadius, safeRadius, cx = null, cy = null) {
  const width = this.physics.world.bounds.width;
  const height = this.physics.world.bounds.height;

  const margin = 200; // ✅ không spawn ở rìa map

  let spawnedClusters = 0, tries = 0;

  while (spawnedClusters < clusterCount && tries < 500) {
    tries++;

    // Nếu có cx, cy thì dùng nó làm tâm, nếu không random trong khoảng an toàn
    const centerX = cx !== null ? cx : Phaser.Math.Between(margin, width - margin);
    const centerY = cy !== null ? cy : Phaser.Math.Between(margin, height - margin);

    if (!this.isValidSpawn(centerX, centerY, safeRadius * 2) || this.isWater(centerX, centerY)) continue;

    let placed = 0, clusterTries = 0;
    while (placed < clusterSize && clusterTries < 200) {
      clusterTries++;
      const angle = Phaser.Math.FloatBetween(0, Math.PI * 2);
      const dist = Phaser.Math.Between(20, clusterRadius);
      const x = centerX + Math.cos(angle) * dist;
      const y = centerY + Math.sin(angle) * dist;

      // ✅ thêm check không spawn ở rìa map
      if (
        this.isValidSpawn(x, y, safeRadius) &&
        !this.isWater(x, y) &&
        x > margin && x < width - margin &&
        y > margin && y < height - margin
      ) {
        this.resourcesNodes.push(new ResourceNode(this, x, y, type, textureKey));
        placed++;
      }
    }

    if (placed > 0) spawnedClusters++;
  }
}



  spawnResources() {
  const nearHouseRatio = 0.5; 
  const totalTrees = 25;
  const totalGold = 8;
  const totalStone = 10;
  const totalLakes = 7;

  const margin = 200; // ✅ Không spawn ở rìa map
  const width = this.physics.world.bounds.width;
  const height = this.physics.world.bounds.height;

  const randomNearHouse = (distMin, distMax) => {
    const angle = Phaser.Math.FloatBetween(0, Math.PI * 2);
    const dist = Phaser.Math.Between(distMin, distMax);
    return {
      x: this.mainHouse.x + Math.cos(angle) * dist,
      y: this.mainHouse.y + Math.sin(angle) * dist
    };
  };

  const treeTextures = ["tree1", "tree2", "tree3", "tree4"];

  // 🌳 Spawn cây
  for (let i = 0; i < totalTrees; i++) {
    let pos, valid = false, tries = 0;
    while (!valid && tries < 50) {
      tries++;
      pos = (Math.random() < nearHouseRatio)
        ? randomNearHouse(80, 400)
        : {
            x: Phaser.Math.Between(margin, width - margin),
            y: Phaser.Math.Between(margin, height - margin)
          };
      valid = !this.isWater(pos.x, pos.y);
    }
    if (!valid) continue;

    const texture = Phaser.Utils.Array.GetRandom(treeTextures);
    this.spawnResourceClusters("tree", texture, 1, Phaser.Math.Between(5, 10), 60, 40, pos.x, pos.y);
  }

  // 🪙 Spawn vàng
  for (let i = 0; i < totalGold; i++) {
    let pos, valid = false, tries = 0;
    while (!valid && tries < 50) {
      tries++;
      pos = (Math.random() < nearHouseRatio)
        ? randomNearHouse(100, 450)
        : {
            x: Phaser.Math.Between(margin, width - margin),
            y: Phaser.Math.Between(margin, height - margin)
          };
      valid = !this.isWater(pos.x, pos.y);
    }
    if (!valid) continue;

    this.spawnResourceClusters("gold", "gold", 1, Phaser.Math.Between(2, 4), 50, 50, pos.x, pos.y);
  }

  // 🪨 Spawn đá
  for (let i = 0; i < totalStone; i++) {
    let pos, valid = false, tries = 0;
    while (!valid && tries < 50) {
      tries++;
      pos = (Math.random() < nearHouseRatio)
        ? randomNearHouse(100, 450)
        : {
            x: Phaser.Math.Between(margin, width - margin),
            y: Phaser.Math.Between(margin, height - margin)
          };
      valid = !this.isWater(pos.x, pos.y);
    }
    if (!valid) continue;

    this.spawnResourceClusters("stone", "rock", 1, Phaser.Math.Between(2, 4), 50, 50, pos.x, pos.y);
  }

  // 🐟 Spawn hồ cá
  for (let i = 0; i < totalLakes; i++) {
    let pos, valid = false, tries = 0;
    while (!valid && tries < 100) {
      tries++;
      pos = (Math.random() < nearHouseRatio)
        ? randomNearHouse(150, 500)
        : {
            x: Phaser.Math.Between(margin, width - margin),
            y: Phaser.Math.Between(margin, height - margin)
          };
      valid = this.isValidSpawn(pos.x, pos.y, 150) 
      && !this.isWater(pos.x, pos.y) 
      && this.distanceToNearestWater(pos.x, pos.y) > 150;

    }
    if (!valid) continue;

    const lake = this.add.circle(pos.x, pos.y, 80, 0x1e90ff, 0.5);
    lake.setDepth(-1);

    const fishCount = Phaser.Math.Between(6, 12);
    for (let j = 0; j < fishCount; j++) {
      const angle = Phaser.Math.FloatBetween(0, Math.PI * 2);
      const dist = Phaser.Math.Between(10, 70);
      const x = pos.x + Math.cos(angle) * dist;
      const y = pos.y + Math.sin(angle) * dist;

      if (this.isValidSpawn(x, y, 20) && !this.isWater(x, y)) {
        this.resourcesNodes.push(new ResourceNode(this, x, y, "fish", "fish"));
      }
    }
  }

  // 🕳 Spawn bãi quái
  for (let i = 0; i < 3; i++) {
    let x, y, valid = false, tries = 0;
    while (!valid && tries < 100) {
      tries++;
      x = Phaser.Math.Between(margin, width - margin);
      y = Phaser.Math.Between(margin, height - margin);
      valid = this.isValidSpawn(x, y, 200) 
      && this.distanceToNearestWater(x, y) > 150;

    }
    if (!valid) continue;

    const cave = this.add.image(x, y, "hangquai");
    cave.setDepth(-1);
    cave.setScale(2);

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

  // 🦌 Spawn thú rừng
  for (let i = 0; i < 10; i++) {
    let x, y, valid = false, tries = 0;
    while (!valid && tries < 100) {
      tries++;
      x = Phaser.Math.Between(margin, width - margin);
      y = Phaser.Math.Between(margin, height - margin);
      valid = this.isValidSpawn(x, y, 100);
    }
    if (!valid) continue;
    const animal = new WildAnimal(this, x, y);
    this.animals.push(animal);
  }
}





  isValidSpawn(x, y, safeRadius = 50) {
  // ❌ Không spawn nếu là nước
  if (this.isWater(x, y)) return false;

  // ❌ Không spawn quá gần nhà chính
  if (Phaser.Math.Distance.Between(x, y, this.mainHouse.x, this.mainHouse.y) < 120) return false;

  // ❌ Không spawn đè tài nguyên khác
  return !this.resourcesNodes.some(n => Phaser.Math.Distance.Between(x, y, n.x, n.y) < safeRadius);
}

distanceToNearestWater(x, y) {
  const tileSize = 64;
  const gx = Math.floor(x / tileSize);
  const gy = Math.floor(y / tileSize);

  let minDist = Infinity;

  // Quét vùng xung quanh (11x11 ô) để tìm tile nước gần nhất
  for (let dy = -5; dy <= 5; dy++) {
    for (let dx = -5; dx <= 5; dx++) {
      const ny = gy + dy;
      const nx = gx + dx;
      if (this.mapData[ny] && this.mapData[ny][nx] === "water") {
        const wx = nx * tileSize + tileSize / 2;
        const wy = ny * tileSize + tileSize / 2;
        const dist = Phaser.Math.Distance.Between(x, y, wx, wy);
        if (dist < minDist) minDist = dist;
      }
    }
  }
  return minDist;
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


  if (this.mainHouse?.update) this.mainHouse.update(time);
  this.houses?.forEach(b => b.update?.(time));
  this.towers?.forEach(t => t.update?.(time));
  this.barracks?.forEach(b => b.update?.(time));
  this.animals.forEach(a => a.update(time));
  // if (this.towers) this.towers.forEach(t => t.update(time));

  // ⭐ Reset fog trước khi vẽ lại
  this.resetFog();

  // 👀 Reveal tầm nhìn
  this.revealFog(this.mainHouse.x, this.mainHouse.y, this.mainHouse.visionRange || 300);

  this.workers.forEach(w => this.revealFog(w.sprite.x, w.sprite.y, 120));
  this.units.forEach(u => this.revealFog(u.sprite.x, u.sprite.y, 120));
  this.houses.forEach(b => this.revealFog(b.x, b.y, b.visionRange || 150));
  if (this.towers) this.towers.forEach(t => this.revealFog(t.x, t.y, t.visionRange || 180));

  // 🎨 Vẽ lại fog
  this.drawFog();

  // 🔦 Highlight selected
  [...this.workers, ...this.units].forEach(u => {
  if (!u.sprite) return; // bỏ qua nếu không có sprite
  if (this.selectedUnits.includes(u)) {
    if (u.sprite.setTint) {
      u.sprite.setTint(0xffff00);
    }
  } else {
    if (u.sprite.clearTint) {
      u.sprite.clearTint();
    }
  }
});

}


}
