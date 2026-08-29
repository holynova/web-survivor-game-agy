import { EventBus } from '@/core/event-bus';

export class AudioManager {
  private static instance: AudioManager;
  private ctx: AudioContext | null = null;
  private isUnlocked = false;
  private masterVolume = 0.8;
  private sfxVolume = 0.8;
  private isMuted = false;
  private phaserSound: Phaser.Sound.BaseSoundManager | null = null;
  private currentBgmKey: string | null = null;
  private currentBgmSound: Phaser.Sound.BaseSound | null = null;

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

  public setSoundManager(soundManager: Phaser.Sound.BaseSoundManager): void {
    this.phaserSound = soundManager;
  }

  private bindEvents(): void {
    EventBus.getInstance().on('sound:play', data => {
      this.playSfx(data.key, data.volume, data.detune);
    });

    EventBus.getInstance().on('entity:damaged', data => {
      const isCrit = data.isCrit;
      const vol = isCrit ? 0.65 : 0.45;
      const detune = isCrit ? 150 : (Math.random() * 160 - 80);
      if (data.sourceId === 'stove_flame') {
        this.playSfx('sfx_fire', vol * 0.8, detune);
      } else if (data.sourceId === 'iron_wok' || data.sourceId === 'cleaver') {
        this.playSfx('sfx_slash', vol, detune);
      } else {
        this.playSfx('sfx_hit', vol, detune);
      }
    });

    EventBus.getInstance().on('entity:died', () => {
      this.playSfx('sfx_kill', 0.7, Math.random() * 100 - 50);
    });

    EventBus.getInstance().on('drop:collected', data => {
      if (data.dropType === 'ingredient') {
        this.playSfx('sfx_coin', 0.5, Math.random() * 120);
      } else {
        this.playSfx('drop_pickup', 0.35);
      }
    });

    EventBus.getInstance().on('player:levelup', () => {
      this.playSfx('sfx_levelup', 0.8);
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
    if (this.phaserSound) {
      this.phaserSound.volume = this.masterVolume;
    }
  }

  public setSfxVolume(vol: number): void {
    this.sfxVolume = Math.max(0, Math.min(1, vol));
  }

  public toggleMute(): boolean {
    this.isMuted = !this.isMuted;
    if (this.phaserSound) {
      this.phaserSound.mute = this.isMuted;
    }
    return this.isMuted;
  }

  public playBgm(key: string, loop = true, volume = 0.5): void {
    if (this.currentBgmKey === key && this.currentBgmSound?.isPlaying) {
      return;
    }
    this.stopBgm();

    this.currentBgmKey = key;
    if (this.phaserSound && !this.isMuted) {
      try {
        if (this.phaserSound.get(key)) {
          this.currentBgmSound = this.phaserSound.add(key, {
            loop,
            volume: volume * this.masterVolume,
          });
          this.currentBgmSound.play();
        }
      } catch {
        // Fallback gracefully
      }
    }
  }

  public stopBgm(): void {
    if (this.currentBgmSound) {
      this.currentBgmSound.stop();
      this.currentBgmSound.destroy();
      this.currentBgmSound = null;
    }
    this.currentBgmKey = null;
  }

  public playSfx(name: string, volume = 0.5, detune = 0): void {
    if (this.isMuted) return;

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

    // 优先尝试使用 Phaser 加载的真实 CC0 音频素材
    if (this.phaserSound) {
      let phaserKey: string | null = null;
      if (name === 'sfx_hit' || name.includes('hurt')) phaserKey = 'sfx_hit';
      else if (name === 'sfx_kill') phaserKey = 'sfx_kill';
      else if (name === 'sfx_coin' || name.includes('coin')) phaserKey = 'sfx_coin';
      else if (name === 'sfx_levelup') phaserKey = 'sfx_levelup';
      else if (name === 'sfx_slash' || name.includes('iron_wok') || name.includes('cleaver')) phaserKey = 'sfx_slash';
      else if (name === 'sfx_fire' || name.includes('stove_flame')) phaserKey = 'sfx_fire';
      else if (name === 'sfx_gameover') phaserKey = 'sfx_gameover';

      if (phaserKey) {
        try {
          this.phaserSound.play(phaserKey, { volume: finalVol, detune });
          return;
        } catch {
          // fallback to synthesized
        }
      }
    }

    // 备用：Web Audio 原生合成振荡器音效
    if (!this.ctx || !this.isUnlocked) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    if (name.includes('iron_wok') || name.includes('cleaver') || name.includes('slash')) {
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(440 + detune, now);
      osc.frequency.exponentialRampToValueAtTime(120, now + 0.12);
      gain.gain.setValueAtTime(finalVol * 0.8, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);
      osc.start(now);
      osc.stop(now + 0.12);
    } else if (name.includes('bamboo_skewer')) {
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(880 + detune, now);
      osc.frequency.exponentialRampToValueAtTime(280, now + 0.08);
      gain.gain.setValueAtTime(finalVol * 0.6, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);
      osc.start(now);
      osc.stop(now + 0.08);
    } else if (name.includes('stove_flame') || name.includes('fire')) {
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(180 + detune, now);
      osc.frequency.linearRampToValueAtTime(60, now + 0.2);
      gain.gain.setValueAtTime(finalVol * 0.5, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
      osc.start(now);
      osc.stop(now + 0.2);
    } else if (name.includes('service_bell') || name.includes('seasoning_jar')) {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(1200 + detune, now);
      osc.frequency.exponentialRampToValueAtTime(800, now + 0.25);
      gain.gain.setValueAtTime(finalVol * 0.7, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
      osc.start(now);
      osc.stop(now + 0.25);
    } else if (name.includes('hurt') || name === 'sfx_hit') {
      osc.type = 'square';
      osc.frequency.setValueAtTime(160, now);
      osc.frequency.exponentialRampToValueAtTime(40, now + 0.15);
      gain.gain.setValueAtTime(finalVol * 0.9, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
      osc.start(now);
      osc.stop(now + 0.15);
    } else {
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
