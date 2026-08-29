import { Vector2 } from '@/core/math';
import { Poolable } from '@/core/pool';

export type DropType = 'heat' | 'ingredient' | 'food';

export class Drop implements Poolable {
  public static nextId = 1;

  public id: number = 0;
  public isActive = false;

  public type: DropType = 'heat';
  public value = 10;
  public x = 0;
  public y = 0;
  public velocity = new Vector2(0, 0);
  public radius = 8;
  public isMagnetized = false;
  public magnetSpeed = 380;
  public color = '#ffd166';

  public spawn(type: DropType, value: number, x: number, y: number): void {
    this.id = Drop.nextId++;
    this.isActive = true;
    this.type = type;
    this.value = value;
    this.x = x;
    this.y = y;
    this.velocity.set(0, 0);
    this.isMagnetized = false;
    this.color = type === 'heat' ? '#00f5d4' : type === 'ingredient' ? '#f4a261' : '#2a9d8f';
    this.radius = type === 'heat' ? 6 : type === 'ingredient' ? 9 : 11;
  }

  public reset(): void {
    this.isActive = false;
    this.isMagnetized = false;
    this.velocity.set(0, 0);
  }
}
