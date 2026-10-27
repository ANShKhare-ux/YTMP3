/**
 * SonicWave Cinematic Soundscape Synthesizer
 * Generates a 48kHz 16-bit stereo WAV audio track tailored for the 6.0s SonicWave intro.
 */
const fs = require('fs');
const path = require('path');

const sampleRate = 48000;
const duration = 6.0;
const numSamples = Math.floor(sampleRate * duration);
const numChannels = 2;

// Left and Right channel float buffers
const left = new Float32Array(numSamples);
const right = new Float32Array(numSamples);

// Helper functions
const clamp = (v, min, max) => Math.max(min, Math.min(max, v));

// 1. Sub-Bass Riser & Drop (0.0s to 3.5s)
let subPhase = 0;
for (let i = 0; i < numSamples; i++) {
  const t = i / sampleRate;
  if (t > 3.5) break;

  // Frequency curve: 42Hz -> 82Hz (at t=1.4) -> 35Hz (at t=2.6)
  let freq;
  if (t < 1.4) {
    const p = t / 1.4;
    freq = 42 + (82 - 42) * Math.pow(p, 2);
  } else if (t < 2.6) {
    const p = (t - 1.4) / 1.2;
    freq = 82 - (82 - 35) * Math.sin(p * Math.PI * 0.5);
  } else {
    freq = 35;
  }

  // Amplitude envelope
  let amp = 0;
  if (t < 1.4) {
    amp = 0.05 + 0.35 * (t / 1.4);
  } else if (t < 2.0) {
    amp = 0.45; // peak boom on lockup
  } else if (t < 3.5) {
    amp = 0.45 * Math.exp(-(t - 2.0) * 2.2);
  }

  subPhase += (2 * Math.PI * freq) / sampleRate;
  // Soft sine with slight third harmonic for analog warmth
  const sample = amp * (Math.sin(subPhase) + 0.12 * Math.sin(subPhase * 3));
  left[i] += sample * 0.95;
  right[i] += sample * 0.95;
}

// 2. Stereo Acoustic Whoosh & Radar Sweep (0.3s to 2.2s)
// Simulates acoustic radar arcs expanding in stereo field
let noiseFilterStateL = 0;
let noiseFilterStateR = 0;
for (let i = 0; i < numSamples; i++) {
  const t = i / sampleRate;
  if (t < 0.3 || t > 2.2) continue;

  const progress = (t - 0.3) / 1.9;
  // White noise
  const rawNoise = (Math.random() * 2 - 1);

  // Dynamic filter cutoff sweeping from low to mid-high
  const cutoff = 0.01 + 0.12 * Math.sin(progress * Math.PI);
  noiseFilterStateL += cutoff * (rawNoise - noiseFilterStateL);
  noiseFilterStateR += cutoff * (rawNoise - noiseFilterStateR);

  // Envelope
  const amp = 0.18 * Math.sin(progress * Math.PI);
  // Stereo panning: left arc and right arc separation
  const panProgress = Math.sin(progress * Math.PI * 2);
  left[i] += noiseFilterStateL * amp * (0.6 + 0.4 * panProgress);
  right[i] += noiseFilterStateR * amp * (0.6 - 0.4 * panProgress);
}

// 3. Crystalline Harmonic Chime Chord (Impact at 1.6s)
// Frequencies: 880Hz (A5), 1320Hz (E6), 1760Hz (A6), 2640Hz (E7)
const chimeT0 = 1.6;
const chimePartials = [
  { freq: 880, amp: 0.22, decay: 3.2 },
  { freq: 1320, amp: 0.16, decay: 4.0 },
  { freq: 1760, amp: 0.14, decay: 4.8 },
  { freq: 2640, amp: 0.08, decay: 6.0 },
  { freq: 3520, amp: 0.04, decay: 7.5 }
];

for (let i = 0; i < numSamples; i++) {
  const t = i / sampleRate;
  if (t < chimeT0) continue;
  const dt = t - chimeT0;

  // 10ms attack ramp
  const attack = clamp(dt / 0.01, 0, 1);

  let chimeSample = 0;
  for (const partial of chimePartials) {
    const env = attack * Math.exp(-dt * partial.decay);
    chimeSample += partial.amp * env * Math.sin(2 * Math.PI * partial.freq * dt);
  }

  // Slight stereo width for the chime
  left[i] += chimeSample * 0.9;
  right[i] += chimeSample * 1.0;
}

