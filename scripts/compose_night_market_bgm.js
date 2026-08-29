import fs from 'fs';
import { execSync } from 'child_process';

const sampleRate = 44100;
const bpm = 128;
const beatSec = 60 / bpm; // ~0.46875s per beat
const barSec = beatSec * 4; // ~1.875s per bar
const totalBars = 32;
const durationSec = barSec * totalBars; // 60.0s
const totalSamples = Math.floor(sampleRate * durationSec);

// Stereo channels
const left = new Float32Array(totalSamples);
const right = new Float32Array(totalSamples);

// Pentatonic Frequencies (D Pentatonic: D4, F4, G4, A4, C5, D5, F5, G5, A5, C6, D6)
const PENTATONIC = {
  D2: 73.42,
  F2: 87.31,
  G2: 98.00,
  A2: 110.00,
  C3: 130.81,
  D3: 146.83,
  F3: 174.61,
  G3: 196.00,
  A3: 220.00,
  C4: 261.63,
  D4: 293.66,
  F4: 349.23,
  G4: 392.00,
  A4: 440.00,
  C5: 523.25,
  D5: 587.33,
  F5: 698.46,
  G5: 783.99,
  A5: 880.00,
  C6: 1046.50,
  D6: 1174.66,
};

// 1. Synthesize Pipa / Guzheng Pluck
function addPluck(freq, startSec, durSec, gain, pan = 0) {
  const startSample = Math.floor(startSec * sampleRate);
  const numSamples = Math.floor(durSec * sampleRate);
  for (let i = 0; i < numSamples; i++) {
    const idx = (startSample + i) % totalSamples;
    const t = i / sampleRate;
    // Karplus-Strong / Multi-harmonic pluck
    const env = Math.exp(-t * (4.5 + freq * 0.003));
    let wave = Math.sin(2 * Math.PI * freq * t) * 0.6;
    wave += Math.sin(4 * Math.PI * freq * t * 1.002) * 0.3;
    wave += Math.sin(6 * Math.PI * freq * t * 0.998) * 0.15;
    wave += Math.sin(8 * Math.PI * freq * t) * 0.08;
    const val = wave * env * gain;

    const panL = Math.cos((pan + 1) * Math.PI * 0.25);
    const panR = Math.sin((pan + 1) * Math.PI * 0.25);
    left[idx] += val * panL;
    right[idx] += val * panR;
  }
}

// 2. Synthesize Bamboo Dizi Flute (Vibrato + Breath Noise)
function addFlute(freq, startSec, durSec, gain, pan = 0) {
  const startSample = Math.floor(startSec * sampleRate);
  const numSamples = Math.floor(durSec * sampleRate);
  for (let i = 0; i < numSamples; i++) {
    const idx = (startSample + i) % totalSamples;
    const t = i / sampleRate;
    // Attack & Release Envelope
    const attack = Math.min(1, t / 0.06);
    const release = Math.min(1, (durSec - t) / 0.08);
    const env = Math.max(0, attack * release);

    // Vibrato
    const vibrato = Math.sin(2 * Math.PI * 5.5 * t) * (t > 0.15 ? 4.0 : 0);
    const currentFreq = freq + vibrato;

    // Pure flute sine + breath airy harmonics
    let wave = Math.sin(2 * Math.PI * currentFreq * t) * 0.75;
    wave += Math.sin(4 * Math.PI * currentFreq * t) * 0.22;
    wave += Math.sin(6 * Math.PI * currentFreq * t) * 0.08;
    // Subtle breath noise
    const breath = (Math.random() * 2 - 1) * 0.03;
    const val = (wave + breath) * env * gain;

    const panL = Math.cos((pan + 1) * Math.PI * 0.25);
    const panR = Math.sin((pan + 1) * Math.PI * 0.25);
    left[idx] += val * panL;
    right[idx] += val * panR;
  }
}

// 3. Synthesize Taiko Drum (Punchy Low Boom)
function addTaiko(startSec, gain = 0.55) {
  const startSample = Math.floor(startSec * sampleRate);
  const numSamples = Math.floor(0.4 * sampleRate);
  for (let i = 0; i < numSamples; i++) {
    const idx = (startSample + i) % totalSamples;
    const t = i / sampleRate;
    const freq = 120 * Math.exp(-t * 18) + 48;
    const env = Math.exp(-t * 9);
    const wave = Math.sin(2 * Math.PI * freq * t);
    const val = wave * env * gain;
    left[idx] += val;
    right[idx] += val;
  }
}

// 4. Synthesize Woodblock / Temple Clack
function addWoodblock(startSec, high = false, gain = 0.3) {
  const startSample = Math.floor(startSec * sampleRate);
  const numSamples = Math.floor(0.08 * sampleRate);
  const baseFreq = high ? 1400 : 950;
  for (let i = 0; i < numSamples; i++) {
    const idx = (startSample + i) % totalSamples;
    const t = i / sampleRate;
    const env = Math.exp(-t * 60);
    const wave = Math.sin(2 * Math.PI * baseFreq * t) + (Math.random() * 2 - 1) * 0.2;
    const val = wave * env * gain;
    left[idx] += val * 0.7;
    right[idx] += val * 0.7;
  }
}

