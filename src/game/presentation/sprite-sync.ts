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
  private projectileSprites: Map<number, Phaser.GameObjects.Image | Phaser.GameObjects.Sprite> = new Map();
  private damageTexts: Map<number, Phaser.GameObjects.Text> = new Map();
  private tilemapBackground: Phaser.GameObjects.TileSprite | null = null;
  private orbitingWeaponSprites: Phaser.GameObjects.Image[] = [];
  private destructibleSprites: Map<number, Phaser.GameObjects.Image> = new Map();

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

    // 1. 绘制封闭夜市竞技场边界
    this.renderEnvironment();

    // 2. 同步并渲染场地破坏物 (蒸笼与招财宝箱)
    this.renderDestructibles(world);

    // 3. 同步并渲染掉落物 (纯净像素食材)
    this.renderDrops(world);

    // 4. 渲染投射物与攻击特效
    this.renderProjectiles(world);

    // 5. 同步并渲染怪物像素精灵、受击白闪与血条
    this.renderEnemies(world);

    // 6. 同步玩家角色精灵与 6 把神兵悬浮环绕
    this.renderPlayer(player);

    // 7. 渲染打击粒子与冲击波
    this.updateAndRenderParticles(1 / 60);

    // 8. 同步飘字跳字系统
    this.renderDamageTexts(world);
  }

  private renderEnvironment(): void {
    // 封闭夜市擂台边界 (-800 到 800, -600 到 600)
    this.graphics.lineStyle(8, 0xe76f51, 0.85);
    this.graphics.strokeRect(-800, -600, 1600, 1200);
    this.graphics.lineStyle(2, 0xffd166, 0.7);
    this.graphics.strokeRect(-806, -606, 1612, 1212);

    // 四角红灯笼柱点缀
    const corners = [
      { x: -800, y: -600 },
      { x: 800, y: -600 },
      { x: -800, y: 600 },
      { x: 800, y: 600 },
    ];
    for (const c of corners) {
      this.graphics.fillStyle(0xffbe0b, 1);
      this.graphics.fillCircle(c.x, c.y, 8);
      this.graphics.fillStyle(0xe76f51, 0.8);
      this.graphics.fillCircle(c.x, c.y, 14);
    }
  }

  private renderDestructibles(world: SimulationWorld): void {
    if (!world.destructibles) return;
    const activeIds = new Set<number>();

    for (const crate of world.destructibles) {
      if (!crate.isAlive) continue;
      activeIds.add(crate.id);

      let sprite = this.destructibleSprites.get(crate.id);
      if (!sprite) {
        const tex = crate.type === 'fortune_chest' ? 'item_sugar' : 'item_food';
        sprite = this.scene.add.image(crate.position.x, crate.position.y, tex);
        sprite.setDepth(5);
        sprite.setScale(1.6);
        this.destructibleSprites.set(crate.id, sprite);
      }

      sprite.setPosition(crate.position.x, crate.position.y);
      if (crate.hitFlashTimer > 0) {
        crate.hitFlashTimer -= 1 / 60;
        sprite.setTint(0xffffff);
      } else {
        sprite.clearTint();
      }

      // 阴影
      this.shadowGraphics.fillStyle(0x000000, 0.35);
      this.shadowGraphics.fillEllipse(crate.position.x, crate.position.y + 12, crate.radius * 1.8, 8);
    }

    for (const [id, sprite] of this.destructibleSprites.entries()) {
      if (!activeIds.has(id)) {
        sprite.destroy();
        this.destructibleSprites.delete(id);
      }
    }
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
        img.setScale(1.3);
        this.dropSprites.set(drop.id, img);
      }

      // 轻微上下浮动呼吸效果
      const bob = Math.sin(this.scene.time.now * 0.008 + i) * 3;
      img.setPosition(drop.x, drop.y + bob);
      img.setVisible(true);

      // 干净自然的地面柔和投影 (去掉了原本的辅助外圈)
      this.shadowGraphics.fillStyle(0x000000, 0.35);
      this.shadowGraphics.fillEllipse(drop.x, drop.y + drop.radius + 2, drop.radius * 1.5, 4);
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
    const activeProjIds = new Set<number>();

    for (let i = 0; i < activeProjectiles.length; i++) {
      const p = activeProjectiles[i];
      activeProjIds.add(p.id);

      // 1. 敌方妖火/毒丸弹道 (幽紫邪光菱形魔弹 + 妖气拖尾)
      if (p.isEnemy || p.weaponId === 'enemy_bullet') {
        const angle = Math.atan2(p.velocity.y, p.velocity.x);
        this.graphics.fillStyle(0x7209b7, 0.9);
        this.graphics.lineStyle(1.5, 0xc77dff, 0.9);

        // 绘制锐利妖魔菱形弹头
        const tipX = p.x + Math.cos(angle) * (p.radius + 3);
        const tipY = p.y + Math.sin(angle) * (p.radius + 3);
        const leftX = p.x + Math.cos(angle + 2.2) * p.radius;
        const leftY = p.y + Math.sin(angle + 2.2) * p.radius;
        const rightX = p.x + Math.cos(angle - 2.2) * p.radius;
        const rightY = p.y + Math.sin(angle - 2.2) * p.radius;
        const tailX = p.x - Math.cos(angle) * (p.radius * 0.8);
        const tailY = p.y - Math.sin(angle) * (p.radius * 0.8);

        this.graphics.fillTriangle(tipX, tipY, leftX, leftY, rightX, rightY);
        this.graphics.fillTriangle(tailX, tailY, leftX, leftY, rightX, rightY);
        this.graphics.strokeTriangle(tipX, tipY, leftX, leftY, rightX, rightY);

        // 妖气光辉核心
        this.graphics.fillStyle(0xffffff, 0.95);
        this.graphics.fillRect(p.x - 2, p.y - 2, 4, 4);
        continue;
      }

      // 2. 近战厚重铁锅 (金色弧形斩刃与刀气)
      if (p.attackPattern === 'arc') {
        this.graphics.lineStyle(4, 0xffd166, 0.95);
        this.graphics.beginPath();
        this.graphics.arc(
          player.position.x,
          player.position.y,
          p.rangeRemaining || 120,
          p.orbitAngle - 0.8,
          p.orbitAngle + 0.8,
        );
        this.graphics.strokePath();

        this.graphics.lineStyle(1.5, 0xffffff, 0.7);
        this.graphics.beginPath();
        this.graphics.arc(
          player.position.x,
          player.position.y,
          (p.rangeRemaining || 120) - 8,
          p.orbitAngle - 0.65,
          p.orbitAngle + 0.65,
        );
        this.graphics.strokePath();
        continue;
      }

      // 3. 八卦游龙铲 (旋转金龙飞铲 + 金色回旋尾流)
      if (p.weaponId === 'dragon_spatula' || p.attackPattern === 'boomerang') {
        let sprite = this.projectileSprites.get(p.id);
        if (!sprite) {
          sprite = this.scene.add.image(p.x, p.y, 'weapon_dragon_spatula');
          sprite.setDepth(8);
          sprite.setScale(p.isReturning ? 1.5 : 1.3);
          this.projectileSprites.set(p.id, sprite);
        }
        sprite.setPosition(p.x, p.y);
        sprite.rotation += p.isReturning ? 0.5 : 0.35;
        sprite.setVisible(true);

        // 回旋金色刀光流线
        this.graphics.lineStyle(p.isReturning ? 3 : 2, p.isReturning ? 0xff006e : 0xffd166, 0.8);
        this.graphics.lineBetween(
          p.x - p.velocity.x * 0.04,
          p.y - p.velocity.y * 0.04,
          p.x,
          p.y,
        );
        continue;
      }

      // 4. 金玉爆米花机 (高抛玉米粒 & 爆散弹跳金米花群)
      if (p.weaponId === 'popcorn_popper' || p.attackPattern === 'mortar') {
        if (!p.isCluster) {
          // 主抛物弹：金黄玉米粒
          this.graphics.fillStyle(0xffe66d, 1);
          this.graphics.fillRect(p.x - 4, p.y - 4, 8, 8);
          this.graphics.fillStyle(0xffffff, 0.9);
          this.graphics.fillRect(p.x - 2, p.y - 2, 4, 4);

          // 弹道投影
          const groundY = p.startY + (p.targetY - p.startY) * p.arcProgress;
          this.shadowGraphics.fillStyle(0x000000, 0.3);
          this.shadowGraphics.fillEllipse(p.x, groundY, 8, 3);
        } else {
          // 爆裂出的弹跳爆米花碎片
          this.graphics.fillStyle(0xffe66d, 0.95);
          this.graphics.fillRect(p.x - 3, p.y - 3, 6, 6);
          this.graphics.fillStyle(0xffffff, 1);
          this.graphics.fillRect(p.x - 1, p.y - 1, 2, 2);
        }
        continue;
      }

      // 5. 冰魄玉泉壶 (极寒冰霜茶雾射线洪流)
      if (p.weaponId === 'jade_teapot' || p.attackPattern === 'beam') {
        const flightAngle = Math.atan2(p.velocity.y, p.velocity.x);
        this.graphics.lineStyle(3, 0x48cae4, 0.85);
        this.graphics.lineBetween(
          p.x - Math.cos(flightAngle) * 20,
          p.y - Math.sin(flightAngle) * 20,
          p.x,
          p.y,
        );
        this.graphics.fillStyle(0x90e0ef, 0.9);
        this.graphics.fillRect(p.x - 3, p.y - 3, 6, 6);
        this.graphics.fillStyle(0xffffff, 1);
        this.graphics.fillRect(p.x - 1, p.y - 1, 2, 2);
        continue;
      }

      // 6. 乾坤聚味瓮 (微缩聚味引力黑洞旋涡)
      if (p.weaponId === 'flavor_vortex' || p.attackPattern === 'vortex') {
        const time = this.scene.time.now * 0.005;
        this.graphics.lineStyle(2, 0x9d4edd, 0.8);

        // 旋转螺旋星云臂
        for (let arm = 0; arm < 3; arm++) {
          const armOffset = (arm * Math.PI * 2) / 3;
          const a1 = time + armOffset;
          const a2 = time + armOffset + 1.2;
          this.graphics.lineBetween(
            p.x + Math.cos(a1) * (p.radius * 0.3),
            p.y + Math.sin(a1) * (p.radius * 0.3),
            p.x + Math.cos(a2) * p.radius,
            p.y + Math.sin(a2) * p.radius,
          );
        }

        // 黑洞中心核心
        this.graphics.fillStyle(0x060b0c, 1);
        this.graphics.fillRect(p.x - 6, p.y - 6, 12, 12);
        this.graphics.fillStyle(0x00f5d4, 1);
        this.graphics.fillRect(p.x - 2, p.y - 2, 4, 4);
        continue;
      }

      // 7. 猛火炉灶 (地火烈焰火域，层次分明的燃烧火舌)
      if (p.attackPattern === 'area') {
        const time = this.scene.time.now * 0.006;
        for (let k = 0; k < 4; k++) {
          const flameAngle = (k * Math.PI) / 2 + Math.sin(time + k) * 0.4;
          const flameDist = (p.radius * 0.6) + Math.cos(time + k * 2) * 6;
          const fx = p.x + Math.cos(flameAngle) * flameDist;
          const fy = p.y + Math.sin(flameAngle) * flameDist;

          this.graphics.fillStyle(0xd90429, 0.8);
          this.graphics.fillRect(fx - 5, fy - 5, 10, 10);
          this.graphics.fillStyle(0xf77f00, 0.9);
          this.graphics.fillRect(fx - 3, fy - 3, 6, 6);
          this.graphics.fillStyle(0xffd166, 1);
          this.graphics.fillRect(fx - 1, fy - 1, 2, 2);
        }
        continue;
      }

      // 8. 精钢菜刀 (高速旋转像素菜刀精灵)
      if (p.weaponId === 'cleaver') {
        let sprite = this.projectileSprites.get(p.id);
        if (!sprite) {
          sprite = this.scene.add.image(p.x, p.y, 'weapon_cleaver');
          sprite.setDepth(8);
          sprite.setScale(1.4);
          this.projectileSprites.set(p.id, sprite);
        }
        sprite.setPosition(p.x, p.y);
        sprite.rotation += 0.35;
        sprite.setVisible(true);

        // 旋转刀风金光流线
        this.graphics.lineStyle(1.5, 0xf4a261, 0.6);
        this.graphics.lineBetween(
          p.x - p.velocity.x * 0.03,
          p.y - p.velocity.y * 0.03,
          p.x,
          p.y,
        );
        continue;
      }

      // 9. 穿心竹签 (朝向飞行角度的像素飞签精灵)
      if (p.weaponId === 'bamboo_skewer' || p.attackPattern === 'pierceLine') {
        let sprite = this.projectileSprites.get(p.id);
        if (!sprite) {
          sprite = this.scene.add.image(p.x, p.y, 'item_skewer');
          sprite.setDepth(8);
          sprite.setScale(1.3);
          this.projectileSprites.set(p.id, sprite);
        }
        sprite.setPosition(p.x, p.y);
        const flightAngle = Math.atan2(p.velocity.y, p.velocity.x);
        sprite.rotation = flightAngle + Math.PI / 4;
        sprite.setVisible(true);

        // 金色疾刺流光尾焰
        this.graphics.lineStyle(2.5, 0xffd166, 0.7);
        this.graphics.lineBetween(
          p.x - p.velocity.x * 0.04,
          p.y - p.velocity.y * 0.04,
          p.x,
          p.y,
        );
        continue;
      }

      // 10. 八宝调料瓶 (环绕调料药瓶精灵)
      if (p.weaponId === 'seasoning_jar' || p.attackPattern === 'orbit') {
        let sprite = this.projectileSprites.get(p.id);
        if (!sprite) {
          sprite = this.scene.add.image(p.x, p.y, 'item_potion');
          sprite.setDepth(8);
          sprite.setScale(1.2);
          this.projectileSprites.set(p.id, sprite);
        }
        sprite.setPosition(p.x, p.y);
        sprite.rotation = p.orbitAngle;
        sprite.setVisible(true);

        // 环绕香料星尘
        this.graphics.fillStyle(0x2a9d8f, 0.8);
        this.graphics.fillRect(p.x - 2, p.y - 2, 4, 4);
        continue;
      }

      // 11. 唤灵上菜铃 (帮厨小幽灵)
      if (p.weaponId === 'service_bell' || p.attackPattern === 'summon') {
        this.graphics.fillStyle(0x7209b7, 0.85);
        this.graphics.fillRect(p.x - 8, p.y - 8, 16, 16);
        this.graphics.fillStyle(0x00f5d4, 1);
        this.graphics.fillRect(p.x - 4, p.y - 3, 3, 3);
        this.graphics.fillRect(p.x + 1, p.y - 3, 3, 3);
        continue;
      }

      // 12. 默认晶石光弹 (纯多边形发光方晶)
      this.graphics.fillStyle(0xffd166, 0.9);
      this.graphics.fillRect(p.x - 4, p.y - 4, 8, 8);
      this.graphics.fillStyle(0xffffff, 1);
      this.graphics.fillRect(p.x - 2, p.y - 2, 4, 4);
    }

    // 清理非激活投射物精灵
    for (const [id, sprite] of this.projectileSprites.entries()) {
      if (!activeProjIds.has(id)) {
        sprite.destroy();
        this.projectileSprites.delete(id);
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
        // 纯白高亮受击剪影
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

      // 冲刺怪蓄力红光提示
      if (e.chargeState === 'windup') {
        sprite.setTint(0xff0055);
        scaleX = baseScale * 0.9;
        scaleY = baseScale * 1.15;
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
          fontSize: dt.isCrit ? '16px' : '13px',
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

    // 纯净自然的玩家角色阴影 (去掉了原本脚下的拾取范围大白圈)
    this.shadowGraphics.fillStyle(0x000000, 0.4);
    this.shadowGraphics.fillEllipse(px, py + player.radius - 2, player.radius * 1.8, 8);

    // 玩家头顶血条
    const pBarW = 36;
    const pBarH = 5;
    const pHpPct = Math.max(0, player.currentHp / player.maxHp);
    this.graphics.fillStyle(0x1a1a1a, 0.85);
    this.graphics.fillRect(px - pBarW / 2, py - player.radius - 16, pBarW, pBarH);
    this.graphics.fillStyle(0x2a9d8f, 1);
    this.graphics.fillRect(px - pBarW / 2, py - player.radius - 16, pBarW * pHpPct, pBarH);

    // 渲染围绕玩家身周悬浮环绕的 1~6 把神兵武器 (Brotato 风格视觉)
    const totalWeapons = player.weapons.length;
    const baseOrbitAngle = (this.scene.time.now / 1000) * 1.6;

    while (this.orbitingWeaponSprites.length < totalWeapons) {
      const img = this.scene.add.image(0, 0, 'weapon_cleaver');
      img.setDepth(7);
      img.setScale(1.15);
      this.orbitingWeaponSprites.push(img);
    }
    while (this.orbitingWeaponSprites.length > totalWeapons) {
      const img = this.orbitingWeaponSprites.pop();
      img?.destroy();
    }

    const orbitRadius = 36;
    for (let i = 0; i < totalWeapons; i++) {
      const wState = player.weapons[i];
      const img = this.orbitingWeaponSprites[i];
      const angle = baseOrbitAngle + (i / totalWeapons) * Math.PI * 2;
      const wx = px + Math.cos(angle) * orbitRadius;
      const wy = py + Math.sin(angle) * orbitRadius;

      img.setPosition(wx, wy);

      const assetKey = wState.definition.assetKey || `weapon_${wState.definition.id}`;
      if (this.scene.textures.exists(assetKey)) {
        img.setTexture(assetKey);
      } else if (this.scene.textures.exists(`weapon_${wState.definition.id}`)) {
        img.setTexture(`weapon_${wState.definition.id}`);
      }

      // 武器朝向：外向放射角 + 微妙晃动
      img.setRotation(angle + Math.PI / 4);
      img.setVisible(true);

      // 微光环绕粒子
      const col = parseInt((wState.definition.color || '#ffd166').replace('#', '0x'), 16) || 0xffd166;
      this.graphics.fillStyle(col, 0.45);
      this.graphics.fillRect(wx - 2, wy - 2, 4, 4);
    }
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
        maxLifeSec: Math.random() * 0.25 + 0.15,
      });
    }
  }

  private spawnShockwave(x: number, y: number, maxRadius: number, color: number): void {
    this.shockwaves.push({
      x,
      y,
      radius: 4,
      maxRadius,
      color,
      alpha: 0.9,
      lifeSec: 0,
      maxLifeSec: 0.18,
    });
  }

  private updateAndRenderParticles(dt: number): void {
    // 1. 更新并绘制火花粒子
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.lifeSec += dt;
      if (p.lifeSec >= p.maxLifeSec) {
        this.particles.splice(i, 1);
        continue;
      }

      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.alpha = Math.max(0, 1 - p.lifeSec / p.maxLifeSec);

      this.graphics.fillStyle(p.color, p.alpha);
      this.graphics.fillCircle(p.x, p.y, p.size);
    }

    // 2. 更新并绘制受击震波
    for (let i = this.shockwaves.length - 1; i >= 0; i--) {
      const sw = this.shockwaves[i];
      sw.lifeSec += dt;
      if (sw.lifeSec >= sw.maxLifeSec) {
        this.shockwaves.splice(i, 1);
        continue;
      }

      const progress = sw.lifeSec / sw.maxLifeSec;
      sw.radius = 4 + (sw.maxRadius - 4) * progress;
      sw.alpha = Math.max(0, (1 - progress) * 0.85);

      this.graphics.lineStyle(2.5, sw.color, sw.alpha);
      this.graphics.strokeCircle(sw.x, sw.y, sw.radius);
    }
  }

  public destroy(): void {
    this.graphics.destroy();
    this.shadowGraphics.destroy();
    this.playerSprite?.destroy();
    for (const s of this.enemySprites.values()) s.destroy();
    for (const s of this.dropSprites.values()) s.destroy();
    for (const s of this.projectileSprites.values()) s.destroy();
    for (const t of this.damageTexts.values()) t.destroy();
    this.tilemapBackground?.destroy();
  }
}
