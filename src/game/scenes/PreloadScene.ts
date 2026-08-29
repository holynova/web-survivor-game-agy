import Phaser from 'phaser';

export class PreloadScene extends Phaser.Scene {
  constructor() {
    super({ key: 'PreloadScene' });
  }

  public preload(): void {
    const width = this.scale.width;
    const height = this.scale.height;

    // 进度条背景
    const progressBox = this.add.graphics();
    progressBox.fillStyle(0x1d3557, 0.8);
    progressBox.fillRoundedRect(width / 2 - 160, height / 2 - 12, 320, 24, 6);

    const progressBar = this.add.graphics();

    const loadingText = this.add.text(width / 2, height / 2 - 40, '夜市摊位准备中...', {
      fontSize: '16px',
      color: '#f4a261',
      fontStyle: 'bold',
    });
    loadingText.setOrigin(0.5, 0.5);

    this.load.on('progress', (value: number) => {
      progressBar.clear();
      progressBar.fillStyle(0x00f5d4, 1);
      progressBar.fillRoundedRect(width / 2 - 156, height / 2 - 8, 312 * value, 16, 4);
    });

    this.load.on('complete', () => {
      progressBox.destroy();
      progressBar.destroy();
      loadingText.destroy();
    });

    // 预热生成必要的基础几何图形纹理
    this.createPlaceholderTextures();
  }

  private createPlaceholderTextures(): void {
    // 为各类粒子/光晕创建轻量纹理
    const g = this.make.graphics({ x: 0, y: 0 });
    g.fillStyle(0xffffff, 1);
    g.fillCircle(8, 8, 8);
    g.generateTexture('particle_circle', 16, 16);
    g.destroy();
  }

  public create(): void {
    this.scene.start('MenuScene');
  }
}
