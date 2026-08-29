import { ItemDefinition, ItemDefinitionSchema } from '../schemas/item';

export const ITEMS: Record<string, ItemDefinition> = {
  chili_pepper: ItemDefinitionSchema.parse({
    id: 'chili_pepper',
    nameKey: 'item.chili_pepper.name',
    descriptionKey: 'item.chili_pepper.desc',
    tags: ['fire', 'crit'],
    rarity: 'common',
    cost: 8,
    maxStacks: 5,
    color: '#e76f51',
    assetKey: 'item_chili_pepper',
    modifiers: [
      { stat: 'damageMultiplier', value: 0.15, mode: 'flat' },
      { stat: 'burnDamageMultiplier', value: 0.25, mode: 'flat' },
    ],
  }),

  ice_cube: ItemDefinitionSchema.parse({
    id: 'ice_cube',
    nameKey: 'item.ice_cube.name',
    descriptionKey: 'item.ice_cube.desc',
    tags: ['ice', 'defense'],
    rarity: 'common',
    cost: 8,
    maxStacks: 5,
    color: '#48cae4',
    assetKey: 'item_ice_cube',
    modifiers: [
      { stat: 'slowDurationMultiplier', value: 0.3, mode: 'flat' },
      { stat: 'armor', value: 1, mode: 'flat' },
    ],
  }),

  sesame_oil: ItemDefinitionSchema.parse({
    id: 'sesame_oil',
    nameKey: 'item.sesame_oil.name',
    descriptionKey: 'item.sesame_oil.desc',
    tags: ['oil', 'speed'],
    rarity: 'common',
    cost: 8,
    maxStacks: 5,
    color: '#f4a261',
    assetKey: 'item_sesame_oil',
    modifiers: [
      { stat: 'moveSpeed', value: 0.1, mode: 'flat' },
      { stat: 'critChance', value: 0.04, mode: 'flat' },
    ],
  }),

  cane_sugar: ItemDefinitionSchema.parse({
    id: 'cane_sugar',
    nameKey: 'item.cane_sugar.name',
    descriptionKey: 'item.cane_sugar.desc',
    tags: ['sugar', 'economy'],
    rarity: 'common',
    cost: 8,
    maxStacks: 5,
    color: '#ffd166',
    assetKey: 'item_cane_sugar',
    modifiers: [
      { stat: 'ingredientDropBonus', value: 0.2, mode: 'flat' },
      { stat: 'pickupRadius', value: 25, mode: 'flat' },
    ],
  }),

  fermented_sauce: ItemDefinitionSchema.parse({
    id: 'fermented_sauce',
    nameKey: 'item.fermented_sauce.name',
    descriptionKey: 'item.fermented_sauce.desc',
    tags: ['ferment', 'crit'],
    rarity: 'rare',
    cost: 12,
    maxStacks: 4,
    color: '#6b705c',
    assetKey: 'item_fermented_sauce',
    modifiers: [
      { stat: 'damageMultiplier', value: 0.2, mode: 'flat' },
      { stat: 'critMultiplier', value: 0.3, mode: 'flat' },
    ],
  }),

  bamboo_steamer: ItemDefinitionSchema.parse({
    id: 'bamboo_steamer',
    nameKey: 'item.bamboo_steamer.name',
    descriptionKey: 'item.bamboo_steamer.desc',
    tags: ['defense'],
    rarity: 'rare',
    cost: 12,
    maxStacks: 4,
    color: '#cb997e',
    assetKey: 'item_bamboo_steamer',
    modifiers: [
      { stat: 'maxHp', value: 25, mode: 'flat' },
      { stat: 'armor', value: 2, mode: 'flat' },
    ],
  }),

  garlic_clove: ItemDefinitionSchema.parse({
    id: 'garlic_clove',
    nameKey: 'item.garlic_clove.name',
    descriptionKey: 'item.garlic_clove.desc',
    tags: ['speed'],
    rarity: 'rare',
    cost: 12,
    maxStacks: 4,
    color: '#f8f9fa',
    assetKey: 'item_garlic_clove',
    modifiers: [{ stat: 'attackSpeedMultiplier', value: 0.15, mode: 'flat' }],
  }),

  star_anise: ItemDefinitionSchema.parse({
    id: 'star_anise',
    nameKey: 'item.star_anise.name',
    descriptionKey: 'item.star_anise.desc',
    tags: ['crit'],
    rarity: 'epic',
    cost: 16,
    maxStacks: 3,
    color: '#bc4749',
    assetKey: 'item_star_anise',
    modifiers: [
      { stat: 'critChance', value: 0.08, mode: 'flat' },
      { stat: 'critMultiplier', value: 0.5, mode: 'flat' },
    ],
  }),
};
