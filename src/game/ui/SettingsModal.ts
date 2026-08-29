import Phaser from 'phaser';
import { SaveManager } from '@/save/storage';
import { AudioManager } from '../presentation/audio';

export class SettingsModal {
  private scene: Phaser.Scene;
  private container: Phaser.GameObjects.Container;
  private onCloseCallback?: () => void;

  constructor(scene: Phaser.Scene, onClose?: () => void) {
    this.scene = scene;
    this.onCloseCallback = onClose;
    this.container = scene.add.container(0, 0);
    this.container.setScrollFactor(0);
    this.container.setDepth(350);
    this.container.setVisible(false);
  }

  public show(): void {
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
    const height = this.scaleHeight();
    const saveData = SaveManager.load();
    const settings = saveData.settings;

    // 半透明背景
    const bg = this.scene.add.graphics();
    bg.fillStyle(0x060b0c, 0.9);
    bg.fillRect(0, 0, width, height);
    bg.setScrollFactor(0);
    this.container.add(bg);

    // 阻挡穿透
    const blocker = this.scene.add.zone(width / 2, height / 2, width, height);
    blocker.setScrollFactor(0);
    blocker.setInteractive();
    this.container.add(blocker);

    // 设置主面板 (680 x 480)
    const cardW = 680;
    const cardH = 480;
    const cardGfx = this.scene.add.graphics();
    cardGfx.fillStyle(0x0f181b, 0.98);
    cardGfx.fillRoundedRect(width / 2 - cardW / 2, height / 2 - cardH / 2, cardW, cardH, 12);
    cardGfx.lineStyle(2, 0x3d5a5b, 1);
    cardGfx.strokeRoundedRect(width / 2 - cardW / 2, height / 2 - cardH / 2, cardW, cardH, 12);
    cardGfx.setScrollFactor(0);
    this.container.add(cardGfx);

    // 标题
    const title = this.scene.add.text(width / 2, height / 2 - cardH / 2 + 25, '⚙️ 游戏画面与声音设置', {
      fontSize: '22px',
      color: '#ffd166',
      fontStyle: 'bold',
    });
    title.setOrigin(0.5, 0);
    title.setScrollFactor(0);
    this.container.add(title);

    let rowY = height / 2 - cardH / 2 + 75;

    // 1. 屏幕震动强度 (none / light / normal / heavy)
    this.renderOptionRow({
      label: '📳 屏幕震动强度',
      y: rowY,
      width,
      options: [
        { label: '关闭 (0%)', value: 'none' },
        { label: '轻柔 (30%)', value: 'light' },
        { label: '标准 (60%)', value: 'normal' },
        { label: '强烈 (100%)', value: 'heavy' },
      ],
      currentValue: settings.shakeIntensity || 'normal',
      onSelect: (val: string) => {
        settings.shakeIntensity = val as any;
        settings.screenShake = val !== 'none';
        SaveManager.save(saveData);
        this.render();
      },
    });
    rowY += 60;

    // 2. 伤害跳字 (开 / 关)
    this.renderOptionRow({
      label: '💥 伤害跳字显示',
      y: rowY,
      width,
      options: [
        { label: '开启跳字', value: 'true' },
        { label: '关闭跳字', value: 'false' },
      ],
      currentValue: String(settings.damageNumbers !== false),
      onSelect: (val: string) => {
        settings.damageNumbers = val === 'true';
        SaveManager.save(saveData);
        this.render();
      },
    });
    rowY += 60;

    // 3. 受击白闪与粒子特效 (开 / 关)
    this.renderOptionRow({
      label: '💡 怪物受击白闪与特效',
      y: rowY,
      width,
      options: [
        { label: '全特效 (高品质)', value: 'true' },
        { label: '简化特效 (性能优先)', value: 'false' },
      ],
      currentValue: String(settings.flashEffects !== false),
      onSelect: (val: string) => {
        settings.flashEffects = val === 'true';
        SaveManager.save(saveData);
        this.render();
      },
    });
    rowY += 60;

    // 4. 音频静音 (开启 / 静音)
    this.renderOptionRow({
      label: '🔊 声音总开关',
      y: rowY,
      width,
      options: [
        { label: '🔊 开启声音', value: 'false' },
        { label: '🔇 全部静音', value: 'true' },
      ],
      currentValue: String(settings.isMuted === true),
      onSelect: (val: string) => {
        settings.isMuted = val === 'true';
        if (settings.isMuted) {
          AudioManager.getInstance().setMasterVolume(0);
        } else {
          AudioManager.getInstance().setMasterVolume(settings.masterVolume || 0.8);
        }
        SaveManager.save(saveData);
        this.render();
      },
    });
    rowY += 60;

    // 5. 音效音量档位 (25% / 50% / 75% / 100%)
    this.renderOptionRow({
      label: '🎚️ 音效音量',
      y: rowY,
      width,
      options: [
        { label: '25%', value: '0.25' },
        { label: '50%', value: '0.5' },
        { label: '75%', value: '0.75' },
        { label: '100%', value: '1.0' },
      ],
      currentValue: String(settings.sfxVolume || 0.8),
      onSelect: (val: string) => {
        const v = parseFloat(val);
        settings.sfxVolume = v;
        settings.masterVolume = v;
        AudioManager.getInstance().setSfxVolume(v);
        AudioManager.getInstance().setMasterVolume(v);
        SaveManager.save(saveData);
        this.render();
      },
    });

    // 底部关闭按钮
    const btnW = 180;
    const btnH = 38;
    const btnX = width / 2;
    const btnY = height / 2 + cardH / 2 - 35;

    const btnGfx = this.scene.add.graphics();
    btnGfx.fillStyle(0x2a9d8f, 1);
    btnGfx.fillRoundedRect(btnX - btnW / 2, btnY - btnH / 2, btnW, btnH, 8);
    btnGfx.setScrollFactor(0);
    this.container.add(btnGfx);

    const btnText = this.scene.add.text(btnX, btnY, '保存并关闭', {
      fontSize: '15px',
      color: '#060b0c',
      fontStyle: 'bold',
    });
    btnText.setOrigin(0.5, 0.5);
    btnText.setScrollFactor(0);
    this.container.add(btnText);

    const btnZone = this.scene.add.zone(btnX, btnY, btnW, btnH);
    btnZone.setScrollFactor(0);
    btnZone.setInteractive({ useHandCursor: true });
    btnZone.on('pointerdown', () => {
      AudioManager.getInstance().playSfx('sfx_click', 0.5);
      this.hide();
    });
    this.container.add(btnZone);
  }

