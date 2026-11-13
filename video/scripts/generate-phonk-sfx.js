import fs from 'fs';
import path from 'path';

const SAMPLE_RATE = 44100;

function createWavBuffer(sampleRate, channels, samples) {
  const byteRate = sampleRate * channels * 2;
  const blockAlign = channels * 2;
  const dataSize = samples.length * 2;
  const buffer = Buffer.alloc(44 + dataSize);

  buffer.write('RIFF', 0);
  buffer.writeUInt32LE(36 + dataSize, 4);
  buffer.write('WAVE', 8);
  buffer.write('fmt ', 12);
  buffer.writeUInt32LE(16, 16);
  buffer.writeUInt16LE(1, 20); // PCM
  buffer.writeUInt16LE(channels, 22);
  buffer.writeUInt32LE(sampleRate, 24);
  buffer.writeUInt32LE(byteRate, 28);
  buffer.writeUInt16LE(blockAlign, 32);
  buffer.writeUInt16LE(16, 34); // 16-bit
  buffer.write('data', 36);
  buffer.writeUInt32LE(dataSize, 40);

  let offset = 44;
  for (let i = 0; i < samples.length; i++) {
    const s = Math.max(-1, Math.min(1, samples[i]));
    buffer.writeInt16LE(s < 0 ? s * 0x8000 : s * 0x7fff, offset);
    offset += 2;
  }
  return buffer;
}

const outDir = path.resolve('video/public/audio');
if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

// 1. SFX: Mechanical Keyboard Typing Clack
{
  const duration = 0.35;
  const totalSamples = Math.floor(SAMPLE_RATE * duration);
  const samples = new Float32Array(totalSamples);
  const clickTimes = [0.02, 0.08, 0.15, 0.22, 0.28];
  for (let i = 0; i < totalSamples; i++) {
    const t = i / SAMPLE_RATE;
    let s = 0;
    for (const ct of clickTimes) {
      if (t >= ct) {
        const dt = t - ct;
        const env = Math.exp(-dt * 65);
        const freq = 1400 * Math.exp(-dt * 40);
        const clickNoise = (Math.random() * 2 - 1) * Math.exp(-dt * 120);
        s += (Math.sin(2 * Math.PI * freq * dt) * 0.6 + clickNoise * 0.4) * env;
      }
    }
    samples[i] = s * 0.7;
  }
  fs.writeFileSync(path.join(outDir, 'sfx-keyboard.wav'), createWavBuffer(SAMPLE_RATE, 1, samples));
}

// 2. SFX: Crisp Mouse Click Pop
{
  const duration = 0.12;
  const totalSamples = Math.floor(SAMPLE_RATE * duration);
  const samples = new Float32Array(totalSamples);
  for (let i = 0; i < totalSamples; i++) {
    const t = i / SAMPLE_RATE;
    const env = Math.exp(-t * 85);
    const click = Math.sin(2 * Math.PI * 1800 * t) * 0.6 + (Math.random() * 2 - 1) * 0.4;
    samples[i] = click * env * 0.8;
  }
  fs.writeFileSync(path.join(outDir, 'sfx-click.wav'), createWavBuffer(SAMPLE_RATE, 1, samples));
}

// 3. SFX: Heavy Timeline Drop Impact (Sub-bass thud + metallic snap)
{
  const duration = 0.9;
  const totalSamples = Math.floor(SAMPLE_RATE * duration);
  const samples = new Float32Array(totalSamples);
  for (let i = 0; i < totalSamples; i++) {
    const t = i / SAMPLE_RATE;
    const subEnv = Math.exp(-t * 6);
    const subFreq = 85 * Math.exp(-t * 12) + 40;
    const sub = Math.sin(2 * Math.PI * subFreq * t) * subEnv;
    const snapEnv = Math.exp(-t * 40);
    const snap = (Math.sin(2 * Math.PI * 1200 * t) + (Math.random() * 2 - 1)) * snapEnv * 0.5;
    samples[i] = (sub * 0.85 + snap * 0.35) * 0.9;
  }
  fs.writeFileSync(path.join(outDir, 'sfx-drop-impact.wav'), createWavBuffer(SAMPLE_RATE, 1, samples));
}

// 4. SFX: Fast Whip-Pan Whoosh
{
  const duration = 0.35;
  const totalSamples = Math.floor(SAMPLE_RATE * duration);
  const samples = new Float32Array(totalSamples);
  for (let i = 0; i < totalSamples; i++) {
    const t = i / SAMPLE_RATE;
    const progress = t / duration;
    const env = Math.sin(progress * Math.PI) ** 3;
    const noise = (Math.random() * 2 - 1);
    const sweep = Math.sin(2 * Math.PI * (150 + 1600 * progress) * t);
    samples[i] = (noise * 0.6 + sweep * 0.4) * env * 0.8;
  }
  fs.writeFileSync(path.join(outDir, 'sfx-whoosh-fast.wav'), createWavBuffer(SAMPLE_RATE, 1, samples));
}

