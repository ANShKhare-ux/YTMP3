const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const {
  getYtDlpPath,
  getFfmpegPath,
  getFfmpegLocation,
  getBinDir,
  verifyBinaries
} = require('../server/binManager');

test.before(async () => {
  // Ensure binaries are provisioned before inspecting filesystem paths
  await verifyBinaries();
});

test('binManager - getBinDir returns existing server/bin directory', () => {
  const binDir = getBinDir();
  assert.ok(binDir, 'binDir must be defined');
  assert.ok(binDir.endsWith(path.join('server', 'bin')), 'binDir must point to server/bin');
  assert.ok(fs.existsSync(binDir), 'binDir must exist on disk');
});

test('binManager - getYtDlpPath points to platform executable', () => {
  const ytDlpPath = getYtDlpPath();
  const expectedName = process.platform === 'win32' ? 'yt-dlp.exe' : 'yt-dlp';
  assert.ok(ytDlpPath.endsWith(expectedName), `ytDlpPath should end in ${expectedName}`);
  assert.ok(fs.existsSync(ytDlpPath), 'yt-dlp executable must be provisioned locally');
});

test('binManager - getFfmpegLocation returns valid path or directory', () => {
  const loc = getFfmpegLocation();
  assert.ok(loc !== null && loc !== undefined, 'FFmpeg location must be available');
  assert.ok(fs.existsSync(loc), 'FFmpeg path/directory must exist');
});

test('binManager - verifyBinaries detects working yt-dlp and ffmpeg', async () => {
  const status = await verifyBinaries();
  assert.strictEqual(status.ytDlp, true, 'ytDlp should be verified');
  assert.ok(typeof status.ytDlpVersion === 'string' && status.ytDlpVersion.length > 0, 'yt-dlp version must be present');
  assert.strictEqual(status.ffmpeg, true, 'ffmpeg should be verified');
  assert.ok(typeof status.ffmpegVersion === 'string' && status.ffmpegVersion.length > 0, 'ffmpeg version must be present');
});

