import { describe, expect, it } from 'vitest';
import { DEFAULT_SAVE_DATA, SaveDataSchema, SaveManager } from '@/save/storage';

describe('Save System & Storage Adapter', () => {
  it('should validate default save data', () => {
    expect(() => SaveDataSchema.parse(DEFAULT_SAVE_DATA)).not.toThrow();
  });

  it('should fall back to safe default save when localStorage is empty', () => {
    const data = SaveManager.load();
    expect(data.schemaVersion).toBe(1);
    expect(data.unlockedCharacters).toContain('wok_master');
  });

  it('should update and validate high scores correctly', () => {
    SaveManager.updateHighScore(5, 120, 300);
    const data = SaveManager.load();
    expect(data.highScores.highestWave).toBeGreaterThanOrEqual(1);
  });
});
