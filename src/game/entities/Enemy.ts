import { EnemyDefinition } from '@/content/schemas/enemy';
import { Vector2 } from '@/core/math';
import { Poolable } from '@/core/pool';
import { SpatialEntity } from '../spatial/spatial-hash';

export interface StatusBurn {
  damagePerTick: number;
  durationRemainingMs: number;
  tickTimerMs: number;
  tickIntervalMs: number;
  sourceId: string;
}

export interface StatusSlow {
  slowFactor: number;
  durationRemainingMs: number;
}

export class Enemy implements Poolable, SpatialEntity {
  public static nextId = 1;

  public id: number = 0;
  public isActive = false;

  public definition!: EnemyDefinition;
  public x = 0;
  public y = 0;
  public velocity = new Vector2(0, 0);
  public radius = 12;

  public maxHp = 30;
  public currentHp = 30;
  public moveSpeed = 60;
  public contactDamage = 10;
  public knockbackResistance = 0;
  public expValue = 10;
  public ingredientChance = 0.25;
  public ingredientValue = 1;
  public isBoss = false;
  public isElite = false;
  public color = '#e76f51';
  public assetKey = 'enemy_hungry_ghost';

  public knockbackVelocity = new Vector2(0, 0);
  public knockbackDecay = 8.0;

  public burnStatus?: StatusBurn;
  public slowStatus?: StatusSlow;

  public hitFlashTimerSec = 0;

  public spawn(def: EnemyDefinition, x: number, y: number): void {
    this.id = Enemy.nextId++;
    this.isActive = true;
    this.definition = def;
    this.x = x;
    this.y = y;
    this.velocity.set(0, 0);
    this.knockbackVelocity.set(0, 0);
    this.radius = def.radius;
    this.maxHp = def.maxHp;
    this.currentHp = def.maxHp;
    this.moveSpeed = def.moveSpeed;
    this.contactDamage = def.contactDamage;
    this.knockbackResistance = def.knockbackResistance;
    this.expValue = def.expValue;
    this.ingredientChance = def.ingredientChance;
    this.ingredientValue = def.ingredientValue;
    this.isBoss = def.category === 'boss';
    this.isElite = def.category === 'elite';
    this.color = def.color;
    this.assetKey = def.assetKey;
    this.burnStatus = undefined;
    this.slowStatus = undefined;
    this.hitFlashTimerSec = 0;
  }

  public reset(): void {
    this.isActive = false;
    this.burnStatus = undefined;
    this.slowStatus = undefined;
    this.velocity.set(0, 0);
    this.knockbackVelocity.set(0, 0);
  }

  public applyKnockback(dirX: number, dirY: number, force: number): void {
    const effectiveForce = force * (1 - this.knockbackResistance);
    if (effectiveForce > 0) {
      this.knockbackVelocity.x += dirX * effectiveForce;
      this.knockbackVelocity.y += dirY * effectiveForce;
    }
  }

  public takeDamage(amount: number): number {
    this.currentHp = Math.max(0, this.currentHp - amount);
    this.hitFlashTimerSec = 0.1;
    return amount;
  }
}
