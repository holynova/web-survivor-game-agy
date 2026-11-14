/**
 * 商店价格计算（纯函数，可单测）。
 * 六臂神童特性：买武器 8 折。此前角色描述有该承诺，但商店从未执行。
 */
export function weaponPriceFor(baseCost: number, characterId: string): number {
  if (characterId === 'six_armed') {
    return Math.max(1, Math.round(baseCost * 0.8));
  }
  return baseCost;
}
