/**
 * 带种子的可确定性伪随机数生成器 (Mulberry32 算法)
 * 保证相同 seed 下的随机序列 100% 可重现
 */
export class SeededRNG {
  private state: number;
  private readonly initialSeed: number;

  constructor(seed: number | string = Date.now()) {
    if (typeof seed === 'string') {
      this.initialSeed = SeededRNG.hashString(seed);
    } else {
      this.initialSeed = Math.floor(seed);
    }
    this.state = this.initialSeed;
  }

  public static hashString(str: string): number {
    let hash = 1779033703 ^ str.length;
    for (let i = 0; i < str.length; i++) {
      hash = Math.imul(hash ^ str.charCodeAt(i), 3432918353);
      hash = (hash << 13) | (hash >>> 19);
    }
    return hash >>> 0;
  }

  public getSeed(): number {
    return this.initialSeed;
  }

  public getState(): number {
    return this.state;
  }

  public setState(state: number): void {
    this.state = state;
  }

  /**
   * 生成 [0, 1) 的浮点随机数
   */
  public next(): number {
    let z = (this.state += 0x6d2b79f5);
    z = Math.imul(z ^ (z >>> 15), z | 1);
    z ^= z + Math.imul(z ^ (z >>> 7), z | 61);
    return ((z ^ (z >>> 14)) >>> 0) / 4294967296;
  }

  /**
   * 生成 [min, max] 的整数随机数（两端包含）
   */
  public nextInt(min: number, max: number): number {
    const minCeil = Math.ceil(min);
    const maxFloor = Math.floor(max);
    return Math.floor(this.next() * (maxFloor - minCeil + 1)) + minCeil;
  }

  /**
   * 生成 [min, max) 的浮点随机数
   */
  public nextFloat(min: number, max: number): number {
    return min + this.next() * (max - min);
  }

  /**
   * 从数组中随机选取一个元素
   */
  public pick<T>(array: readonly T[]): T {
    if (array.length === 0) {
      throw new Error('Cannot pick from an empty array');
    }
    const index = this.nextInt(0, array.length - 1);
    return array[index];
  }

  /**
   * 按照权重随机选取元素
   */
  public pickWeighted<T>(items: readonly { item: T; weight: number }[]): T {
    const totalWeight = items.reduce((sum, entry) => sum + Math.max(0, entry.weight), 0);
    if (totalWeight <= 0) {
      throw new Error('Total weight must be greater than 0');
    }
    let threshold = this.next() * totalWeight;
    for (const entry of items) {
      const w = Math.max(0, entry.weight);
      if (threshold < w) {
        return entry.item;
      }
      threshold -= w;
    }
    return items[items.length - 1].item;
  }

  /**
   * Fisher-Yates 洗牌算法，返回打乱后的新数组
   */
  public shuffle<T>(array: readonly T[]): T[] {
    const copy = [...array];
    for (let i = copy.length - 1; i > 0; i--) {
      const j = this.nextInt(0, i);
      [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy;
  }
}
