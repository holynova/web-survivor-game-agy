import Phaser from 'phaser';

export class BootScene extends Phaser.Scene {
  constructor() {
    super({ key: 'BootScene' });
  }

  public preload(): void {
    // 基础启动加载
  }

  public create(): void {
    // 设置抗锯齿与纹理过滤模式
    this.game.canvas.style.imageRendering = 'pixelated';
    this.scene.start('PreloadScene');
  }
}
