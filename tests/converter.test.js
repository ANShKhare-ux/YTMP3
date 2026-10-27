const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const {
  formatDuration,
  getJob,
  getHistory,
  cancelConversion,
  DOWNLOADS_DIR
} = require('../server/converter');

test('converter - formatDuration formatting rules', () => {
  // Edge cases and invalid values
  assert.strictEqual(formatDuration(0), '0:00');
  assert.strictEqual(formatDuration(null), '0:00');
  assert.strictEqual(formatDuration(undefined), '0:00');
  assert.strictEqual(formatDuration(NaN), '0:00');

  // Sub-minute formatting
  assert.strictEqual(formatDuration(5), '0:05');
  assert.strictEqual(formatDuration(42), '0:42');

  // Multi-minute formatting
  assert.strictEqual(formatDuration(60), '1:00');
  assert.strictEqual(formatDuration(125), '2:05');
  assert.strictEqual(formatDuration(599), '9:59');

  // Multi-hour formatting
  assert.strictEqual(formatDuration(3600), '1:00:00');
  assert.strictEqual(formatDuration(3665), '1:01:05');
  assert.strictEqual(formatDuration(36000), '10:00:00');
});

test('converter - getJob returns null for non-existent job ID', () => {
  const result = getJob('unknown-job-id-9999');
  assert.strictEqual(result, null);
});

test('converter - cancelConversion returns false for non-existent job ID', () => {
  const result = cancelConversion('non-existent-job-uuid');
  assert.strictEqual(result, false);
});

test('converter - getHistory returns array without raw process leaks', () => {
  const history = getHistory();
  assert.ok(Array.isArray(history), 'History should be an array');
  for (const entry of history) {
    assert.strictEqual(entry.process, undefined, 'History entries must not expose child process handles');
    assert.ok(typeof entry.status === 'string', 'History entry must have status');
  }
});

test('converter - DOWNLOADS_DIR exists and is an absolute directory', () => {
  assert.ok(path.isAbsolute(DOWNLOADS_DIR), 'DOWNLOADS_DIR should be an absolute path');
  assert.ok(fs.existsSync(DOWNLOADS_DIR), 'DOWNLOADS_DIR must exist on disk');
  const stats = fs.statSync(DOWNLOADS_DIR);
  assert.ok(stats.isDirectory(), 'DOWNLOADS_DIR must be a directory');
});


