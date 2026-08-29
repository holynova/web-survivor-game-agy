import { RecipeDefinition, RecipeDefinitionSchema } from '../schemas/recipe';

export const RECIPES: Record<string, RecipeDefinition> = {
  spicy_fire_wok: RecipeDefinitionSchema.parse({
    id: 'spicy_fire_wok',
    nameKey: 'recipe.spicy_fire_wok.name',
    descriptionKey: 'recipe.spicy_fire_wok.desc',
    requirement: {
      requiredWeaponId: 'iron_wok',
      requiredTagCounts: { fire: 1 },
      minWeaponLevel: 2,
    },
    transformation: {
      targetWeaponId: 'iron_wok',
      transformedNameKey: 'recipe.spicy_fire_wok.trans_name',
      damageMultiplier: 1.6,
      cooldownMultiplier: 0.8,
      extraProjectiles: 1,
      visualTint: '#ff3d00',
      additionalEffects: [{ type: 'burn', value: 18, durationMs: 2500 }],
    },
    assetKey: 'recipe_spicy_fire_wok',
  }),

  iced_skewers: RecipeDefinitionSchema.parse({
    id: 'iced_skewers',
    nameKey: 'recipe.iced_skewers.name',
    descriptionKey: 'recipe.iced_skewers.desc',
    requirement: {
      requiredWeaponId: 'bamboo_skewer',
      requiredTagCounts: { ice: 1 },
      minWeaponLevel: 2,
    },
    transformation: {
      targetWeaponId: 'bamboo_skewer',
      transformedNameKey: 'recipe.iced_skewers.trans_name',
      damageMultiplier: 1.4,
      cooldownMultiplier: 0.85,
      extraProjectiles: 2,
      visualTint: '#00f5d4',
      additionalEffects: [{ type: 'slow', value: 0.5, durationMs: 2000 }],
    },
    assetKey: 'recipe_iced_skewers',
  }),

  sugar_flame_stove: RecipeDefinitionSchema.parse({
    id: 'sugar_flame_stove',
    nameKey: 'recipe.sugar_flame_stove.name',
    descriptionKey: 'recipe.sugar_flame_stove.desc',
    requirement: {
      requiredWeaponId: 'stove_flame',
      requiredTagCounts: { sugar: 1 },
      minWeaponLevel: 2,
    },
    transformation: {
      targetWeaponId: 'stove_flame',
      transformedNameKey: 'recipe.sugar_flame_stove.trans_name',
      damageMultiplier: 1.7,
      cooldownMultiplier: 0.75,
      extraProjectiles: 1,
      visualTint: '#ffd166',
      additionalEffects: [{ type: 'heal', value: 2, durationMs: 1000 }],
    },
    assetKey: 'recipe_sugar_flame_stove',
  }),

  oil_cleaver_storm: RecipeDefinitionSchema.parse({
    id: 'oil_cleaver_storm',
    nameKey: 'recipe.oil_cleaver_storm.name',
    descriptionKey: 'recipe.oil_cleaver_storm.desc',
    requirement: {
      requiredWeaponId: 'cleaver',
      requiredTagCounts: { oil: 1 },
      minWeaponLevel: 2,
    },
    transformation: {
      targetWeaponId: 'cleaver',
      transformedNameKey: 'recipe.oil_cleaver_storm.trans_name',
      damageMultiplier: 1.5,
      cooldownMultiplier: 0.7,
      extraProjectiles: 2,
      visualTint: '#f77f00',
      additionalEffects: [{ type: 'split', value: 2, durationMs: 0 }],
    },
    assetKey: 'recipe_oil_cleaver_storm',
  }),

  fermented_sauce_bell: RecipeDefinitionSchema.parse({
    id: 'fermented_sauce_bell',
    nameKey: 'recipe.fermented_sauce_bell.name',
    descriptionKey: 'recipe.fermented_sauce_bell.desc',
    requirement: {
      requiredWeaponId: 'service_bell',
      requiredTagCounts: { ferment: 1 },
      minWeaponLevel: 2,
    },
    transformation: {
      targetWeaponId: 'service_bell',
      transformedNameKey: 'recipe.fermented_sauce_bell.trans_name',
      damageMultiplier: 1.8,
      cooldownMultiplier: 0.7,
      extraProjectiles: 1,
      visualTint: '#7209b7',
      additionalEffects: [{ type: 'knockback', value: 120 }],
    },
    assetKey: 'recipe_fermented_sauce_bell',
  }),

  seasoning_barrier: RecipeDefinitionSchema.parse({
    id: 'seasoning_barrier',
    nameKey: 'recipe.seasoning_barrier.name',
    descriptionKey: 'recipe.seasoning_barrier.desc',
    requirement: {
      requiredWeaponId: 'seasoning_jar',
      requiredTagCounts: { defense: 1 },
      minWeaponLevel: 2,
    },
    transformation: {
      targetWeaponId: 'seasoning_jar',
      transformedNameKey: 'recipe.seasoning_barrier.trans_name',
      damageMultiplier: 1.6,
      cooldownMultiplier: 0.6,
      extraProjectiles: 2,
      visualTint: '#06d6a0',
      additionalEffects: [{ type: 'knockback', value: 180 }],
    },
    assetKey: 'recipe_seasoning_barrier',
  }),
};
