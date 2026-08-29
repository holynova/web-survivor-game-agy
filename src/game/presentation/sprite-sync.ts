import Phaser from 'phaser';
import { EventBus } from '@/core/event-bus';
import { Player } from '@/game/entities/Player';
import { SimulationWorld } from '../simulation/world';

interface HitParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: number;
  size: number;
  alpha: number;
  lifeSec: number;
  maxLifeSec: number;
}

interface HitShockwave {
  x: number;
  y: number;
  radius: number;
  maxRadius: number;
  color: number;
  alpha: number;
  lifeSec: number;
  maxLifeSec: number;
}

export class SpriteSyncSystem {
  private scene: Phaser.Scene;
  private graphics: Phaser.GameObjects.Graphics;
  private shadowGraphics: Phaser.GameObjects.Graphics;
  private playerSprite: Phaser.GameObjects.Sprite | null = null;
  private enemySprites: Map<number, Phaser.GameObjects.Sprite> = new Map();
  private dropSprites: Map<number, Phaser.GameObjects.Image> = new Map();
  private damageTexts: Map<number, Phaser.GameObjects.Text> = new Map();
  private tilemapBackground: Phaser.GameObjects.TileSprite | null = null;

  // 粒子与打击特效列表
  private particles: HitParticle[] = [];
  private shockwaves: HitShockwave[] = [];

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
      // 1. 产生受击火花粒子
      this.spawnHitSparks(data.x, data.y, data.isCrit, data.sourceId);

