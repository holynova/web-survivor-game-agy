import { describe, expect, it } from 'vitest';
import { CHARACTERS } from '@/content/characters/data';
import { ITEMS } from '@/content/items/data';
import { Enemy } from '@/game/entities/Enemy';
import { Player } from '@/game/entities/Player';

describe('Player Stats & Damage Mechanics', () => {
  it('should initialize player with base character stats and tags', () => {
    const player = new Player(CHARACTERS.wok_master);
    expect(player.maxHp).toBe(120);
    expect(player.currentHp).toBe(120);
    expect(player.moveSpeed).toBe(190);
    expect(player.armor).toBe(2);
    expect(player.tagCounts.fire).toBe(1);
    expect(player.tagCounts.wok).toBe(1);
  });

  it('should recalculate stats when items are added', () => {
    const player = new Player(CHARACTERS.wok_master);
    const initialDmgMult = player.damageMultiplier;

    player.addItem(ITEMS.chili_pepper);
    expect(player.items).toHaveLength(1);
    expect(player.damageMultiplier).toBeCloseTo(initialDmgMult + 0.15, 4);

    player.addItem(ITEMS.bamboo_steamer);
    expect(player.armor).toBe(4); // 2 + 2
    expect(player.maxHp).toBe(145); // 120 + 25
  });

  it('should handle damage with armor and iFrames', () => {
    const player = new Player(CHARACTERS.wok_master); // armor = 2
    const dmg1 = player.takeDamage(10);
    expect(dmg1).toBe(8); // 10 - 2 = 8
    expect(player.currentHp).toBe(112);
    expect(player.iFrameTimerSec).toBeGreaterThan(0);

    // During iFrames, damage is 0
    const dmg2 = player.takeDamage(10);
    expect(dmg2).toBe(0);
    expect(player.currentHp).toBe(112);
  });

  it('should handle XP addition and level up scaling', () => {
    const player = new Player(CHARACTERS.wok_master);
    expect(player.level).toBe(1);
    expect(player.expToNextLevel).toBe(20);

    const leveled1 = player.addExp(10);
    expect(leveled1).toBe(false);
    expect(player.currentExp).toBe(10);

    const leveled2 = player.addExp(15);
    expect(leveled2).toBe(true);
    expect(player.level).toBe(2);
    expect(player.currentExp).toBe(5); // 10 + 15 - 20 = 5
    expect(player.expToNextLevel).toBe(35); // 20 * 1.25 + 10 = 35
  });

  it('should handle enemy status effects', () => {
    const enemy = new Enemy();
    enemy.spawn(
      {
        id: 'test_ghost',
        nameKey: 'test',
        category: 'normal',
        maxHp: 100,
        moveSpeed: 100,
        radius: 12,
        contactDamage: 10,
        knockbackResistance: 0.2,
        expValue: 10,
        ingredientChance: 0.2,
        ingredientValue: 1,
        color: '#ffffff',
        assetKey: 'test',
        behaviors: [],
      },
      0,
      0,
    );

    expect(enemy.currentHp).toBe(100);
    enemy.applyKnockback(1, 0, 100);
    // Knockback with 0.2 resistance => 80 force
    expect(enemy.knockbackVelocity.x).toBeCloseTo(80, 2);

    enemy.takeDamage(35);
    expect(enemy.currentHp).toBe(65);
    expect(enemy.hitFlashTimerSec).toBeGreaterThan(0);
  });
});
