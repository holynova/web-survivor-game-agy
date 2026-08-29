import Phaser from 'phaser';

export class PreloadScene extends Phaser.Scene {
  constructor() {
    super({ key: 'PreloadScene' });
  }

  public preload(): void {
    const width = this.scale.width;
    const height = this.scale.height;

    // 进度条背景
    const progressBox = this.add.graphics();
    progressBox.fillStyle(0x1d3557, 0.8);
    progressBox.fillRoundedRect(width / 2 - 160, height / 2 - 12, 320, 24, 6);

    const progressBar = this.add.graphics();

    const loadingText = this.add.text(width / 2, height / 2 - 40, '夜市摊位准备中 (加载像素资产与音效)...', {
      fontSize: '16px',
      color: '#f4a261',
      fontStyle: 'bold',
    });
    loadingText.setOrigin(0.5, 0.5);

    this.load.on('progress', (value: number) => {
      progressBar.clear();
      progressBar.fillStyle(0x00f5d4, 1);
      progressBar.fillRoundedRect(width / 2 - 156, height / 2 - 8, 312 * value, 16, 4);
    });

    this.load.on('complete', () => {
      progressBox.destroy();
      progressBar.destroy();
      loadingText.destroy();
    });

    // 1. 加载角色像素图集 (16x16 单帧)
    this.load.spritesheet('char_wok_master', './assets/characters/char_wok_master.png', {
      frameWidth: 16,
      frameHeight: 16,
    });
    this.load.spritesheet('char_cold_brewer', './assets/characters/char_cold_brewer.png', {
      frameWidth: 16,
      frameHeight: 16,
    });
    this.load.spritesheet('char_skewer_griller', './assets/characters/char_skewer_griller.png', {
      frameWidth: 16,
      frameHeight: 16,
    });

    // 2. 加载小怪像素图集 (16x16)
    this.load.spritesheet('enemy_hungry_ghost', './assets/enemies/enemy_hungry_ghost.png', {
      frameWidth: 16,
      frameHeight: 16,
    });
    this.load.spritesheet('enemy_spicy_slime', './assets/enemies/enemy_spicy_slime.png', {
      frameWidth: 16,
      frameHeight: 16,
    });
    this.load.spritesheet('enemy_lantern_spirit', './assets/enemies/enemy_lantern_spirit.png', {
      frameWidth: 16,
      frameHeight: 16,
    });
    this.load.spritesheet('enemy_grease_goblin', './assets/enemies/enemy_grease_goblin.png', {
      frameWidth: 16,
      frameHeight: 16,
    });
    this.load.spritesheet('enemy_skewer_thief', './assets/enemies/enemy_skewer_thief.png', {
      frameWidth: 16,
      frameHeight: 16,
    });
    this.load.spritesheet('enemy_steam_phantom', './assets/enemies/enemy_steam_phantom.png', {
      frameWidth: 16,
      frameHeight: 16,
    });

    // 3. 加载精英与 Boss 像素图集
    this.load.spritesheet('enemy_giant_bao_demon', './assets/enemies/enemy_giant_bao_demon.png', {
      frameWidth: 16,
      frameHeight: 16,
    });
    this.load.spritesheet('enemy_flame_pot_guard', './assets/enemies/enemy_flame_pot_guard.png', {
      frameWidth: 16,
      frameHeight: 16,
    });
    this.load.spritesheet('enemy_night_glutton_king', './assets/enemies/enemy_night_glutton_king.png', {
      frameWidth: 32,
      frameHeight: 32,
    });

    // 4. 加载物品与掉落贴图
    this.load.image('item_skewer', './assets/items/item_skewer.png');
    this.load.image('item_food', './assets/items/item_food.png');
    this.load.image('item_sugar', './assets/items/item_sugar.png');
    this.load.image('item_herb', './assets/items/item_herb.png');
    this.load.image('item_potion', './assets/items/item_potion.png');
    this.load.image('weapon_cleaver', './assets/items/weapon_cleaver.png');
    this.load.image('tileset_floor', './assets/environment/tileset_floor.png');

    // 5. 加载背景音乐与音效
    this.load.audio('bgm_battle', './assets/audio/bgm_battle.ogg');
    this.load.audio('bgm_menu', './assets/audio/bgm_menu.ogg');
    this.load.audio('bgm_shop', './assets/audio/bgm_shop.ogg');
    this.load.audio('sfx_hit', './assets/audio/sfx_hit.wav');
    this.load.audio('sfx_kill', './assets/audio/sfx_kill.wav');
    this.load.audio('sfx_coin', './assets/audio/sfx_coin.wav');
    this.load.audio('sfx_levelup', './assets/audio/sfx_levelup.wav');
    this.load.audio('sfx_fire', './assets/audio/sfx_fire.wav');
    this.load.audio('sfx_slash', './assets/audio/sfx_slash.wav');
    this.load.audio('sfx_explosion', './assets/audio/sfx_explosion.wav');
    this.load.audio('sfx_gameover', './assets/audio/sfx_gameover.wav');

    this.createPlaceholderTextures();
  }

  private createPlaceholderTextures(): void {
    // 粒子圆点
    const g = this.make.graphics({ x: 0, y: 0 });
    g.fillStyle(0xffffff, 1);
    g.fillCircle(8, 8, 8);
    g.generateTexture('particle_circle', 16, 16);
    g.destroy();

    // 生成夜市深色石板地砖 (64x64)
    const floorG = this.make.graphics({ x: 0, y: 0 });
    floorG.fillStyle(0x0f181b, 1);
    floorG.fillRect(0, 0, 64, 64);
    floorG.lineStyle(1, 0x1f3036, 1);
    floorG.strokeRect(1, 1, 30, 30);
    floorG.strokeRect(33, 1, 30, 30);
    floorG.strokeRect(1, 33, 30, 30);
    floorG.strokeRect(33, 33, 30, 30);

    floorG.fillStyle(0x162429, 0.7);
    floorG.fillRect(3, 3, 26, 26);
    floorG.fillRect(35, 3, 26, 26);
    floorG.fillRect(3, 35, 26, 26);
    floorG.fillRect(35, 35, 26, 26);

    floorG.generateTexture('floor_stone', 64, 64);
    floorG.destroy();
  }

  public create(): void {
    // 创建角色行走动画
    this.createAnimations();
    this.scene.start('MenuScene');
  }

  private createAnimations(): void {
    const chars = ['char_wok_master', 'char_cold_brewer', 'char_skewer_griller'];
    for (const key of chars) {
      if (this.textures.exists(key)) {
        this.anims.create({
          key: `${key}_walk`,
          frames: this.anims.generateFrameNumbers(key, { start: 0, end: 3 }),
          frameRate: 8,
          repeat: -1,
        });
      }
    }
  }
}
