import { EventBus } from '@/core/event-bus';
import { distanceSquared, Vector2 } from '@/core/math';
import { ObjectPool } from '@/core/pool';
import { SeededRNG } from '@/core/rng';
import { DamageText } from '../entities/DamageText';
import { Drop } from '../entities/Drop';
import { Enemy } from '../entities/Enemy';
import { Player } from '../entities/Player';
import { Projectile } from '../entities/Projectile';
import { SpatialHash } from '../spatial/spatial-hash';

export interface RunStatistics {
  totalKills: number;
  totalDamageDealt: number;
  damageByWeapon: Record<string, number>;
  ingredientsEarned: number;
  timeSurvivedSec: number;
}

export class CollisionSystem {
  private tempNearbyEnemies: Enemy[] = [];

  public update(params: {
    player: Player;
    enemies: readonly Enemy[];
    projectilePool: ObjectPool<Projectile>;
    enemyPool: ObjectPool<Enemy>;
    dropPool: ObjectPool<Drop>;
    damageTextPool: ObjectPool<DamageText>;
    spatialHash: SpatialHash<Enemy>;
    rng: SeededRNG;
    stats: RunStatistics;
    dt: number;
  }): void {
    const {
      player,
      projectilePool,
      enemyPool,
      dropPool,
      damageTextPool,
      spatialHash,
      rng,
      stats,
      dt,
    } = params;

    // 1. 投射物与敌人碰撞检测 (基于空间哈希优化)
    const activeProjectiles = projectilePool.getActiveItems();
    for (let i = activeProjectiles.length - 1; i >= 0; i--) {
      const p = activeProjectiles[i];
      if (!p.isActive) continue;

      this.tempNearbyEnemies.length = 0;
      spatialHash.queryRadius(p.x, p.y, p.radius, this.tempNearbyEnemies);

      for (let j = 0; j < this.tempNearbyEnemies.length; j++) {
        const enemy = this.tempNearbyEnemies[j];
        if (!enemy.isActive) continue;

        // 避免单发穿透子弹在同一帧内对同一敌人重复判定
        if (p.attackPattern !== 'area' && p.attackPattern !== 'orbit' && p.hitEnemyIds.has(enemy.id)) {
          continue;
        }

        // 持续区域/环绕/召唤物的冷却防重判定
        if (p.attackPattern === 'area' || p.attackPattern === 'orbit') {
          if (p.hitEnemyIds.has(enemy.id) && p.tickDamageTimerMs < 300) {
            continue;
          }
        }

        const distSq = distanceSquared(p.x, p.y, enemy.x, enemy.y);
        const rSum = p.radius + enemy.radius;

        if (distSq <= rSum * rSum) {
          p.hitEnemyIds.add(enemy.id);

          // 伤害与效果结算
          const dmgDealt = enemy.takeDamage(p.damage);
          stats.totalDamageDealt += dmgDealt;
          stats.damageByWeapon[p.weaponId] = (stats.damageByWeapon[p.weaponId] || 0) + dmgDealt;

          // 生成漂字
          const dmgText = damageTextPool.acquire();
          dmgText.spawn(
            `${dmgDealt}${p.isCrit ? '!' : ''}`,
            enemy.x,
            enemy.y,
            p.isCrit ? '#ffd166' : p.color,
            p.isCrit,
          );

          // 击退
          const hitDir = new Vector2(enemy.x - p.x, enemy.y - p.y).normalize();
          for (const eff of p.effects) {
            if (eff.type === 'knockback') {
              enemy.applyKnockback(hitDir.x, hitDir.y, eff.value);
            } else if (eff.type === 'burn') {
              enemy.burnStatus = {
                damagePerTick: eff.value,
                durationRemainingMs: eff.durationMs || 2000,
                tickIntervalMs: eff.tickIntervalMs || 500,
                tickTimerMs: 0,
                sourceId: p.weaponId,
              };
            } else if (eff.type === 'slow') {
              enemy.slowStatus = {
                slowFactor: eff.value,
                durationRemainingMs: eff.durationMs || 2000,
              };
            }
          }

          EventBus.getInstance().emit('entity:damaged', {
            targetId: enemy.id,
            sourceId: p.weaponId,
            damage: dmgDealt,
            isCrit: p.isCrit,
            x: enemy.x,
            y: enemy.y,
          });

          // 检查敌人死亡
          if (enemy.currentHp <= 0) {
            this.handleEnemyDeath(enemy, player, enemyPool, dropPool, spatialHash, rng, stats);
          }

          // 消耗穿透次数
          if (p.attackPattern !== 'area' && p.attackPattern !== 'orbit' && p.attackPattern !== 'summon') {
            p.pierceRemaining--;
            if (p.pierceRemaining <= 0) {
              projectilePool.release(p);
              break;
            }
          }
        }
      }

      if (p.attackPattern === 'area' || p.attackPattern === 'orbit') {
        if (p.tickDamageTimerMs >= 300) {
          p.tickDamageTimerMs = 0;
          p.hitEnemyIds.clear();
        }
      }
    }

    // 2. 敌人与玩家接触碰撞检测
    if (player.currentHp > 0) {
      const px = player.position.x;
      const py = player.position.y;
      this.tempNearbyEnemies.length = 0;
      spatialHash.queryRadius(px, py, player.radius, this.tempNearbyEnemies);

      for (let i = 0; i < this.tempNearbyEnemies.length; i++) {
        const enemy = this.tempNearbyEnemies[i];
        if (!enemy.isActive) continue;

        const distSq = distanceSquared(px, py, enemy.x, enemy.y);
        const rSum = player.radius + enemy.radius;

        if (distSq <= rSum * rSum) {
          const dmg = player.takeDamage(enemy.contactDamage);
          if (dmg > 0) {
            const dmgText = damageTextPool.acquire();
            dmgText.spawn(`-${dmg}`, px, py, '#e63946', false);

            EventBus.getInstance().emit('sound:play', {
              key: 'sfx_player_hurt',
              volume: 0.6,
            });

            if (player.currentHp <= 0) {
              EventBus.getInstance().emit('player:died', {
                cause: enemy.definition.nameKey,
              });
            }
          }
        }
      }
    }

    // 3. 掉落物拾取与磁铁吸附
    const activeDrops = dropPool.getActiveItems();
    const pickupRadiusSq = player.pickupRadius * player.pickupRadius;
    const px = player.position.x;
    const py = player.position.y;

    for (let i = activeDrops.length - 1; i >= 0; i--) {
      const drop = activeDrops[i];
      const distSq = distanceSquared(drop.x, drop.y, px, py);

      if (distSq <= pickupRadiusSq) {
        drop.isMagnetized = true;
      }

      if (drop.isMagnetized) {
        const dx = px - drop.x;
        const dy = py - drop.y;
        const d = Math.sqrt(distSq);

        if (d > 6) {
          drop.x += (dx / d) * drop.magnetSpeed * dt;
          drop.y += (dy / d) * drop.magnetSpeed * dt;
        } else {
          // 拾取成功
          if (drop.type === 'heat') {
            const leveledUp = player.addExp(drop.value);
            if (leveledUp) {
              EventBus.getInstance().emit('player:levelup', { newLevel: player.level });
            }
          } else if (drop.type === 'ingredient') {
            player.ingredients += drop.value;
            stats.ingredientsEarned += drop.value;
          }

          EventBus.getInstance().emit('drop:collected', {
            dropType: drop.type,
            value: drop.value,
            x: drop.x,
            y: drop.y,
          });

          dropPool.release(drop);
        }
      }
    }

    // 4. 更新飘字生命周期
    const activeTexts = damageTextPool.getActiveItems();
    for (let i = activeTexts.length - 1; i >= 0; i--) {
      const text = activeTexts[i];
      text.lifeMs -= dt * 1000;
      text.y += text.vy * dt;
      if (text.lifeMs <= 0) {
        damageTextPool.release(text);
      }
    }
  }

