import { EffectDefinition } from '@/content/schemas/common';
import { AttackPattern } from '@/content/schemas/weapon';
import { Vector2 } from '@/core/math';
import { Poolable } from '@/core/pool';

export class Projectile implements Poolable {
  public static nextId = 1;

  public id: number = 0;
  public isActive = false;

  public weaponId = '';
  public attackPattern: AttackPattern = 'projectile';
  public x = 0;
  public y = 0;
  public velocity = new Vector2(0, 0);
  public radius = 10;

  public damage = 20;
  public isCrit = false;
  public pierceRemaining = 1;
  public rangeRemaining = 300;
  public durationRemainingMs = 1000;
  public color = '#f4a261';
  public effects: EffectDefinition[] = [];

  // 环绕型属性
  public orbitAngle = 0;
  public orbitRadius = 80;
  public orbitSpeed = 2.5;

  // 近战挥砍/穿透去重 (记录已命中的敌人 ID 集合)
  public hitEnemyIds: Set<number> = new Set();
  public tickDamageTimerMs = 0;
  public tickIntervalMs = 300; // 地面火/召唤物定期判定

  public spawn(params: {
    weaponId: string;
    attackPattern: AttackPattern;
    x: number;
    y: number;
    vx: number;
    vy: number;
    damage: number;
    isCrit: boolean;
    pierce: number;
    range: number;
    durationMs: number;
    radius: number;
    color: string;
    effects?: EffectDefinition[];
    orbitAngle?: number;
    orbitRadius?: number;
    orbitSpeed?: number;
  }): void {
    this.id = Projectile.nextId++;
    this.isActive = true;
    this.weaponId = params.weaponId;
    this.attackPattern = params.attackPattern;
    this.x = params.x;
    this.y = params.y;
    this.velocity.set(params.vx, params.vy);
    this.damage = params.damage;
    this.isCrit = params.isCrit;
    this.pierceRemaining = params.pierce;
    this.rangeRemaining = params.range;
    this.durationRemainingMs = params.durationMs;
    this.radius = params.radius;
    this.color = params.color;
    this.effects = params.effects ? [...params.effects] : [];
    this.orbitAngle = params.orbitAngle || 0;
    this.orbitRadius = params.orbitRadius || 80;
    this.orbitSpeed = params.orbitSpeed || 2.5;
    this.hitEnemyIds.clear();
    this.tickDamageTimerMs = 0;
  }

  public reset(): void {
    this.isActive = false;
    this.hitEnemyIds.clear();
    this.effects = [];
    this.velocity.set(0, 0);
  }
}
