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
    this.container.setDepth(450);
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

    // 1. 半透明黑色遮罩与防点击穿透
    const blocker = this.scene.add.rectangle(width / 2, height / 2, width, height, 0x060b0c, 0.9);
    blocker.setScrollFactor(0);
    blocker.setInteractive();
    this.container.add(blocker);

    // 2. 设置主面板 (700 x 490)
    const cardW = 700;
    const cardH = 490;
    const cardGfx = this.scene.add.graphics();
    cardGfx.fillStyle(0x0f181b, 0.98);
    cardGfx.fillRoundedRect(width / 2 - cardW / 2, height / 2 - cardH / 2, cardW, cardH, 12);
    cardGfx.lineStyle(2, 0x3d5a5b, 1);
    cardGfx.strokeRoundedRect(width / 2 - cardW / 2, height / 2 - cardH / 2, cardW, cardH, 12);
    cardGfx.setScrollFactor(0);
    this.container.add(cardGfx);

    // 3. 标题
    const title = this.scene.add.text(width / 2, height / 2 - cardH / 2 + 25, '⚙️ 游戏画面与声音设置', {
      fontSize: '22px',
      color: '#ffd166',
      fontStyle: 'bold',
    });
    title.setOrigin(0.5, 0);
    title.setScrollFactor(0);
    this.container.add(title);

    let rowY = height / 2 - cardH / 2 + 80;

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
        AudioManager.getInstance().setMuted(settings.isMuted);
        SaveManager.save(saveData);
        this.render();
      },
    });
    rowY += 60;

    // 5. 音效音量 (25% / 50% / 75% / 100%)
    this.renderOptionRow({
      label: '📊 音效音量',
      y: rowY,
      width,
      options: [
        { label: '25%', value: '0.25' },
        { label: '50%', value: '0.5' },
        { label: '75%', value: '0.75' },
        { label: '100%', value: '1.0' },
      ],
      currentValue: String(settings.sfxVolume || 0.75),
      onSelect: (val: string) => {
        settings.sfxVolume = parseFloat(val);
        AudioManager.getInstance().setSfxVolume(settings.sfxVolume);
        SaveManager.save(saveData);
        this.render();
      },
    });

    // 底部关闭按钮
    const btnW = 200;
    const btnH = 40;
    const btnX = width / 2;
    const btnY = height / 2 + cardH / 2 - 40;

    const closeBtn = this.scene.add.container(btnX, btnY);
    closeBtn.setScrollFactor(0);
    closeBtn.setSize(btnW, btnH);

    const btnBg = this.scene.add.graphics();
    btnBg.fillStyle(0x2a9d8f, 1);
    btnBg.fillRoundedRect(-btnW / 2, -btnH / 2, btnW, btnH, 8);
    closeBtn.add(btnBg);

    const btnText = this.scene.add.text(0, 0, '保存并关闭', {
      fontSize: '15px',
      color: '#060b0c',
      fontStyle: 'bold',
    });
    btnText.setOrigin(0.5, 0.5);
    closeBtn.add(btnText);

    const btnHit = this.scene.add.zone(0, 0, btnW, btnH);
    btnHit.setScrollFactor(0);
    btnHit.setInteractive({ useHandCursor: true });
    closeBtn.add(btnHit);

    btnHit.on('pointerover', () => {
      closeBtn.setScale(1.04);
      btnBg.clear();
      btnBg.fillStyle(0x00f5d4, 1);
      btnBg.fillRoundedRect(-btnW / 2, -btnH / 2, btnW, btnH, 8);
    });

    btnHit.on('pointerout', () => {
      closeBtn.setScale(1.0);
      btnBg.clear();
      btnBg.fillStyle(0x2a9d8f, 1);
      btnBg.fillRoundedRect(-btnW / 2, -btnH / 2, btnW, btnH, 8);
    });

    btnHit.on('pointerdown', () => {
      AudioManager.getInstance().playSfx('sfx_click', 0.5);
      this.hide();
    });

    this.container.add(closeBtn);
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
    const labelText = this.scene.add.text(width / 2 - 310, y, label, {
      fontSize: '14px',
      color: '#f4a261',
      fontStyle: 'bold',
    });
    labelText.setOrigin(0, 0.5);
    labelText.setScrollFactor(0);
    this.container.add(labelText);

    // 右侧选项组
    const totalOptionsW = 360;
    const optW = (totalOptionsW - (options.length - 1) * 8) / options.length;
    const optH = 30;
    const startX = width / 2 + 310 - totalOptionsW + optW / 2;

    for (let i = 0; i < options.length; i++) {
      const opt = options[i];
      const isSelected = opt.value === currentValue || (parseFloat(opt.value) && Math.abs(parseFloat(opt.value) - parseFloat(currentValue)) < 0.15);
      const bx = startX + i * (optW + 8);

      const optContainer = this.scene.add.container(bx, y);
      optContainer.setScrollFactor(0);
      optContainer.setSize(optW, optH);

      const btnGfx = this.scene.add.graphics();
      btnGfx.fillStyle(isSelected ? 0x2a9d8f : 0x142126, 1);
      btnGfx.fillRoundedRect(-optW / 2, -optH / 2, optW, optH, 6);
      btnGfx.lineStyle(1.5, isSelected ? 0x00f5d4 : 0x3d5a5b, 1);
      btnGfx.strokeRoundedRect(-optW / 2, -optH / 2, optW, optH, 6);
      optContainer.add(btnGfx);

      const text = this.scene.add.text(0, 0, opt.label, {
        fontSize: '11px',
        color: isSelected ? '#060b0c' : '#d8e2dc',
        fontStyle: isSelected ? 'bold' : 'normal',
      });
      text.setOrigin(0.5, 0.5);
      optContainer.add(text);

      const zone = this.scene.add.zone(0, 0, optW, optH);
      zone.setScrollFactor(0);
      zone.setInteractive({ useHandCursor: true });
      optContainer.add(zone);

      zone.on('pointerover', () => {
        if (!isSelected) {
          optContainer.setScale(1.04);
          btnGfx.clear();
          btnGfx.fillStyle(0x1d3557, 1);
          btnGfx.fillRoundedRect(-optW / 2, -optH / 2, optW, optH, 6);
          btnGfx.lineStyle(1.5, 0x00f5d4, 1);
          btnGfx.strokeRoundedRect(-optW / 2, -optH / 2, optW, optH, 6);
        }
      });

      zone.on('pointerout', () => {
        if (!isSelected) {
          optContainer.setScale(1.0);
          btnGfx.clear();
          btnGfx.fillStyle(0x142126, 1);
          btnGfx.fillRoundedRect(-optW / 2, -optH / 2, optW, optH, 6);
          btnGfx.lineStyle(1.5, 0x3d5a5b, 1);
          btnGfx.strokeRoundedRect(-optW / 2, -optH / 2, optW, optH, 6);
        }
      });

      zone.on('pointerdown', () => {
        AudioManager.getInstance().playSfx('sfx_click', 0.5);
        onSelect(opt.value);
      });

      this.container.add(optContainer);
    }
  }

  private scaleHeight(): number {
    return this.scene.scale.height;
  }
}
