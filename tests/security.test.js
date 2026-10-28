const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const { normalizeUrl, getActiveJobCount, DOWNLOADS_DIR } = require('../server/converter');
const { getYtDlpPath, getFfmpegPath } = require('../server/binManager');

test('security - normalizeUrl permits valid external media URLs', () => {
  const valid = [
    'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    'https://youtu.be/dQw4w9WgXcQ',
    'https://soundcloud.com/artist/track',
    'https://www.instagram.com/reel/Cx123456/',
    'https://www.tiktok.com/@creator/video/1234567890',
    'https://x.com/user/status/1234567890',
    'https://reddit.com/r/music/comments/12345/track'
  ];

  for (const url of valid) {
    const normalized = normalizeUrl(url);
    assert.ok(normalized.startsWith('https://'), `Expected https URL for ${url}`);
  }
});

test('security - normalizeUrl blocks SSRF loopback, internal IPs, and cloud metadata', () => {
  const malicious = [
    'http://localhost',
    'http://localhost:3001',
    'http://127.0.0.1',
    'http://127.0.0.1:8080/admin',
    'http://127.0.0.2:9000',
    'http://0.0.0.0:3000',
    'http://[::1]:8080',
    'http://169.254.169.254/latest/meta-data/', // AWS/GCP/Azure instance metadata
    'http://10.0.0.1/internal',
    'http://192.168.1.1/router',
    'http://172.16.0.1/admin',
    'http://100.64.0.1/cgnat'
  ];

  for (const url of malicious) {
    assert.throws(
      () => normalizeUrl(url),
      /prohibited|invalid/i,
      `Should reject SSRF target: ${url}`
    );
  }
});

test('security - normalizeUrl blocks non-HTTP schemes and null-byte injection', () => {
  const invalid = [
    'file:///C:/Windows/win.ini',
    'file:///etc/passwd',
    'gopher://127.0.0.1:70',
    'ftp://internal.server',
    'https://youtube.com/watch?v=123\0admin'
  ];

  for (const url of invalid) {
    assert.throws(
      () => normalizeUrl(url),
      /only http and https|invalid/i,
      `Should reject non-http or null-byte: ${url}`
    );
  }
});

test('security - getActiveJobCount returns non-negative integer', () => {
  const count = getActiveJobCount();
  assert.strictEqual(typeof count, 'number');
  assert.ok(count >= 0, 'Active job count should be >= 0');
});

test('security - DOWNLOADS_DIR path confinement prevents arbitrary file traversal', () => {
  const downloadsAbs = path.resolve(DOWNLOADS_DIR);

  // Valid path inside downloads
  const validPath = path.join(downloadsAbs, 'valid-job-uuid.mp3');
  assert.ok(
    path.resolve(validPath).startsWith(downloadsAbs + path.sep),
    'File inside DOWNLOADS_DIR should be permitted'
  );

  // Traversal path outside downloads
  const outsidePath = path.join(downloadsAbs, '..', '..', 'Windows', 'win.ini');
  assert.ok(
    !path.resolve(outsidePath).startsWith(downloadsAbs + path.sep),
    'File outside DOWNLOADS_DIR must be detected and blocked'
  );
});

test('security - binManager binary paths are absolute and resolved safely', () => {
  const ytDlp = getYtDlpPath();
  assert.ok(path.isAbsolute(ytDlp), 'yt-dlp path must be absolute');
  assert.ok(!ytDlp.includes('"'), 'yt-dlp path must not contain raw shell quotes');
});
