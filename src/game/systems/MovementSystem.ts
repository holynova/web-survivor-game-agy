import { clamp } from '@/core/math';
import { SpatialHash } from '../spatial/spatial-hash';
import { Enemy } from '../entities/Enemy';
import { Player } from '../entities/Player';
import { Projectile } from '../entities/Projectile';
import { ObjectPool } from '@/core/pool';

export interface MapBounds {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
}

export class MovementSystem {
  public static readonly DEFAULT_BOUNDS: MapBounds = {
    minX: -1500,
    minY: -1500,
    maxX: 1500,
    maxY: 1500,
  };

  private tempNeighbors: Enemy[] = [];

  public updatePlayer(
    player: Player,
    inputX: number,
    inputY: number,
    dt: number,
    bounds: MapBounds = MovementSystem.DEFAULT_BOUNDS,
  ): void {
    // 1. 输入速度计算
    const inputLenSq = inputX * inputX + inputY * inputY;
    if (inputLenSq > 0.0001) {
      const invLen = 1 / Math.sqrt(inputLenSq);
      player.velocity.x = inputX * invLen * player.moveSpeed;
      player.velocity.y = inputY * invLen * player.moveSpeed;
      player.facingDirection.set(inputX * invLen, inputY * invLen);
    } else {
      player.velocity.set(0, 0);
    }

    // 2. 积分位移
    player.position.x += player.velocity.x * dt;
    player.position.y += player.velocity.y * dt;

    // 3. 边界限制
    player.position.x = clamp(player.position.x, bounds.minX + player.radius, bounds.maxX - player.radius);
    player.position.y = clamp(player.position.y, bounds.minY + player.radius, bounds.maxY - player.radius);

    // 4. 无敌帧计时
    if (player.iFrameTimerSec > 0) {
      player.iFrameTimerSec = Math.max(0, player.iFrameTimerSec - dt);
    }
  }

