/**
 * Lightweight browser Web Audio synthesizer for the LandingPage hero demo widget.
 * Zero external assets or npm dependencies; produces smooth track-matched synth grooves
 * and gracefully no-ops when Web Audio is unavailable.
 */

const TRACK_PRESETS = {
  neon: {
    stepMs: 260,
    filterHz: 1150,
    bassHz: [65.41, 65.41, 77.78, 73.42],
    chordHz: [
      [261.63, 311.13, 392.0],
      [233.08, 293.66, 349.23],
      [207.65, 261.63, 311.13],
      [233.08, 293.66, 392.0]
    ],
    wave: 'sawtooth'
  },
  lofi: {
    stepMs: 360,
    filterHz: 780,
    bassHz: [73.42, 65.41, 58.27, 65.41],
    chordHz: [
      [220.0, 261.63, 329.63, 392.0],
      [196.0, 246.94, 293.66, 349.23],
      [174.61, 220.0, 261.63, 329.63],
      [196.0, 246.94, 293.66, 392.0]
    ],
    wave: 'triangle'
  },
  acoustic: {
    stepMs: 300,
    filterHz: 1350,
    bassHz: [82.41, 73.42, 65.41, 73.42],
    chordHz: [
      [246.94, 329.63, 392.0],
      [220.0, 293.66, 369.99],
      [196.0, 261.63, 329.63],
      [220.0, 293.66, 392.0]
    ],
    wave: 'sine'
  }
};

function pickPreset(track) {
  const hint = `${track?.title || ''} ${track?.genre || ''} ${track?.id ?? ''}`.toLowerCase();
  if (hint.includes('lofi') || hint.includes('rain') || hint.includes('2')) {
    return TRACK_PRESETS.lofi;
  }
  if (hint.includes('acoustic') || hint.includes('sunset') || hint.includes('3')) {
    return TRACK_PRESETS.acoustic;
  }
  return TRACK_PRESETS.neon;
}

class DemoAudioSynth {
  constructor() {
    this.ctx = null;
    this.masterGain = null;
    this.filter = null;
    this.stepTimer = null;
    this.stepIndex = 0;
    this.activePresetKey = null;
    this.isPlaying = false;
    this.isMuted = false;
  }

  ensureContext() {
    if (typeof window === 'undefined') return null;
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return null;

    if (!this.ctx) {
      this.ctx = new AudioCtx();
      this.filter = this.ctx.createBiquadFilter();
      this.filter.type = 'lowpass';
      this.filter.frequency.value = 1100;
      this.filter.Q.value = 1.2;

      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.value = this.isMuted ? 0 : 0.14;

      this.filter.connect(this.masterGain);
      this.masterGain.connect(this.ctx.destination);
    }

    if (this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
    return this.ctx;
  }

  triggerNote(freq, durationSec, type, gainLevel) {
    if (!this.ctx || !this.filter || this.ctx.state === 'closed') return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const env = this.ctx.createGain();

    osc.type = type;
    osc.frequency.setValueAtTime(freq, now);

    env.gain.setValueAtTime(0.0001, now);
    env.gain.exponentialRampToValueAtTime(gainLevel, now + 0.025);
    env.gain.exponentialRampToValueAtTime(0.0001, now + durationSec);

    osc.connect(env);
    env.connect(this.filter);

    osc.start(now);
    osc.stop(now + durationSec + 0.03);
  }

  playStep(preset) {
    if (!this.isPlaying || !this.ctx) return;
    const bar = Math.floor(this.stepIndex / 4) % preset.chordHz.length;
    const beatInBar = this.stepIndex % 4;
    const chord = preset.chordHz[bar];

    if (beatInBar === 0) {
      this.triggerNote(preset.bassHz[bar], 0.42, 'triangle', 0.34);
      chord.forEach((hz) => this.triggerNote(hz, 0.55, preset.wave, 0.14));
    } else {
      const arpNote = chord[beatInBar % chord.length];
      this.triggerNote(arpNote, 0.24, preset.wave, 0.11);
      if (beatInBar === 2) {
        this.triggerNote(preset.bassHz[bar] * 2, 0.22, 'sine', 0.18);
      }
    }

    this.stepIndex += 1;
  }

  start(track, muted = false) {
    this.isMuted = Boolean(muted);
    const ctx = this.ensureContext();
    if (!ctx) return;

    const preset = pickPreset(track);
    const presetKey = `${track?.id ?? track?.title ?? 'neon'}`;

    if (this.stepTimer) {
      clearInterval(this.stepTimer);
      this.stepTimer = null;
    }

    if (this.activePresetKey !== presetKey) {
      this.stepIndex = 0;
      this.activePresetKey = presetKey;
    }

    this.isPlaying = true;
    this.filter.frequency.setTargetAtTime(preset.filterHz, ctx.currentTime, 0.05);
    this.setMuted(this.isMuted);

    this.playStep(preset);
    this.stepTimer = setInterval(() => this.playStep(preset), preset.stepMs);
  }

  setMuted(muted) {
    this.isMuted = Boolean(muted);
    if (!this.ctx || !this.masterGain || this.ctx.state === 'closed') return;
    const target = this.isMuted || !this.isPlaying ? 0 : 0.14;
    this.masterGain.gain.setTargetAtTime(target, this.ctx.currentTime, 0.04);
  }

  stop() {
    this.isPlaying = false;
    if (this.stepTimer) {
      clearInterval(this.stepTimer);
      this.stepTimer = null;
    }
    if (this.ctx && this.masterGain && this.ctx.state !== 'closed') {
      this.masterGain.gain.setTargetAtTime(0, this.ctx.currentTime, 0.04);
    }
  }

  dispose() {
    this.stop();
    if (this.ctx && this.ctx.state !== 'closed') {
      this.ctx.close().catch(() => {});
    }
    this.ctx = null;
    this.masterGain = null;
    this.filter = null;
  }
}

export const demoAudioSynth = new DemoAudioSynth();