// 5. Synthesize Gong / Chime Crash
function addGong(startSec, gain = 0.35) {
  const startSample = Math.floor(startSec * sampleRate);
  const numSamples = Math.floor(2.2 * sampleRate);
  for (let i = 0; i < numSamples; i++) {
    const idx = (startSample + i) % totalSamples;
    const t = i / sampleRate;
    const env = Math.exp(-t * 2.2);
    let wave = Math.sin(2 * Math.PI * 260 * t) * 0.4;
    wave += Math.sin(2 * Math.PI * 395 * t) * 0.3;
    wave += Math.sin(2 * Math.PI * 580 * t) * 0.2;
    wave += (Math.random() * 2 - 1) * 0.06 * Math.exp(-t * 12);
    const val = wave * env * gain;
    left[idx] += val;
    right[idx] += val;
  }
}

// 6. Synthesize Warm Bassline
function addBass(freq, startSec, durSec, gain = 0.4) {
  const startSample = Math.floor(startSec * sampleRate);
  const numSamples = Math.floor(durSec * sampleRate);
  for (let i = 0; i < numSamples; i++) {
    const idx = (startSample + i) % totalSamples;
    const t = i / sampleRate;
    const env = Math.min(1, t / 0.02) * Math.exp(-t * 2.2);
    const wave = Math.sin(2 * Math.PI * freq * t) * 0.8 + Math.sin(4 * Math.PI * freq * t) * 0.2;
    const val = wave * env * gain;
    left[idx] += val;
    right[idx] += val;
  }
}

console.log('Composing Night Market Fantasy Soundtrack (32 bars, 128 BPM)...');

// Compose 32 Bars of rich music!
for (let bar = 0; bar < totalBars; bar++) {
  const barStart = bar * barSec;

  // Gong on key section downbeats
  if (bar % 8 === 0) {
    addGong(barStart, 0.4);
  }

  // Rhythm: Taiko + Woodblock
  addTaiko(barStart, 0.55);
  addTaiko(barStart + beatSec * 2, 0.5);
  if (bar % 2 === 1) {
    addTaiko(barStart + beatSec * 2.75, 0.4);
    addTaiko(barStart + beatSec * 3.5, 0.45);
  }

  addWoodblock(barStart + beatSec * 0.5, true, 0.22);
  addWoodblock(barStart + beatSec * 1.0, false, 0.25);
  addWoodblock(barStart + beatSec * 1.5, true, 0.22);
  addWoodblock(barStart + beatSec * 2.5, true, 0.22);
  addWoodblock(barStart + beatSec * 3.0, false, 0.25);
  addWoodblock(barStart + beatSec * 3.5, true, 0.25);

  // Bassline progression (D -> F -> G -> A / D -> C -> A -> D)
  const bassNotes = bar % 8 < 4
    ? [PENTATONIC.D2, PENTATONIC.D2, PENTATONIC.F2, PENTATONIC.G2]
    : [PENTATONIC.A2, PENTATONIC.G2, PENTATONIC.C3, PENTATONIC.D2];

  for (let b = 0; b < 4; b++) {
    addBass(bassNotes[b], barStart + b * beatSec, beatSec * 0.9, 0.35);
  }

  // Pipa 16th-note fast arpeggio patterns
  const pipaScale = [
    PENTATONIC.D4, PENTATONIC.F4, PENTATONIC.A4, PENTATONIC.D5,
    PENTATONIC.F4, PENTATONIC.A4, PENTATONIC.D5, PENTATONIC.F5,
    PENTATONIC.G4, PENTATONIC.C5, PENTATONIC.D5, PENTATONIC.G5,
    PENTATONIC.A4, PENTATONIC.D5, PENTATONIC.F5, PENTATONIC.A5,
  ];

  for (let sub = 0; sub < 16; sub++) {
    const note = pipaScale[(bar * 4 + sub) % pipaScale.length];
    const subTime = barStart + sub * (beatSec / 4);
    const pan = Math.sin(sub * 0.7) * 0.4;
    addPluck(note, subTime, 0.25, 0.22, pan);
  }

  // Flute melody phrases (Bars 4..32)
  if (bar >= 4) {
    const melodyPhrase = (bar - 4) % 8;
    if (melodyPhrase === 0) {
      addFlute(PENTATONIC.D5, barStart, beatSec * 1.5, 0.45, -0.2);
      addFlute(PENTATONIC.F5, barStart + beatSec * 1.5, beatSec * 1.0, 0.42, -0.1);
      addFlute(PENTATONIC.G5, barStart + beatSec * 2.5, beatSec * 1.5, 0.48, 0.0);
    } else if (melodyPhrase === 1) {
      addFlute(PENTATONIC.A5, barStart, beatSec * 2.0, 0.52, 0.2);
      addFlute(PENTATONIC.G5, barStart + beatSec * 2.0, beatSec * 1.0, 0.45, 0.1);
      addFlute(PENTATONIC.F5, barStart + beatSec * 3.0, beatSec * 1.0, 0.42, 0.0);
    } else if (melodyPhrase === 2) {
      addFlute(PENTATONIC.D5, barStart, beatSec * 1.2, 0.45, -0.2);
      addFlute(PENTATONIC.C5, barStart + beatSec * 1.2, beatSec * 0.8, 0.4, -0.1);
      addFlute(PENTATONIC.D5, barStart + beatSec * 2.0, beatSec * 2.0, 0.48, 0.0);
    } else if (melodyPhrase === 3) {
      addFlute(PENTATONIC.F5, barStart, beatSec * 1.0, 0.42, 0.1);
      addFlute(PENTATONIC.G5, barStart + beatSec * 1.0, beatSec * 1.0, 0.46, 0.2);
      addFlute(PENTATONIC.A5, barStart + beatSec * 2.0, beatSec * 2.0, 0.55, 0.3);
    } else if (melodyPhrase === 4) {
      addFlute(PENTATONIC.D6, barStart, beatSec * 2.0, 0.58, 0.0);
      addFlute(PENTATONIC.C6, barStart + beatSec * 2.0, beatSec * 1.0, 0.5, -0.1);
      addFlute(PENTATONIC.A5, barStart + beatSec * 3.0, beatSec * 1.0, 0.48, -0.2);
    } else if (melodyPhrase === 5) {
      addFlute(PENTATONIC.G5, barStart, beatSec * 1.5, 0.46, -0.1);
      addFlute(PENTATONIC.F5, barStart + beatSec * 1.5, beatSec * 1.5, 0.44, 0.0);
      addFlute(PENTATONIC.D5, barStart + beatSec * 3.0, beatSec * 1.0, 0.42, 0.1);
    } else if (melodyPhrase === 6) {
      addFlute(PENTATONIC.C5, barStart, beatSec * 1.0, 0.4, 0.0);
      addFlute(PENTATONIC.D5, barStart + beatSec * 1.0, beatSec * 1.0, 0.45, 0.1);
      addFlute(PENTATONIC.F5, barStart + beatSec * 2.0, beatSec * 1.0, 0.48, 0.2);
      addFlute(PENTATONIC.G5, barStart + beatSec * 3.0, beatSec * 1.0, 0.5, 0.3);
    } else if (melodyPhrase === 7) {
      addFlute(PENTATONIC.A5, barStart, beatSec * 2.0, 0.55, 0.2);
      addFlute(PENTATONIC.D5, barStart + beatSec * 2.0, beatSec * 2.0, 0.52, 0.0);
    }
  }
}

