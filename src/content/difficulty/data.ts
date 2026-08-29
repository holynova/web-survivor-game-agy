export interface DifficultyDefinition {
  id: string;
  nameKey: string;
  badge: string;
  color: string;
  descriptionKey: string;
  enemyHpMultiplier: number;
  enemyDamageMultiplier: number;
  enemySpeedMultiplier: number;
  spawnIntervalMultiplier: number;
  scoreMultiplier: number;
}

export const DIFFICULTIES: Record<string, DifficultyDefinition> = {
  easy: {
    id: 'easy',
    nameKey: '初试身手',
    badge: '★☆☆☆☆',
    color: '#2a9d8f',
    descriptionKey: '妖魔虚弱 (生命-20%, 伤害-30%, 移速-15%)，适合新手大厨熟悉菜谱',
    enemyHpMultiplier: 0.8,
    enemyDamageMultiplier: 0.7,
    enemySpeedMultiplier: 0.85,
    spawnIntervalMultiplier: 1.25,
    scoreMultiplier: 0.8,
  },
  normal: {
    id: 'normal',
    nameKey: '热闹夜市',
    badge: '★★☆☆☆',
    color: '#f4a261',
    descriptionKey: '标准山海夜市体验，经典妖魔强度与出摊节奏',
    enemyHpMultiplier: 1.0,
    enemyDamageMultiplier: 1.0,
    enemySpeedMultiplier: 1.0,
    spawnIntervalMultiplier: 1.0,
    scoreMultiplier: 1.0,
  },
  hard: {
    id: 'hard',
    nameKey: '百鬼夜行',
    badge: '★★★☆☆',
    color: '#e76f51',
    descriptionKey: '妖魔狂躁 (生命+35%, 伤害+25%, 移速+15%)，冲刺与远程怪频繁出击',
    enemyHpMultiplier: 1.35,
    enemyDamageMultiplier: 1.25,
    enemySpeedMultiplier: 1.15,
    spawnIntervalMultiplier: 0.85,
    scoreMultiplier: 1.5,
  },
  nightmare: {
    id: 'nightmare',
    nameKey: '饕餮盛宴',
    badge: '★★★★☆',
    color: '#d90429',
    descriptionKey: '妖气滔天 (生命+80%, 伤害+60%, 移速+25%)，妖魔大军铺天盖地',
    enemyHpMultiplier: 1.8,
    enemyDamageMultiplier: 1.6,
    enemySpeedMultiplier: 1.25,
    spawnIntervalMultiplier: 0.7,
    scoreMultiplier: 2.2,
  },
  inferno: {
    id: 'inferno',
    nameKey: '修罗地狱',
    badge: '★★★★★',
    color: '#7209b7',
    descriptionKey: '万劫不复 (生命+140%, 伤害+100%, 移速+40%)，极速刷新，极限生存挑战！',
    enemyHpMultiplier: 2.4,
    enemyDamageMultiplier: 2.0,
    enemySpeedMultiplier: 1.4,
    spawnIntervalMultiplier: 0.55,
    scoreMultiplier: 3.5,
  },
};