  public handleEnemyDeath(
    enemy: Enemy,
    player: Player,
    enemyPool: ObjectPool<Enemy>,
    dropPool: ObjectPool<Drop>,
    spatialHash: SpatialHash<Enemy>,
    rng: SeededRNG,
    stats: RunStatistics,
  ): void {
    stats.totalKills++;

    // 掉落热度（经验）
    const heatDrop = dropPool.acquire();
    heatDrop.spawn('heat', enemy.expValue, enemy.x, enemy.y);

    // 概率掉落食材
    let ingredientBonus = 0;
    for (const item of player.items) {
      for (const mod of item.definition.modifiers) {
        if (mod.stat === 'ingredientDropBonus') {
          ingredientBonus += mod.value * item.count;
        }
      }
    }

    if (rng.next() < enemy.ingredientChance + ingredientBonus) {
      const ingredientDrop = dropPool.acquire();
      ingredientDrop.spawn(
        'ingredient',
        enemy.ingredientValue,
        enemy.x + rng.nextFloat(-8, 8),
        enemy.y + rng.nextFloat(-8, 8),
      );
    }

    EventBus.getInstance().emit('entity:died', {
      entityId: enemy.id,
      enemyTypeId: enemy.definition.id,
      x: enemy.x,
      y: enemy.y,
      isBoss: enemy.isBoss,
    });

    spatialHash.remove(enemy);
    enemyPool.release(enemy);
  }
}
