import { z } from 'zod';

export const SaveDataSchema = z.object({
  schemaVersion: z.number().int().default(1),
  highScores: z.object({
    highestWave: z.number().int().default(1),
    maxKills: z.number().int().default(0),
    bestTimeSec: z.number().default(0),
  }),
  unlockedCharacters: z.array(z.string()).default(['wok_master', 'cold_brewer', 'skewer_griller']),
  selectedCharacterId: z.string().default('wok_master'),
  selectedDifficultyId: z.string().default('normal'),
  settings: z.object({
    masterVolume: z.number().min(0).max(1).default(0.8),
    sfxVolume: z.number().min(0).max(1).default(0.8),
    isMuted: z.boolean().default(false),
    damageNumbers: z.boolean().default(true),
    screenShake: z.boolean().default(true),
  }),
});

export type SaveData = z.infer<typeof SaveDataSchema>;

export const DEFAULT_SAVE_DATA: SaveData = {
  schemaVersion: 1,
  highScores: {
    highestWave: 1,
    maxKills: 0,
    bestTimeSec: 0,
  },
  unlockedCharacters: ['wok_master', 'cold_brewer', 'skewer_griller'],
  selectedCharacterId: 'wok_master',
  selectedDifficultyId: 'normal',
  settings: {
    masterVolume: 0.8,
    sfxVolume: 0.8,
    isMuted: false,
    damageNumbers: true,
    screenShake: true,
  },
};

const SAVE_KEY = 'shanhai_survivor_savedata_v1';

export class SaveManager {
  public static load(): SaveData {
    try {
      if (typeof window === 'undefined' || !window.localStorage) {
        return { ...DEFAULT_SAVE_DATA };
      }

      const raw = window.localStorage.getItem(SAVE_KEY);
      if (!raw) {
        return { ...DEFAULT_SAVE_DATA };
      }

      const parsed = JSON.parse(raw);
      const validated = SaveDataSchema.safeParse(parsed);
      if (validated.success) {
        return validated.data;
      }

      // 如果数据损坏或版本不匹配，执行安全回退
      console.warn('Save data invalid, falling back to default save', validated.error);
      return { ...DEFAULT_SAVE_DATA };
    } catch (e) {
      console.error('Failed to load save data from localStorage:', e);
      return { ...DEFAULT_SAVE_DATA };
    }
  }

  public static save(data: SaveData): boolean {
    try {
      if (typeof window === 'undefined' || !window.localStorage) {
        return false;
      }
      const validated = SaveDataSchema.parse(data);
      window.localStorage.setItem(SAVE_KEY, JSON.stringify(validated));
      return true;
    } catch (e) {
      console.error('Failed to write save data to localStorage:', e);
      return false;
    }
  }

  public static updateHighScore(wave: number, kills: number, timeSec: number): void {
    const data = this.load();
    data.highScores.highestWave = Math.max(data.highScores.highestWave, wave);
    data.highScores.maxKills = Math.max(data.highScores.maxKills, kills);
    data.highScores.bestTimeSec = Math.max(data.highScores.bestTimeSec, timeSec);
    this.save(data);
  }

  public static recordRun(wave: number, kills: number, timeSec = 0): void {
    this.updateHighScore(wave, kills, timeSec);
  }
}
