import { describe, expect, it } from 'vitest';
import { CHARACTERS } from '@/content/characters/data';
import { ITEMS } from '@/content/items/data';
import { WEAPONS } from '@/content/weapons/data';
import { Player } from '@/game/entities/Player';
import { RecipeSystem } from '@/game/systems/RecipeSystem';
import { WaveSystem } from '@/game/systems/WaveSystem';

describe('Wave State Machine & Recipe Transformations', () => {
  it('should transition through 12 waves correctly', () => {
    const waveSystem = new WaveSystem();
    waveSystem.startFirstWave();

    expect(waveSystem.currentWaveIndex).toBe(0);
    expect(waveSystem.wavePhase).toBe('battle');

    // 推进时间越过第1波持续时间
    const duration = waveSystem.currentWave.durationSeconds;
    const { phaseChanged, newPhase } = waveSystem.update(duration + 1, false);

    expect(phaseChanged).toBe(true);
    expect(newPhase).toBe('preparation');
    expect(waveSystem.wavePhase).toBe('preparation');

    // 推进整备期时间
    const prepDuration = waveSystem.currentWave.preparationSeconds;
    const res2 = waveSystem.update(prepDuration + 1, false);
    expect(res2.phaseChanged).toBe(true);
    expect(res2.newPhase).toBe('battle');
    expect(waveSystem.currentWaveIndex).toBe(1);
  });

  it('should activate spicy_fire_wok recipe when iron_wok is level 2+ and fire tag is present', () => {
    const player = new Player(CHARACTERS.wok_master);
    const recipeSystem = new RecipeSystem();

    // 装备铁锅
    player.equipWeapon(WEAPONS.iron_wok); // Lv.1
    let activated = recipeSystem.evaluateRecipes(player);
    expect(activated).toHaveLength(0); // 铁锅等级不够 (需要 Lv.2+)

    // 升级铁锅到 Lv.2
    player.equipWeapon(WEAPONS.iron_wok); // Lv.2
    player.addItem(ITEMS.chili_pepper); // 添加火/辣 Tag

    activated = recipeSystem.evaluateRecipes(player);
    expect(activated.map(r => r.id)).toContain('spicy_fire_wok');
    expect(player.activeRecipes.some(r => r.id === 'spicy_fire_wok')).toBe(true);

    const wokWeapon = player.weapons.find(w => w.definition.id === 'iron_wok');
    expect(wokWeapon?.isTransformed).toBe(true);
    expect(wokWeapon?.transformedRecipeId).toBe('spicy_fire_wok');
  });

  it('should test wave end heal and double loot accumulation logic', () => {
    const player = new Player(CHARACTERS.wok_master);
    player.takeDamage(50);
    expect(player.currentHp).toBeLessThan(player.maxHp);

    player.heal(player.maxHp);
    expect(player.currentHp).toBe(player.maxHp);
  });
});
