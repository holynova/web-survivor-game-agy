import { RecipeDefinition, RecipeDefinitionSchema } from '../schemas/recipe';

export const RECIPES: Record<string, RecipeDefinition> = {
  spicy_fire_wok: RecipeDefinitionSchema.parse({
    id: 'spicy_fire_wok',
    nameKey: '爆炒火环',
    descriptionKey: '铁锅与辣椒共鸣，每次横扫激发全屏火焰冲击波，造成持续灼烧',
    tags: ['wok', 'fire'],
    requirement: {
      requiredWeaponId: 'iron_wok',
      minWeaponLevel: 1,
      requiredTagCounts: { fire: 2 },
    },
    transformation: {
      targetWeaponId: 'iron_wok',
      transformedNameKey: '爆炒火环',
      damageMultiplier: 1.8,
      cooldownMultiplier: 0.75,
      extraProjectiles: 1,
      visualTint: '#ff4500',
      additionalEffects: [
        { type: 'burn', value: 18, durationMs: 3000, tickIntervalMs: 350 },
      ],
    },
  }),

  iced_skewers: RecipeDefinitionSchema.parse({
    id: 'iced_skewers',
    nameKey: '冰镇串烧',
    descriptionKey: '竹签附带绝对零度，贯穿妖魔并造成强力冰霜减速',
    tags: ['skewer', 'ice'],
    requirement: {
      requiredWeaponId: 'bamboo_skewer',
      minWeaponLevel: 1,
      requiredTagCounts: { ice: 2 },
    },
    transformation: {
      targetWeaponId: 'bamboo_skewer',
      transformedNameKey: '冰镇串烧',
      damageMultiplier: 1.6,
      cooldownMultiplier: 0.8,
      extraProjectiles: 2,
      visualTint: '#48cae4',
      additionalEffects: [
        { type: 'slow', value: 0.45, durationMs: 2500 },
      ],
    },
  }),

  sugar_flame_stove: RecipeDefinitionSchema.parse({
    id: 'sugar_flame_stove',
    nameKey: '拔丝烈焰',
    descriptionKey: '炉火熔炼糖浆，火域范围大幅扩大且敌人死亡爆裂食材',
    tags: ['fire', 'sugar'],
    requirement: {
      requiredWeaponId: 'stove_flame',
      minWeaponLevel: 1,
      requiredTagCounts: { sugar: 2 },
    },
    transformation: {
      targetWeaponId: 'stove_flame',
      transformedNameKey: '拔丝烈焰',
      damageMultiplier: 1.7,
      cooldownMultiplier: 0.75,
      extraProjectiles: 2,
      visualTint: '#ffd166',
      additionalEffects: [
        { type: 'burn', value: 22, durationMs: 3500, tickIntervalMs: 300 },
      ],
    },
  }),

  oil_cleaver_storm: RecipeDefinitionSchema.parse({
    id: 'oil_cleaver_storm',
    nameKey: '热油飞刀狂澜',
    descriptionKey: '菜刀浸染热油，飞刀命中敌人后激射出额外回旋飞刃',
    tags: ['cleaver', 'oil'],
    requirement: {
      requiredWeaponId: 'cleaver',
      minWeaponLevel: 1,
      requiredTagCounts: { oil: 2 },
    },
    transformation: {
      targetWeaponId: 'cleaver',
      transformedNameKey: '热油飞刀狂澜',
      damageMultiplier: 1.9,
      cooldownMultiplier: 0.7,
      extraProjectiles: 2,
      visualTint: '#f4a261',
      additionalEffects: [
        { type: 'knockback', value: 120 },
      ],
    },
  }),

  fermented_sauce_bell: RecipeDefinitionSchema.parse({
    id: 'fermented_sauce_bell',
    nameKey: '老酱醒神铃',
    descriptionKey: '上菜铃幽灵化为狂暴帮厨，攻击力提升 200% 且攻击附带穿透爆轰',
    tags: ['summon', 'ferment'],
    requirement: {
      requiredWeaponId: 'service_bell',
      minWeaponLevel: 1,
      requiredTagCounts: { ferment: 2 },
    },
    transformation: {
      targetWeaponId: 'service_bell',
      transformedNameKey: '老酱醒神铃',
      damageMultiplier: 2.2,
      cooldownMultiplier: 0.65,
      extraProjectiles: 2,
      visualTint: '#9b2226',
      additionalEffects: [
        { type: 'knockback', value: 100 },
      ],
    },
  }),

  seasoning_barrier: RecipeDefinitionSchema.parse({
    id: 'seasoning_barrier',
    nameKey: '金汤调料阵',
    descriptionKey: '调料瓶化为金汤结界，大幅强化撞击伤害并形成防护屏障',
    tags: ['orbit', 'defense'],
    requirement: {
      requiredWeaponId: 'seasoning_jar',
      minWeaponLevel: 1,
      requiredTagCounts: { defense: 2 },
    },
    transformation: {
      targetWeaponId: 'seasoning_jar',
      transformedNameKey: '金汤调料阵',
      damageMultiplier: 2.0,
      cooldownMultiplier: 0.7,
      extraProjectiles: 2,
      visualTint: '#d4a373',
      additionalEffects: [
        { type: 'knockback', value: 180 },
      ],
    },
  }),
};
