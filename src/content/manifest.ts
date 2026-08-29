import { CHARACTERS } from './characters/data';
import { WEAPONS } from './weapons/data';
import { ITEMS } from './items/data';
import { ENEMIES } from './enemies/data';
import { WAVES } from './waves/data';
import { RECIPES } from './recipes/data';

export interface ContentRegistry {
  characters: typeof CHARACTERS;
  weapons: typeof WEAPONS;
  items: typeof ITEMS;
  enemies: typeof ENEMIES;
  waves: typeof WAVES;
  recipes: typeof RECIPES;
}

export const GameContent: ContentRegistry = {
  characters: CHARACTERS,
  weapons: WEAPONS,
  items: ITEMS,
  enemies: ENEMIES,
  waves: WAVES,
  recipes: RECIPES,
};

/**
 * 完整性校验器：确保所有引用的 ID、初始武器、波次怪物、菜谱前置全部存在
 */
export function validateContentIntegrity(): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  // 1. 校验角色初始武器
  for (const char of Object.values(GameContent.characters)) {
    if (!GameContent.weapons[char.startingWeaponId]) {
      errors.push(`Character '${char.id}' references non-existent weapon '${char.startingWeaponId}'`);
    }
  }

  // 2. 校验波次敌人
  for (const wave of GameContent.waves) {
    for (const entry of wave.spawnEntries) {
      if (!GameContent.enemies[entry.enemyId]) {
        errors.push(`Wave ${wave.waveNumber} references non-existent enemy '${entry.enemyId}'`);
      }
    }
    if (wave.isBossWave && wave.bossId && !GameContent.enemies[wave.bossId]) {
      errors.push(`Wave ${wave.waveNumber} references non-existent boss '${wave.bossId}'`);
    }
  }

  // 3. 校验菜谱武器
  for (const recipe of Object.values(GameContent.recipes)) {
    if (
      recipe.requirement.requiredWeaponId &&
      !GameContent.weapons[recipe.requirement.requiredWeaponId]
    ) {
      errors.push(
        `Recipe '${recipe.id}' references non-existent required weapon '${recipe.requirement.requiredWeaponId}'`,
      );
    }
    if (!GameContent.weapons[recipe.transformation.targetWeaponId]) {
      errors.push(
        `Recipe '${recipe.id}' references non-existent target weapon '${recipe.transformation.targetWeaponId}'`,
      );
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}