// Master Limiter / Soft Clip
let maxPeak = 0;
for (let i = 0; i < totalSamples; i++) {
  maxPeak = Math.max(maxPeak, Math.abs(left[i]), Math.abs(right[i]));
}
console.log('Peak level before normalization:', maxPeak.toFixed(3));

const targetGain = 0.85 / Math.max(maxPeak, 0.001);
const wavBuffer = Buffer.alloc(44 + totalSamples * 4);

// Write WAV Header
wavBuffer.write('RIFF', 0);
wavBuffer.writeUInt32LE(36 + totalSamples * 4, 4);
wavBuffer.write('WAVE', 8);
wavBuffer.write('fmt ', 12);
wavBuffer.writeUInt32LE(16, 16); // subchunk1 size
wavBuffer.writeUInt16LE(1, 20); // PCM
wavBuffer.writeUInt16LE(2, 22); // Stereo
wavBuffer.writeUInt32LE(sampleRate, 24);
wavBuffer.writeUInt32LE(sampleRate * 4, 28); // byte rate
wavBuffer.writeUInt16LE(4, 32); // block align
wavBuffer.writeUInt16LE(16, 34); // bits per sample
wavBuffer.write('data', 36);
wavBuffer.writeUInt32LE(totalSamples * 4, 40);

// Write 16-bit PCM samples
for (let i = 0; i < totalSamples; i++) {
  const l = Math.max(-1, Math.min(1, left[i] * targetGain));
  const r = Math.max(-1, Math.min(1, right[i] * targetGain));
  wavBuffer.writeInt16LE(Math.floor(l * 32767), 44 + i * 4);
  wavBuffer.writeInt16LE(Math.floor(r * 32767), 44 + i * 4 + 2);
}

const wavPath = 'public/assets/audio/bgm_night_market_theme.wav';
const oggPath = 'public/assets/audio/bgm_night_market_theme.ogg';

fs.writeFileSync(wavPath, wavBuffer);
console.log(`Saved: ${wavPath} (${(wavBuffer.length / 1024 / 1024).toFixed(2)} MB)`);

// Convert to high quality OGG Vorbis
try {
  execSync(`ffmpeg -y -i "${wavPath}" -c:a libvorbis -q:a 5 "${oggPath}"`, { stdio: 'inherit' });
  console.log(`Successfully generated OGG: ${oggPath}`);
} catch (err) {
  console.error('ffmpeg conversion error:', err);
}
