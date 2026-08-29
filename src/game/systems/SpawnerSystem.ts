import { ENEMIES } from '@/content/enemies/data';
import { DifficultyDefinition } from '@/content/difficulty/data';
import { WaveDefinition } from '@/content/schemas/wave';
import { ObjectPool } from '@/core/pool';
import { SeededRNG } from '@/core/rng';
import { Enemy, EnemyStatMultipliers } from '../entities/Enemy';
import { Player } from '../entities/Player';
import { SpatialHash } from '../spatial/spatial-hash';

export class SpawnerSystem {
  private spawnTimers: Map<string, number> = new Map();
  private bossSpawned = false;

  public reset(): void {
    this.spawnTimers.clear();
    this.bossSpawned = false;
  }

  public update(
    wave: WaveDefinition,
    _waveElapsedSec: number,
    player: Player,
    enemyPool: ObjectPool<Enemy>,
    spatialHash: SpatialHash<Enemy>,
    rng: SeededRNG,
    dt: number,
    difficulty?: DifficultyDefinition,
  ): void {
    // 检查是否达到同屏最大怪物上限
    if (enemyPool.getActiveCount() >= wave.maxActiveEnemies) {
      return;
    }

    const mults: EnemyStatMultipliers = {
      hpMult: difficulty?.enemyHpMultiplier || 1,
      dmgMult: difficulty?.enemyDamageMultiplier || 1,
      spdMult: difficulty?.enemySpeedMultiplier || 1,
    };

    const intervalScale = difficulty?.spawnIntervalMultiplier || 1;

    // 1. 生成 Boss（如果是 Boss 波且未生成）
    if (wave.isBossWave && wave.bossId && !this.bossSpawned) {
      const bossDef = ENEMIES[wave.bossId];
      if (bossDef) {
        this.spawnEnemyAtDistance(bossDef, player, 480, enemyPool, spatialHash, rng, mults);
        this.bossSpawned = true;
      }
    }

    // 2. 按照波次条目生成小怪与精英
    for (const entry of wave.spawnEntries) {
      if (entry.enemyId === wave.bossId) continue; // Boss 不走常规循环刷怪

      let timer = this.spawnTimers.get(entry.enemyId) || 0;
      timer += dt * 1000;

      const effectiveInterval = entry.intervalMs * intervalScale;

      if (timer >= effectiveInterval) {
        timer = 0;
        const enemyDef = ENEMIES[entry.enemyId];
        if (enemyDef) {
          const spawnCount = Math.min(
            entry.batchSize,
            wave.maxActiveEnemies - enemyPool.getActiveCount(),
          );
          for (let i = 0; i < spawnCount; i++) {
            this.spawnEnemyAtDistance(enemyDef, player, 520 + rng.nextFloat(0, 120), enemyPool, spatialHash, rng, mults);
          }
        }
      }

      this.spawnTimers.set(entry.enemyId, timer);
    }
  }

  private spawnEnemyAtDistance(
    enemyDef: typeof ENEMIES[string],
    player: Player,
    distance: number,
    enemyPool: ObjectPool<Enemy>,
    spatialHash: SpatialHash<Enemy>,
    rng: SeededRNG,
    mults: EnemyStatMultipliers,
  ): void {
    const angle = rng.nextFloat(0, Math.PI * 2);
    const spawnX = player.position.x + Math.cos(angle) * distance;
    const spawnY = player.position.y + Math.sin(angle) * distance;

    const enemy = enemyPool.acquire();
    enemy.spawn(enemyDef, spawnX, spawnY, mults);
    spatialHash.insert(enemy);
  }
}
