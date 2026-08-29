import { RECIPES } from '@/content/recipes/data';
import { Targeting } from '@/content/schemas/weapon';
import { EventBus } from '@/core/event-bus';
import { distanceSquared, Vector2 } from '@/core/math';
import { ObjectPool } from '@/core/pool';
import { SeededRNG } from '@/core/rng';
import { Enemy } from '../entities/Enemy';
import { Player } from '../entities/Player';
import { Projectile } from '../entities/Projectile';
import { SpatialHash } from '../spatial/spatial-hash';

export class WeaponSystem {
  public update(
    player: Player,
    enemies: readonly Enemy[],
    projectilePool: ObjectPool<Projectile>,
    spatialHash: SpatialHash<Enemy>,
    rng: SeededRNG,
    dt: number,
  ): void {
    const dtMs = dt * 1000;

    for (let i = 0; i < player.weapons.length; i++) {
      const weaponState = player.weapons[i];
      const weaponDef = weaponState.definition;
      const levelDef = weaponDef.levels[Math.min(weaponState.level - 1, weaponDef.levels.length - 1)];

      // 检查是否有激活的菜谱质变
      let damageMultiplier = player.damageMultiplier;
      let cooldownMultiplier = 1 / player.attackSpeedMultiplier;
      let extraProjectiles = 0;
      let additionalEffects = [...levelDef.effects];
      let customColor = weaponDef.color;

      if (weaponState.isTransformed && weaponState.transformedRecipeId) {
        const recipe = RECIPES[weaponState.transformedRecipeId];
        if (recipe) {
          damageMultiplier *= recipe.transformation.damageMultiplier;
          cooldownMultiplier *= recipe.transformation.cooldownMultiplier;
          extraProjectiles += recipe.transformation.extraProjectiles;
          customColor = recipe.transformation.visualTint;
          if (recipe.transformation.additionalEffects) {
            additionalEffects.push(...recipe.transformation.additionalEffects);
          }
        }
      }

      const totalCooldownMs = levelDef.cooldownMs * cooldownMultiplier;

      // 针对环绕型武器 (Orbit)：保持活跃的环绕实例
      if (weaponDef.attackPattern === 'orbit') {
        const targetCount = levelDef.projectileCount + extraProjectiles;
        const activeOrbits = projectilePool
          .getActiveItems()
          .filter(p => p.weaponId === weaponDef.id && p.attackPattern === 'orbit');

        if (activeOrbits.length < targetCount) {
          const needed = targetCount - activeOrbits.length;
          for (let k = 0; k < needed; k++) {
            const proj = projectilePool.acquire();
            const angle = ((activeOrbits.length + k) * Math.PI * 2) / targetCount;
            proj.spawn({
              weaponId: weaponDef.id,
              attackPattern: 'orbit',
              x: player.position.x + Math.cos(angle) * levelDef.range,
              y: player.position.y + Math.sin(angle) * levelDef.range,
              vx: 0,
              vy: 0,
              damage: Math.round(levelDef.damage * damageMultiplier),
              isCrit: rng.next() < player.critChance,
              pierce: 999,
              range: levelDef.range,
              durationMs: 999999,
              radius: levelDef.radius,
              color: customColor,
              effects: additionalEffects,
              orbitAngle: angle,
              orbitRadius: levelDef.range,
              orbitSpeed: levelDef.projectileSpeed || 2.5,
            });
          }
        }
        continue;
      }

      // 常规冷却计时
      weaponState.cooldownTimerMs += dtMs;
      if (weaponState.cooldownTimerMs >= totalCooldownMs) {
        weaponState.cooldownTimerMs = 0;

        // 执行攻击
        this.fireWeapon({
          player,
          weaponDef,
          levelDef,
          damageMultiplier,
          extraProjectiles,
          effects: additionalEffects,
          customColor,
          enemies,
          projectilePool,
          spatialHash,
          rng,
        });
      }
    }

    // 更新所有活跃投射物的位置与生命周期
    this.updateProjectiles(projectilePool, player, dt);
  }

