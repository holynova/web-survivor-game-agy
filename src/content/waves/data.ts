import { WaveDefinition, WaveDefinitionSchema } from '../schemas/wave';

export const WAVES: WaveDefinition[] = [
  WaveDefinitionSchema.parse({
    waveNumber: 1,
    durationSeconds: 45,
    maxActiveEnemies: 80,
    preparationSeconds: 15,
    spawnEntries: [{ enemyId: 'hungry_ghost', weight: 10, intervalMs: 900, batchSize: 2 }],
  }),
  WaveDefinitionSchema.parse({
    waveNumber: 2,
    durationSeconds: 50,
    maxActiveEnemies: 110,
    preparationSeconds: 15,
    spawnEntries: [
      { enemyId: 'hungry_ghost', weight: 8, intervalMs: 800, batchSize: 2 },
      { enemyId: 'spicy_slime', weight: 4, intervalMs: 1400, batchSize: 1 },
    ],
  }),
  WaveDefinitionSchema.parse({
    waveNumber: 3,
    durationSeconds: 50,
    maxActiveEnemies: 140,
    preparationSeconds: 15,
    spawnEntries: [
      { enemyId: 'hungry_ghost', weight: 6, intervalMs: 700, batchSize: 3 },
      { enemyId: 'lantern_spirit', weight: 4, intervalMs: 1200, batchSize: 2 },
    ],
  }),
  WaveDefinitionSchema.parse({
    waveNumber: 4,
    durationSeconds: 55,
    maxActiveEnemies: 180,
    preparationSeconds: 15,
    spawnEntries: [
      { enemyId: 'hungry_ghost', weight: 5, intervalMs: 600, batchSize: 3 },
      { enemyId: 'grease_goblin', weight: 5, intervalMs: 1000, batchSize: 2 },
      { enemyId: 'lantern_spirit', weight: 3, intervalMs: 1200, batchSize: 2 },
    ],
  }),
  WaveDefinitionSchema.parse({
    waveNumber: 5,
    durationSeconds: 55,
    maxActiveEnemies: 220,
    preparationSeconds: 15,
    spawnEntries: [
      { enemyId: 'grease_goblin', weight: 6, intervalMs: 600, batchSize: 3 },
      { enemyId: 'skewer_thief', weight: 5, intervalMs: 800, batchSize: 2 },
      { enemyId: 'spicy_slime', weight: 4, intervalMs: 1000, batchSize: 2 },
    ],
  }),
  WaveDefinitionSchema.parse({
    waveNumber: 6,
    durationSeconds: 60,
    maxActiveEnemies: 250,
    isEliteWave: true,
    preparationSeconds: 20,
    spawnEntries: [
      { enemyId: 'giant_bao_demon', weight: 1, intervalMs: 25000, batchSize: 1 },
      { enemyId: 'hungry_ghost', weight: 6, intervalMs: 500, batchSize: 4 },
      { enemyId: 'lantern_spirit', weight: 4, intervalMs: 800, batchSize: 2 },
    ],
  }),
  WaveDefinitionSchema.parse({
    waveNumber: 7,
    durationSeconds: 55,
    maxActiveEnemies: 280,
    preparationSeconds: 15,
    spawnEntries: [
      { enemyId: 'steam_phantom', weight: 6, intervalMs: 600, batchSize: 3 },
      { enemyId: 'skewer_thief', weight: 5, intervalMs: 600, batchSize: 3 },
      { enemyId: 'spicy_slime', weight: 4, intervalMs: 800, batchSize: 2 },
    ],
  }),
  WaveDefinitionSchema.parse({
    waveNumber: 8,
    durationSeconds: 60,
    maxActiveEnemies: 320,
    preparationSeconds: 15,
    spawnEntries: [
      { enemyId: 'steam_phantom', weight: 5, intervalMs: 500, batchSize: 3 },
      { enemyId: 'grease_goblin', weight: 5, intervalMs: 500, batchSize: 3 },
      { enemyId: 'lantern_spirit', weight: 5, intervalMs: 500, batchSize: 3 },
    ],
  }),
  WaveDefinitionSchema.parse({
    waveNumber: 9,
    durationSeconds: 60,
    maxActiveEnemies: 350,
    isEliteWave: true,
    preparationSeconds: 20,
    spawnEntries: [
      { enemyId: 'flame_pot_guard', weight: 1, intervalMs: 25000, batchSize: 1 },
      { enemyId: 'skewer_thief', weight: 6, intervalMs: 450, batchSize: 4 },
      { enemyId: 'steam_phantom', weight: 5, intervalMs: 500, batchSize: 3 },
    ],
  }),
  WaveDefinitionSchema.parse({
    waveNumber: 10,
    durationSeconds: 60,
    maxActiveEnemies: 400,
    preparationSeconds: 15,
    spawnEntries: [
      { enemyId: 'steam_phantom', weight: 6, intervalMs: 400, batchSize: 4 },
      { enemyId: 'grease_goblin', weight: 6, intervalMs: 400, batchSize: 4 },
      { enemyId: 'spicy_slime', weight: 4, intervalMs: 600, batchSize: 3 },
    ],
  }),
  WaveDefinitionSchema.parse({
    waveNumber: 11,
    durationSeconds: 60,
    maxActiveEnemies: 450,
    preparationSeconds: 20,
    spawnEntries: [
      { enemyId: 'giant_bao_demon', weight: 1, intervalMs: 30000, batchSize: 1 },
      { enemyId: 'flame_pot_guard', weight: 1, intervalMs: 30000, batchSize: 1 },
      { enemyId: 'skewer_thief', weight: 6, intervalMs: 400, batchSize: 4 },
      { enemyId: 'lantern_spirit', weight: 6, intervalMs: 400, batchSize: 4 },
    ],
  }),
  WaveDefinitionSchema.parse({
    waveNumber: 12,
    durationSeconds: 90,
    maxActiveEnemies: 500,
    isBossWave: true,
    bossId: 'night_glutton_king',
    preparationSeconds: 0,
    spawnEntries: [
      { enemyId: 'night_glutton_king', weight: 1, intervalMs: 999999, batchSize: 1 },
      { enemyId: 'hungry_ghost', weight: 4, intervalMs: 500, batchSize: 4 },
      { enemyId: 'spicy_slime', weight: 3, intervalMs: 600, batchSize: 3 },
      { enemyId: 'lantern_spirit', weight: 3, intervalMs: 600, batchSize: 3 },
    ],
  }),
];
