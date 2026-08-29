import Phaser from 'phaser';
import { EventBus } from '@/core/event-bus';
import { Player } from '@/game/entities/Player';
import { SimulationWorld } from '../simulation/world';

export class SpriteSyncSystem {
  private scene: Phaser.Scene;
  private graphics: Phaser.GameObjects.Graphics;
  private playerSprite: Phaser.GameObjects.Sprite | null = null;
  private shadowGraphics: Phaser.GameObjects.Graphics;
  private enemySprites: Map<number, Phaser.GameObjects.Sprite> = new Map();
  private dropSprites: Map<number, Phaser.GameObjects.Image> = new Map();
  private tilemapBackground: Phaser.GameObjects.TileSprite | null = null;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;

    // 创建夜市石板地砖背景
    if (scene.textures.exists('floor_stone')) {
      this.tilemapBackground = scene.add.tileSprite(0, 0, 3200, 3200, 'floor_stone');
      this.tilemapBackground.setDepth(-10);
    }

    this.shadowGraphics = scene.add.graphics();
    this.shadowGraphics.setDepth(1);

    this.graphics = scene.add.graphics();
    this.graphics.setDepth(10);

    this.bindEvents();
  }

  private bindEvents(): void {
    EventBus.getInstance().on('entity:damaged', data => {
      if (data.isCrit) {
        this.scene.cameras.main.shake(120, 0.006);
      }
    });

    EventBus.getInstance().on('player:died', () => {
      this.scene.cameras.main.shake(350, 0.018);
    });
  }

  public renderWorld(world: SimulationWorld): void {
    this.graphics.clear();
    this.shadowGraphics.clear();

    const player = world.player;
    if (!player) return;

    // 1. 绘制边界
    this.renderEnvironment();

    // 2. 同步并渲染掉落物 (像素美食/食材)
    this.renderDrops(world);

    // 3. 渲染投射物与攻击特效
    this.renderProjectiles(world);

    // 4. 同步并渲染怪物像素精灵与血条
    this.renderEnemies(world);

    // 5. 同步玩家角色精灵与状态
    this.renderPlayer(player);
  }

  private renderEnvironment(): void {
    // 地图边界发光警示线 (-1400 到 1400)
    this.graphics.lineStyle(6, 0xe76f51, 0.7);
    this.graphics.strokeRect(-1400, -1400, 2800, 2800);
    this.graphics.lineStyle(2, 0xffbe0b, 0.5);
    this.graphics.strokeRect(-1408, -1408, 2816, 2816);
  }

  private renderDrops(world: SimulationWorld): void {
    const activeDrops = world.dropPool.getActiveItems();
    const activeDropIds = new Set<number>();

    for (let i = 0; i < activeDrops.length; i++) {
      const drop = activeDrops[i];
      activeDropIds.add(drop.id);

      let img = this.dropSprites.get(drop.id);
      if (!img) {
        // 根据掉落类型选择对应像素美食贴图
        let textureKey = 'item_food';
        if (drop.type === 'heat') {
          textureKey = 'item_skewer';
        } else if (drop.type === 'ingredient') {
          textureKey = 'item_sugar';
        }
        if (!this.scene.textures.exists(textureKey)) {
          textureKey = 'particle_circle';
        }

        img = this.scene.add.image(drop.x, drop.y, textureKey);
        img.setDepth(3);
        img.setScale(1.2);
        this.dropSprites.set(drop.id, img);
      }

      // 轻微上下浮动呼吸效果
      const bob = Math.sin(this.scene.time.now * 0.008 + i) * 3;
      img.setPosition(drop.x, drop.y + bob);
      img.setVisible(true);

      // 阴影与微光
      this.shadowGraphics.fillStyle(0x000000, 0.3);
      this.shadowGraphics.fillEllipse(drop.x, drop.y + drop.radius + 2, drop.radius * 1.5, 4);

      const colorNum = parseInt(drop.color.replace('#', '0x'), 16);
      this.graphics.lineStyle(1.5, colorNum, 0.6);
      this.graphics.strokeCircle(drop.x, drop.y + bob, drop.radius + 3);
    }

    // 清理非激活掉落物精灵
    for (const [id, sprite] of this.dropSprites.entries()) {
      if (!activeDropIds.has(id)) {
        sprite.destroy();
        this.dropSprites.delete(id);
      }
    }
  }

  private renderProjectiles(world: SimulationWorld): void {
    const player = world.player;
    if (!player) return;

    const activeProjectiles = world.projectilePool.getActiveItems();
    for (let i = 0; i < activeProjectiles.length; i++) {
      const p = activeProjectiles[i];
      const colorNum = parseInt(p.color.replace('#', '0x'), 16);

      if (p.attackPattern === 'arc') {
        // 近战弧形扇面斩击
        this.graphics.fillStyle(colorNum, 0.4);
        this.graphics.lineStyle(3, colorNum, 0.95);
        this.graphics.beginPath();
        this.graphics.arc(
          player.position.x,
          player.position.y,
          p.rangeRemaining || 120,
          p.orbitAngle - 0.75,
          p.orbitAngle + 0.75,
        );
        this.graphics.strokePath();
      } else if (p.attackPattern === 'area') {
        // 地面燃烧火域
        this.graphics.fillStyle(colorNum, 0.35);
        this.graphics.fillCircle(p.x, p.y, p.radius);
        this.graphics.lineStyle(2, 0xffbe0b, 0.8);
        this.graphics.strokeCircle(p.x, p.y, p.radius);

        // 火苗中心爆点
        this.graphics.fillStyle(0xffffff, 0.5);
        this.graphics.fillCircle(p.x, p.y, p.radius * 0.35);
      } else if (p.attackPattern === 'orbit') {
        // 环绕调料瓶/护盾
        this.graphics.fillStyle(colorNum, 1);
        this.graphics.fillCircle(p.x, p.y, p.radius);
        this.graphics.lineStyle(2, 0xffffff, 0.9);
        this.graphics.strokeCircle(p.x, p.y, p.radius);
      } else if (p.attackPattern === 'summon') {
        // 召唤帮厨小幽灵
        this.graphics.fillStyle(0x7209b7, 0.85);
        this.graphics.fillCircle(p.x, p.y, p.radius);
        this.graphics.fillStyle(0x00f5d4, 1);
        this.graphics.fillCircle(p.x - 3, p.y - 2, 2);
        this.graphics.fillCircle(p.x + 3, p.y - 2, 2);
      } else if (p.attackPattern === 'pierceLine') {
        // 竹签穿透疾刺金光
        this.graphics.fillStyle(0xffbe0b, 1);
        this.graphics.fillCircle(p.x, p.y, p.radius + 1);
        this.graphics.lineStyle(3, 0xffffff, 0.8);
        this.graphics.lineBetween(
          p.x - p.velocity.x * 0.05,
          p.y - p.velocity.y * 0.05,
          p.x,
          p.y,
        );
      } else {
        // 飞刀/普通投射物
        this.graphics.fillStyle(colorNum, 1);
        this.graphics.fillCircle(p.x, p.y, p.radius);
        this.graphics.lineStyle(1.5, 0xffffff, 0.8);
        this.graphics.strokeCircle(p.x, p.y, p.radius);
      }
    }
  }

  private renderEnemies(world: SimulationWorld): void {
    const activeEnemies = world.enemyPool.getActiveItems();
    const activeEnemyIds = new Set<number>();

    for (let i = 0; i < activeEnemies.length; i++) {
      const e = activeEnemies[i];
      if (!e.isActive) continue;
      activeEnemyIds.add(e.id);

      let sprite = this.enemySprites.get(e.id);
      const enemyTextureKey = `enemy_${e.definition.id}`;

      if (!sprite) {
        const textureToUse = this.scene.textures.exists(enemyTextureKey)
          ? enemyTextureKey
          : 'enemy_hungry_ghost';

        sprite = this.scene.add.sprite(e.x, e.y, textureToUse);
        sprite.setDepth(5);

        if (e.isBoss) {
          sprite.setScale(2.5);
        } else if (e.isElite) {
          sprite.setScale(2.0);
        } else {
          sprite.setScale(1.5);
        }
        this.enemySprites.set(e.id, sprite);
      }

      sprite.setPosition(e.x, e.y);
      sprite.setVisible(true);

      // 朝向翻转
      if (e.velocity.x !== 0) {
        sprite.setFlipX(e.velocity.x < 0);
      }

      // 受击白闪效果
      if (e.hitFlashTimerSec > 0) {
        sprite.setTint(0xffffff);
      } else {
        sprite.clearTint();
      }

      // 底部椭圆阴影
      this.shadowGraphics.fillStyle(0x000000, 0.35);
      this.shadowGraphics.fillEllipse(e.x, e.y + e.radius - 2, e.radius * 1.6, 6);

      // 精英与 Boss 光环与血条
      if (e.isBoss || e.isElite) {
        this.graphics.lineStyle(2.5, e.isBoss ? 0xff006e : 0xffbe0b, 0.9);
        this.graphics.strokeCircle(e.x, e.y, e.radius + 6);

        // 精英/Boss 顶部血条
        const barWidth = e.radius * 2 + 12;
        const barHeight = 5;
        const hpPct = Math.max(0, e.currentHp / e.maxHp);
        this.graphics.fillStyle(0x1a1a1a, 0.85);
        this.graphics.fillRect(e.x - barWidth / 2, e.y - e.radius - 12, barWidth, barHeight);
        this.graphics.fillStyle(e.isBoss ? 0xff006e : 0xffbe0b, 1);
        this.graphics.fillRect(e.x - barWidth / 2, e.y - e.radius - 12, barWidth * hpPct, barHeight);
      }
    }

    // 清理回收死亡敌人的精灵
    for (const [id, sprite] of this.enemySprites.entries()) {
      if (!activeEnemyIds.has(id)) {
        sprite.destroy();
        this.enemySprites.delete(id);
      }
    }
  }

  private renderPlayer(player: Player): void {
    const px = player.position.x;
    const py = player.position.y;

    const charTextureKey = `char_${player.characterDef.id}`;
    if (!this.playerSprite) {
      const tex = this.scene.textures.exists(charTextureKey) ? charTextureKey : 'char_wok_master';
      this.playerSprite = this.scene.add.sprite(px, py, tex);
      this.playerSprite.setDepth(6);
      this.playerSprite.setScale(2.0);

      const animKey = `${tex}_walk`;
      if (this.scene.anims.exists(animKey)) {
        this.playerSprite.play(animKey);
      }
    }

    this.playerSprite.setPosition(px, py - 4);

    // 玩家朝向翻转
    if (player.facingDirection.x !== 0) {
      this.playerSprite.setFlipX(player.facingDirection.x < 0);
    }

    // 玩家阴影
    this.shadowGraphics.fillStyle(0x000000, 0.4);
    this.shadowGraphics.fillEllipse(px, py + player.radius - 2, player.radius * 1.8, 8);

    // 拾取光环范围微光
    this.graphics.lineStyle(1.5, 0x2a9d8f, 0.25);
    this.graphics.strokeCircle(px, py, player.pickupRadius);

    // 玩家头顶血条
    const pBarW = 36;
    const pBarH = 5;
    const pHpPct = Math.max(0, player.currentHp / player.maxHp);
    this.graphics.fillStyle(0x1a1a1a, 0.85);
    this.graphics.fillRect(px - pBarW / 2, py - player.radius - 16, pBarW, pBarH);
    this.graphics.fillStyle(0x2a9d8f, 1);
    this.graphics.fillRect(px - pBarW / 2, py - player.radius - 16, pBarW * pHpPct, pBarH);
  }

  public destroy(): void {
    this.graphics.destroy();
    this.shadowGraphics.destroy();
    if (this.playerSprite) {
      this.playerSprite.destroy();
      this.playerSprite = null;
    }
    for (const sprite of this.enemySprites.values()) {
      sprite.destroy();
    }
    this.enemySprites.clear();
    for (const sprite of this.dropSprites.values()) {
      sprite.destroy();
    }
    this.dropSprites.clear();
    if (this.tilemapBackground) {
      this.tilemapBackground.destroy();
      this.tilemapBackground = null;
    }
  }
}
