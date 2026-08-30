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
    this.load.image('cover_night_market', './assets/ui/cover_night_market.jpg');
    this.load.image('item_skewer', './assets/items/item_skewer.png');
    this.load.image('item_food', './assets/items/item_food.png');
    this.load.image('item_sugar', './assets/items/item_sugar.png');
    this.load.image('item_herb', './assets/items/item_herb.png');
    this.load.image('item_potion', './assets/items/item_potion.png');
    this.load.image('weapon_cleaver', './assets/items/weapon_cleaver.png');
    this.load.image('tileset_floor', './assets/environment/tileset_floor.png');

    // 5. 加载背景音乐与音效
    this.load.audio('bgm_night_market_theme', [
      './assets/audio/bgm_night_market_theme.ogg',
      './assets/audio/bgm_night_market_theme.mp3',
    ]);
    this.load.audio('bgm_battle', './assets/audio/bgm_battle.ogg');
    this.load.audio('bgm_boss', './assets/audio/bgm_boss.ogg');
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
    // 1. 粒子圆点
    const g = this.make.graphics({ x: 0, y: 0 });
    g.fillStyle(0xffffff, 1);
    g.fillCircle(8, 8, 8);
    g.generateTexture('particle_circle', 16, 16);
    g.destroy();

    // 2. 生成夜市深色石板地砖 (64x64)
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

    // 3. 生成八卦游龙铲武器图标 (weapon_dragon_spatula)
    const spatG = this.make.graphics({ x: 0, y: 0 });
    spatG.fillStyle(0xffd166, 1);
    spatG.fillRect(4, 2, 8, 8);
    spatG.fillStyle(0xf4a261, 1);
    spatG.fillRect(6, 10, 4, 12);
    spatG.fillStyle(0xe76f51, 1);
    spatG.fillRect(7, 22, 2, 6);
    spatG.generateTexture('weapon_dragon_spatula', 28, 28);
    spatG.destroy();

    // 4. 生成爆米花机图标 (weapon_popcorn_popper)
    const popG = this.make.graphics({ x: 0, y: 0 });
    popG.fillStyle(0xe76f51, 1);
    popG.fillRect(4, 10, 16, 14);
    popG.fillStyle(0xffe66d, 1);
    popG.fillCircle(8, 6, 4);
    popG.fillCircle(16, 6, 4);
    popG.fillCircle(12, 3, 3);
    popG.generateTexture('weapon_popcorn_popper', 24, 24);
    popG.destroy();

    // 5. 生成冰魄玉泉壶图标 (weapon_jade_teapot)
    const teaG = this.make.graphics({ x: 0, y: 0 });
    teaG.fillStyle(0x48cae4, 1);
    teaG.fillCircle(12, 14, 8);
    teaG.fillStyle(0x90e0ef, 1);
    teaG.fillRect(6, 4, 12, 3);
    teaG.fillStyle(0x0077b6, 1);
    teaG.fillRect(18, 10, 5, 4);
    teaG.generateTexture('weapon_jade_teapot', 24, 24);
    teaG.destroy();

    // 6. 生成乾坤聚味瓮图标 (weapon_flavor_vortex)
    const vorG = this.make.graphics({ x: 0, y: 0 });
    vorG.fillStyle(0x7209b7, 1);
    vorG.fillCircle(12, 14, 9);
    vorG.fillStyle(0x9d4edd, 1);
    vorG.fillRect(7, 3, 10, 4);
    vorG.fillStyle(0x00f5d4, 1);
    vorG.fillCircle(12, 14, 3);
    vorG.generateTexture('weapon_flavor_vortex', 24, 24);
    vorG.destroy();

    // 7. 厚重铁锅图标 (weapon_iron_wok)
    const wokG = this.make.graphics({ x: 0, y: 0 });
    wokG.fillStyle(0x3d5a5b, 1);
    wokG.fillCircle(12, 14, 9);
    wokG.fillStyle(0xe76f51, 1);
    wokG.fillRect(2, 12, 4, 3);
    wokG.fillRect(18, 12, 4, 3);
    wokG.generateTexture('weapon_iron_wok', 24, 24);
    wokG.destroy();

    // 8. 猛火炉灶 (weapon_stove_flame)
    const flameG = this.make.graphics({ x: 0, y: 0 });
    flameG.fillStyle(0xd90429, 1);
    flameG.fillTriangle(12, 2, 3, 22, 21, 22);
    flameG.fillStyle(0xffd166, 1);
    flameG.fillTriangle(12, 8, 6, 20, 18, 20);
    flameG.generateTexture('weapon_stove_flame', 24, 24);
    flameG.destroy();

    // 9. 唤灵上菜铃 (weapon_service_bell)
    const bellG = this.make.graphics({ x: 0, y: 0 });
    bellG.fillStyle(0xffd166, 1);
    bellG.fillTriangle(12, 4, 4, 20, 20, 20);
    bellG.fillStyle(0xf4a261, 1);
    bellG.fillRect(10, 20, 4, 3);
    bellG.generateTexture('weapon_service_bell', 24, 24);
    bellG.destroy();

    // 10. 八宝调料瓶 (weapon_seasoning_jar)
    const jarG = this.make.graphics({ x: 0, y: 0 });
    jarG.fillStyle(0x2a9d8f, 1);
    jarG.fillRect(6, 8, 12, 14);
    jarG.fillStyle(0xf4a261, 1);
    jarG.fillRect(9, 3, 6, 5);
    jarG.generateTexture('weapon_seasoning_jar', 24, 24);
    jarG.destroy();

    // 11. 穿心竹签 (weapon_bamboo_skewer)
    const skewG = this.make.graphics({ x: 0, y: 0 });
    skewG.fillStyle(0xd4a373, 1);
    skewG.fillRect(11, 2, 2, 20);
    skewG.fillStyle(0xe76f51, 1);
    skewG.fillRect(8, 6, 8, 4);
    skewG.fillStyle(0x2a9d8f, 1);
    skewG.fillRect(8, 12, 8, 4);
    skewG.generateTexture('weapon_bamboo_skewer', 24, 24);
    skewG.destroy();

    // 12. 朝天红辣椒贴图 (item_chili_pepper)
    const chiliG = this.make.graphics({ x: 0, y: 0 });
    chiliG.fillStyle(0xd90429, 1);
    chiliG.fillTriangle(14, 22, 6, 8, 20, 8);
    chiliG.fillStyle(0x2b9348, 1);
    chiliG.fillRect(11, 2, 4, 7);
    chiliG.generateTexture('item_chili_pepper', 26, 26);
    chiliG.destroy();

    // 13. 老窖碎冰块贴图 (item_ice_cube)
    const iceG = this.make.graphics({ x: 0, y: 0 });
    iceG.fillStyle(0x00b4d8, 1);
    iceG.fillRect(4, 4, 18, 18);
    iceG.fillStyle(0x90e0ef, 1);
    iceG.fillRect(6, 6, 8, 8);
    iceG.fillStyle(0xffffff, 0.9);
    iceG.fillRect(6, 6, 4, 4);
    iceG.generateTexture('item_ice_cube', 26, 26);
    iceG.destroy();

    // 14. 纯香芝麻油贴图 (item_sesame_oil)
    const oilG = this.make.graphics({ x: 0, y: 0 });
    oilG.fillStyle(0xf4a261, 1);
    oilG.fillRect(6, 10, 14, 14);
    oilG.fillStyle(0xe76f51, 1);
    oilG.fillRect(9, 4, 8, 6);
    oilG.fillStyle(0xffd166, 1);
    oilG.fillCircle(13, 16, 4);
    oilG.generateTexture('item_sesame_oil', 26, 26);
    oilG.destroy();

    // 15. 古法红蔗糖贴图 (item_cane_sugar)
    const sugG = this.make.graphics({ x: 0, y: 0 });
    sugG.fillStyle(0x9d0208, 1);
    sugG.fillRect(5, 7, 16, 14);
    sugG.fillStyle(0xd00000, 1);
    sugG.fillRect(7, 5, 12, 4);
    sugG.fillStyle(0xffba08, 1);
    sugG.fillRect(8, 10, 10, 8);
    sugG.generateTexture('item_cane_sugar', 26, 26);
    sugG.destroy();

    // 16. 特酿豆瓣酱贴图 (item_fermented_sauce)
    const beanG = this.make.graphics({ x: 0, y: 0 });
    beanG.fillStyle(0x6a040f, 1);
    beanG.fillRect(4, 8, 18, 16);
    beanG.fillStyle(0x370617, 1);
    beanG.fillRect(3, 6, 20, 4);
    beanG.fillStyle(0xe85d04, 1);
    beanG.fillRect(8, 12, 10, 8);
    beanG.generateTexture('item_fermented_sauce', 26, 26);
    beanG.destroy();

    // 17. 老竹小蒸笼贴图 (item_bamboo_steamer)
    const stmG = this.make.graphics({ x: 0, y: 0 });
    stmG.fillStyle(0xd4a373, 1);
    stmG.fillRect(4, 8, 18, 15);
    stmG.fillStyle(0xfaedcd, 1);
    stmG.fillRect(5, 5, 16, 4);
    stmG.fillStyle(0xb08968, 1);
    stmG.fillRect(4, 14, 18, 2);
    stmG.generateTexture('item_bamboo_steamer', 26, 26);
    stmG.destroy();

    // 18. 紫皮独头蒜贴图 (item_garlic_clove)
    const garG = this.make.graphics({ x: 0, y: 0 });
    garG.fillStyle(0xf8f9fa, 1);
    garG.fillCircle(13, 15, 8);
    garG.fillStyle(0x7209b7, 0.7);
    garG.fillRect(10, 10, 6, 10);
    garG.fillStyle(0x2b9348, 1);
    garG.fillRect(12, 3, 3, 6);
    garG.generateTexture('item_garlic_clove', 26, 26);
    garG.destroy();

    // 19. 阴阳八角茴贴图 (item_star_anise)
    const starG = this.make.graphics({ x: 0, y: 0 });
    starG.fillStyle(0x582f0e, 1);
    starG.fillRect(11, 3, 4, 20);
    starG.fillRect(3, 11, 20, 4);
    starG.fillRect(5, 5, 16, 16);
    starG.fillStyle(0xa68a64, 1);
    starG.fillCircle(13, 13, 4);
    starG.generateTexture('item_star_anise', 26, 26);
    starG.destroy();

    // 20. 招财金灵猫贴图 (item_lucky_cat)
    const catG = this.make.graphics({ x: 0, y: 0 });
    catG.fillStyle(0xffd166, 1);
    catG.fillRect(6, 10, 14, 14);
    catG.fillTriangle(6, 10, 9, 3, 12, 10);
    catG.fillTriangle(14, 10, 17, 3, 20, 10);
    catG.fillStyle(0xe76f51, 1);
    catG.fillCircle(13, 16, 3);
    catG.generateTexture('item_lucky_cat', 26, 26);
    catG.destroy();
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
