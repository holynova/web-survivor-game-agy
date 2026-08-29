import { z } from 'zod';
import { TagSchema } from './common';

export const ItemModifierSchema = z.object({
  stat: z.enum([
    'maxHp',
    'hpRegen',
    'lifesteal',
    'damageMultiplier',
    'meleeDamage',
    'rangedDamage',
    'elementalDamage',
    'attackSpeedMultiplier',
    'critChance',
    'critMultiplier',
    'pickupRadius',
    'armor',
    'dodge',
    'moveSpeed',
    'harvest',
    'luck',
    'engineering',
    'burnDamageMultiplier',
    'slowDurationMultiplier',
    'ingredientDropBonus',
  ]),
  value: z.number(),
  mode: z.enum(['flat', 'multiply']).default('flat'),
});

export type ItemModifier = z.infer<typeof ItemModifierSchema>;

export const ItemDefinitionSchema = z.object({
  id: z.string().min(1),
  nameKey: z.string().min(1),
  descriptionKey: z.string().min(1),
  tags: z.array(TagSchema),
  rarity: z.enum(['common', 'rare', 'epic', 'legendary']).default('common'),
  cost: z.number().int().positive().default(8),
  maxStacks: z.number().int().positive().default(5),
  modifiers: z.array(ItemModifierSchema),
  assetKey: z.string().min(1),
  color: z.string().default('#2a9d8f'),
});

export type ItemDefinition = z.infer<typeof ItemDefinitionSchema>;
