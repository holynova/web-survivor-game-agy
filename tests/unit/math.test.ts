import { describe, expect, it } from 'vitest';
import {
  clamp,
  distance,
  distanceSquared,
  lerp,
  pointInArc,
  Vector2,
} from '@/core/math';

describe('Math Utilities', () => {
  it('Vector2 normalize should produce unit length', () => {
    const v = new Vector2(3, 4);
    expect(v.length()).toBe(5);
    v.normalize();
    expect(v.length()).toBeCloseTo(1.0, 5);
    expect(v.x).toBeCloseTo(0.6, 5);
    expect(v.y).toBeCloseTo(0.8, 5);
  });

  it('Vector2 normalize on zero vector should remain zero', () => {
    const v = new Vector2(0, 0);
    v.normalize();
    expect(v.x).toBe(0);
    expect(v.y).toBe(0);
  });

  it('clamp and lerp should work as expected', () => {
    expect(clamp(15, 0, 10)).toBe(10);
    expect(clamp(-5, 0, 10)).toBe(0);
    expect(clamp(5, 0, 10)).toBe(5);

    expect(lerp(10, 20, 0.5)).toBe(15);
    expect(lerp(10, 20, 0)).toBe(10);
    expect(lerp(10, 20, 1)).toBe(20);
  });

  it('distance and distanceSquared calculation', () => {
    expect(distanceSquared(0, 0, 3, 4)).toBe(25);
    expect(distance(0, 0, 3, 4)).toBe(5);
  });

  it('pointInArc should test sector range and angle correctly', () => {
    const cx = 0;
    const cy = 0;
    const radius = 50;
    const heading = 0; // 朝向正右 (X+)
    const halfAngle = Math.PI / 4; // 45度扇形

    // 正前方在范围内
    expect(pointInArc(30, 0, cx, cy, radius, heading, halfAngle)).toBe(true);
    // 正前方超出半径
    expect(pointInArc(60, 0, cx, cy, radius, heading, halfAngle)).toBe(false);
    // 侧面在扇形内
    expect(pointInArc(20, 15, cx, cy, radius, heading, halfAngle)).toBe(true);
    // 正后方在扇形外
    expect(pointInArc(-20, 0, cx, cy, radius, heading, halfAngle)).toBe(false);
  });
});