// 5. BGM: High-Energy Tech / Phonk Beat (15.5 seconds, 130 BPM)
{
  const duration = 16.0;
  const totalSamples = Math.floor(SAMPLE_RATE * duration);
  const left = new Float32Array(totalSamples);
  const right = new Float32Array(totalSamples);

  const bpm = 130;
  const beatSec = 60 / bpm; // ~0.4615s
  const barSec = beatSec * 4; // ~1.846s

  // Bass notes: F1 (43.65Hz), G#1 (51.9Hz), A#1 (58.27Hz), C2 (65.4Hz)
  const bassFreqs = [43.65, 51.91, 58.27, 65.41];

  for (let i = 0; i < totalSamples; i++) {
    const t = i / SAMPLE_RATE;
    const barIndex = Math.floor(t / barSec) % 4;
    const timeInBar = t % barSec;
    const timeInBeat = t % beatSec;

    // Intro Riser during first 3 seconds (t < 3.0s)
    let isIntro = t < 3.0;

    // Kick: Heavy punch
    let kick = 0;
    if (!isIntro || t > 2.5) {
      const kickEnv = Math.exp(-timeInBeat * 18);
      const kickFreq = 48 + 110 * Math.exp(-timeInBeat * 45);
      kick = Math.sin(2 * Math.PI * kickFreq * timeInBeat) * kickEnv * 0.8;
    }

    // Snare / Trap Clap on beats 2 & 4
    let snare = 0;
    const beatInBar = Math.floor(timeInBar / beatSec);
    if (!isIntro && (beatInBar === 1 || beatInBar === 3)) {
      const snareEnv = Math.exp(-timeInBeat * 22);
      const snareNoise = (Math.random() * 2 - 1) * 0.6;
      const snareTone = Math.sin(2 * Math.PI * 220 * timeInBeat) * 0.4;
      snare = (snareNoise + snareTone) * snareEnv * 0.55;
    }

    // Hi-Hats: Fast 16th notes
    let hat = 0;
    if (!isIntro) {
      const timeIn16th = timeInBeat % (beatSec / 4);
      const hatEnv = Math.exp(-timeIn16th * 60);
      hat = (Math.random() * 2 - 1) * hatEnv * 0.16;
    }

    // Phonk 808 Distorted Bass
    let bass = 0;
    if (!isIntro) {
      const currentBass = bassFreqs[barIndex];
      const sidechain = Math.min(1, timeInBeat * 6);
      const bassPhase = 2 * Math.PI * currentBass * t;
      const rawBass = Math.sin(bassPhase) + 0.4 * Math.sin(bassPhase * 2) + 0.2 * Math.sin(bassPhase * 3);
      // Soft saturation / overdrive distortion
      bass = Math.tanh(rawBass * 2.0) * 0.35 * sidechain;
    }

    // Synth Melody / Cowbell Phonk Pluck
    let synth = 0;
    if (isIntro) {
      // Swelling riser filter
      const riserProgress = t / 3.0;
      const riserFreq = 100 + 1200 * (riserProgress ** 2);
      synth = Math.sin(2 * Math.PI * riserFreq * t) * (riserProgress ** 1.5) * 0.3;
    } else {
      const timeIn8th = timeInBeat % (beatSec / 2);
      const synthEnv = Math.exp(-timeIn8th * 14);
      const noteFreq = bassFreqs[barIndex] * 8; // Harmonics
      synth = Math.sin(2 * Math.PI * noteFreq * t) * synthEnv * 0.18;
    }

    // Master fadeout at very end
    let master = 1;
    if (t > 14.5) master = Math.max(0, (15.5 - t) / 1.0);

    const l = (kick * 0.9 + snare * 0.8 + hat * 0.7 + bass * 0.85 + synth * 0.8) * master;
    const r = (kick * 0.9 + snare * 0.8 + hat * 0.8 + bass * 0.85 + synth * 0.85) * master;

    left[i] = l;
    right[i] = r;
  }

  const stereoSamples = new Float32Array(totalSamples * 2);
  for (let i = 0; i < totalSamples; i++) {
    stereoSamples[i * 2] = left[i];
    stereoSamples[i * 2 + 1] = right[i];
  }
  fs.writeFileSync(path.join(outDir, 'bgm-phonk.wav'), createWavBuffer(SAMPLE_RATE, 2, stereoSamples));
}

console.log('Successfully generated Phonk BGM and tactile SFX!');
