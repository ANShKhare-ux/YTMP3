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

// 1. SFX: Whoosh (Air swoosh transition)
{
  const duration = 0.6;
  const totalSamples = Math.floor(SAMPLE_RATE * duration);
  const samples = new Float32Array(totalSamples);
  for (let i = 0; i < totalSamples; i++) {
    const t = i / SAMPLE_RATE;
    const progress = t / duration; // 0 to 1
    // Volume envelope (bell curve)
    const env = Math.sin(progress * Math.PI) ** 2;
    // Sweeping frequency noise
    const noise = (Math.random() * 2 - 1);
    const sweep = Math.sin(2 * Math.PI * (200 + 1200 * Math.sin(progress * Math.PI)) * t);
    samples[i] = (noise * 0.7 + sweep * 0.3) * env * 0.7;
  }
  fs.writeFileSync(path.join(outDir, 'sfx-whoosh.wav'), createWavBuffer(SAMPLE_RATE, 1, samples));
}

// 2. SFX: Pop (Snappy UI spring pop)
{
  const duration = 0.18;
  const totalSamples = Math.floor(SAMPLE_RATE * duration);
  const samples = new Float32Array(totalSamples);
  for (let i = 0; i < totalSamples; i++) {
    const t = i / SAMPLE_RATE;
    const env = Math.exp(-t * 28);
    const freq = 650 * Math.exp(-t * 18);
    samples[i] = Math.sin(2 * Math.PI * freq * t) * env * 0.75;
  }
  fs.writeFileSync(path.join(outDir, 'sfx-pop.wav'), createWavBuffer(SAMPLE_RATE, 1, samples));
}

// 3. SFX: Glitch / Error Alert
{
  const duration = 0.35;
  const totalSamples = Math.floor(SAMPLE_RATE * duration);
  const samples = new Float32Array(totalSamples);
  for (let i = 0; i < totalSamples; i++) {
    const t = i / SAMPLE_RATE;
    const env = Math.exp(-t * 8);
    const square = Math.sin(2 * Math.PI * 130 * t) > 0 ? 1 : -1;
    const buzz = Math.sin(2 * Math.PI * 880 * t) > 0 ? 0.6 : -0.6;
    const grit = (Math.random() * 2 - 1) * 0.3;
    samples[i] = (square * 0.5 + buzz * 0.3 + grit) * env * 0.6;
  }
  fs.writeFileSync(path.join(outDir, 'sfx-glitch.wav'), createWavBuffer(SAMPLE_RATE, 1, samples));
}

// 4. SFX: Success Chime (Bright digital sparkle chord)
{
  const duration = 1.4;
  const totalSamples = Math.floor(SAMPLE_RATE * duration);
  const samples = new Float32Array(totalSamples);
  const freqs = [880, 1108.73, 1318.51, 1760]; // A5 major chord
  for (let i = 0; i < totalSamples; i++) {
    const t = i / SAMPLE_RATE;
    const env = Math.exp(-t * 3.5);
    let mix = 0;
    freqs.forEach((f, idx) => {
      mix += Math.sin(2 * Math.PI * f * t) * (1 / (idx + 1));
    });
    samples[i] = mix * env * 0.45;
  }
  fs.writeFileSync(path.join(outDir, 'sfx-success.wav'), createWavBuffer(SAMPLE_RATE, 1, samples));
}

// 5. BGM: Modern Tech Electronic Track (32 seconds, 124 BPM)
{
  const duration = 32.0;
  const totalSamples = Math.floor(SAMPLE_RATE * duration);
  const left = new Float32Array(totalSamples);
  const right = new Float32Array(totalSamples);

  const bpm = 124;
  const beatSec = 60 / bpm; // ~0.4838s
  const barSec = beatSec * 4; // ~1.935s

  // Chord progression (root frequencies): D2 (73.4), F2 (87.3), G2 (98.0), Bb2 (116.5)
  const bassNotes = [73.42, 87.31, 97.99, 116.54];
  const leadChords = [
    [293.66, 349.23, 440.0, 523.25], // Dm7
    [349.23, 440.0, 523.25, 659.25], // Fmaj7
    [392.0, 466.16, 587.33, 698.46], // Gm7
    [466.16, 587.33, 698.46, 880.0]  // Bbmaj7
  ];

  for (let i = 0; i < totalSamples; i++) {
    const t = i / SAMPLE_RATE;
    const barIndex = Math.floor(t / barSec) % 4;
    const timeInBar = t % barSec;
    const timeInBeat = t % beatSec;

    // --- A. Kick Drum (Punchy 120Hz -> 50Hz pitch drop) ---
    const kickEnv = Math.exp(-timeInBeat * 16);
    const kickFreq = 50 + 90 * Math.exp(-timeInBeat * 40);
    const kick = Math.sin(2 * Math.PI * kickFreq * timeInBeat) * kickEnv * 0.7;

    // --- B. Closed Hi-Hat on offbeats (8th notes) ---
    const timeInHalfBeat = timeInBeat % (beatSec / 2);
    const isOffbeat = timeInBeat >= (beatSec / 2);
    const hatEnv = isOffbeat ? Math.exp(-timeInHalfBeat * 45) : Math.exp(-timeInHalfBeat * 80) * 0.3;
    const hatNoise = (Math.random() * 2 - 1) * hatEnv * 0.18;

    // --- C. Rolling Sub/Bassline (Sidechained to kick) ---
    const sidechain = Math.min(1, timeInBeat * 5); // Dips on kick impact
    const currentBass = bassNotes[barIndex];
    const bassPhase = 2 * Math.PI * currentBass * t;
    const bass = (Math.sin(bassPhase) + 0.5 * Math.sin(bassPhase * 2)) * 0.35 * sidechain;

    // --- D. Melodic Synth Arp (16th notes pluck) ---
    const sixteenth = beatSec / 4;
    const arpIdx = Math.floor(t / sixteenth) % 4;
    const timeInArp = t % sixteenth;
    const arpFreq = leadChords[barIndex][arpIdx];
    const arpEnv = Math.exp(-timeInArp * 14);
    const arpPhase = 2 * Math.PI * arpFreq * t;
    const arp = (Math.sin(arpPhase) + 0.3 * Math.sin(arpPhase * 3)) * arpEnv * 0.22;

    // --- E. Master Fade In (1s) & Fade Out (1.5s) ---
    let masterEnv = 1;
    if (t < 0.8) masterEnv = t / 0.8;
    if (t > duration - 1.5) masterEnv = Math.max(0, (duration - t) / 1.5);

    // Stereo spread
    const l = (kick * 0.9 + hatNoise * 0.7 + bass * 0.85 + arp * 0.75) * masterEnv;
    const r = (kick * 0.9 + hatNoise * 0.8 + bass * 0.85 + arp * 0.9) * masterEnv;

    left[i] = l;
    right[i] = r;
  }

  // Interleave stereo samples
  const stereoSamples = new Float32Array(totalSamples * 2);
  for (let i = 0; i < totalSamples; i++) {
    stereoSamples[i * 2] = left[i];
    stereoSamples[i * 2 + 1] = right[i];
  }
  fs.writeFileSync(path.join(outDir, 'bgm-track.wav'), createWavBuffer(SAMPLE_RATE, 2, stereoSamples));
}

console.log('Successfully generated SFX and BGM WAV files!');