  private fireWeapon(params: {
    player: Player;
    weaponDef: typeof params.player.weapons[0]['definition'];
    levelDef: typeof params.weaponDef.levels[0];
    damageMultiplier: number;
    extraProjectiles: number;
    effects: typeof params.levelDef.effects;
    customColor: string;
    enemies: readonly Enemy[];
    projectilePool: ObjectPool<Projectile>;
    spatialHash: SpatialHash<Enemy>;
    rng: SeededRNG;
  }): void {
    const { player, weaponDef, levelDef, damageMultiplier, extraProjectiles, effects, customColor, projectilePool, rng } = params;

    const totalCount = levelDef.projectileCount + extraProjectiles;
    const baseDamage = Math.round(levelDef.damage * damageMultiplier);
    const isCrit = rng.next() < player.critChance;
    const finalDamage = isCrit ? Math.round(baseDamage * player.critMultiplier) : baseDamage;

    // 寻找目标方向
    const targetDir = this.findTargetDirection(player, weaponDef.targeting, params.enemies, levelDef.range);

    EventBus.getInstance().emit('sound:play', {
      key: `sfx_${weaponDef.id}`,
      volume: 0.4,
      detune: (rng.next() - 0.5) * 200,
    });

    switch (weaponDef.attackPattern) {
      case 'projectile': {
        // 扇形散射多枚投射物
        const spreadAngle = totalCount > 1 ? 0.25 : 0;
        const startAngle = targetDir.angle() - (spreadAngle * (totalCount - 1)) / 2;

        for (let i = 0; i < totalCount; i++) {
          const angle = startAngle + i * spreadAngle;
          const vx = Math.cos(angle) * levelDef.projectileSpeed;
          const vy = Math.sin(angle) * levelDef.projectileSpeed;

          const proj = projectilePool.acquire();
          proj.spawn({
            weaponId: weaponDef.id,
            attackPattern: 'projectile',
            x: player.position.x,
            y: player.position.y,
            vx,
            vy,
            damage: finalDamage,
            isCrit,
            pierce: levelDef.pierce,
            range: levelDef.range,
            durationMs: levelDef.durationMs,
            radius: levelDef.radius,
            color: customColor,
            effects,
          });
        }
        break;
      }

      case 'arc': {
        // 近战弧形横扫
        const proj = projectilePool.acquire();
        const heading = targetDir.angle();
        proj.spawn({
          weaponId: weaponDef.id,
          attackPattern: 'arc',
          x: player.position.x + Math.cos(heading) * (levelDef.range * 0.6),
          y: player.position.y + Math.sin(heading) * (levelDef.range * 0.6),
          vx: Math.cos(heading) * 10,
          vy: Math.sin(heading) * 10,
          damage: finalDamage,
          isCrit,
          pierce: 999,
          range: levelDef.range,
          durationMs: levelDef.durationMs,
          radius: levelDef.radius,
          color: customColor,
          effects,
          orbitAngle: heading,
        });
        break;
      }

      case 'pierceLine': {
        // 穿透疾刺
        for (let i = 0; i < totalCount; i++) {
          const angleOffset = (i - (totalCount - 1) / 2) * 0.12;
          const angle = targetDir.angle() + angleOffset;
          const vx = Math.cos(angle) * levelDef.projectileSpeed;
          const vy = Math.sin(angle) * levelDef.projectileSpeed;

          const proj = projectilePool.acquire();
          proj.spawn({
            weaponId: weaponDef.id,
            attackPattern: 'pierceLine',
            x: player.position.x,
            y: player.position.y,
            vx,
            vy,
            damage: finalDamage,
            isCrit,
            pierce: 99,
            range: levelDef.range,
            durationMs: levelDef.durationMs,
            radius: levelDef.radius,
            color: customColor,
            effects,
          });
        }
        break;
      }

      case 'area': {
        // 地面持续燃烧火域：朝最近怪物方向或周围铺设火海
        for (let i = 0; i < totalCount; i++) {
          const spreadDist = ((i + 1) / (totalCount + 1)) * levelDef.range;
          const targetX = player.position.x + targetDir.x * spreadDist + (rng.next() - 0.5) * 32;
          const targetY = player.position.y + targetDir.y * spreadDist + (rng.next() - 0.5) * 32;

          const proj = projectilePool.acquire();
          proj.spawn({
            weaponId: weaponDef.id,
            attackPattern: 'area',
            x: targetX,
            y: targetY,
            vx: 0,
            vy: 0,
            damage: Math.max(1, Math.round(finalDamage * 0.4)),
            isCrit,
            pierce: 999,
            range: levelDef.range,
            durationMs: levelDef.durationMs,
            radius: levelDef.radius,
            color: customColor,
            effects,
          });
        }
        break;
      }

      case 'summon': {
        // 召唤帮厨小幽灵
        for (let i = 0; i < totalCount; i++) {
          const proj = projectilePool.acquire();
          const angle = rng.nextFloat(0, Math.PI * 2);
          proj.spawn({
            weaponId: weaponDef.id,
            attackPattern: 'summon',
            x: player.position.x + Math.cos(angle) * 40,
            y: player.position.y + Math.sin(angle) * 40,
            vx: Math.cos(angle) * levelDef.projectileSpeed,
            vy: Math.sin(angle) * levelDef.projectileSpeed,
            damage: finalDamage,
            isCrit,
            pierce: 999,
            range: levelDef.range,
            durationMs: levelDef.durationMs,
            radius: levelDef.radius,
            color: customColor,
            effects,
          });
        }
        break;
      }
    }
  }

