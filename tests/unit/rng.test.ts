import { describe, expect, it } from 'vitest';
import { SeededRNG } from '@/core/rng';

describe('SeededRNG', () => {
  it('should produce identical sequences for the same seed', () => {
    const rng1 = new SeededRNG(123456);
    const rng2 = new SeededRNG(123456);

    const seq1 = Array.from({ length: 50 }, () => rng1.next());
    const seq2 = Array.from({ length: 50 }, () => rng2.next());

    expect(seq1).toEqual(seq2);
  });

  it('should produce different sequences for different seeds', () => {
    const rng1 = new SeededRNG(123456);
    const rng2 = new SeededRNG(654321);

    const val1 = rng1.next();
    const val2 = rng2.next();

    expect(val1).not.toEqual(val2);
  });

  it('should generate integers within [min, max]', () => {
    const rng = new SeededRNG(999);
    for (let i = 0; i < 200; i++) {
      const val = rng.nextInt(3, 7);
      expect(val).toBeGreaterThanOrEqual(3);
      expect(val).toBeLessThanOrEqual(7);
      expect(Number.isInteger(val)).toBe(true);
    }
  });

  it('should pick weighted items correctly', () => {
    const rng = new SeededRNG(42);
    const items = [
      { item: 'rare', weight: 1 },
      { item: 'common', weight: 99 },
    ];

    const counts: Record<string, number> = { rare: 0, common: 0 };
    for (let i = 0; i < 1000; i++) {
      const picked = rng.pickWeighted(items);
      counts[picked]++;
    }

    expect(counts.common).toBeGreaterThan(900);
    expect(counts.rare).toBeGreaterThan(0);
  });

  it('should shuffle arrays without losing items', () => {
    const rng = new SeededRNG(100);
    const original = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
    const shuffled = rng.shuffle(original);

    expect(shuffled).toHaveLength(original.length);
    expect(shuffled.sort((a, b) => a - b)).toEqual(original);
  });
});
