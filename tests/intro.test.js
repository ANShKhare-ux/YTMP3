const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const ROOT_DIR = path.resolve(__dirname, '..');

test('intro - Remotion video composition files and assets exist', () => {
  const rootTsx = path.join(ROOT_DIR, 'remotion', 'src', 'Root.tsx');
  assert.ok(fs.existsSync(rootTsx), 'Root.tsx must exist');
  const rootContent = fs.readFileSync(rootTsx, 'utf-8');
  assert.ok(rootContent.includes('id="SonicWaveIntro"'), 'Root.tsx must register SonicWaveIntro');
  assert.ok(rootContent.includes('durationInFrames={180}'), 'Composition duration must be 180 frames');
  assert.ok(rootContent.includes('fps={30}'), 'Composition fps must be 30');
  assert.ok(rootContent.includes('width={1920}'), 'Composition width must be 1920');
  assert.ok(rootContent.includes('height={1080}'), 'Composition height must be 1080');

  const introTsx = path.join(ROOT_DIR, 'remotion', 'src', 'SonicWaveIntro.tsx');
  assert.ok(fs.existsSync(introTsx), 'SonicWaveIntro.tsx must exist');
  const introContent = fs.readFileSync(introTsx, 'utf-8');
  assert.ok(introContent.includes('sonicwave-intro-audio.wav'), 'SonicWaveIntro must reference audio soundtrack');
});

test('intro - synthesized cinematic audio soundtrack integrity', () => {
  const audioPath = path.join(ROOT_DIR, 'remotion', 'public', 'sonicwave-intro-audio.wav');
  assert.ok(fs.existsSync(audioPath), 'Remotion audio soundtrack must exist');
  const stats = fs.statSync(audioPath);
  assert.ok(stats.size > 1000000, 'Audio track must be at least 1MB for 6s uncompressed 48kHz stereo PCM');

  // Verify RIFF header
  const buf = fs.readFileSync(audioPath);
  assert.strictEqual(buf.toString('ascii', 0, 4), 'RIFF');
  assert.strictEqual(buf.toString('ascii', 8, 12), 'WAVE');
  assert.strictEqual(buf.readUInt16LE(20), 1); // PCM
  assert.strictEqual(buf.readUInt16LE(22), 2); // 2 channels stereo
  assert.strictEqual(buf.readUInt32LE(24), 48000); // 48kHz
  assert.strictEqual(buf.readUInt16LE(34), 16); // 16-bit
});

test('intro - rendered video and thumbnail deliverables exist', () => {
  const mp4Path = path.join(ROOT_DIR, 'out', 'sonicwave-intro.mp4');
  assert.ok(fs.existsSync(mp4Path), 'Rendered MP4 video must exist in out/');
  const mp4Stats = fs.statSync(mp4Path);
  assert.ok(mp4Stats.size > 1000000, 'MP4 file must be > 1MB');

  const thumbPath = path.join(ROOT_DIR, 'out', 'thumbnail.png');
  assert.ok(fs.existsSync(thumbPath), 'Thumbnail still image must exist');
  const thumbBuf = fs.readFileSync(thumbPath);
  // PNG Magic Header: 89 50 4E 47
  assert.strictEqual(thumbBuf[0], 0x89);
  assert.strictEqual(thumbBuf[1], 0x50);
  assert.strictEqual(thumbBuf[2], 0x4e);
  assert.strictEqual(thumbBuf[3], 0x47);

  const lockupPath = path.join(ROOT_DIR, 'out', 'frame-105-lockup.png');
  assert.ok(fs.existsSync(lockupPath), 'Lockup still image must exist');
});

test('intro - in-app SonicIntro component implements accessibility and audio safeguards', () => {
  const introPath = path.join(ROOT_DIR, 'client', 'src', 'components', 'SonicIntro.jsx');
  assert.ok(fs.existsSync(introPath), 'SonicIntro.jsx must exist');
  const content = fs.readFileSync(introPath, 'utf-8');

  // Reduced motion handling
  assert.ok(content.includes('prefers-reduced-motion'), 'Must check prefers-reduced-motion');
  assert.ok(content.includes('!forcePlay'), 'Must check !forcePlay to allow instant exit on auto-mount');

  // Key handling
  assert.ok(content.includes("e.key === 'Escape'"), 'Must handle Escape key');
  assert.ok(!content.includes("e.key === ' '"), 'Must not hijack spacebar');

  // Audio master gain for pop-free transitions
  assert.ok(content.includes('masterGainRef'), 'Must use master gain ref for click-free volume control');

  // Scroll lock
  assert.ok(content.includes('document.body.style.overflow'), 'Must lock and restore body scroll');
});

test('intro - App.jsx and AppDesktop.jsx pass introForcePlay state', () => {
  const appPath = path.join(ROOT_DIR, 'client', 'src', 'App.jsx');
  const appContent = fs.readFileSync(appPath, 'utf-8');
  assert.ok(appContent.includes('introForcePlay'), 'App.jsx must track introForcePlay');
  assert.ok(appContent.includes('forcePlay={introForcePlay}'), 'App.jsx must pass dynamic forcePlay');

  const desktopPath = path.join(ROOT_DIR, 'client', 'src', 'AppDesktop.jsx');
  const desktopContent = fs.readFileSync(desktopPath, 'utf-8');
  assert.ok(desktopContent.includes('introForcePlay'), 'AppDesktop.jsx must track introForcePlay');
  assert.ok(desktopContent.includes('forcePlay={introForcePlay}'), 'AppDesktop.jsx must pass dynamic forcePlay');
});

test('intro - index.css defines Easing Wizard physics tokens and intro classes', () => {
  const cssPath = path.join(ROOT_DIR, 'client', 'src', 'index.css');
  const cssContent = fs.readFileSync(cssPath, 'utf-8');

  assert.ok(cssContent.includes('--ease-intro-spring'), 'Must declare --ease-intro-spring token');
  assert.ok(cssContent.includes('--ease-intro-overshoot'), 'Must declare --ease-intro-overshoot token');
  assert.ok(cssContent.includes('--ease-intro-bounce'), 'Must declare --ease-intro-bounce token');
  assert.ok(cssContent.includes('--ease-intro-back'), 'Must declare --ease-intro-back token');
  assert.ok(cssContent.includes('--ease-intro-expo'), 'Must declare --ease-intro-expo token');

  assert.ok(cssContent.includes('.sonic-intro-stage'), 'Must declare .sonic-intro-stage');
  assert.ok(cssContent.includes('.sonic-intro-shockwave'), 'Must declare .sonic-intro-shockwave');
  assert.ok(cssContent.includes('.sonic-intro-emblem-wrap'), 'Must declare .sonic-intro-emblem-wrap');
});