  private findTargetDirection(
    player: Player,
    targeting: Targeting,
    enemies: readonly Enemy[],
    searchRange: number,
  ): Vector2 {
    const px = player.position.x;
    const py = player.position.y;

    if (enemies.length === 0) {
      return player.facingDirection.clone();
    }

    let bestEnemy: Enemy | null = null;
    let bestDistSq = Infinity;
    let lowestHp = Infinity;

    for (let i = 0; i < enemies.length; i++) {
      const e = enemies[i];
      if (!e.isActive || e.currentHp <= 0) continue;
      const dSq = distanceSquared(px, py, e.x, e.y);

      if (targeting === 'lowestHp') {
        if (dSq <= searchRange * searchRange * 2 && e.currentHp < lowestHp) {
          lowestHp = e.currentHp;
          bestEnemy = e;
        }
      } else {
        // nearest 及所有武器默认智能索敌：瞄准距玩家最近的活体妖怪
        if (dSq < bestDistSq) {
          bestDistSq = dSq;
          bestEnemy = e;
        }
      }
    }

    if (bestEnemy) {
      const dx = bestEnemy.x - px;
      const dy = bestEnemy.y - py;
      const len = Math.hypot(dx, dy);
      if (len > 0.0001) {
        return new Vector2(dx / len, dy / len);
      }
    }

    return player.facingDirection.clone();
  }

  private updateProjectiles(
    projectilePool: ObjectPool<Projectile>,
    player: Player,
    dt: number,
  ): void {
    const dtMs = dt * 1000;
    const activeProjectiles = projectilePool.getActiveItems();

    for (let i = activeProjectiles.length - 1; i >= 0; i--) {
      const p = activeProjectiles[i];
      p.durationRemainingMs -= dtMs;

      if (p.durationRemainingMs <= 0 || p.pierceRemaining <= 0) {
        projectilePool.release(p);
        continue;
      }

      if (p.attackPattern === 'orbit') {
        // 环绕围绕玩家旋转
        p.orbitAngle += p.orbitSpeed * dt;
        p.x = player.position.x + Math.cos(p.orbitAngle) * p.orbitRadius;
        p.y = player.position.y + Math.sin(p.orbitAngle) * p.orbitRadius;
      } else if (p.attackPattern === 'area') {
        // 静态地面火域，更新周期伤害计时
        p.tickDamageTimerMs += dtMs;
      } else if (p.attackPattern === 'summon') {
        // 召唤物定期向玩家周围巡航或追击
        p.x += p.velocity.x * dt;
        p.y += p.velocity.y * dt;
        p.tickDamageTimerMs += dtMs;
      } else {
        // 常规弹道移动
        p.x += p.velocity.x * dt;
        p.y += p.velocity.y * dt;
        p.rangeRemaining -= p.velocity.length() * dt;

        if (p.rangeRemaining <= 0) {
          projectilePool.release(p);
        }
      }
    }
  }
}
