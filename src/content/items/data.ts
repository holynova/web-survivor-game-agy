import { ItemDefinition, ItemDefinitionSchema } from '../schemas/item';

export const ITEMS: Record<string, ItemDefinition> = {
  chili_pepper: ItemDefinitionSchema.parse({
    id: 'chili_pepper',
    nameKey: '朝天红辣椒',
    descriptionKey: '全武器伤害 +15%，灼烧持续伤害 +25%',
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
    nameKey: '老窖碎冰块',
    descriptionKey: '减速持续时间 +30%，角色护甲 +1',
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
    nameKey: '纯香芝麻油',
    descriptionKey: '角色移动速度 +10%，暴击率 +4%',
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
    nameKey: '古法红蔗糖',
    descriptionKey: '掉落物拾取范围 +25%，食材掉落收益 +35%',
    tags: ['sugar', 'economy'],
    rarity: 'common',
    cost: 8,
    maxStacks: 5,
    color: '#ffd166',
    assetKey: 'item_cane_sugar',
    modifiers: [
      { stat: 'pickupRadius', value: 0.25, mode: 'flat' },
      { stat: 'ingredientDropBonus', value: 0.35, mode: 'flat' },
    ],
  }),

  fermented_sauce: ItemDefinitionSchema.parse({
    id: 'fermented_sauce',
    nameKey: '特酿豆瓣酱',
    descriptionKey: '暴击伤害倍率 +35%，全武器伤害 +10%',
    tags: ['ferment', 'crit'],
    rarity: 'rare',
    cost: 12,
    maxStacks: 3,
    color: '#9b2226',
    assetKey: 'item_fermented_sauce',
    modifiers: [
      { stat: 'critMultiplier', value: 0.35, mode: 'flat' },
      { stat: 'damageMultiplier', value: 0.1, mode: 'flat' },
    ],
  }),

  bamboo_steamer: ItemDefinitionSchema.parse({
    id: 'bamboo_steamer',
    nameKey: '老竹小蒸笼',
    descriptionKey: '最大生命值 +25 点，角色护甲 +2',
    tags: ['defense', 'ferment'],
    rarity: 'rare',
    cost: 12,
    maxStacks: 3,
    color: '#d4a373',
    assetKey: 'item_bamboo_steamer',
    modifiers: [
      { stat: 'maxHp', value: 25, mode: 'flat' },
      { stat: 'armor', value: 2, mode: 'flat' },
    ],
  }),

  garlic_clove: ItemDefinitionSchema.parse({
    id: 'garlic_clove',
    nameKey: '紫皮独头蒜',
    descriptionKey: '最大生命值 +15 点，角色护甲 +1',
    tags: ['defense', 'oil'],
    rarity: 'common',
    cost: 7,
    maxStacks: 4,
    color: '#e2ece9',
    assetKey: 'item_garlic_clove',
    modifiers: [
      { stat: 'maxHp', value: 15, mode: 'flat' },
      { stat: 'armor', value: 1, mode: 'flat' },
    ],
  }),

  star_anise: ItemDefinitionSchema.parse({
    id: 'star_anise',
    nameKey: '阴阳八角茴',
    descriptionKey: '全武器攻击速度 +12%',
    tags: ['speed', 'crit'],
    rarity: 'rare',
    cost: 12,
    maxStacks: 3,
    color: '#8d0801',
    assetKey: 'item_star_anise',
    modifiers: [
      { stat: 'attackSpeedMultiplier', value: 0.12, mode: 'flat' },
    ],
  }),

  dang_gui_herb: ItemDefinitionSchema.parse({
    id: 'dang_gui_herb',
    nameKey: '当归滋补草',
    descriptionKey: '武器命中敌人有 12% 几率吸取 2 点生命值',
    tags: ['defense', 'ferment'],
    rarity: 'rare',
    cost: 12,
    maxStacks: 3,
    color: '#2a9d8f',
    assetKey: 'item_herb',
    modifiers: [],
  }),

  wolfberry_wine: ItemDefinitionSchema.parse({
    id: 'wolfberry_wine',
    nameKey: '枸杞养生酒',
    descriptionKey: '击杀敌人必回 2 点生命值，最大生命 +20 点',
    tags: ['ferment', 'economy'],
    rarity: 'rare',
    cost: 14,
    maxStacks: 3,
    color: '#e76f51',
    assetKey: 'item_potion',
    modifiers: [
      { stat: 'maxHp', value: 20, mode: 'flat' },
    ],
  }),
};
