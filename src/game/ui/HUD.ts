import Phaser from 'phaser';
import { Player } from '../entities/Player';
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

  // 底部武器与法术栏
  private weaponBarContainer!: Phaser.GameObjects.Container;
  private weaponSlotElements: {
    bg: Phaser.GameObjects.Graphics;
    icon: Phaser.GameObjects.Image;
    levelText: Phaser.GameObjects.Text;
    cdGfx: Phaser.GameObjects.Graphics;
  }[] = [];

  // 顶部快捷操作按钮 (设置 & 测试)
  public onSettingsClick?: () => void;
  public onDebugClick?: () => void;

  // 移动端虚拟摇杆
  private joystickBase!: Phaser.GameObjects.Graphics;
  private joystickThumb!: Phaser.GameObjects.Graphics;
  private isTouching = false;
  private touchOrigin = { x: 0, y: 0 };
  private touchCurrent = { x: 0, y: 0 };

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
    const height = this.scene.scale.height;

    // 1. 顶部经验条 (全宽)
    this.expBarBg = this.scene.add.graphics();
    this.expBarBg.fillStyle(0x101a1d, 0.85);
    this.expBarBg.fillRect(0, 0, width, 14);
    this.container.add(this.expBarBg);

    this.expBarFill = this.scene.add.graphics();
    this.container.add(this.expBarFill);

    this.expText = this.scene.add.text(width / 2, 20, '等级 1 (0/20)', {
      fontSize: '13px',
      color: '#00f5d4',
      fontStyle: 'bold',
    });
    this.expText.setOrigin(0.5, 0);
    this.container.add(this.expText);

    // 2. 左上角血条
    this.hpBarBg = this.scene.add.graphics();
    this.hpBarBg.fillStyle(0x19282f, 0.9);
    this.hpBarBg.fillRect(20, 24, 210, 22);
    this.hpBarBg.lineStyle(1.5, 0x3d5a5b, 1);
    this.hpBarBg.strokeRect(20, 24, 210, 22);
    this.container.add(this.hpBarBg);

    this.hpBarFill = this.scene.add.graphics();
    this.container.add(this.hpBarFill);

    this.hpText = this.scene.add.text(125, 27, 'HP 120/120', {
      fontSize: '12px',
      color: '#ffffff',
      fontStyle: 'bold',
    });
    this.hpText.setOrigin(0.5, 0);
    this.container.add(this.hpText);

    // 3. 顶部中央波次与倒计时
    this.waveText = this.scene.add.text(width / 2, 40, '第 1 波 / 共 12 波', {
      fontSize: '16px',
      color: '#f4a261',
      fontStyle: 'bold',
    });
    this.waveText.setOrigin(0.5, 0);
    this.container.add(this.waveText);

    this.timerText = this.scene.add.text(width / 2, 62, '00:45', {
      fontSize: '15px',
      color: '#e76f51',
      fontStyle: 'bold',
    });
    this.timerText.setOrigin(0.5, 0);
    this.container.add(this.timerText);

    // 4. 右上角食材金币与双倍留存提示
    this.ingredientText = this.scene.add.text(width - 150, 24, '🥟 食材: 0', {
      fontSize: '15px',
      color: '#ffd166',
      fontStyle: 'bold',
    });
    this.ingredientText.setOrigin(1, 0);
    this.container.add(this.ingredientText);

    this.doubleLootText = this.scene.add.text(width - 150, 48, '', {
      fontSize: '12px',
      color: '#00f5d4',
      fontStyle: 'bold',
    });
    this.doubleLootText.setOrigin(1, 0);
    this.container.add(this.doubleLootText);

    // 5. 顶部右上角快捷按钮 (🧪 测试指令 & ⚙️ 画面设置)
    this.createTopRightButtons(width);

    // 6. 底部中央武器栏 (Weapon Hotbar)
    this.weaponBarContainer = this.scene.add.container(width / 2, height - 38);
    this.container.add(this.weaponBarContainer);
    this.initWeaponHotbar();

    // 7. 底部激活菜谱文本
    this.recipeText = this.scene.add.text(20, height - 28, '', {
      fontSize: '13px',
      color: '#06d6a0',
      fontStyle: 'bold',
    });
    this.container.add(this.recipeText);
  }

  private createTopRightButtons(width: number): void {
    // 1. 设置按钮
    const setBtnW = 68;
    const setBtnH = 26;
    const setBtnX = width - 110;
    const setBtnY = 32;

    const setGfx = this.scene.add.graphics();
    setGfx.fillStyle(0x1b2d34, 0.9);
    setGfx.fillRoundedRect(setBtnX - setBtnW / 2, setBtnY - setBtnH / 2, setBtnW, setBtnH, 5);
    setGfx.lineStyle(1, 0x3d5a5b, 1);
    setGfx.strokeRoundedRect(setBtnX - setBtnW / 2, setBtnY - setBtnH / 2, setBtnW, setBtnH, 5);
    this.container.add(setGfx);

    const setText = this.scene.add.text(setBtnX, setBtnY, '⚙️ 设置', {
      fontSize: '12px',
      color: '#ffd166',
      fontStyle: 'bold',
    });
    setText.setOrigin(0.5, 0.5);
    this.container.add(setText);

    const setZone = this.scene.add.zone(setBtnX, setBtnY, setBtnW, setBtnH);
    setZone.setInteractive({ useHandCursor: true });
    setZone.on('pointerdown', () => {
      if (this.onSettingsClick) this.onSettingsClick();
    });
    this.container.add(setZone);

    // 2. 测试菜单按钮
    const dbgBtnW = 68;
    const dbgBtnH = 26;
    const dbgBtnX = width - 38;
    const dbgBtnY = 32;

    const dbgGfx = this.scene.add.graphics();
    dbgGfx.fillStyle(0x1b2d34, 0.9);
    dbgGfx.fillRoundedRect(dbgBtnX - dbgBtnW / 2, dbgBtnY - dbgBtnH / 2, dbgBtnW, dbgBtnH, 5);
    dbgGfx.lineStyle(1, 0x00f5d4, 0.8);
    dbgGfx.strokeRoundedRect(dbgBtnX - dbgBtnW / 2, dbgBtnY - dbgBtnH / 2, dbgBtnW, dbgBtnH, 5);
    this.container.add(dbgGfx);

    const dbgText = this.scene.add.text(dbgBtnX, dbgBtnY, '🧪 测试', {
      fontSize: '12px',
      color: '#00f5d4',
      fontStyle: 'bold',
    });
    dbgText.setOrigin(0.5, 0.5);
    this.container.add(dbgText);

    const dbgZone = this.scene.add.zone(dbgBtnX, dbgBtnY, dbgBtnW, dbgBtnH);
    dbgZone.setInteractive({ useHandCursor: true });
    dbgZone.on('pointerdown', () => {
      if (this.onDebugClick) this.onDebugClick();
    });
    this.container.add(dbgZone);
  }

  private initWeaponHotbar(): void {
    const slotCount = 4;
    const slotSize = 48;
    const gap = 12;
    const startX = -((slotCount * slotSize + (slotCount - 1) * gap) / 2) + slotSize / 2;

    for (let i = 0; i < slotCount; i++) {
      const sx = startX + i * (slotSize + gap);
      const slotContainer = this.scene.add.container(sx, 0);

      const bg = this.scene.add.graphics();
      slotContainer.add(bg);

      const icon = this.scene.add.image(0, 0, 'particle_circle');
      icon.setDisplaySize(30, 30);
      icon.setVisible(false);
      slotContainer.add(icon);

      const cdGfx = this.scene.add.graphics();
      slotContainer.add(cdGfx);

      const levelText = this.scene.add.text(slotSize / 2 - 4, slotSize / 2 - 4, '', {
        fontSize: '10px',
        color: '#ffd166',
        fontStyle: 'bold',
        backgroundColor: '#060b0c',
        padding: { x: 2, y: 1 },
      });
      levelText.setOrigin(1, 1);
      slotContainer.add(levelText);

      this.weaponBarContainer.add(slotContainer);
      this.weaponSlotElements.push({ bg, icon, levelText, cdGfx });
    }
  }

  private renderWeaponHotbar(player: Player): void {
    const slotSize = 48;

    for (let i = 0; i < this.weaponSlotElements.length; i++) {
      const slot = this.weaponSlotElements[i];
      const weaponState = player.weapons[i];

      slot.bg.clear();
      slot.cdGfx.clear();

      if (!weaponState) {
        // 空槽位
        slot.bg.fillStyle(0x0c1518, 0.85);
        slot.bg.fillRoundedRect(-slotSize / 2, -slotSize / 2, slotSize, slotSize, 6);
        slot.bg.lineStyle(1, 0x22363e, 0.7);
        slot.bg.strokeRoundedRect(-slotSize / 2, -slotSize / 2, slotSize, slotSize, 6);

        slot.icon.setVisible(false);
        slot.levelText.setText('');
      } else {
        // 已装备武器槽位
        const isTransformed = weaponState.isTransformed;
        slot.bg.fillStyle(0x122227, 0.95);
        slot.bg.fillRoundedRect(-slotSize / 2, -slotSize / 2, slotSize, slotSize, 6);
        slot.bg.lineStyle(isTransformed ? 2 : 1.5, isTransformed ? 0xffd166 : 0x2a9d8f, 1);
        slot.bg.strokeRoundedRect(-slotSize / 2, -slotSize / 2, slotSize, slotSize, 6);

        // 武器图标
        const assetKey = weaponState.definition.assetKey || `weapon_${weaponState.definition.id}`;
        if (this.scene.textures.exists(assetKey)) {
          slot.icon.setTexture(assetKey);
        } else if (this.scene.textures.exists(`weapon_${weaponState.definition.id}`)) {
          slot.icon.setTexture(`weapon_${weaponState.definition.id}`);
        } else {
          slot.icon.setTexture('particle_circle');
        }
        slot.icon.setDisplaySize(28, 28);
        slot.icon.setVisible(true);

        slot.levelText.setText(isTransformed ? `🔥MAX` : `Lv.${weaponState.level}`);

        // 冷却遮罩
        const lvlDef = weaponState.definition.levels[weaponState.level - 1];
        if (lvlDef && weaponState.cooldownTimerMs > 0) {
          const totalCd = lvlDef.cooldownMs;
          const ratio = Math.min(1, weaponState.cooldownTimerMs / totalCd);
          if (ratio < 1) {
            slot.cdGfx.fillStyle(0x000000, 0.55 * (1 - ratio));
            slot.cdGfx.fillRect(-slotSize / 2, -slotSize / 2, slotSize, slotSize * (1 - ratio));
          }
        }
      }
    }
  }

  private setupVirtualJoystick(): void {
    this.joystickBase = this.scene.add.graphics();
    this.joystickThumb = this.scene.add.graphics();
    this.joystickBase.setVisible(false);
    this.joystickThumb.setVisible(false);
    this.container.add(this.joystickBase);
    this.container.add(this.joystickThumb);

    this.scene.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      if (pointer.x < this.scene.scale.width * 0.6 && pointer.y > 100) {
        this.isTouching = true;
        this.touchOrigin.x = pointer.x;
        this.touchOrigin.y = pointer.y;
        this.touchCurrent.x = pointer.x;
        this.touchCurrent.y = pointer.y;

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
      if (!this.isTouching) return;

      const dx = pointer.x - this.touchOrigin.x;
      const dy = pointer.y - this.touchOrigin.y;
      const dist = Math.hypot(dx, dy);
      const maxDist = 50;

      if (dist <= maxDist) {
        this.touchCurrent.x = pointer.x;
        this.touchCurrent.y = pointer.y;
      } else {
        this.touchCurrent.x = this.touchOrigin.x + (dx / dist) * maxDist;
        this.touchCurrent.y = this.touchOrigin.y + (dy / dist) * maxDist;
      }

      this.joystickThumb.clear();
      this.joystickThumb.fillStyle(0xf4a261, 0.8);
      this.joystickThumb.fillCircle(this.touchCurrent.x, this.touchCurrent.y, 22);
    });

    const endTouch = () => {
      this.isTouching = false;
      this.joystickBase.setVisible(false);
      this.joystickThumb.setVisible(false);
    };

    this.scene.input.on('pointerup', endTouch);
    this.scene.input.on('pointerupoutside', endTouch);
  }

  public getJoystickVector(): { x: number; y: number } {
    if (!this.isTouching) return { x: 0, y: 0 };
    const dx = this.touchCurrent.x - this.touchOrigin.x;
    const dy = this.touchCurrent.y - this.touchOrigin.y;
    const dist = Math.hypot(dx, dy);
    if (dist < 8) return { x: 0, y: 0 };
    return { x: dx / dist, y: dy / dist };
  }

  public update(world: SimulationWorld): void {
    const player = world.player;
    if (!player) return;

    // 1. 经验条
    const width = this.scene.scale.width;
    const expRatio = Math.min(1, Math.max(0, player.currentExp / player.expToNextLevel));
    this.expBarFill.clear();
    this.expBarFill.fillStyle(0x00f5d4, 1);
    this.expBarFill.fillRect(0, 0, width * expRatio, 14);
    this.expText.setText(`等级 ${player.level} (${player.currentExp}/${player.expToNextLevel})`);

    // 2. 生命条
    const hpRatio = Math.min(1, Math.max(0, player.currentHp / player.maxHp));
    this.hpBarFill.clear();
    const hpColor = hpRatio > 0.5 ? 0x2a9d8f : hpRatio > 0.25 ? 0xf4a261 : 0xe76f51;
    this.hpBarFill.fillStyle(hpColor, 1);
    this.hpBarFill.fillRect(20, 24, 210 * hpRatio, 22);
    this.hpText.setText(`HP ${Math.ceil(player.currentHp)}/${player.maxHp}`);

    // 3. 波次与倒计时
    const wave = world.waveSystem.currentWave;
    const isPrep = world.waveSystem.wavePhase === 'preparation';
    this.waveText.setText(`第 ${wave.waveNumber} 波 / 共 12 波`);

    const remainingSec = Math.max(
      0,
      isPrep
        ? wave.preparationSeconds - world.waveSystem.waveTimerSec
        : wave.durationSeconds - world.waveSystem.waveTimerSec,
    );
    const mins = Math.floor(remainingSec / 60);
    const secs = Math.floor(remainingSec % 60);
    const timeStr = `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    this.timerText.setText(isPrep ? `整备期: ${timeStr}` : timeStr);
    this.timerText.setColor(isPrep ? '#06d6a0' : remainingSec <= 10 ? '#e76f51' : '#f4a261');

    // 4. 食材金币与双倍留存
    this.ingredientText.setText(`🥟 食材: ${player.ingredients}`);
    if (world.doubleLootRemaining > 0) {
      this.doubleLootText.setText(`✨ 双倍留存: ${world.doubleLootRemaining} 个`);
    } else {
      this.doubleLootText.setText('');
    }

    // 5. 底部激活菜谱提示
    if (player.activeRecipes.length > 0) {
      const names = player.activeRecipes.map(r => `【${r.transformation?.transformedNameKey || r.nameKey}】`).join(' ');
      this.recipeText.setText(`🔥 质变菜谱: ${names}`);
    } else {
      this.recipeText.setText('');
    }

    // 6. 底部武器物品栏渲染
    this.renderWeaponHotbar(player);
  }

  public destroy(): void {
    this.container.destroy();
  }
}
