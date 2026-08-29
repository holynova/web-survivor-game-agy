import { Tag } from '@/content/schemas/common';
import { Player } from '../entities/Player';

export interface SynergyTier {
  requiredCount: number;
  description: string;
}

export interface SynergyDefinition {
  tag: Tag;
  name: string;
  icon: string;
  color: string;
  tiers: SynergyTier[];
}

export const SYNERGIES: Record<string, SynergyDefinition> = {
  fire: {
    tag: 'fire',
    name: '猛火派系',
    icon: '🔥',
    color: '#ff5400',
    tiers: [
      { requiredCount: 2, description: '攻击附带猛火灼烧 (每秒 12 点伤害)' },
      { requiredCount: 4, description: '元素与灼烧伤害提升 +50%' },
      { requiredCount: 6, description: '击杀敌人引发全屏火海连环爆炸' },
    ],
  },
  cleaver: {
    tag: 'cleaver',
    name: '刀工派系',
    icon: '🔪',
    color: '#f4a261',
    tiers: [
      { requiredCount: 2, description: '暴击率 +10%' },
      { requiredCount: 4, description: '暴击伤害 +50%, 近战伤害 +8' },
      { requiredCount: 6, description: '暴击 100% 触发 3 点生命窃取' },
    ],
  },
  ice: {
    tag: 'ice',
    name: '冰饮派系',
    icon: '❄️',
    color: '#00f5d4',
    tiers: [
      { requiredCount: 2, description: '攻击降低敌人 30% 移动速度' },
      { requiredCount: 4, description: '对减速/冰冻敌人造成的伤害 +40%' },
      { requiredCount: 6, description: '攻击 25% 几率深度冰冻定身 1.5 秒' },
    ],
  },
  summon: {
    tag: 'summon',
    name: '帮厨派系',
    icon: '🥟',
    color: '#9d4edd',
    tiers: [
      { requiredCount: 2, description: '自动召唤 1 只帮厨小幽灵助阵' },
      { requiredCount: 4, description: '帮厨伤害 +60%, 攻击频率 +30%' },
      { requiredCount: 6, description: '帮厨击杀敌人必定掉落双倍食材' },
    ],
  },
  economy: {
    tag: 'economy',
    name: '经营派系',
    icon: '🏺',
    color: '#ffd166',
    tiers: [
      { requiredCount: 2, description: '拾取范围 +50%, 幸运 +10' },
      { requiredCount: 4, description: '【收获】营收 +15, 商店商品 8 折' },
      { requiredCount: 6, description: '每持有 20 份食材全伤害提升 +1%' },
    ],
  },
  skewer: {
    tag: 'skewer',
    name: '穿透派系',
    icon: '⚡',
    color: '#06d6a0',
    tiers: [
      { requiredCount: 2, description: '远程基础伤害 +5, 武器穿透 +1' },
      { requiredCount: 4, description: '攻击速度 +25%, 武器穿透 +2' },
      { requiredCount: 6, description: '投射物速度 +50%, 折返 200% 暴击' },
    ],
  },
};

export class SynergySystem {
  public static getActiveSynergies(player: Player): { synergy: SynergyDefinition; activeTier: number; count: number }[] {
    const result: { synergy: SynergyDefinition; activeTier: number; count: number }[] = [];

    for (const key of Object.keys(SYNERGIES)) {
      const syn = SYNERGIES[key];
      const count = player.tagCounts[syn.tag] || 0;
      if (count > 0) {
        let activeTier = 0;
        for (let i = syn.tiers.length - 1; i >= 0; i--) {
          if (count >= syn.tiers[i].requiredCount) {
            activeTier = i + 1;
            break;
          }
        }
        result.push({ synergy: syn, activeTier, count });
      }
    }

    return result;
  }
}
