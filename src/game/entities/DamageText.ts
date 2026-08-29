import { Poolable } from '@/core/pool';

export class DamageText implements Poolable {
  public static nextId = 1;

  public id: number = 0;
  public isActive = false;

  public text = '';
  public x = 0;
  public y = 0;
  public vy = -50;
  public color = '#ffffff';
  public isCrit = false;
  public lifeMs = 600;
  public maxLifeMs = 600;

  public spawn(text: string, x: number, y: number, color = '#ffffff', isCrit = false): void {
    this.id = DamageText.nextId++;
    this.isActive = true;
    this.text = text;
    this.x = x + (Math.random() * 16 - 8);
    this.y = y - 10;
    this.vy = isCrit ? -80 : -50;
    this.color = color;
    this.isCrit = isCrit;
    this.maxLifeMs = isCrit ? 800 : 550;
    this.lifeMs = this.maxLifeMs;
  }

  public reset(): void {
    this.isActive = false;
    this.text = '';
  }
}
