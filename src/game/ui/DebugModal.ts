import Phaser from 'phaser';
import { ENEMIES } from '@/content/enemies/data';
import { EventBus } from '@/core/event-bus';
import { AudioManager } from '../presentation/audio';
import { SimulationWorld } from '../simulation/world';

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
    this.container.setDepth(500);
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

    // 1. 半透明黑色遮罩与防点击穿透
    const blocker = this.scene.add.rectangle(width / 2, height / 2, width, height, 0x060b0c, 0.9);
    blocker.setScrollFactor(0);
    blocker.setInteractive();
    this.container.add(blocker);

    // 2. 测试主面板卡片 (780 x 500)
    const cardW = 780;
    const cardH = 500;
    const cardGfx = this.scene.add.graphics();
    cardGfx.fillStyle(0x101a1d, 0.98);
    cardGfx.fillRoundedRect(width / 2 - cardW / 2, height / 2 - cardH / 2, cardW, cardH, 12);
    cardGfx.lineStyle(2, 0x00f5d4, 1);
    cardGfx.strokeRoundedRect(width / 2 - cardW / 2, height / 2 - cardH / 2, cardW, cardH, 12);
    cardGfx.setScrollFactor(0);
    this.container.add(cardGfx);

    // 3. 标题
    const title = this.scene.add.text(width / 2, height / 2 - cardH / 2 + 25, '🧪 神厨开发者与测试指令面板 (Debug Menu)', {
      fontSize: '20px',
      color: '#00f5d4',
      fontStyle: 'bold',
    });
    title.setOrigin(0.5, 0);
    title.setScrollFactor(0);
    this.container.add(title);

    // 4. 指令按钮配置
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
        text: '🥟 召唤 蒸笼包大妖 (精英Boss)',
        color: 0xe76f51,
        action: () => {
          this.spawnBoss('giant_bao_demon');
          this.popNotice('🥟 蒸笼包大妖已降临！');
        },
      },
      {
        text: '🏮 召唤 离火石锅卫 (精英Boss)',
        color: 0xf4a261,
        action: () => {
          this.spawnBoss('flame_pot_guard');
          this.popNotice('🏮 离火石锅卫已降临！');
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
          this.popNotice('🥟 获得 +100 食材！');
        },
      },
      {
        text: '💚 神厨生命值完全回满',
        color: 0x06d6a0,
        textColor: '#060b0c',
        action: () => {
          this.world.player.heal(this.world.player.maxHp);
          this.popNotice('💚 生命值已完全回满！');
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
    const btnW = 224;
    const btnH = 50;
    const gapX = 16;
    const gapY = 14;
    const gridStartX = width / 2 - (gridCols * btnW + (gridCols - 1) * gapX) / 2 + btnW / 2;
    const gridStartY = height / 2 - cardH / 2 + 105;

    for (let i = 0; i < btnConfigs.length; i++) {
      const cfg = btnConfigs[i];
      const col = i % gridCols;
      const row = Math.floor(i / gridCols);
      const bx = gridStartX + col * (btnW + gapX);
      const by = gridStartY + row * (btnH + gapY);

      const btnContainer = this.scene.add.container(bx, by);
      btnContainer.setScrollFactor(0);
      btnContainer.setSize(btnW, btnH);

      const btnBg = this.scene.add.graphics();
      btnBg.fillStyle(cfg.color, 1);
      btnBg.fillRoundedRect(-btnW / 2, -btnH / 2, btnW, btnH, 8);
      btnBg.lineStyle(1.5, 0xffffff, 0.4);
      btnBg.strokeRoundedRect(-btnW / 2, -btnH / 2, btnW, btnH, 8);
      btnContainer.add(btnBg);

      const text = this.scene.add.text(0, 0, cfg.text, {
        fontSize: '12px',
        color: cfg.textColor || '#ffffff',
        fontStyle: 'bold',
        wordWrap: { width: btnW - 16, useAdvancedWrap: true },
        align: 'center',
      });
      text.setOrigin(0.5, 0.5);
      btnContainer.add(text);

      const hitZone = this.scene.add.zone(0, 0, btnW, btnH);
      hitZone.setScrollFactor(0);
      hitZone.setInteractive({ useHandCursor: true });
      btnContainer.add(hitZone);

      hitZone.on('pointerover', () => {
        btnContainer.setScale(1.04);
        btnBg.clear();
        btnBg.fillStyle(cfg.color, 1);
        btnBg.fillRoundedRect(-btnW / 2, -btnH / 2, btnW, btnH, 8);
        btnBg.lineStyle(2.5, 0x00f5d4, 1);
        btnBg.strokeRoundedRect(-btnW / 2, -btnH / 2, btnW, btnH, 8);
      });

      hitZone.on('pointerout', () => {
        btnContainer.setScale(1.0);
        btnBg.clear();
        btnBg.fillStyle(cfg.color, 1);
        btnBg.fillRoundedRect(-btnW / 2, -btnH / 2, btnW, btnH, 8);
        btnBg.lineStyle(1.5, 0xffffff, 0.4);
        btnBg.strokeRoundedRect(-btnW / 2, -btnH / 2, btnW, btnH, 8);
      });

      hitZone.on('pointerdown', () => {
        AudioManager.getInstance().playSfx('sfx_click', 0.6);
        cfg.action();
      });

      this.container.add(btnContainer);
    }

    // 5. 底部关闭测试面板按钮
    const closeW = 220;
    const closeH = 42;
    const closeY = height / 2 + cardH / 2 - 45;

    const closeContainer = this.scene.add.container(width / 2, closeY);
    closeContainer.setScrollFactor(0);
    closeContainer.setSize(closeW, closeH);

    const closeBg = this.scene.add.graphics();
    closeBg.fillStyle(0x2a9d8f, 1);
    closeBg.fillRoundedRect(-closeW / 2, -closeH / 2, closeW, closeH, 8);
    closeContainer.add(closeBg);

    const closeText = this.scene.add.text(0, 0, '关闭测试面板', {
      fontSize: '15px',
      color: '#060b0c',
      fontStyle: 'bold',
    });
    closeText.setOrigin(0.5, 0.5);
    closeContainer.add(closeText);

    const closeHit = this.scene.add.zone(0, 0, closeW, closeH);
    closeHit.setScrollFactor(0);
    closeHit.setInteractive({ useHandCursor: true });
    closeContainer.add(closeHit);

    closeHit.on('pointerover', () => {
      closeContainer.setScale(1.04);
      closeBg.clear();
      closeBg.fillStyle(0x00f5d4, 1);
      closeBg.fillRoundedRect(-closeW / 2, -closeH / 2, closeW, closeH, 8);
    });

    closeHit.on('pointerout', () => {
      closeContainer.setScale(1.0);
      closeBg.clear();
      closeBg.fillStyle(0x2a9d8f, 1);
      closeBg.fillRoundedRect(-closeW / 2, -closeH / 2, closeW, closeH, 8);
    });

    closeHit.on('pointerdown', () => {
      AudioManager.getInstance().playSfx('sfx_click', 0.5);
      this.hide();
      this.world.resumeGame();
    });

    this.container.add(closeContainer);
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
    const notice = this.scene.add.text(this.scene.scale.width / 2, this.scene.scale.height / 2 + 195, msg, {
      fontSize: '15px',
      color: '#ffd166',
      backgroundColor: '#060b0c',
      padding: { x: 16, y: 8 },
    });
    notice.setOrigin(0.5, 0.5);
    notice.setScrollFactor(0);
    notice.setDepth(600);

    this.scene.tweens.add({
      targets: notice,
      y: notice.y - 30,
      alpha: 0,
      duration: 1400,
      onComplete: () => notice.destroy(),
    });
  }
}