  public updateEnemies(
    enemies: readonly Enemy[],
    player: Player,
    spatialHash: SpatialHash<Enemy>,
    dt: number,
    projectilePool?: ObjectPool<Projectile>,
    bounds: MapBounds = MovementSystem.DEFAULT_BOUNDS,
  ): void {
    const px = player.position.x;
    const py = player.position.y;

    for (let i = 0; i < enemies.length; i++) {
      const enemy = enemies[i];
      if (!enemy.isActive) continue;

      const dx = px - enemy.x;
      const dy = py - enemy.y;
      const distSq = dx * dx + dy * dy;
      const dist = Math.sqrt(distSq);
      const invDist = dist > 0.001 ? 1 / dist : 0;

      let effectiveSpeed = enemy.moveSpeed;
      if (enemy.slowStatus) {
        effectiveSpeed *= 1 - enemy.slowStatus.slowFactor;
      }

      const hasCharge = enemy.definition?.behaviors?.includes('charge');
      const hasRanged = enemy.definition?.behaviors?.includes('ranged');

      // 1. 冲刺怪行为
      if (hasCharge) {
        enemy.chargeTimerSec += dt;
        if (enemy.chargeState === 'none') {
          // 常规向玩家移动
          if (distSq > 1) {
            enemy.velocity.x = dx * invDist * effectiveSpeed;
            enemy.velocity.y = dy * invDist * effectiveSpeed;
          } else {
            enemy.velocity.set(0, 0);
          }

          // 距离玩家适中时触发前摇蓄力
          if (enemy.chargeTimerSec >= 3.0 && dist < 360) {
            enemy.chargeState = 'windup';
            enemy.chargeTimerSec = 0;
            enemy.chargeDirection.set(dx * invDist, dy * invDist);
          }
        } else if (enemy.chargeState === 'windup') {
          // 蓄力 0.4s，原地不动并红闪预警
          enemy.velocity.set(0, 0);
          enemy.hitFlashTimerSec = 0.08;
          if (enemy.chargeTimerSec >= 0.4) {
            enemy.chargeState = 'dashing';
            enemy.chargeTimerSec = 0;
          }
        } else if (enemy.chargeState === 'dashing') {
          // 极速冲刺 0.55s
          enemy.velocity.x = enemy.chargeDirection.x * effectiveSpeed * 3.4;
          enemy.velocity.y = enemy.chargeDirection.y * effectiveSpeed * 3.4;
          if (enemy.chargeTimerSec >= 0.55) {
            enemy.chargeState = 'cooldown';
            enemy.chargeTimerSec = 0;
          }
        } else if (enemy.chargeState === 'cooldown') {
          // 冲刺后冷却 2.0s
          if (distSq > 1) {
            enemy.velocity.x = dx * invDist * effectiveSpeed * 0.7;
            enemy.velocity.y = dy * invDist * effectiveSpeed * 0.7;
          }
          if (enemy.chargeTimerSec >= 2.0) {
            enemy.chargeState = 'none';
            enemy.chargeTimerSec = 0;
          }
        }
      }
      // 2. 远程怪行为
      else if (hasRanged) {
        enemy.rangedShootTimerSec += dt;

        // 拉扯走位：过近后退，过远逼近，适中环绕
        if (dist < 190) {
          enemy.velocity.x = -dx * invDist * effectiveSpeed;
          enemy.velocity.y = -dy * invDist * effectiveSpeed;
        } else if (dist > 270) {
          enemy.velocity.x = dx * invDist * effectiveSpeed;
          enemy.velocity.y = dy * invDist * effectiveSpeed;
        } else {
          enemy.velocity.x = -dy * invDist * effectiveSpeed * 0.6;
          enemy.velocity.y = dx * invDist * effectiveSpeed * 0.6;
        }

        // 定期射出妖火/毒丸
        if (enemy.rangedShootTimerSec >= 2.6 && dist < 420 && projectilePool) {
          enemy.rangedShootTimerSec = 0;
          const proj = projectilePool.acquire();
          const bulletSpeed = 220;
          proj.spawn({
            weaponId: 'enemy_bullet',
            attackPattern: 'projectile',
            x: enemy.x,
            y: enemy.y,
            vx: dx * invDist * bulletSpeed,
            vy: dy * invDist * bulletSpeed,
            damage: enemy.contactDamage,
            isCrit: false,
            pierce: 1,
            range: 450,
            durationMs: 2200,
            radius: 8,
            color: '#c77dff',
            isEnemy: true,
          });
        }
      }
      // 3. 常规敌人追踪
      else {
        if (distSq > 1) {
          enemy.velocity.x = dx * invDist * effectiveSpeed;
          enemy.velocity.y = dy * invDist * effectiveSpeed;
        } else {
          enemy.velocity.set(0, 0);
        }
      }

      // 4. 邻域轻量分离 (基于空间哈希防重叠)
      this.tempNeighbors.length = 0;
      spatialHash.queryRadius(enemy.x, enemy.y, enemy.radius * 1.5, this.tempNeighbors);
      for (let j = 0; j < this.tempNeighbors.length; j++) {
        const other = this.tempNeighbors[j];
        if (other.id === enemy.id) continue;
        const sepDx = enemy.x - other.x;
        const sepDy = enemy.y - other.y;
        const sepDistSq = sepDx * sepDx + sepDy * sepDy;
        const minSep = enemy.radius + other.radius;
        if (sepDistSq < minSep * minSep && sepDistSq > 0.001) {
          const sepDist = Math.sqrt(sepDistSq);
          const pushForce = (minSep - sepDist) * 15;
          enemy.velocity.x += (sepDx / sepDist) * pushForce;
          enemy.velocity.y += (sepDy / sepDist) * pushForce;
        }
      }

      // 5. 击退位移叠加与衰减
      enemy.velocity.x += enemy.knockbackVelocity.x;
      enemy.velocity.y += enemy.knockbackVelocity.y;

      const decayFactor = Math.max(0, 1 - enemy.knockbackDecay * dt);
      enemy.knockbackVelocity.x *= decayFactor;
      enemy.knockbackVelocity.y *= decayFactor;

      // 6. 更新位置与边界约束
      enemy.x += enemy.velocity.x * dt;
      enemy.y += enemy.velocity.y * dt;

      enemy.x = clamp(enemy.x, bounds.minX + enemy.radius, bounds.maxX - enemy.radius);
      enemy.y = clamp(enemy.y, bounds.minY + enemy.radius, bounds.maxY - enemy.radius);

      // 7. 更新空间哈希
      spatialHash.update(enemy);

      // 8. 受击闪白计时
      if (enemy.hitFlashTimerSec > 0) {
        enemy.hitFlashTimerSec = Math.max(0, enemy.hitFlashTimerSec - dt);
      }
    }
  }
}
