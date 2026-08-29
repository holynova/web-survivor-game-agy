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
  currentAngle?: number; // 悬浮环绕角度
}

export class Player {
  public position = new Vector2(0, 0);
  public velocity = new Vector2(0, 0);
  public facingDirection = new Vector2(1, 0);
  public radius = 14;

  public characterDef: CharacterDefinition;

  // 12 大全维深度属性 (Brotato 体系)
  public currentHp: number;
  public maxHp: number;
  public hpRegen = 0; // 每 5 秒自动回复量
  public hpRegenTimerSec = 0;
  public lifesteal = 0; // 击中回血点数
  public lifestealChance = 0; // 击中吸血触发概率

  public damageMultiplier: number;
  public meleeDamage = 0; // 近战基础伤害加成
  public rangedDamage = 0; // 远程基础伤害加成
  public elementalDamage = 0; // 元素灼烧/极寒基础伤害加成

  public moveSpeed: number;
  public attackSpeedMultiplier: number;
  public critChance: number;
  public critMultiplier: number;
  public pickupRadius: number;
  public armor: number;
  public dodge = 0; // 闪避几率 (上限 60%)
  public lifestealAmount = 0;

  public harvest = 0; // 收获 (每波发放食材并复利增长)
  public luck = 0; // 幸运 (提升高阶商品与神坛掉落)
  public engineering = 0; // 帮厨工程 (召唤物与自动设施强化)

  public healOnKill = 0;

  public isInvincible = false;
  public iFrameTimerSec = 0;
  public readonly iFrameDurationSec = 0.35;

  public level = 1;
  public currentExp = 0;
  public expToNextLevel = 20;
  public ingredients = 20; // 初始启动资金

  public maxWeapons = 6;
  public weapons: EquippedWeaponState[] = [];
  public items: { definition: ItemDefinition; count: number }[] = [];
  public activeRecipes: RecipeDefinition[] = [];
  public tagCounts: Partial<Record<Tag, number>> = {};

  constructor(characterDef: CharacterDefinition, spawnX = 0, spawnY = 0) {
    this.characterDef = characterDef;
    this.position.set(spawnX, spawnY);
    this.maxWeapons = characterDef.maxWeapons || 6;

    const base = characterDef.baseStats;
    this.currentHp = base.maxHp;
    this.maxHp = base.maxHp;
    this.moveSpeed = base.moveSpeed;
    this.damageMultiplier = base.damageMultiplier || 1.0;
    this.attackSpeedMultiplier = base.attackSpeedMultiplier || 1.0;
    this.critChance = base.critChance || 0.05;
    this.critMultiplier = base.critMultiplier || 1.5;
    this.pickupRadius = base.pickupRadius || 70;
    this.armor = base.armor || 0;
    this.dodge = base.dodge || 0;
    this.hpRegen = base.hpRegen || 0;
    this.lifesteal = base.lifesteal || 0;
    this.meleeDamage = base.meleeDamage || 0;
    this.rangedDamage = base.rangedDamage || 0;
    this.elementalDamage = base.elementalDamage || 0;
    this.harvest = base.harvest || 0;
    this.luck = base.luck || 0;
    this.engineering = base.engineering || 0;

    this.recalculateTags();
    this.recalculateStats();
  }

  public update(dtSec: number): void {
    if (this.iFrameTimerSec > 0) {
      this.iFrameTimerSec = Math.max(0, this.iFrameTimerSec - dtSec);
    }

    // 生命秒回逻辑 (每 5 秒自动恢复 hpRegen 点生命)
    if (this.hpRegen > 0 && this.currentHp < this.maxHp) {
      this.hpRegenTimerSec += dtSec;
      if (this.hpRegenTimerSec >= 5.0) {
        this.hpRegenTimerSec -= 5.0;
        this.heal(this.hpRegen);
      }
    }
  }

  public takeDamage(rawDamage: number): { damage: number; dodged: boolean } {
    if (this.isInvincible || this.iFrameTimerSec > 0) {
      return { damage: 0, dodged: false };
    }

    // 闪避判定 (上限 60%)
    const effectiveDodge = Math.min(0.6, Math.max(0, this.dodge));
    if (Math.random() < effectiveDodge) {
      this.iFrameTimerSec = 0.2; // 闪避微短无敌防连续撞击
      return { damage: 0, dodged: true };
    }

    const effectiveDamage = Math.max(1, Math.round(rawDamage - this.armor));
    this.currentHp = Math.max(0, this.currentHp - effectiveDamage);
    this.iFrameTimerSec = this.iFrameDurationSec;
    return { damage: effectiveDamage, dodged: false };
  }

  public heal(amount: number): void {
    this.currentHp = Math.min(this.maxHp, this.currentHp + amount);
  }

  public applyEndOfWaveHarvest(): number {
    const earned = this.harvest;
    this.ingredients += earned;
    // 复利增长 5% (向上取整)
    if (this.harvest > 0) {
      this.harvest = Math.ceil(this.harvest * 1.05);
    }
    return earned;
  }

