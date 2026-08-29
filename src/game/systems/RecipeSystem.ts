import { RECIPES } from '@/content/recipes/data';
import { Tag } from '@/content/schemas/common';
import { RecipeDefinition } from '@/content/schemas/recipe';
import { EventBus } from '@/core/event-bus';
import { Player } from '../entities/Player';

export class RecipeSystem {
  public evaluateRecipes(player: Player): RecipeDefinition[] {
    const newlyActivated: RecipeDefinition[] = [];

    for (const recipe of Object.values(RECIPES)) {
      // 检查是否已经激活
      const alreadyActive = player.activeRecipes.some(r => r.id === recipe.id);
      if (alreadyActive) continue;

      // 1. 检查前置武器与等级
      if (recipe.requirement.requiredWeaponId) {
        const weapon = player.weapons.find(
          w => w.definition.id === recipe.requirement.requiredWeaponId,
        );
        if (!weapon || weapon.level < (recipe.requirement.minWeaponLevel || 1)) {
          continue;
        }
      }

      // 2. 检查 Tag 条件
      let tagsSatisfied = true;
      if (recipe.requirement.requiredTagCounts) {
        for (const [tag, requiredCount] of Object.entries(recipe.requirement.requiredTagCounts)) {
          const currentCount = player.tagCounts[tag as Tag] || 0;
          if (currentCount < requiredCount) {
            tagsSatisfied = false;
            break;
          }
        }
      }

      if (!tagsSatisfied) continue;

      // 达成质变条件！
      player.activeRecipes.push(recipe);
      newlyActivated.push(recipe);

      // 将对应武器标记为质变状态
      const targetWeapon = player.weapons.find(
        w => w.definition.id === recipe.transformation.targetWeaponId,
      );
      if (targetWeapon) {
        targetWeapon.isTransformed = true;
        targetWeapon.transformedRecipeId = recipe.id;
      }

      EventBus.getInstance().emit('recipe:activated', {
        recipeId: recipe.id,
        nameKey: recipe.nameKey,
      });
    }

    return newlyActivated;
  }
}
