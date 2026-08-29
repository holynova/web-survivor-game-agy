import { EventBus } from '@/core/event-bus';
import { ObjectPool } from '@/core/pool';
import { SeededRNG } from '@/core/rng';
import { DamageText } from '../entities/DamageText';
import { Drop } from '../entities/Drop';
import { Enemy } from '../entities/Enemy';
import { Player } from '../entities/Player';
import { SpatialHash } from '../spatial/spatial-hash';
import { CollisionSystem, RunStatistics } from './CollisionSystem';

export class StatusSystem {
  public update(params: {
    player: Player;
    enemies: readonly Enemy[];
    enemyPool: ObjectPool<Enemy>;
    dropPool: ObjectPool<Drop>;
    damageTextPool: ObjectPool<DamageText>;
    spatialHash: SpatialHash<Enemy>;
    rng: SeededRNG;
    stats: RunStatistics;
    collisionSystem: CollisionSystem;
    dt: number;
  }): void {
    const { player, enemies, enemyPool, dropPool, damageTextPool, spatialHash, rng, stats, collisionSystem, dt } = params;
    const dtMs = dt * 1000;

    for (let i = 0; i < enemies.length; i++) {
      const enemy = enemies[i];
      if (!enemy.isActive) continue;

      // 1. 处理减速持续时间
      if (enemy.slowStatus) {
        enemy.slowStatus.durationRemainingMs -= dtMs;
        if (enemy.slowStatus.durationRemainingMs <= 0) {
          enemy.slowStatus = undefined;
        }
      }

      // 2. 处理灼烧 DoT
      if (enemy.burnStatus) {
        enemy.burnStatus.durationRemainingMs -= dtMs;
        enemy.burnStatus.tickTimerMs += dtMs;

        if (enemy.burnStatus.tickTimerMs >= enemy.burnStatus.tickIntervalMs) {
          enemy.burnStatus.tickTimerMs = 0;
          const dmg = enemy.takeDamage(enemy.burnStatus.damagePerTick);
          stats.totalDamageDealt += dmg;
          stats.damageByWeapon[enemy.burnStatus.sourceId] =
            (stats.damageByWeapon[enemy.burnStatus.sourceId] || 0) + dmg;

          const dmgText = damageTextPool.acquire();
          dmgText.spawn(`${dmg}`, enemy.x, enemy.y, '#e76f51', false);

          EventBus.getInstance().emit('entity:damaged', {
            targetId: enemy.id,
            sourceId: enemy.burnStatus.sourceId,
            damage: dmg,
            isCrit: false,
            x: enemy.x,
            y: enemy.y,
          });

          if (enemy.currentHp <= 0) {
            collisionSystem.handleEnemyDeath(enemy, player, enemyPool, dropPool, spatialHash, rng, stats);
          }
        }

        if (enemy.burnStatus && enemy.burnStatus.durationRemainingMs <= 0) {
          enemy.burnStatus = undefined;
        }
      }
    }
  }
}
