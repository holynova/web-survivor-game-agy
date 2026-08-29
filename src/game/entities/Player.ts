import { CharacterDefinition } from '@/content/schemas/character';
import { Tag } from '@/content/schemas/common';
import { ItemDefinition } from '@/content/schemas/item';
import { RecipeDefinition } from '@/content/schemas/recipe';
import { WeaponDefinition } from '@/content/schemas/weapon';
import { Vector2 } from '@/core/math';

export interface EquippedWeaponState {
  definition: WeaponDefinition;
  level: number;
  cooldownTimerMs: number;
  isTransformed: boolean;
  transformedRecipeId?: string;
}

export class Player {
  public position = new Vector2(0, 0);
  public velocity = new Vector2(0, 0);
  public facingDirection = new Vector2(1, 0);
  public radius = 14;

  public characterDef: CharacterDefinition;

  public currentHp: number;
  public maxHp: number;
  public moveSpeed: number;
  public damageMultiplier: number;
  public attackSpeedMultiplier: number;
  public critChance: number;
  public critMultiplier: number;
  public pickupRadius: number;
  public armor: number;
  public lifestealChance = 0;
  public lifestealAmount = 0;
  public healOnKill = 0;

  public isInvincible = false;
  public iFrameTimerSec = 0;
  public readonly iFrameDurationSec = 0.4;

  public level = 1;
  public currentExp = 0;
  public expToNextLevel = 20;
  public ingredients = 20; // 初始启动资金

  public maxWeapons = 4;
  public weapons: EquippedWeaponState[] = [];
  public items: { definition: ItemDefinition; count: number }[] = [];
  public activeRecipes: RecipeDefinition[] = [];
  public tagCounts: Partial<Record<Tag, number>> = {};

  constructor(characterDef: CharacterDefinition, spawnX = 0, spawnY = 0) {
    this.characterDef = characterDef;
    this.position.set(spawnX, spawnY);
    this.currentHp = characterDef.baseStats.maxHp;
    this.maxHp = characterDef.baseStats.maxHp;
    this.moveSpeed = characterDef.baseStats.moveSpeed;
    this.damageMultiplier = characterDef.baseStats.damageMultiplier;
    this.attackSpeedMultiplier = characterDef.baseStats.attackSpeedMultiplier;
    this.critChance = characterDef.baseStats.critChance;
    this.critMultiplier = characterDef.baseStats.critMultiplier;
    this.pickupRadius = characterDef.baseStats.pickupRadius;
    this.armor = characterDef.baseStats.armor;
    this.recalculateTags();
  }

  public takeDamage(rawDamage: number): number {
    if (this.isInvincible || this.iFrameTimerSec > 0) {
      return 0;
    }
    const effectiveDamage = Math.max(1, Math.round(rawDamage - this.armor));
    this.currentHp = Math.max(0, this.currentHp - effectiveDamage);
    this.iFrameTimerSec = this.iFrameDurationSec;
    return effectiveDamage;
  }

  public heal(amount: number): void {
    this.currentHp = Math.min(this.maxHp, this.currentHp + amount);
  }

  public addExp(amount: number): boolean {
    this.currentExp += amount;
    if (this.currentExp >= this.expToNextLevel) {
      this.currentExp -= this.expToNextLevel;
      this.level++;
      // 等级阈值平滑递增：每级增加 25% + 10
      this.expToNextLevel = Math.round(this.expToNextLevel * 1.25 + 10);
      return true; // 触发升级
    }
    return false;
  }

  public upgradeWeapon(weaponId: string): void {
    const existing = this.weapons.find(w => w.definition.id === weaponId);
    if (existing && existing.level < existing.definition.levels.length) {
      existing.level++;
      this.recalculateTags();
      this.recalculateStats();
    }
  }

  public equipWeapon(weaponDef: WeaponDefinition): void {
    const existing = this.weapons.find(w => w.definition.id === weaponDef.id);
    if (existing) {
      if (existing.level < weaponDef.levels.length) {
        existing.level++;
      }
    } else {
      this.weapons.push({
        definition: weaponDef,
        level: 1,
        cooldownTimerMs: 0,
        isTransformed: false,
      });
    }
    this.recalculateTags();
    this.recalculateStats();
  }

  public getItemCount(id: string): number {
    const existing = this.items.find(i => i.definition.id === id);
    return existing ? existing.count : 0;
  }

  public addItem(itemDef: ItemDefinition): void {
    const existing = this.items.find(i => i.definition.id === itemDef.id);
    if (existing) {
      if (existing.count < itemDef.maxStacks) {
        existing.count++;
      }
    } else {
      this.items.push({ definition: itemDef, count: 1 });
    }
    this.recalculateTags();
    this.recalculateStats();
  }

  public recalculateTags(): void {
    this.tagCounts = {};

    // 1. 角色原生 Tags
    for (const t of this.characterDef.tags) {
      this.tagCounts[t] = (this.tagCounts[t] || 0) + 1;
    }

    // 2. 武器 Tags
    for (const w of this.weapons) {
      for (const t of w.definition.tags) {
        this.tagCounts[t] = (this.tagCounts[t] || 0) + 1;
      }
    }

    // 3. 物品 Tags
    for (const itemEntry of this.items) {
      for (const t of itemEntry.definition.tags) {
        this.tagCounts[t] = (this.tagCounts[t] || 0) + itemEntry.count;
      }
    }
  }

  public recalculateStats(): void {
    // 重置为角色基础
    let hpBonus = 0;
    let speedBonus = 0;
    let dmgMultBonus = 0;
    let atkSpdBonus = 0;
    let critBonus = 0;
    let critMultBonus = 0;
    let pickupBonus = 0;
    let armorBonus = 0;

    for (const entry of this.items) {
      for (const mod of entry.definition.modifiers) {
        const totalModValue = mod.value * entry.count;
        if (mod.stat === 'maxHp') hpBonus += totalModValue;
        if (mod.stat === 'moveSpeed') speedBonus += totalModValue;
        if (mod.stat === 'damageMultiplier') dmgMultBonus += totalModValue;
        if (mod.stat === 'attackSpeedMultiplier') atkSpdBonus += totalModValue;
        if (mod.stat === 'critChance') critBonus += totalModValue;
        if (mod.stat === 'critMultiplier') critMultBonus += totalModValue;
        if (mod.stat === 'pickupRadius') pickupBonus += totalModValue;
        if (mod.stat === 'armor') armorBonus += totalModValue;
      }
    }

    // 滋补回血与吸血属性叠加
    this.lifestealChance = this.getItemCount('dang_gui_herb') * 0.12;
    this.lifestealAmount = this.getItemCount('dang_gui_herb') * 2;
    this.healOnKill = this.getItemCount('wolfberry_wine') * 2;

    const base = this.characterDef.baseStats;
    this.maxHp = Math.round(base.maxHp + hpBonus);
    this.moveSpeed = base.moveSpeed * (1 + speedBonus);
    this.damageMultiplier = base.damageMultiplier + dmgMultBonus;
    this.attackSpeedMultiplier = base.attackSpeedMultiplier + atkSpdBonus;
    this.critChance = base.critChance + critBonus;
    this.critMultiplier = base.critMultiplier + critMultBonus;
    this.pickupRadius = Math.round(base.pickupRadius * (1 + pickupBonus));
    this.armor = Math.round(base.armor + armorBonus);
  }
}
