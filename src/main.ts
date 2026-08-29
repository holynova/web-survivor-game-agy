import Phaser from 'phaser';
import { GAME_CONFIG } from './game/config';
import { AudioManager } from './game/presentation/audio';

// 声明构建注入的全局变量
declare const __APP_VERSION__: string;

class App {
  private game: Phaser.Game | null = null;

  public init(): void {
    this.setupErrorBoundary();
    this.setupStartOverlay();
  }

  private setupErrorBoundary(): void {
    const errorBoundary = document.getElementById('error-boundary');
    const errorMessage = document.getElementById('error-message');
    const errorStack = document.getElementById('error-stack');
    const reloadBtn = document.getElementById('reload-btn');

    const showError = (msg: string, stack?: string) => {
      if (errorBoundary && errorMessage && errorStack) {
        errorMessage.textContent = msg;
        errorStack.textContent = stack || '';
        errorBoundary.classList.remove('hidden');
      }
    };

    window.onerror = (message, source, lineno, colno, error) => {
      showError(`运行时错误: ${message} (${source}:${lineno}:${colno})`, error?.stack);
      return false;
    };

    window.onunhandledrejection = event => {
      showError(`未捕获的 Promise 异常: ${event.reason}`, event.reason?.stack);
    };

    if (reloadBtn) {
      reloadBtn.addEventListener('click', () => {
        window.location.reload();
      });
    }
  }

  private setupStartOverlay(): void {
    const startOverlay = document.getElementById('start-overlay');
    const startBtn = document.getElementById('start-btn');
    const versionTag = document.getElementById('app-version-tag');

    if (versionTag && typeof __APP_VERSION__ !== 'undefined') {
      versionTag.textContent = `v${__APP_VERSION__}`;
    }

    if (startBtn && startOverlay) {
      startBtn.addEventListener('click', () => {
        // 用户首次手势解锁音频
        AudioManager.getInstance().unlock();

        startOverlay.style.opacity = '0';
        setTimeout(() => {
          startOverlay.classList.add('hidden');
          this.startGame();
        }, 300);
      });
    } else {
      this.startGame();
    }
  }

  private startGame(): void {
    if (!this.game) {
      this.game = new Phaser.Game(GAME_CONFIG);
      (window as unknown as { __PHASER_GAME__: Phaser.Game }).__PHASER_GAME__ = this.game;
    }
  }
}

const app = new App();
app.init();
