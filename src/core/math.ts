/**
 * 2D 几何与物理数学工具库
 */

export interface Vector2Like {
  x: number;
  y: number;
}

export class Vector2 implements Vector2Like {
  public x: number;
  public y: number;

  constructor(x = 0, y = 0) {
    this.x = x;
    this.y = y;
  }

  public set(x: number, y: number): this {
    this.x = x;
    this.y = y;
    return this;
  }

  public copy(other: Vector2Like): this {
    this.x = other.x;
    this.y = other.y;
    return this;
  }

  public clone(): Vector2 {
    return new Vector2(this.x, this.y);
  }

  public add(other: Vector2Like): this {
    this.x += other.x;
    this.y += other.y;
    return this;
  }

  public subtract(other: Vector2Like): this {
    this.x -= other.x;
    this.y -= other.y;
    return this;
  }

  public scale(scalar: number): this {
    this.x *= scalar;
    this.y *= scalar;
    return this;
  }

  public lengthSquared(): number {
    return this.x * this.x + this.y * this.y;
  }

  public length(): number {
    return Math.sqrt(this.lengthSquared());
  }

  public normalize(): this {
    const lenSq = this.lengthSquared();
    if (lenSq > 0.000001) {
      const invLen = 1 / Math.sqrt(lenSq);
      this.x *= invLen;
      this.y *= invLen;
    } else {
      this.x = 0;
      this.y = 0;
    }
    return this;
  }

  public distanceToSquared(other: Vector2Like): number {
    const dx = this.x - other.x;
    const dy = this.y - other.y;
    return dx * dx + dy * dy;
  }

  public distanceTo(other: Vector2Like): number {
    return Math.sqrt(this.distanceToSquared(other));
  }

  public angle(): number {
    return Math.atan2(this.y, this.x);
  }

  public setAngle(angle: number, length = 1): this {
    this.x = Math.cos(angle) * length;
    this.y = Math.sin(angle) * length;
    return this;
  }
}

export function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

export function lerp(start: number, end: number, t: number): number {
  return start + (end - start) * clamp(t, 0, 1);
}

export function distanceSquared(x1: number, y1: number, x2: number, y2: number): number {
  const dx = x2 - x1;
  const dy = y2 - y1;
  return dx * dx + dy * dy;
}

export function distance(x1: number, y1: number, x2: number, y2: number): number {
  return Math.sqrt(distanceSquared(x1, y1, x2, y2));
}

export function circleIntersectsCircle(
  x1: number,
  y1: number,
  r1: number,
  x2: number,
  y2: number,
  r2: number,
): boolean {
  const rSum = r1 + r2;
  return distanceSquared(x1, y1, x2, y2) <= rSum * rSum;
}

/**
 * 判断点是否在以 (cx, cy) 为中心、半径为 r、朝向为 headingRad、夹角为 halfAngleRad 的扇形范围内
 */
export function pointInArc(
  px: number,
  py: number,
  cx: number,
  cy: number,
  r: number,
  headingRad: number,
  halfAngleRad: number,
): boolean {
  const distSq = distanceSquared(px, py, cx, cy);
  if (distSq > r * r) {
    return false;
  }
  const angleToPoint = Math.atan2(py - cy, px - cx);
  let diff = angleToPoint - headingRad;
  while (diff > Math.PI) diff -= 2 * Math.PI;
  while (diff < -Math.PI) diff += 2 * Math.PI;
  return Math.abs(diff) <= halfAngleRad;
}
