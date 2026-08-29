import { describe, expect, it } from 'vitest';
import { SpatialEntity, SpatialHash } from '@/game/spatial/spatial-hash';

interface MockEntity extends SpatialEntity {
  name: string;
}

describe('SpatialHash', () => {
  it('should insert and query entities within radius', () => {
    const hash = new SpatialHash<MockEntity>(64);
    const e1: MockEntity = { id: 1, x: 10, y: 10, radius: 10, name: 'e1' };
    const e2: MockEntity = { id: 2, x: 50, y: 50, radius: 10, name: 'e2' };
    const e3: MockEntity = { id: 3, x: 500, y: 500, radius: 10, name: 'e3' };

    hash.insert(e1);
    hash.insert(e2);
    hash.insert(e3);

    const queryResult: MockEntity[] = [];
    hash.queryRadius(0, 0, 80, queryResult);

    const ids = queryResult.map(e => e.id);
    expect(ids).toContain(1);
    expect(ids).toContain(2);
    expect(ids).not.toContain(3);
  });

  it('should update entity location across cells correctly', () => {
    const hash = new SpatialHash<MockEntity>(64);
    const e1: MockEntity = { id: 1, x: 10, y: 10, radius: 10, name: 'e1' };
    hash.insert(e1);

    // 移动到远离原点的位置
    e1.x = 600;
    e1.y = 600;
    hash.update(e1);

    const queryNearOrigin: MockEntity[] = [];
    hash.queryRadius(0, 0, 50, queryNearOrigin);
    expect(queryNearOrigin).toHaveLength(0);

    const queryNearNewPos: MockEntity[] = [];
    hash.queryRadius(600, 600, 50, queryNearNewPos);
    expect(queryNearNewPos.map(e => e.id)).toContain(1);
  });

  it('should remove entities cleanly', () => {
    const hash = new SpatialHash<MockEntity>(64);
    const e1: MockEntity = { id: 1, x: 10, y: 10, radius: 10, name: 'e1' };
    hash.insert(e1);
    hash.remove(e1);

    const queryResult: MockEntity[] = [];
    hash.queryRadius(10, 10, 50, queryResult);
    expect(queryResult).toHaveLength(0);
  });
});
