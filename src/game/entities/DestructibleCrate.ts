import { Vector2 } from '@/core/math';

export class DestructibleCrate {
  public id: number;
  public position = new Vector2(0, 0);
  public maxHp = 25;
  public currentHp = 25;
  public radius = 18;
  public isAlive = true;
  public type: 'steamer_basket' | 'fortune_chest';
  public hitFlashTimer = 0;

  constructor(id: number, x: number, y: number, type: 'steamer_basket' | 'fortune_chest' = 'steamer_basket') {
    this.id = id;
    this.position.set(x, y);
    this.type = type;
    this.maxHp = type === 'fortune_chest' ? 40 : 25;
    this.currentHp = this.maxHp;
    this.radius = type === 'fortune_chest' ? 20 : 16;
  }

  public takeDamage(damage: number): boolean {
    if (!this.isAlive) return false;
    this.currentHp -= damage;
    this.hitFlashTimer = 0.15;
    if (this.currentHp <= 0) {
      this.isAlive = false;
      return true; // 击破
    }
    return false;
  }
}
