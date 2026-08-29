import Phaser from 'phaser';
import { EventBus } from '@/core/event-bus';
import { DebugOverlay } from '@/debug/DebugOverlay';
import { AudioManager } from '../presentation/audio';
import { SpriteSyncSystem } from '../presentation/sprite-sync';
import { SimulationWorld } from '../simulation/world';
import { HUD } from '../ui/HUD';
import { LevelUpModal } from '../ui/LevelUpModal';
import { PauseModal } from '../ui/PauseModal';
import { ShopModal } from '../ui/ShopModal';

export class RunScene extends Phaser.Scene {
  public world!: SimulationWorld;
  public spriteSync!: SpriteSyncSystem;
  public hud!: HUD;
  public levelUpModal!: LevelUpModal;
  public shopModal!: ShopModal;
  public pauseModal!: PauseModal;
  public debugOverlay!: DebugOverlay;

  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private wasdKeys!: {
    W: Phaser.Input.Keyboard.Key;
    A: Phaser.Input.Keyboard.Key;
    S: Phaser.Input.Keyboard.Key;
    D: Phaser.Input.Keyboard.Key;
  };
  private escKey!: Phaser.Input.Keyboard.Key;

  private eventUnsubscribers: (() => void)[] = [];

  constructor() {
    super({ key: 'RunScene' });
  }

  public create(data: { characterId?: string }): void {
    const characterId = data.characterId || 'wok_master';

    // 1. 初始化世界模拟与实体
    this.world = new SimulationWorld(Date.now());
    this.world.initGame(characterId);

    // 2. 初始化音效管理器与战斗音乐
    AudioManager.getInstance().setSoundManager(this.sound);
    AudioManager.getInstance().playBgm('bgm_battle', true, 0.45);

    // 3. 初始化表现层与渲染同步器
    this.spriteSync = new SpriteSyncSystem(this);
    this.hud = new HUD(this);
    this.debugOverlay = new DebugOverlay(this);

    // 4. 初始化模态交互窗口
    this.levelUpModal = new LevelUpModal(this, () => {
      this.world.resumeGame();
    });

    this.shopModal = new ShopModal(this, () => {
      AudioManager.getInstance().playBgm('bgm_battle', true, 0.45);
      this.world.waveSystem.nextWave();
      this.world.resumeGame();
    });

    this.pauseModal = new PauseModal(
      this,
      () => {
        this.world.resumeGame();
      },
      () => {
        AudioManager.getInstance().stopBgm();
        this.scene.restart({ characterId });
      },
    );

    // 5. 配置摄像机跟随
    this.cameras.main.startFollow(this.world.player.position, true, 0.1, 0.1);
    this.cameras.main.setBounds(-1400, -1400, 2800, 2800);

    // 6. 绑定键盘输入
    if (this.input.keyboard) {
      this.cursors = this.input.keyboard.createCursorKeys();
      this.wasdKeys = {
        W: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.W),
        A: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.A),
        S: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.S),
        D: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D),
      };
      this.escKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ESC);
      this.escKey.on('down', () => {
        if (this.world.gameState === 'playing') {
          this.world.gameState = 'paused';
          this.world.clock.pause();
          this.pauseModal.show(this.world.player, this.world);
        } else if (this.world.gameState === 'paused') {
          this.pauseModal.hide();
          this.world.resumeGame();
        }
      });
    }

    // 7. 绑定全局领域事件流转
    this.bindEvents(characterId);
  }

  private bindEvents(characterId: string): void {
    const bus = EventBus.getInstance();

    this.eventUnsubscribers.push(
      bus.on('player:died', () => {
        AudioManager.getInstance().stopBgm();
        AudioManager.getInstance().playSfx('sfx_gameover', 0.8);
        this.time.delayedCall(1200, () => {
          this.scene.start('ResultsScene', {
            isVictory: false,
            characterId,
            stats: this.world.statistics,
            waveReached: this.world.waveSystem.currentWave.waveNumber,
            activeRecipes: this.world.player.activeRecipes,
            seed: this.world.rng.getSeed(),
          });
        });
      }),
    );

    this.eventUnsubscribers.push(
      bus.on('game:victory', () => {
        AudioManager.getInstance().stopBgm();
        this.time.delayedCall(1500, () => {
          this.scene.start('ResultsScene', {
            isVictory: true,
            characterId,
            stats: this.world.statistics,
            waveReached: 12,
            activeRecipes: this.world.player.activeRecipes,
            seed: this.world.rng.getSeed(),
          });
        });
      }),
    );

    this.eventUnsubscribers.push(
      bus.on('player:levelup', () => {
        this.world.gameState = 'levelup';
        this.world.clock.pause();
        AudioManager.getInstance().playSfx('sfx_levelup', 0.7);
        this.levelUpModal.show(this.world.player, this.world.rng);
      }),
    );

    this.eventUnsubscribers.push(
      bus.on('recipe:activated', _data => {
        AudioManager.getInstance().playSfx('sfx_service_bell', 0.9);
        this.cameras.main.flash(400, 255, 180, 0, false);
      }),
    );
  }

  public override update(): void {
    if (!this.world || !this.world.player) return;

    // 1. 获取输入向量 (键盘 + 虚拟摇杆)
    let inputX = 0;
    let inputY = 0;

    if (this.wasdKeys) {
      if (this.wasdKeys.A.isDown || this.cursors.left.isDown) inputX -= 1;
      if (this.wasdKeys.D.isDown || this.cursors.right.isDown) inputX += 1;
      if (this.wasdKeys.W.isDown || this.cursors.up.isDown) inputY -= 1;
      if (this.wasdKeys.S.isDown || this.cursors.down.isDown) inputY += 1;
    }

    const joystick = this.hud.getJoystickVector();
    if (joystick.x !== 0 || joystick.y !== 0) {
      inputX = joystick.x;
      inputY = joystick.y;
    }

    this.world.inputVector.x = inputX;
    this.world.inputVector.y = inputY;

    // 2. 推进物理模拟时钟
    this.world.clock.tick(performance.now(), dt => {
      this.world.updateStep(dt);
    });

    // 3. 检查整备期弹窗状态并切换为夜市商摊音乐
    if (this.world.gameState === 'shop' && !this.shopModal.isVisible()) {
      AudioManager.getInstance().playBgm('bgm_shop', true, 0.4);
      this.shopModal.show(
        this.world.player,
        this.world.rng,
        this.world.waveSystem.currentWave.waveNumber,
      );
    }

    // 4. 渲染表现层
    this.spriteSync.renderWorld(this.world);
    this.hud.update(this.world);
    this.debugOverlay.update(this.world);
  }

  public shutdown(): void {
    AudioManager.getInstance().stopBgm();
    for (const unsub of this.eventUnsubscribers) {
      unsub();
    }
    this.eventUnsubscribers = [];
    this.world.destroy();
    this.spriteSync.destroy();
    this.hud.destroy();
    this.debugOverlay.destroy();
  }
}
