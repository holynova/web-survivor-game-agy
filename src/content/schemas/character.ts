import { z } from 'zod';
import { TagSchema } from './common';

export const CharacterDefinitionSchema = z.object({
  id: z.string().min(1),
  nameKey: z.string().min(1),
  titleKey: z.string().min(1),
  descriptionKey: z.string().min(1),
  startingWeaponId: z.string().min(1),
  tags: z.array(TagSchema),
  maxWeapons: z.number().int().positive().default(6),
  baseStats: z.object({
    maxHp: z.number().positive(),
    moveSpeed: z.number().positive(),
    damageMultiplier: z.number().default(1),
    attackSpeedMultiplier: z.number().default(1),
    critChance: z.number().min(0).max(1).default(0.05),
    critMultiplier: z.number().min(1).default(1.5),
    pickupRadius: z.number().positive().default(60),
    armor: z.number().default(0),
    dodge: z.number().min(0).max(0.6).default(0),
    hpRegen: z.number().default(0),
    lifesteal: z.number().default(0),
    meleeDamage: z.number().default(0),
    rangedDamage: z.number().default(0),
    elementalDamage: z.number().default(0),
    harvest: z.number().default(0),
    luck: z.number().default(0),
    engineering: z.number().default(0),
  }),
  assetKey: z.string().min(1),
  specialTrait: z.string().optional(),
});

export type CharacterDefinition = z.infer<typeof CharacterDefinitionSchema>;