  private renderOptionRow(params: {
    label: string;
    y: number;
    width: number;
    options: { label: string; value: string }[];
    currentValue: string;
    onSelect: (val: string) => void;
  }): void {
    const { label, y, width, options, currentValue, onSelect } = params;

    // 左侧标签
    const labelText = this.scene.add.text(width / 2 - 290, y, label, {
      fontSize: '14px',
      color: '#f4a261',
      fontStyle: 'bold',
    });
    labelText.setOrigin(0, 0.5);
    labelText.setScrollFactor(0);
    this.container.add(labelText);

    // 右侧选项组
    const totalOptionsW = 340;
    const optW = (totalOptionsW - (options.length - 1) * 8) / options.length;
    const optH = 28;
    const startX = width / 2 + 290 - totalOptionsW + optW / 2;

    for (let i = 0; i < options.length; i++) {
      const opt = options[i];
      const isSelected = opt.value === currentValue || (parseFloat(opt.value) && Math.abs(parseFloat(opt.value) - parseFloat(currentValue)) < 0.15);
      const bx = startX + i * (optW + 8);

      const btnGfx = this.scene.add.graphics();
      btnGfx.fillStyle(isSelected ? 0x2a9d8f : 0x142126, 1);
      btnGfx.fillRoundedRect(bx - optW / 2, y - optH / 2, optW, optH, 6);
      btnGfx.lineStyle(1, isSelected ? 0x00f5d4 : 0x3d5a5b, 1);
      btnGfx.strokeRoundedRect(bx - optW / 2, y - optH / 2, optW, optH, 6);
      btnGfx.setScrollFactor(0);
      this.container.add(btnGfx);

      const text = this.scene.add.text(bx, y, opt.label, {
        fontSize: '11px',
        color: isSelected ? '#060b0c' : '#d8e2dc',
        fontStyle: isSelected ? 'bold' : 'normal',
      });
      text.setOrigin(0.5, 0.5);
      text.setScrollFactor(0);
      this.container.add(text);

      const zone = this.scene.add.zone(bx, y, optW, optH);
      zone.setScrollFactor(0);
      zone.setInteractive({ useHandCursor: true });
      zone.on('pointerdown', () => {
        AudioManager.getInstance().playSfx('sfx_click', 0.5);
        onSelect(opt.value);
      });
      this.container.add(zone);
    }
  }

  private scaleHeight(): number {
    return this.scene.scale.height;
  }
}
