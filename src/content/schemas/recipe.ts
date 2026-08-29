import { z } from 'zod';
import { TagSchema, EffectDefinitionSchema } from './common';

export const RecipeRequirementSchema = z.object({
  requiredWeaponId: z.string().optional(),
  requiredTagCounts: z.record(TagSchema, z.number().int().positive()).optional(),
  minWeaponLevel: z.number().int().positive().optional().default(1),
});

export type RecipeRequirement = z.infer<typeof RecipeRequirementSchema>;

export const RecipeTransformationSchema = z.object({
  targetWeaponId: z.string().min(1),
  transformedNameKey: z.string().min(1),
  damageMultiplier: z.number().positive().default(1.5),
  cooldownMultiplier: z.number().positive().default(0.8),
  additionalEffects: z.array(EffectDefinitionSchema).default([]),
  extraProjectiles: z.number().int().default(1),
  visualTint: z.string().default('#ff4500'),
});

export type RecipeTransformation = z.infer<typeof RecipeTransformationSchema>;

export const RecipeDefinitionSchema = z.object({
  id: z.string().min(1),
  nameKey: z.string().min(1),
  descriptionKey: z.string().min(1),
  requirement: RecipeRequirementSchema,
  transformation: RecipeTransformationSchema,
  assetKey: z.string().min(1),
});

export type RecipeDefinition = z.infer<typeof RecipeDefinitionSchema>;
