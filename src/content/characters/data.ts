import { CharacterDefinition, CharacterDefinitionSchema } from '../schemas/character';

export const CHARACTERS: Record<string, CharacterDefinition> = {
  wok_master: CharacterDefinitionSchema.parse({
    id: 'wok_master',
    nameKey: '爆炒大厨',
    titleKey: '夜市宗师',
    descriptionKey: '大排档掌勺宗师。生命值与防御极高，专精火候与近战猛攻。',
    startingWeaponId: 'iron_wok',
    tags: ['wok', 'fire', 'melee', 'defense'],
    baseStats: {
      maxHp: 120,
      moveSpeed: 190,
      damageMultiplier: 1.1,
      attackSpeedMultiplier: 1.0,
      critChance: 0.05,
      critMultiplier: 1.5,
      pickupRadius: 70,
      armor: 2,
    },
    assetKey: 'char_wok_master',
  }),

  cold_brewer: CharacterDefinitionSchema.parse({
    id: 'cold_brewer',
    nameKey: '冷饮师',
    titleKey: '冰饮掌柜',
    descriptionKey: '幽冥冰饮铺主理人。步履如风，拾取范围广阔，擅长冰霜减速与游击。',
    startingWeaponId: 'cleaver',
    tags: ['ice', 'projectile', 'speed'],
    baseStats: {
      maxHp: 90,
      moveSpeed: 230,
      damageMultiplier: 0.95,
      attackSpeedMultiplier: 1.15,
      critChance: 0.08,
      critMultiplier: 1.6,
      pickupRadius: 95,
      armor: 0,
    },
    assetKey: 'char_cold_brewer',
  }),

  skewer_griller: CharacterDefinitionSchema.parse({
    id: 'skewer_griller',
    nameKey: '串烧厨神',
    titleKey: '炭火烧烤王',
    descriptionKey: '炭火烧烤摊主。攻速迅猛，暴击率极高，擅长以暴制暴快速收割。',
    startingWeaponId: 'bamboo_skewer',
    tags: ['skewer', 'oil', 'crit', 'projectile'],
    baseStats: {
      maxHp: 100,
      moveSpeed: 210,
      damageMultiplier: 1.05,
      attackSpeedMultiplier: 1.1,
      critChance: 0.12,
      critMultiplier: 1.75,
      pickupRadius: 80,
      armor: 1,
    },
    assetKey: 'char_skewer_griller',
  }),
};
