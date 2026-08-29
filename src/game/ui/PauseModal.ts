import Phaser from 'phaser';
import { AudioManager } from '../presentation/audio';

export class PauseModal {
  private scene: Phaser.Scene;
  private container: Phaser.GameObjects.Container;
  private onResumeCallback: () => void;
  private onRestartCallback: () => void;

  constructor(scene: Phaser.Scene, onResume: () => void, onRestart: () => void) {
    this.scene = scene;
    this.onResumeCallback = onResume;
    this.onRestartCallback = onRestart;
    this.container = scene.add.container(0, 0);
    this.container.setScrollFactor(0);
    this.container.setDepth(300);
    this.container.setVisible(false);
  }

  public show(): void {
    this.container.removeAll(true);

    const width = this.scene.scale.width;
    const height = this.scene.scale.height;

    // 半透明背景
    const bg = this.scene.add.graphics();
    bg.fillStyle(0x060b0c, 0.85);
    bg.fillRect(0, 0, width, height);
    this.container.add(bg);

    // 面板框
    const cardW = 320;
    const cardH = 260;
    const cardGfx = this.scene.add.graphics();
    cardGfx.fillStyle(0x121c20, 0.95);
    cardGfx.fillRoundedRect(width / 2 - cardW / 2, height / 2 - cardH / 2, cardW, cardH, 12);
    cardGfx.lineStyle(2, 0x3d5a5b, 1);
    cardGfx.strokeRoundedRect(width / 2 - cardW / 2, height / 2 - cardH / 2, cardW, cardH, 12);
    this.container.add(cardGfx);

    // 标题
    const title = this.scene.add.text(width / 2, height / 2 - cardH / 2 + 25, '⏸ 游戏暂停', {
      fontSize: '20px',
      color: '#ffd166',
      fontStyle: 'bold',
    });
    title.setOrigin(0.5, 0);
    this.container.add(title);

    // 静音切换按钮
    const audioManager = AudioManager.getInstance();
    const muteBtnText = this.scene.add.text(
      width / 2,
      height / 2 - 20,
      '🔊 点击切换 静音/开启音效',
      {
        fontSize: '13px',
        color: '#2a9d8f',
      },
    );
    muteBtnText.setOrigin(0.5, 0.5);
    muteBtnText.setInteractive({ useHandCursor: true });
    muteBtnText.on('pointerdown', () => {
      const isMuted = audioManager.toggleMute();
      muteBtnText.setText(isMuted ? '🔇 音效已静音 (点击开启)' : '🔊 音效开启中 (点击静音)');
    });
    this.container.add(muteBtnText);

    // 继续按钮
    const resumeBtnGfx = this.scene.add.graphics();
    resumeBtnGfx.fillStyle(0x2a9d8f, 1);
    resumeBtnGfx.fillRoundedRect(width / 2 - 100, height / 2 + 15, 200, 34, 6);
    this.container.add(resumeBtnGfx);

    const resumeText = this.scene.add.text(width / 2, height / 2 + 32, '继续游戏', {
      fontSize: '14px',
      color: '#060b0c',
      fontStyle: 'bold',
    });
    resumeText.setOrigin(0.5, 0.5);
    this.container.add(resumeText);

    const resumeZone = this.scene.add.zone(width / 2, height / 2 + 32, 200, 34);
    resumeZone.setInteractive({ useHandCursor: true });
    resumeZone.on('pointerdown', () => {
      this.hide();
      this.onResumeCallback();
    });
    this.container.add(resumeZone);

    // 重新开始按钮
    const restartBtnGfx = this.scene.add.graphics();
    restartBtnGfx.fillStyle(0xe76f51, 1);
    restartBtnGfx.fillRoundedRect(width / 2 - 100, height / 2 + 60, 200, 34, 6);
    this.container.add(restartBtnGfx);

    const restartText = this.scene.add.text(width / 2, height / 2 + 77, '重新开始', {
      fontSize: '14px',
      color: '#060b0c',
      fontStyle: 'bold',
    });
    restartText.setOrigin(0.5, 0.5);
    this.container.add(restartText);

    const restartZone = this.scene.add.zone(width / 2, height / 2 + 77, 200, 34);
    restartZone.setInteractive({ useHandCursor: true });
    restartZone.on('pointerdown', () => {
      this.hide();
      this.onRestartCallback();
    });
    this.container.add(restartZone);

    this.container.setVisible(true);
  }

  public hide(): void {
    this.container.setVisible(false);
  }

  public isVisible(): boolean {
    return this.container.visible;
  }

  public destroy(): void {
    this.container.destroy();
  }
}
