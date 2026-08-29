import { CHARACTERS } from '@/content/characters/data';
import { WEAPONS } from '@/content/weapons/data';
import { EventBus } from '@/core/event-bus';
import { ObjectPool } from '@/core/pool';
import { SeededRNG } from '@/core/rng';
import { DamageText } from '../entities/DamageText';
import { Drop } from '../entities/Drop';
import { Enemy } from '../entities/Enemy';
import { Player } from '../entities/Player';
import { Projectile } from '../entities/Projectile';
import { SpatialHash } from '../spatial/spatial-hash';
import { CollisionSystem, RunStatistics } from '../systems/CollisionSystem';
import { MovementSystem } from '../systems/MovementSystem';
import { RecipeSystem } from '../systems/RecipeSystem';
import { SpawnerSystem } from '../systems/SpawnerSystem';
import { StatusSystem } from '../systems/StatusSystem';
import { WaveSystem } from '../systems/WaveSystem';
import { WeaponSystem } from '../systems/WeaponSystem';
import { SimulationClock } from './clock';

export type GameState = 'playing' | 'paused' | 'levelup' | 'shop' | 'victory' | 'gameover';

export class SimulationWorld {
  public player!: Player;
  public enemyPool: ObjectPool<Enemy>;
  public projectilePool: ObjectPool<Projectile>;
  public dropPool: ObjectPool<Drop>;
  public damageTextPool: ObjectPool<DamageText>;

  public spatialHash: SpatialHash<Enemy>;
  public rng: SeededRNG;
  public clock: SimulationClock;

  public movementSystem = new MovementSystem();
  public spawnerSystem = new SpawnerSystem();
  public weaponSystem = new WeaponSystem();
  public collisionSystem = new CollisionSystem();
  public statusSystem = new StatusSystem();
  public waveSystem = new WaveSystem();
  public recipeSystem = new RecipeSystem();

  public inputVector = { x: 0, y: 0 };
  public gameState: GameState = 'playing';
  public statistics: RunStatistics = {
    totalKills: 0,
    totalDamageDealt: 0,
    damageByWeapon: {},
    ingredientsEarned: 0,
    timeSurvivedSec: 0,
  };

  private eventUnsubscribers: (() => void)[] = [];

  constructor(seed: number | string = Date.now()) {
    this.rng = new SeededRNG(seed);
    this.clock = new SimulationClock();

    this.enemyPool = new ObjectPool<Enemy>(() => new Enemy(), 128);
    this.projectilePool = new ObjectPool<Projectile>(() => new Projectile(), 256);
    this.dropPool = new ObjectPool<Drop>(() => new Drop(), 256);
    this.damageTextPool = new ObjectPool<DamageText>(() => new DamageText(), 128);

    this.spatialHash = new SpatialHash<Enemy>(64);

    this.bindEvents();
  }

  private bindEvents(): void {
    const bus = EventBus.getInstance();

    this.eventUnsubscribers.push(
      bus.on('player:died', () => {
        this.gameState = 'gameover';
        this.clock.pause();
      }),
    );

    this.eventUnsubscribers.push(
      bus.on('game:victory', () => {
        this.gameState = 'victory';
        this.clock.pause();
      }),
    );

    this.eventUnsubscribers.push(
      bus.on('player:levelup', () => {
        this.gameState = 'levelup';
        this.clock.pause();
      }),
    );
  }

  public initGame(characterId = 'wok_master'): void {
    const charDef = CHARACTERS[characterId] || CHARACTERS.wok_master;
    this.player = new Player(charDef, 0, 0);

    // 装备初始武器
    const startWeapon = WEAPONS[charDef.startingWeaponId];
    if (startWeapon) {
      this.player.equipWeapon(startWeapon);
    }

    this.resetState();
    this.waveSystem.startFirstWave();
    this.clock.start();
  }

  public resetState(): void {
    this.enemyPool.releaseAll();
    this.projectilePool.releaseAll();
    this.dropPool.releaseAll();
    this.damageTextPool.releaseAll();
    this.spatialHash.clear();
    this.spawnerSystem.reset();
    this.waveSystem.reset();

    this.gameState = 'playing';
    this.statistics = {
      totalKills: 0,
      totalDamageDealt: 0,
      damageByWeapon: {},
      ingredientsEarned: 0,
      timeSurvivedSec: 0,
    };
  }

  /**
   * 固定逻辑步长更新 (每秒执行 60 次)
   */
  public updateStep(dt: number): void {
    if (this.gameState !== 'playing') return;

    this.statistics.timeSurvivedSec += dt;

    // 1. 检查是否有 Boss 在场
    const isBossAlive = this.enemyPool.getActiveItems().some(e => e.isBoss && e.isActive);

    // 2. 波次逻辑更新与整备期状态流转
    const { phaseChanged, newPhase } = this.waveSystem.update(dt, isBossAlive);
    if (phaseChanged && newPhase === 'preparation') {
      this.gameState = 'shop';
      this.clock.pause();
      return;
    }

    // 3. 玩家与敌人移动
    this.movementSystem.updatePlayer(this.player, this.inputVector.x, this.inputVector.y, dt);
    this.movementSystem.updateEnemies(
      this.enemyPool.getActiveItems(),
      this.player,
      this.spatialHash,
      dt,
    );

    // 4. 刷怪系统
    if (this.waveSystem.wavePhase === 'battle') {
      this.spawnerSystem.update(
        this.waveSystem.currentWave,
        this.waveSystem.waveTimerSec,
        this.player,
        this.enemyPool,
        this.spatialHash,
        this.rng,
        dt,
      );
    }

    // 5. 武器攻击与弹道调度
    this.weaponSystem.update(
      this.player,
      this.enemyPool.getActiveItems(),
      this.projectilePool,
      this.spatialHash,
      this.rng,
      dt,
    );

    // 6. 状态效果与持续伤害
    this.statusSystem.update({
      player: this.player,
      enemies: this.enemyPool.getActiveItems(),
      enemyPool: this.enemyPool,
      dropPool: this.dropPool,
      damageTextPool: this.damageTextPool,
      spatialHash: this.spatialHash,
      rng: this.rng,
      stats: this.statistics,
      collisionSystem: this.collisionSystem,
      dt,
    });

    // 7. 碰撞检测与伤害结算
    this.collisionSystem.update({
      player: this.player,
      enemies: this.enemyPool.getActiveItems(),
      projectilePool: this.projectilePool,
      enemyPool: this.enemyPool,
      dropPool: this.dropPool,
      damageTextPool: this.damageTextPool,
      spatialHash: this.spatialHash,
      rng: this.rng,
      stats: this.statistics,
      dt,
    });

    // 8. 菜谱质变检测
    this.recipeSystem.evaluateRecipes(this.player);
  }

  public resumeGame(): void {
    if (this.gameState === 'levelup' || this.gameState === 'shop' || this.gameState === 'paused') {
      this.gameState = 'playing';
      this.clock.resume();
    }
  }

  public destroy(): void {
    for (const unsub of this.eventUnsubscribers) {
      unsub();
    }
    this.eventUnsubscribers = [];
    this.clock.destroy();
  }
}
