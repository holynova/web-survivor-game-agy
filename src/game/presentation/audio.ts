import { EventBus } from '@/core/event-bus';

export class AudioManager {
  private static instance: AudioManager;
  private ctx: AudioContext | null = null;
  private isUnlocked = false;
  private masterVolume = 0.8;
  private sfxVolume = 0.8;
  private isMuted = false;

  private soundConcurrency: Map<string, number> = new Map();

  public static getInstance(): AudioManager {
    if (!AudioManager.instance) {
      AudioManager.instance = new AudioManager();
    }
    return AudioManager.instance;
  }

  constructor() {
    this.bindEvents();
  }

  private bindEvents(): void {
    EventBus.getInstance().on('sound:play', data => {
      this.playSfx(data.key, data.volume, data.detune);
    });
  }

  public unlock(): void {
    if (this.isUnlocked) return;
    try {
      const AudioContextClass =
        window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioContextClass) {
        this.ctx = new AudioContextClass();
        if (this.ctx.state === 'suspended') {
          this.ctx.resume();
        }
        this.isUnlocked = true;
      }
    } catch {
      // Audio context not available in current environment
    }
  }

  public setMasterVolume(vol: number): void {
    this.masterVolume = Math.max(0, Math.min(1, vol));
  }

  public setSfxVolume(vol: number): void {
    this.sfxVolume = Math.max(0, Math.min(1, vol));
  }

  public toggleMute(): boolean {
    this.isMuted = !this.isMuted;
    return this.isMuted;
  }

  public playSfx(name: string, volume = 0.5, detune = 0): void {
    if (!this.ctx || this.isMuted || !this.isUnlocked) return;

    // 限流：同类音效同一帧/短周期并发不超过 3 个
    const currentCount = this.soundConcurrency.get(name) || 0;
    if (currentCount >= 3) return;
    this.soundConcurrency.set(name, currentCount + 1);
    setTimeout(() => {
      const c = this.soundConcurrency.get(name) || 1;
      this.soundConcurrency.set(name, Math.max(0, c - 1));
    }, 50);

    const finalVol = volume * this.sfxVolume * this.masterVolume;
    if (finalVol <= 0.001) return;

    // 使用高品质 Web Audio 合成音效
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    if (name.includes('iron_wok') || name.includes('cleaver')) {
      // 菜刀/铁锅击打挥砍音效
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(440 + detune, now);
      osc.frequency.exponentialRampToValueAtTime(120, now + 0.12);
      gain.gain.setValueAtTime(finalVol * 0.8, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);
      osc.start(now);
      osc.stop(now + 0.12);
    } else if (name.includes('bamboo_skewer')) {
      // 竹签刺击音效
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(880 + detune, now);
      osc.frequency.exponentialRampToValueAtTime(280, now + 0.08);
      gain.gain.setValueAtTime(finalVol * 0.6, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);
      osc.start(now);
      osc.stop(now + 0.08);
    } else if (name.includes('stove_flame')) {
      // 烈焰爆裂音效
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(180 + detune, now);
      osc.frequency.linearRampToValueAtTime(60, now + 0.2);
      gain.gain.setValueAtTime(finalVol * 0.5, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
      osc.start(now);
      osc.stop(now + 0.2);
    } else if (name.includes('service_bell') || name.includes('seasoning_jar')) {
      // 铜铃/瓷瓶清脆音效
      osc.type = 'sine';
      osc.frequency.setValueAtTime(1200 + detune, now);
      osc.frequency.exponentialRampToValueAtTime(800, now + 0.25);
      gain.gain.setValueAtTime(finalVol * 0.7, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
      osc.start(now);
      osc.stop(now + 0.25);
    } else if (name.includes('hurt')) {
      // 受击音效
      osc.type = 'square';
      osc.frequency.setValueAtTime(160, now);
      osc.frequency.exponentialRampToValueAtTime(40, now + 0.15);
      gain.gain.setValueAtTime(finalVol * 0.9, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
      osc.start(now);
      osc.stop(now + 0.15);
    } else {
      // 通用拾取/点击音效
      osc.type = 'sine';
      osc.frequency.setValueAtTime(600 + detune, now);
      osc.frequency.exponentialRampToValueAtTime(900, now + 0.08);
      gain.gain.setValueAtTime(finalVol * 0.5, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);
      osc.start(now);
      osc.stop(now + 0.08);
    }
  }
}
