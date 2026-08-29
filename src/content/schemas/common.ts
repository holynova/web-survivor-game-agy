import { z } from 'zod';

export const TagSchema = z.enum([
  'wok',
  'cleaver',
  'skewer',
  'fire',
  'ice',
  'oil',
  'sugar',
  'ferment',
  'melee',
  'projectile',
  'pierce',
  'orbit',
  'area',
  'summon',
  'speed',
  'defense',
  'crit',
  'economy',
]);

export type Tag = z.infer<typeof TagSchema>;

export const EffectDefinitionSchema = z.object({
  type: z.enum(['damage', 'knockback', 'burn', 'slow', 'pierce', 'split', 'heal']),
  value: z.number(),
  durationMs: z.number().optional(),
  tickIntervalMs: z.number().optional(),
  chance: z.number().min(0).max(1).optional().default(1),
});

export type EffectDefinition = z.infer<typeof EffectDefinitionSchema>;
