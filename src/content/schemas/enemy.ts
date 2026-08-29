import { z } from 'zod';

export const EnemyDefinitionSchema = z.object({
  id: z.string().min(1),
  nameKey: z.string().min(1),
  category: z.enum(['normal', 'elite', 'boss']),
  maxHp: z.number().positive(),
  moveSpeed: z.number().positive(),
  radius: z.number().positive(),
  contactDamage: z.number().positive(),
  knockbackResistance: z.number().min(0).max(1).default(0),
  expValue: z.number().positive(),
  ingredientChance: z.number().min(0).max(1).default(0.2),
  ingredientValue: z.number().int().default(1),
  color: z.string().default('#e76f51'),
  assetKey: z.string().min(1),
  behaviors: z.array(z.string()).default([]),
});

export type EnemyDefinition = z.infer<typeof EnemyDefinitionSchema>;
