import { z } from 'zod';
import { TagSchema, EffectDefinitionSchema } from './common';

export const AttackPatternSchema = z.enum([
  'projectile',
  'arc',
  'orbit',
  'area',
  'summon',
  'pierceLine',
]);

export type AttackPattern = z.infer<typeof AttackPatternSchema>;

export const TargetingSchema = z.enum(['nearest', 'forward', 'random', 'lowestHp']);
export type Targeting = z.infer<typeof TargetingSchema>;

export const WeaponLevelDefinitionSchema = z.object({
  level: z.number().int().positive(),
  descriptionKey: z.string().min(1),
  damage: z.number().positive(),
  cooldownMs: z.number().positive(),
  projectileCount: z.number().int().positive().default(1),
  projectileSpeed: z.number().default(300),
  pierce: z.number().int().default(1),
  range: z.number().positive().default(150),
  durationMs: z.number().default(1000),
  radius: z.number().positive().default(12),
  effects: z.array(EffectDefinitionSchema).default([]),
});

export type WeaponLevelDefinition = z.infer<typeof WeaponLevelDefinitionSchema>;

export const WeaponDefinitionSchema = z.object({
  id: z.string().min(1),
  nameKey: z.string().min(1),
  descriptionKey: z.string().min(1),
  tags: z.array(TagSchema),
  attackPattern: AttackPatternSchema,
  targeting: TargetingSchema,
  rarity: z.enum(['common', 'rare', 'epic', 'legendary']).default('common'),
  cost: z.number().int().positive().default(10),
  levels: z.array(WeaponLevelDefinitionSchema).min(1),
  assetKey: z.string().min(1),
  color: z.string().default('#f4a261'),
});

export type WeaponDefinition = z.infer<typeof WeaponDefinitionSchema>;
