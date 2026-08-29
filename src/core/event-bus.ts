/**
 * 强类型领域事件总线
 * 解耦物理模拟与表现层（音频、粒子、动画、HUD）
 */

export interface GameEvents {
  'entity:damaged': {
    targetId: number;
    sourceId: string;
    damage: number;
    isCrit: boolean;
    x: number;
    y: number;
  };
  'entity:died': {
    entityId: number;
    enemyTypeId: string;
    x: number;
    y: number;
    isBoss: boolean;
  };
  'drop:collected': {
    dropType: 'heat' | 'ingredient' | 'food';
    value: number;
    x: number;
    y: number;
  };
  'player:levelup': {
    newLevel: number;
  };
  'wave:started': {
    waveNumber: number;
    durationSeconds: number;
    isBossWave: boolean;
  };
  'wave:completed': {
    waveNumber: number;
  };
  'recipe:activated': {
    recipeId: string;
    nameKey: string;
  };
  'player:died': {
    cause: string;
  };
  'game:victory': void;
  'game:restart': void;
  'sound:play': {
    key: string;
    volume?: number;
    detune?: number;
  };
}

export type EventKey = keyof GameEvents;
export type EventCallback<K extends EventKey> = (data: GameEvents[K]) => void;

export class EventBus {
  private static instance: EventBus;
  private listeners: { [K in EventKey]?: ((data: unknown) => void)[] } = {};

  public static getInstance(): EventBus {
    if (!EventBus.instance) {
      EventBus.instance = new EventBus();
    }
    return EventBus.instance;
  }

  public on<K extends EventKey>(event: K, callback: EventCallback<K>): () => void {
    if (!this.listeners[event]) {
      this.listeners[event] = [];
    }
    this.listeners[event]!.push(callback as (data: unknown) => void);
    return () => this.off(event, callback);
  }

  public off<K extends EventKey>(event: K, callback: EventCallback<K>): void {
    const list = this.listeners[event];
    if (list) {
      const idx = list.indexOf(callback as (data: unknown) => void);
      if (idx !== -1) {
        list.splice(idx, 1);
      }
    }
  }

  public emit<K extends EventKey>(event: K, data: GameEvents[K]): void {
    const list = this.listeners[event];
    if (list) {
      for (let i = 0; i < list.length; i++) {
        list[i](data);
      }
    }
  }

  public clear(): void {
    this.listeners = {};
  }
}
