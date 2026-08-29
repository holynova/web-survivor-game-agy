import Phaser from 'phaser';
import { SimulationWorld } from '../game/simulation/world';

export class DebugOverlay {
  private scene: Phaser.Scene;
  private container: Phaser.GameObjects.Container;
  private statsText!: Phaser.GameObjects.Text;
  private isVisible = false;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    this.container = scene.add.container(10, 80);
    this.container.setScrollFactor(0);
    this.container.setDepth(500);
    this.container.setVisible(false);

    this.createPanel();
    this.bindKeyboard();
  }

  private createPanel(): void {
    const bg = this.scene.add.graphics();
    bg.fillStyle(0x000000, 0.75);
    bg.fillRoundedRect(0, 0, 240, 240, 6);
    this.container.add(bg);

    this.statsText = this.scene.add.text(10, 10, 'DEBUG PANEL', {
      fontSize: '11px',
      color: '#00f5d4',
      lineSpacing: 4,
    });
    this.container.add(this.statsText);

    // 快捷作弊按钮
    this.createCheatButton(10, 140, '无敌模式', world => {
      world.player.isInvincible = !world.player.isInvincible;
    });

    this.createCheatButton(85, 140, '+50 食材', world => {
      world.player.ingredients += 50;
    });

    this.createCheatButton(160, 140, '跳到下波', world => {
      world.waveSystem.skipToNextWave();
    });

    this.createCheatButton(10, 180, '刷50怪', world => {
      for (let i = 0; i < 50; i++) {
        world.spawnerSystem.update(
          world.waveSystem.currentWave,
          world.waveSystem.waveTimerSec,
          world.player,
          world.enemyPool,
          world.spatialHash,
          world.rng,
          10,
        );
      }
    });

    this.createCheatButton(85, 180, '2x 速度', world => {
      world.clock.setTimeScale(world.clock.getTimeScale() === 1.0 ? 2.0 : 1.0);
    });

    this.createCheatButton(160, 180, '直接升级', world => {
      world.player.addExp(world.player.expToNextLevel);
    });
  }

  private createCheatButton(
    x: number,
    y: number,
    label: string,
    action: (world: SimulationWorld) => void,
  ): void {
    const btnGfx = this.scene.add.graphics();
    btnGfx.fillStyle(0x2a9d8f, 1);
    btnGfx.fillRoundedRect(x, y, 68, 26, 4);
    this.container.add(btnGfx);

    const btnText = this.scene.add.text(x + 34, y + 13, label, {
      fontSize: '10px',
      color: '#060b0c',
      fontStyle: 'bold',
    });
    btnText.setOrigin(0.5, 0.5);
    this.container.add(btnText);

    const hitZone = this.scene.add.zone(x + 34, y + 13, 68, 26);
    hitZone.setInteractive({ useHandCursor: true });
    hitZone.on('pointerdown', () => {
      const world = (this.scene as unknown as { world: SimulationWorld }).world;
      if (world) {
        action(world);
      }
    });
    this.container.add(hitZone);
  }

  private bindKeyboard(): void {
    this.scene.input.keyboard?.on('keydown-BACKQUOTE', () => {
      this.toggle();
    });
  }

  public toggle(): void {
    this.isVisible = !this.isVisible;
    this.container.setVisible(this.isVisible);
  }

  public update(world: SimulationWorld): void {
    if (!this.isVisible) return;

    const fps = Math.round(this.scene.game.loop.actualFps);
    const enemies = world.enemyPool.getActiveCount();
    const enemiesPeak = world.enemyPool.getPeakActive();
    const projs = world.projectilePool.getActiveCount();
    const drops = world.dropPool.getActiveCount();
    const texts = world.damageTextPool.getActiveCount();
    const seed = world.rng.getSeed();
    const god = world.player.isInvincible ? 'ON' : 'OFF';
    const speed = world.clock.getTimeScale();

    this.statsText.setText(
      `FPS: ${fps} | Speed: ${speed}x\n` +
        `Enemies: ${enemies} (Peak: ${enemiesPeak})\n` +
        `Projectiles: ${projs}\n` +
        `Drops: ${drops} | DamageTexts: ${texts}\n` +
        `Seed: ${seed}\n` +
        `GodMode: ${god}\n` +
        `[~] 键隐藏/显示调试面板`,
    );
  }

  public destroy(): void {
    this.container.destroy();
  }
}
