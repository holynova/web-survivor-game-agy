import { describe, expect, it } from 'vitest';
import { CHARACTERS } from '@/content/characters/data';
import { ENEMIES } from '@/content/enemies/data';
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
    expect(player.maxWeapons).toBe(6);
    expect(player.tagCounts.fire).toBe(1);
    expect(player.tagCounts.wok).toBe(1);
  });

  it('should recalculate stats when items are added', () => {
    const player = new Player(CHARACTERS.wok_master);
    const initialDmgMult = player.damageMultiplier;

    player.addItem(ITEMS.chili_pepper);
    expect(player.items).toHaveLength(1);
    expect(player.damageMultiplier).toBeCloseTo(initialDmgMult + 0.15, 4);

    player.addItem(ITEMS.garlic_clove);
    expect(player.armor).toBe(4); // 2 + 2
    expect(player.hpRegen).toBe(2); // 1 base + 1

    player.addItem(ITEMS.bamboo_steamer);
    expect(player.maxHp).toBe(145); // 120 + 25
    expect(player.engineering).toBe(3);

    player.addItem(ITEMS.golden_spatula);
    expect(player.harvest).toBe(20); // 5 base + 15
    expect(player.luck).toBe(10);
  });

  it('should handle damage with armor and iFrames', () => {
    const player = new Player(CHARACTERS.wok_master); // armor = 2
    player.dodge = 0; // force 0 dodge for deterministic test
    const res1 = player.takeDamage(10);
    expect(res1.damage).toBe(8); // 10 - 2 = 8
    expect(res1.dodged).toBe(false);
    expect(player.currentHp).toBe(112);
    expect(player.iFrameTimerSec).toBeGreaterThan(0);

    // During iFrames, damage is 0
    const res2 = player.takeDamage(10);
    expect(res2.damage).toBe(0);
    expect(player.currentHp).toBe(112);
  });

  it('should handle harvest compounding interest at wave end', () => {
    const player = new Player(CHARACTERS.wok_master);
    player.harvest = 20;
    const initialCoins = player.ingredients;

    const earned = player.applyEndOfWaveHarvest();
    expect(earned).toBe(20);
    expect(player.ingredients).toBe(initialCoins + 20);
    expect(player.harvest).toBe(21); // ceil(20 * 1.05) = 21
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
    enemy.spawn(ENEMIES.hungry_ghost, 0, 0);

    expect(enemy.currentHp).toBe(ENEMIES.hungry_ghost.maxHp);
    expect(enemy.isActive).toBe(true);

    const dmg = enemy.takeDamage(20);
    expect(dmg).toBe(20);
    expect(enemy.currentHp).toBe(ENEMIES.hungry_ghost.maxHp - 20);

    enemy.applyKnockback(1, 0, 100);
    expect(enemy.knockbackVelocity.x).toBeGreaterThan(0);

    enemy.slowStatus = { slowFactor: 0.5, durationRemainingMs: 2000 };
    expect(enemy.slowStatus).not.toBeNull();
    expect(enemy.slowStatus?.slowFactor).toBe(0.5);

    enemy.takeDamage(999);
    expect(enemy.currentHp).toBe(0);
  });
});
