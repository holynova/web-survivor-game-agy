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
  private spriteSync!: SpriteSyncSystem;
  private hud!: HUD;
  private levelUpModal!: LevelUpModal;
  private shopModal!: ShopModal;
  private pauseModal!: PauseModal;
  private debugOverlay!: DebugOverlay;

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

    // 2. 初始化表现层与渲染同步器
    this.spriteSync = new SpriteSyncSystem(this);
    this.hud = new HUD(this);
    this.debugOverlay = new DebugOverlay(this);

    // 3. 初始化模态交互窗口
    this.levelUpModal = new LevelUpModal(this, () => {
      this.world.resumeGame();
    });

    this.shopModal = new ShopModal(this, () => {
      this.world.waveSystem.nextWave();
      this.world.resumeGame();
    });

    this.pauseModal = new PauseModal(
      this,
      () => {
        this.world.resumeGame();
      },
      () => {
        this.scene.restart({ characterId });
      },
    );

    // 4. 配置摄像机跟随
    this.cameras.main.startFollow(this.world.player.position, true, 0.1, 0.1);
    this.cameras.main.setBounds(-1400, -1400, 2800, 2800);

    // 5. 绑定键盘输入
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
          this.pauseModal.show();
        } else if (this.world.gameState === 'paused') {
          this.pauseModal.hide();
          this.world.resumeGame();
        }
      });
    }

    // 6. 绑定全局领域事件流转
    this.bindEvents(characterId);
  }

  private bindEvents(characterId: string): void {
    const bus = EventBus.getInstance();

    this.eventUnsubscribers.push(
      bus.on('player:died', () => {
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

    // 3. 检查整备期弹窗状态
    if (this.world.gameState === 'shop' && !this.shopModal.isVisible()) {
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
