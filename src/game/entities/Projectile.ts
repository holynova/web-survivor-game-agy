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
  public isEnemy = false;
  public x = 0;
  public y = 0;
  public velocity = new Vector2(0, 0);
  public radius = 10;

  public damage = 20;
  public isCrit = false;
  public pierceRemaining = 1;
  public rangeRemaining = 300;
  public durationRemainingMs = 1000;
  public totalDurationMs = 1000;
  public color = '#f4a261';
  public effects: EffectDefinition[] = [];

  // 环绕型属性
  public orbitAngle = 0;
  public orbitRadius = 80;
  public orbitSpeed = 2.5;

  // 回旋镖属性 (boomerang)
  public isReturning = false;
  public originX = 0;
  public originY = 0;
  public maxDistance = 300;
  public distanceTraveled = 0;

  // 迫击炮/抛物线/弹跳集群属性 (mortar)
  public startX = 0;
  public startY = 0;
  public targetX = 0;
  public targetY = 0;
  public arcProgress = 0;
  public isCluster = false;
  public bounceCount = 0;

  // 旋涡引力属性 (vortex)
  public vortexPullForce = 150;

  // 持续射线角度 (beam)
  public beamAngle = 0;

  // 近战挥砍/穿透去重 (记录已命中的敌人 ID 集合)
  public hitEnemyIds: Set<number> = new Set();
  public tickDamageTimerMs = 0;
  public tickIntervalMs = 300; // 地面火/召唤物/旋涡定期判定

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
    isEnemy?: boolean;
    startX?: number;
    startY?: number;
    targetX?: number;
    targetY?: number;
    isCluster?: boolean;
    vortexPullForce?: number;
  }): void {
    this.id = Projectile.nextId++;
    this.isActive = true;
    this.weaponId = params.weaponId;
    this.attackPattern = params.attackPattern;
    this.isEnemy = params.isEnemy || false;
    this.x = params.x;
    this.y = params.y;
    this.velocity.set(params.vx, params.vy);
    this.damage = params.damage;
    this.isCrit = params.isCrit;
    this.pierceRemaining = params.pierce;
    this.rangeRemaining = params.range;
    this.durationRemainingMs = params.durationMs;
    this.totalDurationMs = params.durationMs;
    this.radius = params.radius;
    this.color = params.color;
    this.effects = params.effects ? [...params.effects] : [];

    this.orbitAngle = params.orbitAngle || 0;
    this.orbitRadius = params.orbitRadius || 80;
    this.orbitSpeed = params.orbitSpeed || 2.5;

    this.isReturning = false;
    this.originX = params.startX ?? params.x;
    this.originY = params.startY ?? params.y;
    this.maxDistance = params.range;
    this.distanceTraveled = 0;

    this.startX = params.startX ?? params.x;
    this.startY = params.startY ?? params.y;
    this.targetX = params.targetX ?? (params.x + params.vx);
    this.targetY = params.targetY ?? (params.y + params.vy);
    this.arcProgress = 0;
    this.isCluster = params.isCluster || false;
    this.bounceCount = 0;

    this.vortexPullForce = params.vortexPullForce || 150;
    this.beamAngle = Math.atan2(params.vy, params.vx);

    this.hitEnemyIds.clear();
    this.tickDamageTimerMs = 0;
  }

  public reset(): void {
    this.isActive = false;
    this.isEnemy = false;
    this.velocity.set(0, 0);
    this.effects.length = 0;
    this.hitEnemyIds.clear();
    this.isReturning = false;
    this.isCluster = false;
    this.bounceCount = 0;
    this.arcProgress = 0;
  }
}
