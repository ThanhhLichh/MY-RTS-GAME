import Worker from "../entities/Worker.js";
import ResourceNode from "../entities/ResourceNode.js";
import { MeleeSoldier, RangedSoldier, Healer, Cavalry, DragonKnight } from "../entities/Soldier.js";
import { MainHouse, House, Barracks, Tower, Shipyard } from "../entities/Building.js";
import { WildAnimal } from "../entities/WildAnimal.js";
import { Monster } from "../entities/Monster.js";
import { TransportShip, FishingBoat, Warship } from "../entities/Ship.js";
import Fish from "../entities/Fish.js";


export default class GameScene extends Phaser.Scene {
  constructor() {
    super("GameScene");
    this.resources = {
      food: 0,   // dân số đang dùng
      cap: 1000,   // giới hạn dân số
      wood: 1000,
      stone: 1000,
      gold: 1000,
      meat: 1000,
    };

    
    this.fogData = null; // mảng 2D lưu trạng thái fog
    this.fogSprites = [];
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

    // Shipyard & Ship
    this.shipyards = [];   // tất cả xưởng đóng tàu
    this.ships = [];       // tất cả thuyền trên bản đồ
    this.activeShipyard = null; // xưởng đang mở menu
    this.shipyardMenu = null;   // menu build tàu

    this.transportMenu = null;
    this.activeTransport = null;

    // Build mode
    this.buildingPreview = null;
    this.buildingType = null;
    this.skipNextPointerDown = false;

    this.towers = [];

    this.monsters = [];
    this.animals = [];

    this.hoveredTarget = null; // kẻ địch hoặc thú được hover
    this.buildings = [];



  }

