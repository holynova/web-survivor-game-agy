import { describe, expect, it } from 'vitest';
import { CHARACTERS } from '@/content/characters/data';
import { WEAPONS } from '@/content/weapons/data';
import { Player } from '@/game/entities/Player';
import { SynergySystem } from '@/game/systems/SynergySystem';

describe('Synergy & Multi-Weapon System', () => {
  it('should support equipping up to 6 weapons on standard character', () => {
    const player = new Player(CHARACTERS.wok_master);
    expect(player.maxWeapons).toBe(6);

    const weaponList = Object.values(WEAPONS);
    for (let i = 0; i < 6; i++) {
      const equipped = player.equipWeapon(weaponList[i]);
      expect(equipped).toBe(true);
    }
    expect(player.weapons).toHaveLength(6);

    // 7th weapon should be rejected
    const extraEquipped = player.equipWeapon(weaponList[6]);
    expect(extraEquipped).toBe(false);
    expect(player.weapons).toHaveLength(6);
  });

  it('should enforce 1 weapon restriction for One-Handed Chef', () => {
    const player = new Player(CHARACTERS.one_handed);
    expect(player.maxWeapons).toBe(1);

    player.equipWeapon(WEAPONS.cleaver);
    expect(player.weapons).toHaveLength(1);

    const secondEquipped = player.equipWeapon(WEAPONS.iron_wok);
    expect(secondEquipped).toBe(false);
    expect(player.weapons).toHaveLength(1);
  });

  it('should compute active synergy tiers based on weapon tags', () => {
    const player = new Player(CHARACTERS.wok_master); // Has fire tag
    player.equipWeapon(WEAPONS.iron_wok); // Has wok, fire, melee
    player.equipWeapon(WEAPONS.stove_flame); // Has stove, fire, area

    const synergies = SynergySystem.getActiveSynergies(player);
    const fireSynergy = synergies.find(s => s.synergy.tag === 'fire');
    expect(fireSynergy).toBeDefined();
    expect(fireSynergy?.count).toBeGreaterThanOrEqual(2);
    expect(fireSynergy?.activeTier).toBeGreaterThanOrEqual(1);
  });
});
