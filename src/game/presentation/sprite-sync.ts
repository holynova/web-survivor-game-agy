import Phaser from 'phaser';
import { EventBus } from '@/core/event-bus';
import { SimulationWorld } from '../simulation/world';

export class SpriteSyncSystem {
  private scene: Phaser.Scene;
  private graphics: Phaser.GameObjects.Graphics;
  private textGroup: Phaser.GameObjects.Group;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    this.graphics = scene.add.graphics();
    this.textGroup = scene.add.group();
    this.bindEvents();
  }

  private bindEvents(): void {
    EventBus.getInstance().on('entity:damaged', data => {
      if (data.isCrit) {
        this.scene.cameras.main.shake(100, 0.005);
      }
    });

    EventBus.getInstance().on('player:died', () => {
      this.scene.cameras.main.shake(300, 0.015);
    });
  }

  public renderWorld(world: SimulationWorld): void {
    this.graphics.clear();

    const player = world.player;
    if (!player) return;

    // 1. 绘制夜市地砖网格与边界
    this.renderEnvironment();

    // 2. 绘制掉落物 (热度/经验 & 食材)
    const activeDrops = world.dropPool.getActiveItems();
    for (let i = 0; i < activeDrops.length; i++) {
      const drop = activeDrops[i];
      const colorNum = parseInt(drop.color.replace('#', '0x'), 16);
      this.graphics.fillStyle(colorNum, 0.9);
      this.graphics.fillCircle(drop.x, drop.y, drop.radius);

      // 发光外圈
      this.graphics.lineStyle(1.5, colorNum, 0.5);
      this.graphics.strokeCircle(drop.x, drop.y, drop.radius + 2);
    }

    // 3. 绘制投射物与攻击特效
    const activeProjectiles = world.projectilePool.getActiveItems();
    for (let i = 0; i < activeProjectiles.length; i++) {
      const p = activeProjectiles[i];
      const colorNum = parseInt(p.color.replace('#', '0x'), 16);

      if (p.attackPattern === 'arc') {
        // 近战弧形横扫
        this.graphics.fillStyle(colorNum, 0.35);
        this.graphics.lineStyle(2, colorNum, 0.85);
        this.graphics.beginPath();
        this.graphics.arc(
          player.position.x,
          player.position.y,
          p.rangeRemaining || 120,
          p.orbitAngle - 0.7,
          p.orbitAngle + 0.7,
        );
        this.graphics.strokePath();
      } else if (p.attackPattern === 'area') {
        // 地面燃烧区域
        this.graphics.fillStyle(colorNum, 0.3);
        this.graphics.fillCircle(p.x, p.y, p.radius);
        this.graphics.lineStyle(1.5, 0xffbe0b, 0.6);
        this.graphics.strokeCircle(p.x, p.y, p.radius);
      } else if (p.attackPattern === 'orbit') {
        // 环绕调料瓶
        this.graphics.fillStyle(colorNum, 1);
        this.graphics.fillCircle(p.x, p.y, p.radius);
        this.graphics.lineStyle(2, 0xffffff, 0.8);
        this.graphics.strokeCircle(p.x, p.y, p.radius);
      } else if (p.attackPattern === 'summon') {
        // 召唤小幽灵
        this.graphics.fillStyle(0x7209b7, 0.8);
        this.graphics.fillCircle(p.x, p.y, p.radius);
        this.graphics.fillStyle(0x00f5d4, 1);
        this.graphics.fillCircle(p.x - 3, p.y - 2, 2);
        this.graphics.fillCircle(p.x + 3, p.y - 2, 2);
      } else {
        // 飞行弹道
        this.graphics.fillStyle(colorNum, 1);
        this.graphics.fillCircle(p.x, p.y, p.radius);
        this.graphics.lineStyle(1.5, 0xffffff, 0.7);
        this.graphics.strokeCircle(p.x, p.y, p.radius);
      }
    }

    // 4. 绘制敌人
    const activeEnemies = world.enemyPool.getActiveItems();
    for (let i = 0; i < activeEnemies.length; i++) {
      const e = activeEnemies[i];
      if (!e.isActive) continue;

      // 受击白闪
      if (e.hitFlashTimerSec > 0) {
        this.graphics.fillStyle(0xffffff, 1);
      } else {
        const colorNum = parseInt(e.color.replace('#', '0x'), 16);
        this.graphics.fillStyle(colorNum, 1);
      }

      this.graphics.fillCircle(e.x, e.y, e.radius);
      this.graphics.lineStyle(1.5, 0x060b0c, 0.9);
      this.graphics.strokeCircle(e.x, e.y, e.radius);

      // 精英与 Boss 渲染光环与血条
      if (e.isBoss || e.isElite) {
        this.graphics.lineStyle(2, e.isBoss ? 0xff006e : 0xffbe0b, 0.8);
        this.graphics.strokeCircle(e.x, e.y, e.radius + 4);

        // 精英/Boss 顶部小血条
        const barWidth = e.radius * 2 + 8;
        const barHeight = 4;
        const hpPct = Math.max(0, e.currentHp / e.maxHp);
        this.graphics.fillStyle(0x333333, 0.8);
        this.graphics.fillRect(e.x - barWidth / 2, e.y - e.radius - 8, barWidth, barHeight);
        this.graphics.fillStyle(e.isBoss ? 0xff006e : 0xffbe0b, 1);
        this.graphics.fillRect(e.x - barWidth / 2, e.y - e.radius - 8, barWidth * hpPct, barHeight);
      }
    }

    // 5. 绘制玩家
    const px = player.position.x;
    const py = player.position.y;

    // 拾取光环范围微光
    this.graphics.lineStyle(1, 0x2a9d8f, 0.2);
    this.graphics.strokeCircle(px, py, player.pickupRadius);

    // 玩家本体（夜市大厨）
    this.graphics.fillStyle(0xf4a261, 1);
    this.graphics.fillCircle(px, py, player.radius);
    this.graphics.lineStyle(2, 0x060b0c, 1);
    this.graphics.strokeCircle(px, py, player.radius);

    // 厨师帽与朝向
    const headX = px + player.facingDirection.x * 6;
    const headY = py + player.facingDirection.y * 6;
    this.graphics.fillStyle(0xffffff, 1);
    this.graphics.fillCircle(headX, headY - 4, 5);

    // 玩家血条（头顶）
    const pBarW = 32;
    const pBarH = 4;
    const pHpPct = Math.max(0, player.currentHp / player.maxHp);
    this.graphics.fillStyle(0x222222, 0.8);
    this.graphics.fillRect(px - pBarW / 2, py - player.radius - 12, pBarW, pBarH);
    this.graphics.fillStyle(0x2a9d8f, 1);
    this.graphics.fillRect(px - pBarW / 2, py - player.radius - 12, pBarW * pHpPct, pBarH);
  }

  private renderEnvironment(): void {
    // 地图边界框 (-1400 到 1400)
    this.graphics.lineStyle(4, 0xe76f51, 0.4);
    this.graphics.strokeRect(-1400, -1400, 2800, 2800);

    // 网格纹理
    this.graphics.lineStyle(1, 0x1d3557, 0.15);
    for (let x = -1400; x <= 1400; x += 160) {
      this.graphics.lineBetween(x, -1400, x, 1400);
    }
    for (let y = -1400; y <= 1400; y += 160) {
      this.graphics.lineBetween(-1400, y, 1400, y);
    }
  }

  public destroy(): void {
    this.graphics.destroy();
    this.textGroup.destroy(true);
  }
}