      // 2. 暴击额外镜头震屏与震波
      if (data.isCrit) {
        this.scene.cameras.main.shake(120, 0.008);
        this.spawnShockwave(data.x, data.y, 42, 0xffd166);
      }
    });

    EventBus.getInstance().on('entity:died', data => {
      // 怪物击杀爆散特效
      this.spawnDeathExplosion(data.x, data.y);
      this.spawnShockwave(data.x, data.y, 35, 0xe76f51);
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

    // 1. 绘制环境边界
    this.renderEnvironment();

    // 2. 同步并渲染掉落物 (像素美食/食材)
    this.renderDrops(world);

    // 3. 渲染投射物与攻击特效
    this.renderProjectiles(world);

    // 4. 同步并渲染怪物像素精灵、受击白闪与血条
    this.renderEnemies(world);

    // 5. 同步玩家角色精灵与状态
    this.renderPlayer(player);

    // 6. 渲染打击粒子与冲击波
    this.updateAndRenderParticles(1 / 60);

    // 7. 同步飘字跳字系统
    this.renderDamageTexts(world);
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

      const baseScale = e.isBoss ? 2.5 : e.isElite ? 2.0 : 1.5;

      if (!sprite) {
        const textureToUse = this.scene.textures.exists(enemyTextureKey)
          ? enemyTextureKey
          : 'enemy_hungry_ghost';

        sprite = this.scene.add.sprite(e.x, e.y, textureToUse);
        sprite.setDepth(5);
        sprite.setScale(baseScale);
        this.enemySprites.set(e.id, sprite);
      }

      // 受击位置微颤动与挤压变形
      let drawX = e.x;
      let drawY = e.y;
      let scaleX = baseScale;
      let scaleY = baseScale;

      // 1. 核心受击反馈：白闪、形变、微抖
      if (e.hitFlashTimerSec > 0) {
        // 纯白高亮受击剪影 (兼顾 Phaser 3/4 API)
        sprite.setTint(0xffffff);
        if (typeof (sprite as any).setTintFill === 'function') {
          (sprite as any).setTintFill(0xffffff);
        }

        // 受击横向挤压与纵向扁平打击感
        scaleX = baseScale * 1.22;
        scaleY = baseScale * 0.82;

        // 微颤抖动
        drawX += (Math.random() * 4 - 2);
        drawY += (Math.random() * 4 - 2);
      } else if (e.burnStatus) {
        // 灼烧状态：红橙烈焰脉冲滤镜
        const pulse = Math.sin(this.scene.time.now * 0.015) > 0;
        sprite.setTint(pulse ? 0xff4500 : 0xffa500);
      } else if (e.slowStatus) {
        // 减速状态：冰霜蔚蓝滤镜
        sprite.setTint(0x48cae4);
      } else {
        sprite.clearTint();
      }

      sprite.setPosition(drawX, drawY);
      sprite.setScale(scaleX, scaleY);
      sprite.setVisible(true);

      // 朝向翻转
      if (e.velocity.x !== 0) {
        sprite.setFlipX(e.velocity.x < 0);
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

  private renderDamageTexts(world: SimulationWorld): void {
    const activeTexts = world.damageTextPool.getActiveItems();
    const activeTextIds = new Set<number>();

    for (let i = 0; i < activeTexts.length; i++) {
      const dt = activeTexts[i];
      activeTextIds.add(dt.id);

      let textObj = this.damageTexts.get(dt.id);
      if (!textObj) {
        textObj = this.scene.add.text(dt.x, dt.y, dt.text, {
          fontSize: dt.isCrit ? '16px' : '12px',
          fontStyle: 'bold',
          color: dt.isCrit ? '#ffd166' : dt.color || '#ffffff',
          stroke: '#060b0c',
          strokeThickness: dt.isCrit ? 4 : 3,
        });
        textObj.setOrigin(0.5, 0.5);
        textObj.setDepth(100);
        this.damageTexts.set(dt.id, textObj);
      }

      // 上升与缩放弹跳
      textObj.setPosition(dt.x, dt.y);

      // 计算生命期渐变与暴击弹跳比例
      const lifePct = Math.max(0, dt.lifeMs / dt.maxLifeMs);
      textObj.setAlpha(lifePct);

      if (dt.isCrit) {
        const scale = 1.0 + (1.0 - lifePct) * 0.3;
        textObj.setScale(scale);
      } else {
        textObj.setScale(1.0);
      }
      textObj.setVisible(true);
    }

    // 清理非激活飘字
    for (const [id, textObj] of this.damageTexts.entries()) {
      if (!activeTextIds.has(id)) {
        textObj.destroy();
        this.damageTexts.delete(id);
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

  private spawnHitSparks(x: number, y: number, isCrit: boolean, sourceId?: string): void {
    const count = isCrit ? 10 : 5;
    let sparkColor = 0xffe66d;
    if (sourceId === 'stove_flame') sparkColor = 0xff5722;
    else if (sourceId === 'cleaver') sparkColor = 0xf4a261;
    else if (sourceId === 'bamboo_skewer') sparkColor = 0x00f5d4;

    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = Math.random() * (isCrit ? 220 : 140) + 40;
      this.particles.push({
        x: x + (Math.random() * 8 - 4),
        y: y + (Math.random() * 8 - 4),
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        color: sparkColor,
        size: Math.random() * (isCrit ? 3.5 : 2.5) + 1.5,
        alpha: 1.0,
        lifeSec: 0,
        maxLifeSec: Math.random() * 0.18 + 0.12,
      });
    }
  }

  private spawnDeathExplosion(x: number, y: number): void {
    const count = 12;
    const colors = [0xe76f51, 0xffd166, 0xf4a261, 0xffffff];

    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI * 2 + (Math.random() * 0.3 - 0.15);
      const speed = Math.random() * 180 + 80;
      this.particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        color: colors[i % colors.length],
        size: Math.random() * 4 + 2,
        alpha: 1.0,
        lifeSec: 0,
        maxLifeSec: Math.random() * 0.25 + 0.18,
      });
    }
  }

  private spawnShockwave(x: number, y: number, maxRadius: number, color: number): void {
    this.shockwaves.push({
      x,
      y,
      radius: 6,
      maxRadius,
      color,
      alpha: 0.9,
      lifeSec: 0,
      maxLifeSec: 0.22,
    });
  }

  private updateAndRenderParticles(dt: number): void {
    // 1. 渲染并更新冲击波
    for (let i = this.shockwaves.length - 1; i >= 0; i--) {
      const sw = this.shockwaves[i];
      sw.lifeSec += dt;
      if (sw.lifeSec >= sw.maxLifeSec) {
        this.shockwaves.splice(i, 1);
        continue;
      }
      const progress = sw.lifeSec / sw.maxLifeSec;
      const currentRadius = sw.radius + (sw.maxRadius - sw.radius) * progress;
      const currentAlpha = sw.alpha * (1 - progress);

      this.graphics.lineStyle(2.5 * (1 - progress * 0.5), sw.color, currentAlpha);
      this.graphics.strokeCircle(sw.x, sw.y, currentRadius);
    }

    // 2. 渲染并更新火花粒子
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.lifeSec += dt;
      if (p.lifeSec >= p.maxLifeSec) {
        this.particles.splice(i, 1);
        continue;
      }

      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vx *= 0.88; // 阻尼减速
      p.vy *= 0.88;

      const progress = p.lifeSec / p.maxLifeSec;
      const currentAlpha = p.alpha * (1 - progress);
      const currentSize = Math.max(1, p.size * (1 - progress * 0.5));

      this.graphics.fillStyle(p.color, currentAlpha);
      this.graphics.fillCircle(p.x, p.y, currentSize);
    }
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
    for (const text of this.damageTexts.values()) {
      text.destroy();
    }
    this.damageTexts.clear();
    if (this.tilemapBackground) {
      this.tilemapBackground.destroy();
      this.tilemapBackground = null;
    }
  }
}
