import { WaveDefinition } from '@/content/schemas/wave';
import { WAVES } from '@/content/waves/data';
import { EventBus } from '@/core/event-bus';

export type WavePhase = 'battle' | 'preparation' | 'completed' | 'gameover';

export class WaveSystem {
  public currentWaveIndex = 0;
  public wavePhase: WavePhase = 'battle';
  public waveTimerSec = 0;
  public totalGameTimeSec = 0;

  public get currentWave(): WaveDefinition {
    return WAVES[Math.min(this.currentWaveIndex, WAVES.length - 1)];
  }

  public get totalWaves(): number {
    return WAVES.length;
  }

  public reset(): void {
    this.currentWaveIndex = 0;
    this.wavePhase = 'battle';
    this.waveTimerSec = 0;
    this.totalGameTimeSec = 0;
  }

  public startFirstWave(): void {
    this.currentWaveIndex = 0;
    this.wavePhase = 'battle';
    this.waveTimerSec = 0;
    EventBus.getInstance().emit('wave:started', {
      waveNumber: this.currentWave.waveNumber,
      durationSeconds: this.currentWave.durationSeconds,
      isBossWave: this.currentWave.isBossWave,
    });
  }

  public update(dt: number, isBossAlive: boolean): { phaseChanged: boolean; newPhase: WavePhase } {
    this.totalGameTimeSec += dt;
    this.waveTimerSec += dt;

    if (this.wavePhase === 'battle') {
      // 检查波次战斗是否结束
      const wave = this.currentWave;
      const timeUp = this.waveTimerSec >= wave.durationSeconds;

      // 如果是 Boss 波，必须时间结束且击杀 Boss；否则常规波次只要时间到达
      const isWaveComplete = wave.isBossWave ? timeUp && !isBossAlive : timeUp;

      if (isWaveComplete) {
        EventBus.getInstance().emit('wave:completed', { waveNumber: wave.waveNumber });

        if (this.currentWaveIndex >= WAVES.length - 1) {
          this.wavePhase = 'completed';
          EventBus.getInstance().emit('game:victory', undefined as void);
          return { phaseChanged: true, newPhase: 'completed' };
        } else {
          this.wavePhase = 'preparation';
          this.waveTimerSec = 0;
          return { phaseChanged: true, newPhase: 'preparation' };
        }
      }
    } else if (this.wavePhase === 'preparation') {
      const prepTime = this.currentWave.preparationSeconds;
      if (this.waveTimerSec >= prepTime) {
        this.nextWave();
        return { phaseChanged: true, newPhase: 'battle' };
      }
    }

    return { phaseChanged: false, newPhase: this.wavePhase };
  }

  public nextWave(): void {
    this.currentWaveIndex++;
    this.wavePhase = 'battle';
    this.waveTimerSec = 0;

    EventBus.getInstance().emit('wave:started', {
      waveNumber: this.currentWave.waveNumber,
      durationSeconds: this.currentWave.durationSeconds,
      isBossWave: this.currentWave.isBossWave,
    });
  }

  public skipToNextWave(): void {
    if (this.currentWaveIndex < WAVES.length - 1) {
      this.nextWave();
    }
  }
}
