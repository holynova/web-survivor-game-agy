import { describe, expect, it } from 'vitest';
import { CHARACTERS } from '@/content/characters/data';
import { Player } from '@/game/entities/Player';
import { weaponPriceFor } from '@/game/shop-pricing';
import { applyLuckBonus } from '@/game/systems/CollisionSystem';

describe('Audit fixes: luck now affects drops, six-armed discount works', () => {
  it('applyLuckBonus: no luck means no change', () => {
    expect(applyLuckBonus(0.07, 0)).toBeCloseTo(0.07, 10);
    expect(applyLuckBonus(0.25, 0)).toBeCloseTo(0.25, 10);
  });

  it('applyLuckBonus: +0.4% per luck point', () => {
    expect(applyLuckBonus(0.07, 15)).toBeCloseTo(0.13, 10);
    expect(applyLuckBonus(0.25, 25)).toBeCloseTo(0.35, 10);
  });

  it('applyLuckBonus: bonus caps at +20% and total at 95%', () => {
    expect(applyLuckBonus(0.07, 100)).toBeCloseTo(0.27, 10);
    expect(applyLuckBonus(0.9, 100)).toBeCloseTo(0.95, 10);
  });

  it('weaponPriceFor: six-armed gets 20% off weapons, others pay full price', () => {
    expect(weaponPriceFor(10, 'six_armed')).toBe(8);
    expect(weaponPriceFor(15, 'six_armed')).toBe(12);
    expect(weaponPriceFor(10, 'wok_master')).toBe(10);
    expect(weaponPriceFor(10, '')).toBe(10);
  });

  it('weaponPriceFor: discounted price never drops below 1', () => {
    expect(weaponPriceFor(1, 'six_armed')).toBe(1);
  });

  it('applyEndOfWaveHarvest: records last payout for the shop notice', () => {
    const player = new Player(CHARACTERS.investor);
    const before = player.ingredients;
    const earned = player.applyEndOfWaveHarvest();
    expect(earned).toBe(25);
    expect(player.lastHarvestEarned).toBe(25);
    expect(player.ingredients).toBe(before + 25);
  });
});
