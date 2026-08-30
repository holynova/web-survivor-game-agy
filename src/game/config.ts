import Phaser from 'phaser';
import { BootScene } from './scenes/BootScene';
import { MenuScene } from './scenes/MenuScene';
import { PreloadScene } from './scenes/PreloadScene';
import { ResultsScene } from './scenes/ResultsScene';
import { RunScene } from './scenes/RunScene';

const deviceDpr = typeof window !== 'undefined' ? Math.max(2, Math.min(Math.round(window.devicePixelRatio || 2), 4)) : 2;

// 高清中文字体栈与 3x 超采样分辨率 (彻底消除模糊)
export const HD_FONT_FAMILY = '"PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", "WenQuanYi Micro Hei", "Noto Sans SC", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
export const TEXT_HD_RESOLUTION = 3;

// 全局拦截 Phaser Text 工厂方法，强制所有场景与弹窗使用 3x 超高清光栅化与精细平滑渲染
const originalAddText = Phaser.GameObjects.GameObjectFactory.prototype.text;
Phaser.GameObjects.GameObjectFactory.prototype.text = function (
  x: number,
  y: number,
  text: string | string[],
  style?: Phaser.Types.GameObjects.Text.TextStyle,
) {
  const mergedStyle: Phaser.Types.GameObjects.Text.TextStyle = {
    fontFamily: HD_FONT_FAMILY,
    resolution: TEXT_HD_RESOLUTION,
    ...style,
  };
  if (style && style.resolution === undefined) {
    mergedStyle.resolution = TEXT_HD_RESOLUTION;
  }
  if (style && !style.fontFamily) {
    mergedStyle.fontFamily = HD_FONT_FAMILY;
  }
  const textObj = originalAddText.call(this, x, y, text, mergedStyle);
  textObj.setResolution(TEXT_HD_RESOLUTION);
  return textObj;
};

// 全局拦截 TextStyle 设置，确保动态变更样式依然保持 3x 高清超分辨率
const originalSetStyle = Phaser.GameObjects.TextStyle.prototype.setStyle;
Phaser.GameObjects.TextStyle.prototype.setStyle = function (style, updateText, setDefaults) {
  const customStyle: Phaser.Types.GameObjects.Text.TextStyle = { ...(style as Phaser.Types.GameObjects.Text.TextStyle) };
  if (customStyle.resolution === undefined) {
    customStyle.resolution = TEXT_HD_RESOLUTION;
  }
  if (!customStyle.fontFamily) {
    customStyle.fontFamily = HD_FONT_FAMILY;
  }
  return originalSetStyle.call(this, customStyle, updateText, setDefaults);
};

export const GAME_CONFIG: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  parent: 'game-container',
  width: 1280,
  height: 720,
  pixelArt: false, // 允许 UI 与文字使用高精度矢量平滑抗锯齿
  roundPixels: false, // 禁用整数像素对齐，确保高分辨率文本矢量边缘细腻平滑
  render: {
    antialias: true,
    antialiasGL: true,
    roundPixels: false,
    powerPreference: 'high-performance',
    transparent: false,
    clearBeforeRender: true,
    pixelArt: false,
  },
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
    width: 1280,
    height: 720,
  },
  physics: {
    default: 'arcade',
    arcade: {
      gravity: { x: 0, y: 0 },
      debug: false,
    },
  },
  scene: [BootScene, PreloadScene, MenuScene, RunScene, ResultsScene],
};

(GAME_CONFIG as Record<string, unknown>).resolution = deviceDpr;
