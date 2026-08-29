/**
 * 固定步长模拟时钟 (Fixed Timestep Simulation Clock)
 * 采用 60Hz (16.666ms) 逻辑步长更新，单帧最多补算 4 步以防止死亡螺旋
 * 页面失去焦点/隐藏后切回时自动清空累积时间，防止瞬间跳跃
 */

export class SimulationClock {
  public static readonly FIXED_STEP_MS = 1000 / 60; // 16.666ms
  public static readonly FIXED_STEP_SEC = 1 / 60;
  public static readonly MAX_SUB_STEPS = 4;

  private accumulator = 0;
  private lastTime = 0;
  private isRunning = false;
  private isPaused = false;
  private timeScale = 1.0;
  private totalSimulatedSeconds = 0;

  constructor() {
    this.handleVisibilityChange = this.handleVisibilityChange.bind(this);
    if (typeof document !== 'undefined') {
      document.addEventListener('visibilitychange', this.handleVisibilityChange);
    }
  }

  public start(): void {
    this.lastTime = performance.now();
    this.accumulator = 0;
    this.isRunning = true;
    this.isPaused = false;
    this.totalSimulatedSeconds = 0;
  }

  public pause(): void {
    this.isPaused = true;
  }

  public resume(): void {
    this.isPaused = false;
    this.lastTime = performance.now();
    this.accumulator = 0;
  }

  public togglePause(): boolean {
    if (this.isPaused) {
      this.resume();
    } else {
      this.pause();
    }
    return this.isPaused;
  }

  public isPausedState(): boolean {
    return this.isPaused;
  }

  public setTimeScale(scale: number): void {
    this.timeScale = Math.max(0.1, Math.min(10.0, scale));
  }

  public getTimeScale(): number {
    return this.timeScale;
  }

  public getTotalSimulatedSeconds(): number {
    return this.totalSimulatedSeconds;
  }

  private handleVisibilityChange(): void {
    if (document.hidden) {
      this.accumulator = 0;
    } else {
      this.lastTime = performance.now();
      this.accumulator = 0;
    }
  }

  /**
   * 驱动物理模拟循环，每帧调用
   * @param currentTime 当前时间戳 (performance.now())
   * @param stepCallback 单个固定步长 (16.666ms) 模拟回调
   * @returns 实际执行的模拟步数
   */
  public tick(currentTime: number, stepCallback: (dt: number) => void): number {
    if (!this.isRunning || this.isPaused) {
      this.lastTime = currentTime;
      return 0;
    }

    const elapsed = (currentTime - this.lastTime) * this.timeScale;
    this.lastTime = currentTime;

    // 限制单帧最大 delta 为 250ms (防止大卡顿后累积无限补算)
    this.accumulator += Math.min(elapsed, 250);

    let steps = 0;
    while (
      this.accumulator >= SimulationClock.FIXED_STEP_MS &&
      steps < SimulationClock.MAX_SUB_STEPS
    ) {
      stepCallback(SimulationClock.FIXED_STEP_SEC);
      this.accumulator -= SimulationClock.FIXED_STEP_MS;
      this.totalSimulatedSeconds += SimulationClock.FIXED_STEP_SEC;
      steps++;
    }

    // 若超过最大补算步数，丢弃多余累积时间
    if (this.accumulator >= SimulationClock.FIXED_STEP_MS) {
      this.accumulator = 0;
    }

    return steps;
  }

  public destroy(): void {
    if (typeof document !== 'undefined') {
      document.removeEventListener('visibilitychange', this.handleVisibilityChange);
    }
  }
}
