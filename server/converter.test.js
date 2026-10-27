const test = require('node:test');
const assert = require('node:assert');
const { formatDuration } = require('./converter.js');

test('formatDuration', async (t) => {
  await t.test('handles falsy or invalid inputs', () => {
    assert.strictEqual(formatDuration(0), '00:00');
    assert.strictEqual(formatDuration(null), '00:00');
    assert.strictEqual(formatDuration(undefined), '00:00');
    assert.strictEqual(formatDuration(''), '00:00');
    assert.strictEqual(formatDuration(NaN), '00:00');
  });

  await t.test('formats seconds less than a minute', () => {
    assert.strictEqual(formatDuration(1), '00:01');
    assert.strictEqual(formatDuration(9), '00:09');
    assert.strictEqual(formatDuration(10), '00:10');
    assert.strictEqual(formatDuration(59), '00:59');
  });

  await t.test('formats exact minutes', () => {
    assert.strictEqual(formatDuration(60), '01:00');
    assert.strictEqual(formatDuration(120), '02:00');
    assert.strictEqual(formatDuration(599), '09:59');
    assert.strictEqual(formatDuration(600), '10:00');
  });

  await t.test('formats minutes and seconds', () => {
    assert.strictEqual(formatDuration(61), '01:01');
    assert.strictEqual(formatDuration(69), '01:09');
    assert.strictEqual(formatDuration(70), '01:10');
    assert.strictEqual(formatDuration(125), '02:05');
    assert.strictEqual(formatDuration(3599), '59:59');
  });

  await t.test('formats exact hours', () => {
    assert.strictEqual(formatDuration(3600), '1:00:00');
    assert.strictEqual(formatDuration(7200), '2:00:00');
    assert.strictEqual(formatDuration(36000), '10:00:00');
  });

  await t.test('formats hours, minutes, and seconds', () => {
    assert.strictEqual(formatDuration(3601), '1:00:01');
    assert.strictEqual(formatDuration(3660), '1:01:00');
    assert.strictEqual(formatDuration(3661), '1:01:01');
    assert.strictEqual(formatDuration(7265), '2:01:05');
    assert.strictEqual(formatDuration(86399), '23:59:59');
  });

  await t.test('handles float numbers by flooring', () => {
    assert.strictEqual(formatDuration(1.5), '00:01');
    assert.strictEqual(formatDuration(61.9), '01:01');
    assert.strictEqual(formatDuration(3601.2), '1:00:01');
  });
});
