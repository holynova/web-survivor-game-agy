import Phaser from 'phaser';
import { ENEMIES } from '@/content/enemies/data';
import { EventBus } from '@/core/event-bus';
import { SimulationWorld } from '../simulation/world';
import { AudioManager } from '../presentation/audio';

export class DebugModal {
  private scene: Phaser.Scene;
  private container: Phaser.GameObjects.Container;
  private world!: SimulationWorld;
  private onCloseCallback?: () => void;

  constructor(scene: Phaser.Scene, onClose?: () => void) {
    this.scene = scene;
    this.onCloseCallback = onClose;
    this.container = scene.add.container(0, 0);
    this.container.setScrollFactor(0);
    this.container.setDepth(400);
    this.container.setVisible(false);
  }

  public show(world: SimulationWorld): void {
    this.world = world;
    this.render();
    this.container.setVisible(true);
  }

  public hide(): void {
    this.container.setVisible(false);
    if (this.onCloseCallback) {
      this.onCloseCallback();
    }
  }

  public isVisible(): boolean {
    return this.container.visible;
  }

  private render(): void {
    this.container.removeAll(true);
    const width = this.scene.scale.width;
    const height = this.scene.scale.height;

    // 半透明背景
    const bg = this.scene.add.graphics();
    bg.fillStyle(0x060b0c, 0.88);
    bg.fillRect(0, 0, width, height);
    bg.setScrollFactor(0);
    this.container.add(bg);

    // 阻挡穿透
    const blocker = this.scene.add.zone(width / 2, height / 2, width, height);
    blocker.setScrollFactor(0);
    blocker.setInteractive();
    this.container.add(blocker);

    // 测试主面板 (760 x 480)
    const cardW = 760;
    const cardH = 480;
    const cardGfx = this.scene.add.graphics();
    cardGfx.fillStyle(0x101a1d, 0.98);
    cardGfx.fillRoundedRect(width / 2 - cardW / 2, height / 2 - cardH / 2, cardW, cardH, 12);
    cardGfx.lineStyle(2, 0x00f5d4, 1);
    cardGfx.strokeRoundedRect(width / 2 - cardW / 2, height / 2 - cardH / 2, cardW, cardH, 12);
    cardGfx.setScrollFactor(0);
    this.container.add(cardGfx);

    // 标题
    const title = this.scene.add.text(width / 2, height / 2 - cardH / 2 + 25, '🧪 神厨开发者与测试指令面板 (Debug Menu)', {
      fontSize: '20px',
      color: '#00f5d4',
      fontStyle: 'bold',
    });
    title.setOrigin(0.5, 0);
    title.setScrollFactor(0);
    this.container.add(title);

    // 指令按钮网格布局
    const btnConfigs = [
      {
        text: '👑 召唤 饕餮夜王 (最终Boss)',
        color: 0x9b2226,
        action: () => {
          this.spawnBoss('night_glutton_king');
          this.popNotice('👑 饕餮夜王已降临！');
        },
      },
      {
        text: '👑 召唤 蒸笼包大妖 (精英Boss)',
        color: 0xe76f51,
        action: () => {
          this.spawnBoss('giant_bao_demon');
          this.popNotice('👑 蒸笼包大妖已降临！');
        },
      },
      {
        text: '👑 召唤 离火石锅卫 (精英Boss)',
        color: 0xf4a261,
        action: () => {
          this.spawnBoss('flame_pot_guard');
          this.popNotice('👑 离火石锅卫已降临！');
        },
      },
      {
        text: '⬆️ 角色立即升级 (+1级三选一)',
        color: 0x2a9d8f,
        action: () => {
          this.world.player.currentExp = this.world.player.expToNextLevel;
          const leveled = this.world.player.addExp(0);
          if (leveled) {
            EventBus.getInstance().emit('player:levelup', { newLevel: this.world.player.level });
          }
          this.hide();
        },
      },
      {
        text: '🥟 增加 +100 食材 (金币)',
        color: 0xffd166,
        textColor: '#060b0c',
        action: () => {
          this.world.player.ingredients += 100;
          this.world.statistics.ingredientsEarned += 100;
          this.popNotice('🥟 获得 100 食材！');
        },
      },
      {
        text: '💚 神厨生命值完全回满',
        color: 0x06d6a0,
        textColor: '#060b0c',
        action: () => {
          this.world.player.heal(this.world.player.maxHp);
          this.popNotice('💚 生命值已回满！');
        },
      },
      {
        text: '⚡ 天罚神雷 (秒杀场上全部小怪)',
        color: 0x7209b7,
        action: () => {
          const enemies = this.world.enemyPool.getActiveItems();
          let count = 0;
          for (const e of enemies) {
            if (e.isActive) {
              e.takeDamage(99999);
              count++;
            }
          }
          this.popNotice(`⚡ 已秒杀 ${count} 只怪物！`);
        },
      },
      {
        text: '⏩ 立即跳过当前波 (进入整备)',
        color: 0x3a86ff,
        action: () => {
          this.world.waveSystem.waveTimerSec = this.world.waveSystem.currentWave.durationSeconds + 1;
          this.hide();
          this.world.resumeGame();
        },
      },
      {
        text: '🛡️ 切换无敌模式 (God Mode)',
        color: 0x48cae4,
        textColor: '#060b0c',
        action: () => {
          this.world.player.isInvincible = !this.world.player.isInvincible;
          this.popNotice(this.world.player.isInvincible ? '🛡️ 无敌模式: 已开启' : '🛡️ 无敌模式: 已关闭');
        },
      },
    ];

    const gridCols = 3;
    const btnW = 220;
    const btnH = 46;
    const gapX = 16;
    const gapY = 14;
    const gridStartX = width / 2 - (gridCols * btnW + (gridCols - 1) * gapX) / 2 + btnW / 2;
    const gridStartY = height / 2 - cardH / 2 + 100;

    for (let i = 0; i < btnConfigs.length; i++) {
      const cfg = btnConfigs[i];
      const col = i % gridCols;
      const row = Math.floor(i / gridCols);
      const bx = gridStartX + col * (btnW + gapX);
      const by = gridStartY + row * (btnH + gapY);

      const btnGfx = this.scene.add.graphics();
      btnGfx.fillStyle(cfg.color, 1);
      btnGfx.fillRoundedRect(bx - btnW / 2, by - btnH / 2, btnW, btnH, 8);
      btnGfx.setScrollFactor(0);
      this.container.add(btnGfx);

      const text = this.scene.add.text(bx, by, cfg.text, {
        fontSize: '12px',
        color: cfg.textColor || '#ffffff',
        fontStyle: 'bold',
        wordWrap: { width: btnW - 16, useAdvancedWrap: true },
        align: 'center',
      });
      text.setOrigin(0.5, 0.5);
      text.setScrollFactor(0);
      this.container.add(text);

      const zone = this.scene.add.zone(bx, by, btnW, btnH);
      zone.setScrollFactor(0);
      zone.setInteractive({ useHandCursor: true });
      zone.on('pointerdown', () => {
        AudioManager.getInstance().playSfx('sfx_click', 0.5);
        cfg.action();
      });
      this.container.add(zone);
    }

    // 底部继续与关闭
    const closeW = 200;
    const closeH = 38;
    const closeY = height / 2 + cardH / 2 - 40;

    const closeGfx = this.scene.add.graphics();
    closeGfx.fillStyle(0x3d5a5b, 1);
    closeGfx.fillRoundedRect(width / 2 - closeW / 2, closeY - closeH / 2, closeW, closeH, 8);
    closeGfx.setScrollFactor(0);
    this.container.add(closeGfx);

    const closeText = this.scene.add.text(width / 2, closeY, '关闭测试面板', {
      fontSize: '15px',
      color: '#ffffff',
      fontStyle: 'bold',
    });
    closeText.setOrigin(0.5, 0.5);
    closeText.setScrollFactor(0);
    this.container.add(closeText);

    const closeZone = this.scene.add.zone(width / 2, closeY, closeW, closeH);
    closeZone.setScrollFactor(0);
    closeZone.setInteractive({ useHandCursor: true });
    closeZone.on('pointerdown', () => {
      this.hide();
      this.world.resumeGame();
    });
    this.container.add(closeZone);
  }

  private spawnBoss(bossId: string): void {
    const bossDef = ENEMIES[bossId];
    if (!bossDef || !this.world || !this.world.player) return;

    const angle = Math.random() * Math.PI * 2;
    const dist = 360;
    const spawnX = this.world.player.position.x + Math.cos(angle) * dist;
    const spawnY = this.world.player.position.y + Math.sin(angle) * dist;

    const enemy = this.world.enemyPool.acquire();
    enemy.spawn(bossDef, spawnX, spawnY);
    this.world.spatialHash.insert(enemy);
  }

  private popNotice(msg: string): void {
    const notice = this.scene.add.text(this.scene.scale.width / 2, this.scene.scale.height / 2 + 190, msg, {
      fontSize: '14px',
      color: '#ffd166',
      backgroundColor: '#060b0c',
      padding: { x: 12, y: 6 },
    });
    notice.setOrigin(0.5, 0.5);
    notice.setScrollFactor(0);
    notice.setDepth(450);

    this.scene.tweens.add({
      targets: notice,
      y: notice.y - 25,
      alpha: 0,
      duration: 1200,
      onComplete: () => notice.destroy(),
    });
  }
}