    preload() {
    this.load.image("tile_grass", "assets/map/tile_grass.png");
    this.load.image("tree1", "assets/resources/tree1.png");
    this.load.image("tree2", "assets/resources/tree2.png");
    this.load.image("tree3", "assets/resources/tree3.png");
    this.load.image("tree4", "assets/resources/tree4.png");
    this.load.image("gold", "assets/resources/gold.png");
    this.load.image("rock", "assets/resources/rock.png");
    this.load.image("rice_field", "assets/resources/rice_field.png");

    

    for (let i = 0; i < 4; i++) {
  this.load.image(`fish_${i}`, `assets/enemies/fish_${i}.png`);
}

    this.load.image("main-house", "assets/buildings/main-house.png"); // đường dẫn tới ảnh
    this.load.image("house", "assets/buildings/house.png");
    this.load.image("barracks", "assets/buildings/barracks.png");
    this.load.image("tower", "assets/buildings/tower.png");
    this.load.image("shipyard", "assets/buildings/shipyard.png");
    this.load.image("tile_water", "assets/map/tile_water.png");   // nền biển
    this.load.image("water_wave", "assets/map/water_wave.png");   // overlay sóng
    this.load.image("danhca_fish", "assets/ship/danhca_fish.png");
    this.load.image("dragon_knight_attack_0", "assets/units/dragon_knight_attack_0.png");
    this.load.image("dragon_knight_attack_1", "assets/units/dragon_knight_attack_1.png");
    

    
    

    for (let i = 0; i < 4; i++) {
  this.load.image(`fog_${i}`, `assets/map/fog_${i}.png`);
}



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

for (let i = 0; i < 4; i++) {
  this.load.image(`dragon_knight_${i}`, `assets/units/dragon_knight_${i}.png`);
}



// 🚢 Transport Ship (Tàu chở quân)
for (let i = 0; i < 4; i++) {
  this.load.image(`choquan_${i}`, `assets/ship/choquan_${i}.png`);
}

// 🚢 Fishing Boat (Tàu đánh cá)
for (let i = 0; i < 4; i++) {
  this.load.image(`danhca_${i}`, `assets/ship/danhca_${i}.png`);
}

// 🚢 Warship (Tàu chiến)
for (let i = 0; i < 4; i++) {
  this.load.image(`tauchien_${i}`, `assets/ship/tauchien_${i}.png`);
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
this.waterOverlayTiles = [];

for (let y = 0; y < grassRows; y++) {
  this.mapData[y] = [];
  for (let x = 0; x < grassCols; x++) {
    let type = "land";
    if (x <= 3 || y <= 3 || x >= grassCols - 4 || y >= grassRows - 4) {
      type = "water";
    }

    this.mapData[y][x] = type;

    const posX = x * tileSize;
    const posY = y * tileSize;

    if (type === "land") {
      this.add.image(posX, posY, "tile_grass")
        .setOrigin(0)
        .setDepth(-1000);
    } else {
      this.add.image(posX, posY, "tile_water")
        .setOrigin(0)
        .setDepth(-1000);

      const wave = this.add.tileSprite(posX, posY, tileSize, tileSize, "water_wave")
        .setOrigin(0)
        .setDepth(-999)      // trên water, dưới fog
        .setAlpha(0.25);     // nhẹ nhàng

      this.waterOverlayTiles.push(wave);
    }
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
  this.fogSprites = [];
for (let y = 0; y < rows; y++) {
  for (let x = 0; x < cols; x++) {
    const key = `fog_${Phaser.Math.Between(0, 3)}`;
    const fogTile = this.add.image(x * this.fogCellSize, y * this.fogCellSize, key)
  .setOrigin(0)
  .setDepth(9999);
fogTile.setAlpha(1); 

// ✅ Lưu lại vị trí gốc để dùng khi update
fogTile.baseX = fogTile.x;
fogTile.baseY = fogTile.y;

this.fogSprites.push(fogTile);

  }
}


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

this.anims.create({
  key: "fish_anim",
  frames: [
    { key: "fish_0" },
    { key: "fish_1" },
    { key: "fish_2" },
    { key: "fish_3" },
  ],
  frameRate: 4, // tốc độ bơi
  repeat: -1    // lặp vô hạn
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
  key: "dragon_knight_fly",
  frames: [
    { key: "dragon_knight_0" },
    { key: "dragon_knight_1" },
    { key: "dragon_knight_2" },
    { key: "dragon_knight_3" }
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

// 🚢 Transport Ship
this.anims.create({
  key: "choquan_sail",
  frames: [
    { key: "choquan_0" },
    { key: "choquan_1" },
    { key: "choquan_2" },
    { key: "choquan_3" }
  ],
  frameRate: 6,
  repeat: -1
});

// 🎣 Fishing Boat
this.anims.create({
  key: "danhca_sail",
  frames: [
    { key: "danhca_0" },
    { key: "danhca_1" },
    { key: "danhca_2" },
    { key: "danhca_3" }
  ],
  frameRate: 6,
  repeat: -1
});

// 💣 Warship
this.anims.create({
  key: "tauchien_sail",
  frames: [
    { key: "tauchien_0" },
    { key: "tauchien_1" },
    { key: "tauchien_2" },
    { key: "tauchien_3" }
  ],
  frameRate: 6,
  repeat: -1
});

this.anims.create({
  key: "dragon_knight_attack",
  frames: [
    { key: "dragon_knight_attack_0" },
    { key: "dragon_knight_attack_1" }
  ],
  frameRate: 6,
  repeat: 0 // chỉ đánh 1 lần
});



    // Spawn tài nguyên ngẫu nhiên
    this.spawnResources();

    // // Spawn thử 1 Tower
    // this.tower = new Tower(this, 600, 300);
    // this.towers.push(this.tower); // Đúng mảng!

// Spawn 1 lính địch melee để test
    const enemy = new MeleeSoldier(this, 800, 300, "enemy");
    
   this.units.push(enemy);

   //sinh lính đánh xa
    const enemy2 = new RangedSoldier(this, 800, 400, "enemy");
    this.units.push(enemy2);


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
  // === Kéo bản đồ bằng chuột phải ===
  if (pointer.rightButtonDown() && !this.buildingPreview) {
    this.isPanning = true;
    this.panStart = { x: pointer.x, y: pointer.y };
    this.cameraStart = {
      x: this.cameras.main.scrollX,
      y: this.cameras.main.scrollY,
    };
  }

  // === Nếu đang build ===
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
    return; // ✅ Thoát luôn
  }

  // === Chuột trái → chọn lính / tàu ===
  if (pointer.leftButtonDown()) {
    // 👉 Nếu click vào TransportShip để thả quân
    const ship = this.ships.find(
      s => s.type === "transportShip" &&
      Phaser.Math.Distance.Between(pointer.worldX, pointer.worldY, s.sprite.x, s.sprite.y) < 30
    );
    if (ship && ship.passengers.length > 0) {
      this.showTransportMenu(ship, "unload");
      return; // ✅ dừng ở đây, không xử lý chọn lính
    }

    // 👉 Nếu không phải thuyền → chọn lính như cũ
    this.isDragging = true;
    this.dragStart = { x: pointer.worldX, y: pointer.worldY };
    if (this.selectionRect) this.selectionRect.destroy();
    this.selectionRect = this.add
      .rectangle(pointer.worldX, pointer.worldY, 1, 1, 0x00aaff, 0.2)
      .setStrokeStyle(1, 0x00aaff)
      .setOrigin(0);
  }

  // === Chuột phải → ra lệnh ===
  if (pointer.rightButtonDown() && this.selectedUnits.length > 0) {
    // 👉 Nếu click vào TransportShip để LÊN THUYỀN
    const ship = this.ships.find(
      s => s.type === "transportShip" &&
      Phaser.Math.Distance.Between(pointer.worldX, pointer.worldY, s.sprite.x, s.sprite.y) < 30
    );
    if (ship && this.selectedUnits.some(u => !u.isShip)) {
      this.showTransportMenu(ship, "load");
      return; // ✅ dừng, không xử lý di chuyển
    }

    if (this.hoveredTarget) {
      // 👉 Nếu hover quái/thú → tấn công
      this.selectedUnits.forEach((unit) => {
        if (unit.attack) unit.attack(this.hoveredTarget);
      });
    } else {
      // 👉 Nếu không thì thử xem có tài nguyên không
      const targetNode = this.resourcesNodes.find(
        (n) =>
          Phaser.Math.Distance.Between(
            pointer.worldX,
            pointer.worldY,
            n.x,
            n.y
          ) < 20
      );

      this.selectedUnits.forEach((unit, i) => {
        // === Worker → khai thác ===
        if (unit.commandHarvest && targetNode && unit.type === "worker") {
          unit.commandHarvest(targetNode, this.resources, () => {
            this.events.emit("updateHUD", this.resources);
          });
        }
        else if (
  unit.type === "fishingBoat" &&
  targetNode &&
  targetNode.type === "fish" &&
  typeof unit.commandFishing === "function"
) {
  unit.commandFishing(targetNode);
}



        // === Di chuyển ===
        else if (unit.moveTo) {
  if (unit.type === "dragon_knight") {
    // 🐉 Rồng → đi mọi địa hình
    unit.moveTo(
      pointer.worldX + i * 10,
      pointer.worldY + i * 10
    );
  } else if (unit.isShip) {
    // 🚢 Tàu → chỉ đi trên biển
    if (this.isWater(pointer.worldX, pointer.worldY)) {
      unit.moveTo(
        pointer.worldX + i * 10,
        pointer.worldY + i * 10
      );
    }
  } else {
    // 👤 Lính & Worker → chỉ đi trên đất
    if (!this.isWater(pointer.worldX, pointer.worldY)) {
      unit.moveTo(
        pointer.worldX + i * 10,
        pointer.worldY + i * 10
      );
    }
  }
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

  // Dừng chọn lính / tàu
  if (this.isDragging && this.selectionRect) {
    const x = this.selectionRect.x;
    const y = this.selectionRect.y;
    const w = this.selectionRect.width;
    const h = this.selectionRect.height;

    // Gom toàn bộ entity có thể chọn
    const allUnits = [...this.workers, ...this.units, ...this.ships];

    if (w < 5 && h < 5) {
      // 👉 Click nhỏ → chọn 1 unit
      this.selectedUnits = [];
      const clicked = allUnits.find(
        (u) =>
          Phaser.Math.Distance.Between(
            pointer.worldX,
            pointer.worldY,
            u.sprite.x,
            u.sprite.y
          ) < 15
      );
      if (clicked) {
        this.selectedUnits = [clicked];
      }
    } else {
      // 👉 Drag select → chọn nhiều unit
      this.selectedUnits = allUnits.filter((u) => {
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
  let i = 0;
  for (let y = 0; y < this.fogData.length; y++) {
    for (let x = 0; x < this.fogData[0].length; x++) {
      const tile = this.fogSprites[i++];
      if (this.fogData[y][x] === 1 && this.exploredData[y][x] === 0) {
        tile.setAlpha(0.7);   // vùng chưa khám phá → che đặc
      } else if (this.fogData[y][x] === 1 && this.exploredData[y][x] === 1) {
        tile.setAlpha(0.25); // đã khám phá nhưng không còn tầm nhìn
      } else {
        tile.setAlpha(0);   // đang trong tầm nhìn → ẩn
      }
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

  // ✅ Kiểm tra vị trí nước / đất
  if (this.isWater(x, y)) {
    // Nếu đang build Shipyard → được phép
    if (this.buildingType !== "Shipyard") return false;
  } else {
    // Nếu là đất → không cho Shipyard
    if (this.buildingType === "Shipyard") return false;
  }

  // ❌ Không cho xây trong fog
  const cellSize = this.fogCellSize;
  const cx = Math.floor(x / cellSize);
  const cy = Math.floor(y / cellSize);
  if (this.fogData && this.fogData[cy] && this.fogData[cy][cx] === 1) return false;

  return true;
}


isWater(x, y) {
  const tileSize = 64;
  const gx = Math.floor(x / tileSize);
  const gy = Math.floor(y / tileSize);
  return this.mapData[gy] && this.mapData[gy][gx] === "water";
}

isNearLand(x, y, radius = 40) {
  for (let dx = -radius; dx <= radius; dx += 8) {
    for (let dy = -radius; dy <= radius; dy += 8) {
      if (!this.isWater(x + dx, y + dy)) {
        return true; // tìm thấy đất gần đó
      }
    }
  }
  return false;
}

isNearWater(x, y, radius = 40) {
  for (let dx = -radius; dx <= radius; dx += 8) {
    for (let dy = -radius; dy <= radius; dy += 8) {
      if (this.isWater(x + dx, y + dy)) {
        return true; // tìm thấy nước gần đó
      }
    }
  }
  return false;
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
    case "Shipyard":
  if (this.resources.wood >= 150 && this.resources.stone >= 100) {
    this.resources.wood -= 150;
    this.resources.stone -= 100;
    building = new Shipyard(this, x, y);

    // ✅ Ghi vào danh sách buildings chung để các entity tìm thấy
    this.buildings.push(building); 

    // (Tuỳ bạn có dùng this.shipyards riêng không)
    if (!this.shipyards) this.shipyards = [];
    this.shipyards.push(building);
  } else {
    console.log("❌ Not enough resources for Shipyard.");
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


showTransportMenu(ship, mode) {
  if (this.transportMenu) {
    this.transportMenu.destroy(true);
    this.transportMenu = null;
  }

  this.activeTransport = ship;
  const menuX = ship.sprite.x + 60;
  const menuY = ship.sprite.y;

  this.transportMenu = this.add.container(menuX, menuY);

  const bg = this.add.rectangle(0, 0, 120, 60, 0x333333);
  this.transportMenu.add(bg);

  if (mode === "load") {
    // 👉 Menu LÊN THUYỀN
    const loadBtn = this.add.text(-40, -10, "⬆️ Lên thuyền", { fontSize: "12px", color: "#fff" }).setInteractive();
    loadBtn.on("pointerdown", () => {
      this.selectedUnits.forEach((u) => {
        if (!u.isShip && Phaser.Math.Distance.Between(u.sprite.x, u.sprite.y, ship.sprite.x, ship.sprite.y) < 100) {
          ship.loadUnit(u);
        }
      });
      this.transportMenu.destroy(true);
      this.transportMenu = null;
    });
    this.transportMenu.add(loadBtn);

  } else if (mode === "unload") {
    // 👉 Menu THẢ QUÂN
    const unloadBtn = this.add.text(-40, -10, "⬇️ Thả quân", { fontSize: "12px", color: "#fff" }).setInteractive();
    unloadBtn.on("pointerdown", () => {
      if (this.isNearLand(ship.sprite.x, ship.sprite.y)) {
        ship.unloadUnits(ship.sprite.x, ship.sprite.y);
          this.selectedUnits = [];  
      } else {
        console.log("❌ Thuyền chưa cập bờ, không thể thả quân!");
      }
      this.transportMenu.destroy(true);
      this.transportMenu = null;
    });
    this.transportMenu.add(unloadBtn);
  }

  // Nút close
  const closeBtn = this.add.text(40, -20, "✖", { fontSize: "14px", color: "#fff" }).setInteractive();
  closeBtn.on("pointerdown", () => {
    this.transportMenu.destroy(true);
    this.transportMenu = null;
  });
  this.transportMenu.add(closeBtn);
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
  const bg = this.add.rectangle(0, 0, 120, 210, 0x333333);
  this.barracksMenu.add(bg);

  // ⚔️ Melee
  // ⚔️ Melee
const meleeBtn = this.add.rectangle(0, -80, 110, 25, 0x444444).setInteractive();
const meleeText = this.add.text(-25, -88, "⚔️ Melee", { fontSize: "12px", color: "#fff" });
  this.barracksMenu.add(meleeBtn).add(meleeText);
  meleeBtn.on("pointerdown", () => this.spawnMelee());

  // 🏹 Ranged
  // 🏹 Ranged
const rangedBtn = this.add.rectangle(0, -40, 110, 25, 0x444444).setInteractive();
const rangedText = this.add.text(-30, -48, "🏹 Ranged", { fontSize: "12px", color: "#fff" });
  this.barracksMenu.add(rangedBtn).add(rangedText);
  rangedBtn.on("pointerdown", () => this.spawnRanged());

// 💚 Healer
const healerBtn = this.add.rectangle(0, 0, 110, 25, 0x444444).setInteractive();
const healerText = this.add.text(-25, -8, "💚 Healer", { fontSize: "12px", color: "#fff" });
  this.barracksMenu.add(healerBtn).add(healerText);
  healerBtn.on("pointerdown", () => this.spawnHealer());

// 🐎 Cavalry
const cavalryBtn = this.add.rectangle(0, 40, 110, 25, 0x444444).setInteractive();
const cavalryText = this.add.text(-30, 32, "🐎 Cavalry", { fontSize: "12px", color: "#fff" });

  this.barracksMenu.add(cavalryBtn).add(cavalryText);
  cavalryBtn.on("pointerdown", () => this.spawnCavalry());

// 🐉 Dragon Knight
const dragonBtn = this.add.rectangle(0, 80, 110, 25, 0x444444).setInteractive();
const dragonText = this.add.text(-38, 72, "🐉 Dragon Knight", { fontSize: "12px", color: "#fff" });
this.barracksMenu.add(dragonBtn).add(dragonText);
dragonBtn.on("pointerdown", () => this.spawnDragonKnight());


  // ✖ Close button
  const closeBtn = this.add.text(50, -100, "✖", { fontSize: "16px", color: "#fff" }).setInteractive();

  closeBtn.setDepth(1);
  closeBtn.on("pointerdown", () => {
    this.barracksMenu.destroy(true);
    this.barracksMenu = null;
    this.activeBarracks = null;
  });
  this.barracksMenu.add(closeBtn);
}


  spawnMelee() {
  this.activeBarracks.spawnUnit("melee", this, this.resources);
  this.barracksMenu.destroy(true);
  this.barracksMenu = null;
}

spawnRanged() {
  this.activeBarracks.spawnUnit("ranged", this, this.resources);
  this.barracksMenu.destroy(true);
  this.barracksMenu = null;
}

spawnHealer() {
  this.activeBarracks.spawnUnit("healer", this, this.resources);
  this.barracksMenu.destroy(true);
  this.barracksMenu = null;
}

spawnCavalry() {
  this.activeBarracks.spawnUnit("cavalry", this, this.resources);
  this.barracksMenu.destroy(true);
  this.barracksMenu = null;
}

spawnDragonKnight() {
  this.activeBarracks.spawnUnit("dragon", this, this.resources);
  this.barracksMenu.destroy(true);
  this.barracksMenu = null;
}



showShipyardMenu(shipyard) {
  // Nếu menu cũ còn thì xoá
  if (this.shipyardMenu) {
    this.shipyardMenu.destroy(true);
    this.shipyardMenu = null;
  }

  this.activeShipyard = shipyard;
  const menuX = shipyard.x + 70;
  const menuY = shipyard.y;

  this.shipyardMenu = this.add.container(menuX, menuY);

  // Nền đủ cao cho 3 nút
  const bg = this.add.rectangle(0, 0, 130, 140, 0x333333);
  this.shipyardMenu.add(bg);

  // 🚢 TransportShip
  const transportBtn = this.add.rectangle(0, -40, 120, 25, 0x444444).setInteractive();
  const transportText = this.add.text(-40, -48, "🚢 Transport", { fontSize: "12px", color: "#fff" });
  this.shipyardMenu.add(transportBtn).add(transportText);
  transportBtn.on("pointerdown", () => this.spawnTransportShip());

  // 🎣 FishingBoat
  const fishingBtn = this.add.rectangle(0, 0, 120, 25, 0x444444).setInteractive();
  const fishingText = this.add.text(-40, -8, "🎣 Fishing", { fontSize: "12px", color: "#fff" });
  this.shipyardMenu.add(fishingBtn).add(fishingText);
  fishingBtn.on("pointerdown", () => this.spawnFishingBoat());

  // ⚓ Warship
  const warshipBtn = this.add.rectangle(0, 40, 120, 25, 0x444444).setInteractive();
  const warshipText = this.add.text(-40, 32, "⚓ Warship", { fontSize: "12px", color: "#fff" });
  this.shipyardMenu.add(warshipBtn).add(warshipText);
  warshipBtn.on("pointerdown", () => this.spawnWarship());

  // ✖ Close
  const closeBtn = this.add.text(55, -65, "✖", { fontSize: "16px", color: "#fff" }).setInteractive();
  closeBtn.on("pointerdown", () => {
    this.shipyardMenu.destroy(true);
    this.shipyardMenu = null;
    this.activeShipyard = null;
  });
  this.shipyardMenu.add(closeBtn);
}
spawnTransportShip() {
  if (this.resources.wood >= 100 && this.resources.gold >= 50) {
    this.resources.wood -= 100;
    this.resources.gold -= 50;
    const ship = new TransportShip(this, this.activeShipyard.x + 80, this.activeShipyard.y);
    this.ships.push(ship);
    this.events.emit("updateHUD", this.resources);
    this.shipyardMenu.destroy(true);
    this.shipyardMenu = null;
  } else {
    console.log("❌ Not enough resources for TransportShip");
  }
}

spawnFishingBoat() {
  if (this.resources.wood >= 80) {
    this.resources.wood -= 80;
    const ship = new FishingBoat(this, this.activeShipyard.x + 80, this.activeShipyard.y);
    this.ships.push(ship);
    this.events.emit("updateHUD", this.resources);
    this.shipyardMenu.destroy(true);
    this.shipyardMenu = null;
  } else {
    console.log("❌ Not enough resources for FishingBoat");
  }
}

spawnWarship() {
  if (this.resources.wood >= 150 && this.resources.gold >= 100) {
    this.resources.wood -= 150;
    this.resources.gold -= 100;
    const ship = new Warship(this, this.activeShipyard.x + 80, this.activeShipyard.y);
    this.ships.push(ship);
    this.events.emit("updateHUD", this.resources);
    this.shipyardMenu.destroy(true);
    this.shipyardMenu = null;
  } else {
    console.log("❌ Not enough resources for Warship");
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

  // 🐟 Spawn cá trên biển

  const totalFishClusters = 10;
// 🐟 Spawn bầy cá theo chùm

for (let i = 0; i < totalFishClusters; i++) {
  let cx, cy, valid = false, tries = 0;

  while (!valid && tries < 100) {
    tries++;
    cx = Phaser.Math.Between(0, this.physics.world.bounds.width);
    cy = Phaser.Math.Between(0, this.physics.world.bounds.height);
    valid = this.isWater(cx, cy);
  }

  if (!valid) continue;

  const fishInCluster = Phaser.Math.Between(4, 8); // mỗi cụm 4–8 con
  const radius = Phaser.Math.Between(30, 60); // bán kính lan cá

  for (let j = 0; j < fishInCluster; j++) {
    const angle = Phaser.Math.FloatBetween(0, Math.PI * 2);
    const dist = Phaser.Math.Between(10, radius);
    const x = cx + Math.cos(angle) * dist;
    const y = cy + Math.sin(angle) * dist;

    if (this.isWater(x, y)) {
      const fish = new Fish(this, x, y);
      this.resourcesNodes.push(fish);
    }
  }
}

const totalFieldClusters = 12;
for (let i = 0; i < totalFieldClusters; i++) {
  let pos, valid = false, tries = 0;

  while (!valid && tries < 50) {
    tries++;
    pos = (Math.random() < nearHouseRatio)
      ? randomNearHouse(100, 350)
      : {
          x: Phaser.Math.Between(margin, width - margin),
          y: Phaser.Math.Between(margin, height - margin)
        };

    valid = !this.isWater(pos.x, pos.y);
  }

  if (!valid) continue;

  // 👉 Gọi spawnResourceClusters với nhiều lúa hơn, khoảng cách nhỏ
  this.spawnResourceClusters(
    "field",           // type
    "rice_field",      // texture
    1,                 // mỗi cụm
    Phaser.Math.Between(10, 20), // nhiều lúa
    60,                // bán kính cụm lớn hơn
    15,                // khoảng cách nhỏ
    pos.x,
    pos.y
  );
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
  this.workers.forEach(w => w.update(time));
  this.units.forEach(u => u.update(time));
  this.monsters.forEach(m => m.update(time));
  this.animals.forEach(a => a.update(time));
  this.ships.forEach(s => s.update(time));

  if (this.mainHouse?.update) this.mainHouse.update(time);
  this.houses?.forEach(b => b.update?.(time));
  this.towers?.forEach(t => t.update?.(time));
  this.barracks?.forEach(b => b.update?.(time));
  this.shipyards?.forEach(s => s.update?.(time));

  // ⭐ Reset fog trước khi vẽ lại
  this.resetFog();

  // 👀 Reveal tầm nhìn
  this.revealFog(this.mainHouse.x, this.mainHouse.y, this.mainHouse.visionRange || 300);
  this.workers.forEach(w => this.revealFog(w.sprite.x, w.sprite.y, 120));
  this.units.forEach(u => this.revealFog(u.sprite.x, u.sprite.y, 120));
  this.ships.forEach(s => this.revealFog(s.sprite.x, s.sprite.y, s.visionRange || 180));
  this.houses.forEach(b => this.revealFog(b.x, b.y, b.visionRange || 150));
  if (this.towers) this.towers.forEach(t => this.revealFog(t.x, t.y, t.visionRange || 180));
  if (this.shipyards) this.shipyards.forEach(s => this.revealFog(s.x, s.y, s.visionRange || 200));
  this.waterOverlayTiles?.forEach(wave => {
  wave.tilePositionX += 0.1;
  wave.tilePositionY += 0.05;
});



  // 🎨 Vẽ lại fog bằng sprite
  this.drawFog();

  // ☁️ Hiệu ứng mây trôi
  // ☁️ Hiệu ứng mây trôi nhẹ tại chỗ
this.fogSprites.forEach((tile, idx) => {
  const offsetX = Math.sin(time * 0.0003 + idx) * 9; // biên độ 1.5 px
  const offsetY = Math.cos(time * 0.00025 + idx) * 9; // biên độ 1.5 px
  tile.x = tile.baseX + offsetX;
  tile.y = tile.baseY + offsetY;
});

  // 🔦 Highlight selected
  [...this.workers, ...this.units, ...this.ships].forEach(u => {
    if (!u.sprite) return;
    if (this.selectedUnits.includes(u)) {
      if (u.sprite.setTint) u.sprite.setTint(0xffff00);
    } else {
      if (u.sprite.clearTint) u.sprite.clearTint();
    }
  });
}




}
