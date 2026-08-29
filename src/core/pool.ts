/**
 * 通用高性能对象池
 * 支持动态扩容、预热、重置与峰值监控
 */

export interface Poolable {
  reset(): void;
  isActive: boolean;
}

export class ObjectPool<T extends Poolable> {
  private freeList: T[] = [];
  private activeList: T[] = [];
  private readonly factory: () => T;
  private peakActive = 0;
  private totalAllocations = 0;

  constructor(factory: () => T, initialCapacity = 64) {
    this.factory = factory;
    this.prewarm(initialCapacity);
  }

  public prewarm(count: number): void {
    for (let i = 0; i < count; i++) {
      const obj = this.factory();
      obj.isActive = false;
      this.freeList.push(obj);
      this.totalAllocations++;
    }
  }

  public acquire(): T {
    let obj: T;
    if (this.freeList.length > 0) {
      obj = this.freeList.pop()!;
    } else {
      obj = this.factory();
      this.totalAllocations++;
    }
    obj.isActive = true;
    this.activeList.push(obj);
    if (this.activeList.length > this.peakActive) {
      this.peakActive = this.activeList.length;
    }
    return obj;
  }

  public release(obj: T): void {
    const idx = this.activeList.indexOf(obj);
    if (idx !== -1) {
      this.activeList.splice(idx, 1);
      obj.isActive = false;
      obj.reset();
      this.freeList.push(obj);
    }
  }

  public releaseAll(): void {
    for (const obj of this.activeList) {
      obj.isActive = false;
      obj.reset();
      this.freeList.push(obj);
    }
    this.activeList.length = 0;
  }

  public getActiveCount(): number {
    return this.activeList.length;
  }

  public getFreeCount(): number {
    return this.freeList.length;
  }

  public getPeakActive(): number {
    return this.peakActive;
  }

  public getTotalAllocations(): number {
    return this.totalAllocations;
  }

  public getActiveItems(): readonly T[] {
    return this.activeList;
  }

  public resetMetrics(): void {
    this.peakActive = this.activeList.length;
  }
}
