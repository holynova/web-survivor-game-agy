import { z } from 'zod';
import { TagSchema } from './common';

export const CharacterDefinitionSchema = z.object({
  id: z.string().min(1),
  nameKey: z.string().min(1),
  titleKey: z.string().min(1),
  descriptionKey: z.string().min(1),
  startingWeaponId: z.string().min(1),
  tags: z.array(TagSchema),
  baseStats: z.object({
    maxHp: z.number().positive(),
    moveSpeed: z.number().positive(),
    damageMultiplier: z.number().positive().default(1),
    attackSpeedMultiplier: z.number().positive().default(1),
    critChance: z.number().min(0).max(1).default(0.05),
    critMultiplier: z.number().min(1).default(1.5),
    pickupRadius: z.number().positive().default(60),
    armor: z.number().default(0),
  }),
  assetKey: z.string().min(1),
});

export type CharacterDefinition = z.infer<typeof CharacterDefinitionSchema>;
