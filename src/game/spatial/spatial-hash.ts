/**
 * 2D 空间哈希网格
 * 用于对大量敌人、投射物、掉落物进行 O(1) 局部近邻查询与碰撞检测
 */

export interface SpatialEntity {
  id: number;
  x: number;
  y: number;
  radius: number;
}

export class SpatialHash<T extends SpatialEntity> {
  private readonly invCellSize: number;
  private grid: Map<number, T[]> = new Map();
  private entityCellMap: Map<number, number> = new Map();

  constructor(cellSize = 64) {
    this.invCellSize = 1 / cellSize;
  }

  private hashCoords(cx: number, cy: number): number {
    // 32 位混合哈希
    return ((cx * 73856093) ^ (cy * 19349663)) | 0;
  }

  private getCellX(x: number): number {
    return Math.floor(x * this.invCellSize);
  }

  private getCellY(y: number): number {
    return Math.floor(y * this.invCellSize);
  }

  public insert(entity: T): void {
    const cx = this.getCellX(entity.x);
    const cy = this.getCellY(entity.y);
    const key = this.hashCoords(cx, cy);

    let cell = this.grid.get(key);
    if (!cell) {
      cell = [];
      this.grid.set(key, cell);
    }
    cell.push(entity);
    this.entityCellMap.set(entity.id, key);
  }

  public update(entity: T): void {
    const oldKey = this.entityCellMap.get(entity.id);
    const cx = this.getCellX(entity.x);
    const cy = this.getCellY(entity.y);
    const newKey = this.hashCoords(cx, cy);

    if (oldKey === newKey) {
      return;
    }

    if (oldKey !== undefined) {
      const oldCell = this.grid.get(oldKey);
      if (oldCell) {
        const idx = oldCell.indexOf(entity);
        if (idx !== -1) {
          oldCell.splice(idx, 1);
        }
      }
    }

    let newCell = this.grid.get(newKey);
    if (!newCell) {
      newCell = [];
      this.grid.set(newKey, newCell);
    }
    newCell.push(entity);
    this.entityCellMap.set(entity.id, newKey);
  }

  public remove(entity: T): void {
    const key = this.entityCellMap.get(entity.id);
    if (key !== undefined) {
      const cell = this.grid.get(key);
      if (cell) {
        const idx = cell.indexOf(entity);
        if (idx !== -1) {
          cell.splice(idx, 1);
        }
      }
      this.entityCellMap.delete(entity.id);
    }
  }

  public clear(): void {
    this.grid.clear();
    this.entityCellMap.clear();
  }

  /**
   * 查询 (x, y) 半径 radius 内可能发生碰撞的所有实体
   */
  public queryRadius(x: number, y: number, radius: number, outResults: T[] = []): T[] {
    outResults.length = 0;
    const minCx = this.getCellX(x - radius);
    const maxCx = this.getCellX(x + radius);
    const minCy = this.getCellY(y - radius);
    const maxCy = this.getCellY(y + radius);

    for (let cx = minCx; cx <= maxCx; cx++) {
      for (let cy = minCy; cy <= maxCy; cy++) {
        const key = this.hashCoords(cx, cy);
        const cell = this.grid.get(key);
        if (cell) {
          for (let i = 0; i < cell.length; i++) {
            const e = cell[i];
            const dx = e.x - x;
            const dy = e.y - y;
            const distSq = dx * dx + dy * dy;
            const totalR = radius + e.radius;
            if (distSq <= totalR * totalR) {
              outResults.push(e);
            }
          }
        }
      }
    }

    return outResults;
  }
}