  public addExp(amount: number): boolean {
    this.currentExp += amount;
    if (this.currentExp >= this.expToNextLevel) {
      this.currentExp -= this.expToNextLevel;
      this.level++;
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

  public equipWeapon(weaponDef: WeaponDefinition): boolean {
    const existing = this.weapons.find(w => w.definition.id === weaponDef.id);
    if (existing) {
      if (existing.level < weaponDef.levels.length) {
        existing.level++;
        this.recalculateTags();
        this.recalculateStats();
        return true;
      }
      return false;
    }
    if (this.weapons.length >= this.maxWeapons) {
      return false; // 已达到武器装备槽位上限
    }
    this.weapons.push({
      definition: weaponDef,
      level: 1,
      cooldownTimerMs: 0,
      isTransformed: false,
    });
    this.recalculateTags();
    this.recalculateStats();
    return true;
  }

  public removeWeapon(index: number): WeaponDefinition | null {
    if (index >= 0 && index < this.weapons.length) {
      const removed = this.weapons.splice(index, 1)[0];
      this.recalculateTags();
      this.recalculateStats();
      return removed.definition;
    }
    return null;
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
    const base = this.characterDef.baseStats;

    let hpBonus = 0;
    let speedBonus = 0;
    let dmgMultBonus = 0;
    let atkSpdBonus = 0;
    let critBonus = 0;
    let critMultBonus = 0;
    let pickupBonus = 0;
    let armorBonus = 0;
    let dodgeBonus = 0;
    let hpRegenBonus = 0;
    let lifestealBonus = 0;
    let meleeBonus = 0;
    let rangedBonus = 0;
    let elementalBonus = 0;
    let harvestBonus = 0;
    let luckBonus = 0;
    let engineeringBonus = 0;

    for (const entry of this.items) {
      for (const mod of entry.definition.modifiers) {
        const totalVal = mod.value * entry.count;
        if (mod.stat === 'maxHp') hpBonus += totalVal;
        if (mod.stat === 'moveSpeed') speedBonus += totalVal;
        if (mod.stat === 'damageMultiplier') dmgMultBonus += totalVal;
        if (mod.stat === 'attackSpeedMultiplier') atkSpdBonus += totalVal;
        if (mod.stat === 'critChance') critBonus += totalVal;
        if (mod.stat === 'critMultiplier') critMultBonus += totalVal;
        if (mod.stat === 'pickupRadius') pickupBonus += totalVal;
        if (mod.stat === 'armor') armorBonus += totalVal;
        if (mod.stat === 'dodge') dodgeBonus += totalVal;
        if (mod.stat === 'hpRegen') hpRegenBonus += totalVal;
        if (mod.stat === 'lifesteal') lifestealBonus += totalVal;
        if (mod.stat === 'meleeDamage') meleeBonus += totalVal;
        if (mod.stat === 'rangedDamage') rangedBonus += totalVal;
        if (mod.stat === 'elementalDamage') elementalBonus += totalVal;
        if (mod.stat === 'harvest') harvestBonus += totalVal;
        if (mod.stat === 'luck') luckBonus += totalVal;
        if (mod.stat === 'engineering') engineeringBonus += totalVal;
      }
    }

    // 特殊角色机制：守财掌柜 (每 25 食材 +1% 伤害)
    if (this.characterDef.specialTrait === 'investor') {
      dmgMultBonus += Math.floor(this.ingredients / 25) * 0.01;
    }

    this.maxHp = Math.max(10, Math.round(base.maxHp + hpBonus));
    this.currentHp = Math.min(this.currentHp, this.maxHp);
    this.moveSpeed = Math.max(80, base.moveSpeed + speedBonus);
    this.damageMultiplier = Math.max(0.1, (base.damageMultiplier || 1.0) + dmgMultBonus);
    this.attackSpeedMultiplier = Math.max(0.2, (base.attackSpeedMultiplier || 1.0) + atkSpdBonus);
    this.critChance = Math.max(0, Math.min(1.0, (base.critChance || 0.05) + critBonus));
    this.critMultiplier = Math.max(1.0, (base.critMultiplier || 1.5) + critMultBonus);
    this.pickupRadius = Math.max(30, Math.round((base.pickupRadius || 70) + pickupBonus));
    this.armor = Math.round((base.armor || 0) + armorBonus);
    this.dodge = Math.max(0, Math.min(0.6, (base.dodge || 0) + dodgeBonus));
    this.hpRegen = Math.max(0, (base.hpRegen || 0) + hpRegenBonus);
    this.lifesteal = Math.max(0, (base.lifesteal || 0) + lifestealBonus);
    this.meleeDamage = (base.meleeDamage || 0) + meleeBonus;
    this.rangedDamage = (base.rangedDamage || 0) + rangedBonus;
    this.elementalDamage = (base.elementalDamage || 0) + elementalBonus;
    this.harvest = Math.max(0, (base.harvest || 0) + harvestBonus);
    this.luck = Math.max(0, (base.luck || 0) + luckBonus);
    this.engineering = Math.max(0, (base.engineering || 0) + engineeringBonus);

    // 吸血与回血概率映射
    this.lifestealChance = this.lifesteal > 0 ? Math.min(0.5, this.lifesteal * 0.08) : 0;
    this.healOnKill = this.getItemCount('wolfberry_wine') * 2;
  }
}
