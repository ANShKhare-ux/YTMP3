const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const {
  getYtDlpPath,
  getFfmpegPath,
  getFfmpegLocation,
  getBinDir,
  verifyBinaries,
  updateYtDlp,
  cleanCorruptBinary
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

test('binManager - updateYtDlp returns a promise and completes asynchronously', async () => {
  const promise = updateYtDlp();
  assert.ok(promise && typeof promise.then === 'function', 'updateYtDlp must return a promise');
  const res = await promise;
  assert.ok(typeof res === 'object' && res !== null, 'result must be an object');
  assert.ok(typeof res.success === 'boolean', 'result must have a boolean success property');
});

test('binManager - verifyBinaries detects and unlinks 0-byte corrupt binary', async () => {
  const ytDlpPath = getYtDlpPath();
  const backupPath = ytDlpPath + '.zero-byte-test.bak';
  const hasOriginal = fs.existsSync(ytDlpPath);

  if (hasOriginal) {
    fs.renameSync(ytDlpPath, backupPath);
  }

  try {
    // Plant 0-byte corrupt file at YT_DLP_PATH
    fs.writeFileSync(ytDlpPath, Buffer.alloc(0));
    assert.strictEqual(fs.existsSync(ytDlpPath), true, '0-byte test file must exist before verification');
    assert.strictEqual(fs.statSync(ytDlpPath).size, 0, 'file size must be 0 bytes');

    // Call verifyBinaries directly with skipDownload: true to avoid network calls
    const status = await verifyBinaries({ skipDownload: true });

    // verifyBinaries must detect size === 0, unlink the file, and report ytDlp as false
    assert.strictEqual(fs.existsSync(ytDlpPath), false, 'verifyBinaries must delete 0-byte corrupt binary');
    assert.strictEqual(status.ytDlp, false, 'corrupt binary must not be marked verified');
  } finally {
    if (fs.existsSync(ytDlpPath)) {
      try { fs.unlinkSync(ytDlpPath); } catch {}
    }
    if (hasOriginal && fs.existsSync(backupPath)) {
      fs.renameSync(backupPath, ytDlpPath);
    }
  }
});

test('binManager - cleanCorruptBinary removes 0-byte file and preserves valid file', () => {
  const tempZero = path.join(getBinDir(), 'temp-zero-byte.bin');
  const tempValid = path.join(getBinDir(), 'temp-valid.bin');

  fs.writeFileSync(tempZero, Buffer.alloc(0));
  fs.writeFileSync(tempValid, Buffer.from('valid executable header'));

  try {
    const unlinkedZero = cleanCorruptBinary(tempZero);
    assert.strictEqual(unlinkedZero, true, 'cleanCorruptBinary should return true for 0-byte file');
    assert.strictEqual(fs.existsSync(tempZero), false, '0-byte file must be deleted');

    const unlinkedValid = cleanCorruptBinary(tempValid);
    assert.strictEqual(unlinkedValid, false, 'cleanCorruptBinary should return false for non-zero file');
    assert.strictEqual(fs.existsSync(tempValid), true, 'valid non-zero file must not be deleted');
  } finally {
    if (fs.existsSync(tempZero)) fs.unlinkSync(tempZero);
    if (fs.existsSync(tempValid)) fs.unlinkSync(tempValid);
  }
});


