import Phaser from 'phaser';
import { SimulationWorld } from '../simulation/world';

export class HUD {
  private scene: Phaser.Scene;
  private container: Phaser.GameObjects.Container;

  private hpText!: Phaser.GameObjects.Text;
  private hpBarBg!: Phaser.GameObjects.Graphics;
  private hpBarFill!: Phaser.GameObjects.Graphics;

  private expText!: Phaser.GameObjects.Text;
  private expBarBg!: Phaser.GameObjects.Graphics;
  private expBarFill!: Phaser.GameObjects.Graphics;

  private waveText!: Phaser.GameObjects.Text;
  private timerText!: Phaser.GameObjects.Text;
  private ingredientText!: Phaser.GameObjects.Text;
  private doubleLootText!: Phaser.GameObjects.Text;
  private recipeText!: Phaser.GameObjects.Text;

  // 移动端虚拟摇杆
  private joystickBase!: Phaser.GameObjects.Graphics;
  private joystickThumb!: Phaser.GameObjects.Graphics;
  private isTouching = false;
  private touchOrigin = { x: 0, y: 0 };

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    this.container = scene.add.container(0, 0);
    this.container.setScrollFactor(0);
    this.container.setDepth(100);

    this.createElements();
    this.setupVirtualJoystick();
  }

  private createElements(): void {
    const width = this.scene.scale.width;

    // 1. 顶部经验条 (全宽)
    this.expBarBg = this.scene.add.graphics();
    this.expBarBg.fillStyle(0x1d3557, 0.8);
    this.expBarBg.fillRect(0, 0, width, 12);
    this.container.add(this.expBarBg);

    this.expBarFill = this.scene.add.graphics();
    this.container.add(this.expBarFill);

    this.expText = this.scene.add.text(width / 2, 18, 'Lv.1', {
      fontSize: '14px',
      color: '#00f5d4',
      fontStyle: 'bold',
    });
    this.expText.setOrigin(0.5, 0);
    this.container.add(this.expText);

    // 2. 左上角血条
    this.hpBarBg = this.scene.add.graphics();
    this.hpBarBg.fillStyle(0x333333, 0.8);
    this.hpBarBg.fillRect(20, 24, 200, 20);
    this.container.add(this.hpBarBg);

    this.hpBarFill = this.scene.add.graphics();
    this.container.add(this.hpBarFill);

    this.hpText = this.scene.add.text(120, 26, 'HP 100/100', {
      fontSize: '13px',
      color: '#ffffff',
      fontStyle: 'bold',
    });
    this.hpText.setOrigin(0.5, 0);
    this.container.add(this.hpText);

    // 3. 顶部中央波次与倒计时
    this.waveText = this.scene.add.text(width / 2, 40, '第 1 波 / 共 12 波', {
      fontSize: '17px',
      color: '#f4a261',
      fontStyle: 'bold',
    });
    this.waveText.setOrigin(0.5, 0);
    this.container.add(this.waveText);

    this.timerText = this.scene.add.text(width / 2, 64, '00:45', {
      fontSize: '16px',
      color: '#e76f51',
      fontStyle: 'bold',
    });
    this.timerText.setOrigin(0.5, 0);
    this.container.add(this.timerText);

    // 4. 右上角食材金币与双倍留存提示
    this.ingredientText = this.scene.add.text(width - 20, 24, '🥟 食材: 0', {
      fontSize: '16px',
      color: '#ffd166',
      fontStyle: 'bold',
    });
    this.ingredientText.setOrigin(1, 0);
    this.container.add(this.ingredientText);

    this.doubleLootText = this.scene.add.text(width - 20, 48, '', {
      fontSize: '13px',
      color: '#00f5d4',
      fontStyle: 'bold',
    });
    this.doubleLootText.setOrigin(1, 0);
    this.container.add(this.doubleLootText);

    // 5. 底部激活菜谱展示
    this.recipeText = this.scene.add.text(20, this.scene.scale.height - 30, '', {
      fontSize: '14px',
      color: '#06d6a0',
      fontStyle: 'bold',
    });
    this.container.add(this.recipeText);
  }

  private setupVirtualJoystick(): void {
    this.joystickBase = this.scene.add.graphics();
    this.joystickThumb = this.scene.add.graphics();
    this.joystickBase.setVisible(false);
    this.joystickThumb.setVisible(false);
    this.container.add(this.joystickBase);
    this.container.add(this.joystickThumb);

    this.scene.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      // 只有点击屏幕左下半区才触发虚拟摇杆
      if (pointer.x < this.scene.scale.width * 0.6 && pointer.y > 100) {
        this.isTouching = true;
        this.touchOrigin.x = pointer.x;
        this.touchOrigin.y = pointer.y;

        this.joystickBase.clear();
        this.joystickBase.fillStyle(0xffffff, 0.15);
        this.joystickBase.fillCircle(pointer.x, pointer.y, 50);
        this.joystickBase.setVisible(true);

        this.joystickThumb.clear();
        this.joystickThumb.fillStyle(0xf4a261, 0.8);
        this.joystickThumb.fillCircle(pointer.x, pointer.y, 22);
        this.joystickThumb.setVisible(true);
      }
    });

    this.scene.input.on('pointermove', (pointer: Phaser.Input.Pointer) => {
      if (this.isTouching) {
        const dx = pointer.x - this.touchOrigin.x;
        const dy = pointer.y - this.touchOrigin.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const maxDist = 50;

        if (dist > maxDist) {
          const angle = Math.atan2(dy, dx);
          this.joystickThumb.clear();
          this.joystickThumb.fillStyle(0xf4a261, 0.8);
          this.joystickThumb.fillCircle(
            this.touchOrigin.x + Math.cos(angle) * maxDist,
            this.touchOrigin.y + Math.sin(angle) * maxDist,
            22,
          );
        } else {
          this.joystickThumb.clear();
          this.joystickThumb.fillStyle(0xf4a261, 0.8);
          this.joystickThumb.fillCircle(pointer.x, pointer.y, 22);
        }
      }
    });

    const resetJoystick = () => {
      this.isTouching = false;
      this.joystickBase.setVisible(false);
      this.joystickThumb.setVisible(false);
    };

    this.scene.input.on('pointerup', resetJoystick);
    this.scene.input.on('pointerupoutside', resetJoystick);
  }

  public getJoystickVector(): { x: number; y: number } {
    if (!this.isTouching) {
      return { x: 0, y: 0 };
    }
    const pointer = this.scene.input.activePointer;
    const dx = pointer.x - this.touchOrigin.x;
    const dy = pointer.y - this.touchOrigin.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist < 5) return { x: 0, y: 0 };
    return {
      x: dx / Math.max(dist, 50),
      y: dy / Math.max(dist, 50),
    };
  }

  public update(world: SimulationWorld): void {
    const player = world.player;
    const waveSys = world.waveSystem;
    const width = this.scene.scale.width;

    // 1. 经验条
    const expPct = Math.min(1, player.currentExp / Math.max(1, player.expToNextLevel));
    this.expBarFill.clear();
    this.expBarFill.fillStyle(0x00f5d4, 1);
    this.expBarFill.fillRect(0, 0, width * expPct, 12);
    this.expText.setText(`等级 ${player.level} (${player.currentExp}/${player.expToNextLevel})`);

    // 2. 血条
    const hpPct = Math.min(1, Math.max(0, player.currentHp / player.maxHp));
    this.hpBarFill.clear();
    const hpColor = hpPct > 0.5 ? 0x2a9d8f : hpPct > 0.25 ? 0xf4a261 : 0xe76f51;
    this.hpBarFill.fillStyle(hpColor, 1);
    this.hpBarFill.fillRect(20, 24, 200 * hpPct, 20);
    this.hpText.setText(`HP ${Math.round(player.currentHp)}/${player.maxHp}`);

    // 3. 波次与时间
    const currentWave = waveSys.currentWave;
    const timeLeft = Math.max(0, Math.ceil(currentWave.durationSeconds - waveSys.waveTimerSec));
    const mins = Math.floor(timeLeft / 60);
    const secs = timeLeft % 60;
    const timeStr = `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;

    this.waveText.setText(
      currentWave.isBossWave
        ? `🔥 最终波次: 饕餮狂潮 (第 ${currentWave.waveNumber} 波)`
        : `第 ${currentWave.waveNumber} 波 / 共 ${waveSys.totalWaves} 波`,
    );
    this.timerText.setText(timeStr);

    // 4. 食材金币与双倍留存
    this.ingredientText.setText(`🥟 食材: ${player.ingredients}`);
    if (world.doubleLootRemaining > 0) {
      this.doubleLootText.setText(`✨ 双倍留存: ${world.doubleLootRemaining} 个`);
      this.doubleLootText.setVisible(true);
    } else {
      this.doubleLootText.setVisible(false);
    }

    // 5. 菜谱质变展示
    if (player.activeRecipes.length > 0) {
      const names = player.activeRecipes
        .map(r => `【${r.transformation?.transformedNameKey || r.nameKey}】`)
        .join(' ');
      this.recipeText.setText(`🔥 质变神菜: ${names}`);
    } else {
      this.recipeText.setText('');
    }
  }

  public destroy(): void {
    this.container.destroy();
  }
}
