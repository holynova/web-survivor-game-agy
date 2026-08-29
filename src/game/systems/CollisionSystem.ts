import { EventBus } from '@/core/event-bus';
import { distanceSquared } from '@/core/math';
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

export interface DoubleLootProvider {
  doubleLootRemaining: number;
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
    doubleLootProvider?: DoubleLootProvider;
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
      doubleLootProvider,
      dt,
    } = params;

    // 1. 投射物碰撞检测
    const activeProjectiles = projectilePool.getActiveItems();
    for (let i = activeProjectiles.length - 1; i >= 0; i--) {
      const p = activeProjectiles[i];
      if (!p.isActive) continue;

      // 妖魔远程子弹击中玩家检测
      if (p.isEnemy) {
        const pDistSq = distanceSquared(p.x, p.y, player.position.x, player.position.y);
        const rSum = p.radius + player.radius;
        if (pDistSq <= rSum * rSum) {
          const dmg = player.takeDamage(p.damage);
          if (dmg > 0) {
            const dmgText = damageTextPool.acquire();
            dmgText.spawn(String(dmg), player.position.x, player.position.y - 12, '#e76f51', false);

            EventBus.getInstance().emit('entity:damaged', {
              targetId: 0,
              sourceId: 'enemy_bullet',
              damage: dmg,
              isCrit: false,
              x: player.position.x,
              y: player.position.y,
            });

            EventBus.getInstance().emit('sound:play', { key: 'sfx_hit', volume: 0.7 });

            if (player.currentHp <= 0) {
              EventBus.getInstance().emit('player:died', { cause: 'enemy_bullet' });
            }
          }
          projectilePool.release(p);
        }
        continue;
      }

      // 玩家武器投射物击中敌人检测 (基于空间哈希优化)
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

          // 伤害跳字
          const dmgText = damageTextPool.acquire();
          dmgText.spawn(
            String(dmgDealt),
            enemy.x,
            enemy.y,
            p.isCrit ? '#ffd166' : '#ffffff',
            p.isCrit,
          );

          EventBus.getInstance().emit('entity:damaged', {
            targetId: enemy.id,
            sourceId: p.weaponId,
            damage: dmgDealt,
            isCrit: p.isCrit,
            x: enemy.x,
            y: enemy.y,
          });

          // 击中音效
          EventBus.getInstance().emit('sound:play', {
            key: 'sfx_hit',
            volume: p.isCrit ? 0.8 : 0.5,
          });

          // 触发吸血滋补效果 (当归药膳)
          if (player.lifestealChance > 0 && rng.next() < player.lifestealChance) {
            player.heal(player.lifestealAmount);
            const healText = damageTextPool.acquire();
            healText.spawn(`💚 +${player.lifestealAmount}`, player.position.x, player.position.y - 14, '#2a9d8f', false);
          }

          // 触发武器附加效果 (击退、灼烧、减速)
          for (const eff of p.effects) {
            if (eff.type === 'knockback') {
              const kx = enemy.x - player.position.x;
              const ky = enemy.y - player.position.y;
              const kDist = Math.sqrt(kx * kx + ky * ky);
              if (kDist > 0.001) {
                enemy.applyKnockback(kx / kDist, ky / kDist, eff.value);
              }
            } else if (eff.type === 'burn') {
              enemy.burnStatus = {
                damagePerTick: eff.value,
                durationRemainingMs: eff.durationMs || 3000,
                tickTimerMs: 0,
                tickIntervalMs: 500,
                sourceId: p.weaponId,
              };
            } else if (eff.type === 'slow') {
              enemy.slowStatus = {
                slowFactor: eff.value,
                durationRemainingMs: eff.durationMs || 2500,
              };
            }
          }

          // 检查敌人击杀
          if (enemy.currentHp <= 0) {
            this.handleEnemyDeath(enemy, player, enemyPool, dropPool, spatialHash, rng, stats);
          }

          // 穿透损耗判定
          if (p.attackPattern === 'projectile') {
            p.pierceRemaining--;
            if (p.pierceRemaining <= 0) {
              projectilePool.release(p);
              break;
            }
          }
        }
      }
    }

    // 2. 玩家与敌人接触伤害判定
    if (!player.isInvincible && player.iFrameTimerSec <= 0) {
      this.tempNearbyEnemies.length = 0;
      spatialHash.queryRadius(player.position.x, player.position.y, player.radius + 15, this.tempNearbyEnemies);

      for (let i = 0; i < this.tempNearbyEnemies.length; i++) {
        const enemy = this.tempNearbyEnemies[i];
        if (!enemy.isActive) continue;

        const distSq = distanceSquared(player.position.x, player.position.y, enemy.x, enemy.y);
        const rSum = player.radius + enemy.radius;

        if (distSq <= rSum * rSum) {
          const dmgDealt = player.takeDamage(enemy.contactDamage);
          if (dmgDealt > 0) {
            const dmgText = damageTextPool.acquire();
            dmgText.spawn(String(dmgDealt), player.position.x, player.position.y - 12, '#e76f51', false);

            EventBus.getInstance().emit('entity:damaged', {
              targetId: 0,
              sourceId: 'contact',
              damage: dmgDealt,
              isCrit: false,
              x: player.position.x,
              y: player.position.y,
            });

            EventBus.getInstance().emit('sound:play', { key: 'sfx_hit', volume: 0.8 });

            if (player.currentHp <= 0) {
              EventBus.getInstance().emit('player:died', { cause: 'contact' });
            }
          }
          break; // 每次受击触发单次判定与无敌帧
        }
      }
    }

    // 3. 掉落物拾取与磁铁吸附 (包含双倍收益留存 & 美食回血)
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
          // 拾取成功：计算是否触发双倍留存收益
          let effectiveValue = drop.value;
          let isDouble = false;

          if (doubleLootProvider && doubleLootProvider.doubleLootRemaining > 0) {
            doubleLootProvider.doubleLootRemaining--;
            effectiveValue = drop.value * 2;
            isDouble = true;
          }

          if (drop.type === 'food') {
            // 拾取美食恢复生命
            player.heal(effectiveValue);
            const healText = damageTextPool.acquire();
            healText.spawn(`💚 +${effectiveValue} HP`, player.position.x, player.position.y - 14, '#06d6a0', true);
            EventBus.getInstance().emit('sound:play', { key: 'sfx_pickup', volume: 0.8 });
          } else if (drop.type === 'heat') {
            const leveledUp = player.addExp(effectiveValue);
            if (leveledUp) {
              EventBus.getInstance().emit('player:levelup', { newLevel: player.level });
            }
            if (isDouble) {
              const dmgText = damageTextPool.acquire();
              dmgText.spawn(`EXP x2`, drop.x, drop.y - 12, '#ffd166', true);
            }
          } else if (drop.type === 'ingredient') {
            player.ingredients += effectiveValue;
            stats.ingredientsEarned += effectiveValue;
            if (isDouble) {
              const dmgText = damageTextPool.acquire();
              dmgText.spawn(`🥟 +${effectiveValue} (双倍!)`, drop.x, drop.y - 12, '#ffd166', true);
            }
          }

          EventBus.getInstance().emit('drop:collected', {
            dropType: drop.type,
            value: effectiveValue,
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
      if (!text.isActive) continue;
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
    enemy.isActive = false;
    stats.totalKills++;

    EventBus.getInstance().emit('entity:died', {
      entityId: enemy.id,
      enemyTypeId: enemy.definition.id,
      x: enemy.x,
      y: enemy.y,
      isBoss: enemy.isBoss,
    });

    // 触发枸杞击杀回血
    if (player.healOnKill > 0) {
      player.heal(player.healOnKill);
    }

    // 爆出美食(回血)、火候(经验)或食材(金币)
    const foodChance = enemy.isBoss ? 0.9 : enemy.isElite ? 0.4 : 0.07;
    if (rng.next() < foodChance) {
      const foodDrop = dropPool.acquire();
      foodDrop.spawn('food', enemy.isBoss ? 50 : 25, enemy.x, enemy.y);
    } else if (rng.next() < enemy.ingredientChance) {
      const ingDrop = dropPool.acquire();
      ingDrop.spawn('ingredient', enemy.ingredientValue, enemy.x, enemy.y);
    } else {
      const heatDrop = dropPool.acquire();
      heatDrop.spawn('heat', enemy.expValue, enemy.x, enemy.y);
    }

    enemyPool.release(enemy);
    spatialHash.remove(enemy);
  }
}