// 4. Kinetic Typography Airy Swish (2.4s to 3.6s)
let swishFilterL = 0;
let swishFilterR = 0;
for (let i = 0; i < numSamples; i++) {
  const t = i / sampleRate;
  if (t < 2.4 || t > 3.6) continue;

  const dt = (t - 2.4) / 1.2;
  const rawNoise = (Math.random() * 2 - 1);
  const cutoff = 0.08 + 0.06 * Math.sin(dt * Math.PI);
  swishFilterL += cutoff * (rawNoise - swishFilterL);
  swishFilterR += cutoff * (rawNoise - swishFilterR);

  const amp = 0.09 * Math.sin(dt * Math.PI);
  left[i] += swishFilterL * amp;
  right[i] += swishFilterR * amp;
}

// 5. Master Tail Fade & Limiter / Normalization
let maxPeak = 0.001;
for (let i = 0; i < numSamples; i++) {
  const t = i / sampleRate;
  // Tail fade out from 5.2s to 6.0s
  if (t > 5.2) {
    const fade = 1 - (t - 5.2) / 0.8;
    left[i] *= fade * fade;
    right[i] *= fade * fade;
  }
  const peakL = Math.abs(left[i]);
  const peakR = Math.abs(right[i]);
  if (peakL > maxPeak) maxPeak = peakL;
  if (peakR > maxPeak) maxPeak = peakR;
}

// Normalize to -1.0 dBFS (peak = 0.89)
const targetPeak = 0.89;
const gainMultiplier = targetPeak / maxPeak;

// Assemble 16-bit PCM WAV Buffer
const bytesPerSample = 2;
const blockAlign = numChannels * bytesPerSample;
const byteRate = sampleRate * blockAlign;
const dataSize = numSamples * blockAlign;

const outBuffer = Buffer.alloc(44 + dataSize);
outBuffer.write('RIFF', 0);
outBuffer.writeUInt32LE(36 + dataSize, 4);
outBuffer.write('WAVE', 8);
outBuffer.write('fmt ', 12);
outBuffer.writeUInt32LE(16, 16);
outBuffer.writeUInt16LE(1, 20);
outBuffer.writeUInt16LE(numChannels, 22);
outBuffer.writeUInt32LE(sampleRate, 24);
outBuffer.writeUInt32LE(byteRate, 28);
outBuffer.writeUInt16LE(blockAlign, 32);
outBuffer.writeUInt16LE(16, 34);
outBuffer.write('data', 36);
outBuffer.writeUInt32LE(dataSize, 40);

let offset = 44;
for (let i = 0; i < numSamples; i++) {
  // Soft saturation / clip protection
  let sL = clamp(left[i] * gainMultiplier, -0.999, 0.999);
  let sR = clamp(right[i] * gainMultiplier, -0.999, 0.999);

  const intL = Math.round(sL * 32767);
  const intR = Math.round(sR * 32767);

  outBuffer.writeInt16LE(intL, offset);
  outBuffer.writeInt16LE(intR, offset + 2);
  offset += 4;
}

// Write to remotion/public/ and client/public/
const targetDirRemotion = path.resolve(__dirname, '..', 'remotion', 'public');
if (!fs.existsSync(targetDirRemotion)) {
  fs.mkdirSync(targetDirRemotion, { recursive: true });
}
const remotionAudioPath = path.join(targetDirRemotion, 'sonicwave-intro-audio.wav');
fs.writeFileSync(remotionAudioPath, outBuffer);
console.log(`[AUDIO] Synthesized Remotion intro audio: ${remotionAudioPath} (${(outBuffer.length / 1024).toFixed(1)} KB)`);

// Also save to client/public/ for optional high-fidelity audio asset in web intro
const targetDirClient = path.resolve(__dirname, '..', 'client', 'public');
const clientAudioPath = path.join(targetDirClient, 'sonicwave-intro-audio.wav');
fs.writeFileSync(clientAudioPath, outBuffer);
console.log(`[AUDIO] Copied intro audio to client public: ${clientAudioPath}`);
