import { clamp } from '@/core/math';
import { Player } from '../entities/Player';
import { Enemy } from '../entities/Enemy';
import { SpatialHash } from '../spatial/spatial-hash';

export interface MapBounds {
  minX: number;
  maxX: number;
  minY: number;
  maxY: number;
}

export class MovementSystem {
  public static readonly DEFAULT_BOUNDS: MapBounds = {
    minX: -1400,
    maxX: 1400,
    minY: -1400,
    maxY: 1400,
  };

  private tempNeighbors: Enemy[] = [];

  public updatePlayer(
    player: Player,
    inputX: number,
    inputY: number,
    dt: number,
    bounds: MapBounds = MovementSystem.DEFAULT_BOUNDS,
  ): void {
    // 1. 向量归一化
    const lenSq = inputX * inputX + inputY * inputY;
    if (lenSq > 0.00001) {
      const invLen = 1 / Math.sqrt(lenSq);
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
    bounds: MapBounds = MovementSystem.DEFAULT_BOUNDS,
  ): void {
    const px = player.position.x;
    const py = player.position.y;

    for (let i = 0; i < enemies.length; i++) {
      const enemy = enemies[i];
      if (!enemy.isActive) continue;

      // 1. 直线追踪朝向玩家
      const dx = px - enemy.x;
      const dy = py - enemy.y;
      const distSq = dx * dx + dy * dy;

      let effectiveSpeed = enemy.moveSpeed;
      if (enemy.slowStatus) {
        effectiveSpeed *= 1 - enemy.slowStatus.slowFactor;
      }

      if (distSq > 1) {
        const invDist = 1 / Math.sqrt(distSq);
        enemy.velocity.x = dx * invDist * effectiveSpeed;
        enemy.velocity.y = dy * invDist * effectiveSpeed;
      } else {
        enemy.velocity.set(0, 0);
      }

      // 2. 邻域轻量分离 (基于空间哈希防重叠)
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

      // 3. 击退位移叠加与衰减
      enemy.velocity.x += enemy.knockbackVelocity.x;
      enemy.velocity.y += enemy.knockbackVelocity.y;

      const decayFactor = Math.max(0, 1 - enemy.knockbackDecay * dt);
      enemy.knockbackVelocity.x *= decayFactor;
      enemy.knockbackVelocity.y *= decayFactor;

      // 4. 更新位置与边界约束
      enemy.x += enemy.velocity.x * dt;
      enemy.y += enemy.velocity.y * dt;

      enemy.x = clamp(enemy.x, bounds.minX + enemy.radius, bounds.maxX - enemy.radius);
      enemy.y = clamp(enemy.y, bounds.minY + enemy.radius, bounds.maxY - enemy.radius);

      // 5. 更新空间哈希
      spatialHash.update(enemy);

      // 6. 受击闪白计时
      if (enemy.hitFlashTimerSec > 0) {
        enemy.hitFlashTimerSec = Math.max(0, enemy.hitFlashTimerSec - dt);
      }
    }
  }
}
