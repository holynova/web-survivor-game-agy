import { CharacterDefinition, CharacterDefinitionSchema } from '../schemas/character';

export const CHARACTERS: Record<string, CharacterDefinition> = {
  wok_master: CharacterDefinitionSchema.parse({
    id: 'wok_master',
    nameKey: 'character.wok_master.name',
    titleKey: 'character.wok_master.title',
    descriptionKey: 'character.wok_master.desc',
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
    nameKey: 'character.cold_brewer.name',
    titleKey: 'character.cold_brewer.title',
    descriptionKey: 'character.cold_brewer.desc',
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
    nameKey: 'character.skewer_griller.name',
    titleKey: 'character.skewer_griller.title',
    descriptionKey: 'character.skewer_griller.desc',
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
