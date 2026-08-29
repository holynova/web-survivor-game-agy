import { z } from 'zod';

export const WaveSpawnEntrySchema = z.object({
  enemyId: z.string().min(1),
  weight: z.number().positive(),
  intervalMs: z.number().positive().default(1000),
  batchSize: z.number().int().positive().default(1),
});

export type WaveSpawnEntry = z.infer<typeof WaveSpawnEntrySchema>;

export const WaveDefinitionSchema = z.object({
  waveNumber: z.number().int().positive(),
  durationSeconds: z.number().positive(),
  maxActiveEnemies: z.number().int().positive().default(300),
  spawnEntries: z.array(WaveSpawnEntrySchema).min(1),
  isEliteWave: z.boolean().default(false),
  isBossWave: z.boolean().default(false),
  bossId: z.string().optional(),
  preparationSeconds: z.number().default(20),
});

export type WaveDefinition = z.infer<typeof WaveDefinitionSchema>;
