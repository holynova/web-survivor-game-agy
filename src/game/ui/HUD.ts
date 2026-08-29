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
    this.expBarBg.fillRect(0, 0, width, 10);
    this.container.add(this.expBarBg);

    this.expBarFill = this.scene.add.graphics();
    this.container.add(this.expBarFill);

    this.expText = this.scene.add.text(width / 2, 16, 'Lv.1', {
      fontSize: '13px',
      color: '#00f5d4',
      fontStyle: 'bold',
    });
    this.expText.setOrigin(0.5, 0);
    this.container.add(this.expText);

    // 2. 左上角血条
    this.hpBarBg = this.scene.add.graphics();
    this.hpBarBg.fillStyle(0x333333, 0.8);
    this.hpBarBg.fillRect(16, 20, 160, 16);
    this.container.add(this.hpBarBg);

    this.hpBarFill = this.scene.add.graphics();
    this.container.add(this.hpBarFill);

    this.hpText = this.scene.add.text(96, 21, 'HP 100/100', {
      fontSize: '11px',
      color: '#ffffff',
      fontStyle: 'bold',
    });
    this.hpText.setOrigin(0.5, 0);
    this.container.add(this.hpText);

    // 3. 顶部中央波次与倒计时
    this.waveText = this.scene.add.text(width / 2, 34, '第 1 波 / 共 12 波', {
      fontSize: '15px',
      color: '#f4a261',
      fontStyle: 'bold',
    });
    this.waveText.setOrigin(0.5, 0);
    this.container.add(this.waveText);

    this.timerText = this.scene.add.text(width / 2, 54, '00:45', {
      fontSize: '14px',
      color: '#e76f51',
      fontStyle: 'bold',
    });
    this.timerText.setOrigin(0.5, 0);
    this.container.add(this.timerText);

    // 4. 右上角食材金币
    this.ingredientText = this.scene.add.text(width - 16, 20, '🥟 食材: 0', {
      fontSize: '14px',
      color: '#ffd166',
      fontStyle: 'bold',
    });
    this.ingredientText.setOrigin(1, 0);
    this.container.add(this.ingredientText);

    // 5. 底部激活菜谱展示
    this.recipeText = this.scene.add.text(16, this.scene.scale.height - 24, '', {
      fontSize: '12px',
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
        this.joystickBase.fillCircle(pointer.x, pointer.y, 45);
        this.joystickBase.setVisible(true);

        this.joystickThumb.clear();
        this.joystickThumb.fillStyle(0xf4a261, 0.8);
        this.joystickThumb.fillCircle(pointer.x, pointer.y, 20);
        this.joystickThumb.setVisible(true);
      }
    });

    this.scene.input.on('pointermove', (pointer: Phaser.Input.Pointer) => {
      if (this.isTouching) {
        const dx = pointer.x - this.touchOrigin.x;
        const dy = pointer.y - this.touchOrigin.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const maxDist = 45;

        const clampedDist = Math.min(dist, maxDist);
        const angle = Math.atan2(dy, dx);

        const thumbX = this.touchOrigin.x + Math.cos(angle) * clampedDist;
        const thumbY = this.touchOrigin.y + Math.sin(angle) * clampedDist;

        this.joystickThumb.clear();
        this.joystickThumb.fillStyle(0xf4a261, 0.8);
        this.joystickThumb.fillCircle(thumbX, thumbY, 20);
      }
    });

    this.scene.input.on('pointerup', () => {
      this.isTouching = false;
      this.joystickBase.setVisible(false);
      this.joystickThumb.setVisible(false);
    });
  }

  public getJoystickVector(): { x: number; y: number } {
    if (!this.isTouching) return { x: 0, y: 0 };
    const pointer = this.scene.input.activePointer;
    const dx = pointer.x - this.touchOrigin.x;
    const dy = pointer.y - this.touchOrigin.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist < 5) return { x: 0, y: 0 };
    return { x: dx / dist, y: dy / dist };
  }

  public update(world: SimulationWorld): void {
    const player = world.player;
    if (!player) return;

    const width = this.scene.scale.width;

    // 1. 经验条
    const expPct = Math.min(1, player.currentExp / player.expToNextLevel);
    this.expBarFill.clear();
    this.expBarFill.fillStyle(0x00f5d4, 1);
    this.expBarFill.fillRect(0, 0, width * expPct, 10);
    this.expText.setText(`等级 ${player.level} (${player.currentExp}/${player.expToNextLevel})`);

    // 2. 血条
    const hpPct = Math.max(0, player.currentHp / player.maxHp);
    this.hpBarFill.clear();
    this.hpBarFill.fillStyle(hpPct > 0.3 ? 0x2a9d8f : 0xe76f51, 1);
    this.hpBarFill.fillRect(16, 20, 160 * hpPct, 16);
    this.hpText.setText(`HP ${Math.ceil(player.currentHp)}/${player.maxHp}`);

    // 3. 波次与倒计时
    const wave = world.waveSystem.currentWave;
    const waveNum = wave.waveNumber;
    const totalWaves = world.waveSystem.totalWaves;
    const isPrep = world.waveSystem.wavePhase === 'preparation';

    this.waveText.setText(
      isPrep
        ? `[夜市整备中] 准备下一波`
        : `第 ${waveNum} 波 / 共 ${totalWaves} 波${wave.isBossWave ? ' (BOSS战)' : wave.isEliteWave ? ' (精英检验)' : ''}`,
    );

    const remainingSec = Math.max(
      0,
      isPrep ? wave.preparationSeconds - world.waveSystem.waveTimerSec : wave.durationSeconds - world.waveSystem.waveTimerSec,
    );
    const mins = Math.floor(remainingSec / 60);
    const secs = Math.floor(remainingSec % 60);
    this.timerText.setText(`${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`);

    // 4. 食材金币
    this.ingredientText.setText(`🥟 食材: ${player.ingredients}`);

    // 5. 激活菜谱
    if (player.activeRecipes.length > 0) {
      const names = player.activeRecipes.map(r => `【${r.transformation.transformedNameKey}】`).join(' ');
      this.recipeText.setText(`已激活神厨菜谱: ${names}`);
    } else {
      this.recipeText.setText('');
    }
  }

  public destroy(): void {
    this.container.destroy();
  }
}
