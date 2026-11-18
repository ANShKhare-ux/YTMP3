const test = require('node:test');
const assert = require('node:assert/strict');
const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const { app, setSystemStatus } = require('../server/index');
const { _jobs, DOWNLOADS_DIR } = require('../server/converter');

let server;
let baseUrl;

test.before(async () => {
  setSystemStatus({
    ready: true,
    ytDlp: true,
    ffmpeg: true,
    ytDlpVersion: '2026.08.19',
    ffmpegVersion: '6.1.1'
  });

  await new Promise((resolve) => {
    server = app.listen(0, '127.0.0.1', () => {
      const port = server.address().port;
      baseUrl = `http://127.0.0.1:${port}`;
      resolve();
    });
  });
});

test.after(async () => {
  await new Promise((resolve) => {
    server.close(resolve);
  });
});

test('server - GET /api/status returns operational status and binary metadata', async () => {
  const res = await fetch(`${baseUrl}/api/status`);
  assert.strictEqual(res.status, 200);
  const data = await res.json();
  assert.strictEqual(data.success, true);
  assert.ok(data.status, 'Status object must be present');
});

test('server - POST /api/info rejects missing body or empty URL with HTTP 400', async () => {
  const resEmptyBody = await fetch(`${baseUrl}/api/info`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({})
  });
  assert.strictEqual(resEmptyBody.status, 400);
  const dataEmpty = await resEmptyBody.json();
  assert.strictEqual(dataEmpty.success, false);
  assert.strictEqual(dataEmpty.error, 'Media URL is required');

  const resBlankUrl = await fetch(`${baseUrl}/api/info`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ url: '   ' })
  });
  assert.strictEqual(resBlankUrl.status, 400);
});

test('server - POST /api/info rejects invalid JSON with HTTP 400', async () => {
  const res = await fetch(`${baseUrl}/api/info`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: '{ broken json: '
  });
  assert.strictEqual(res.status, 400);
  const data = await res.json();
  assert.strictEqual(data.success, false);
  assert.strictEqual(data.error, 'Invalid JSON payload');
});

test('server - POST /api/info rejects SSRF target URLs with HTTP 400', async () => {
  const targets = [
    'http://127.0.0.1:8080/admin',
    'http://169.254.169.254/latest/meta-data/',
    'http://test.localhost:3000',
    'http://printer.local/status'
  ];

  for (const url of targets) {
    const res = await fetch(`${baseUrl}/api/info`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url })
    });
    assert.strictEqual(res.status, 400);
    const data = await res.json();
    assert.strictEqual(data.success, false);
    assert.ok(/prohibited|invalid/i.test(data.error), `Error should mention invalid/prohibited: ${data.error}`);
  }
});

test('server - POST /api/convert validates missing media URL with HTTP 400', async () => {
  const res = await fetch(`${baseUrl}/api/convert`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ format: 'mp3' })
  });
  assert.strictEqual(res.status, 400);
  const data = await res.json();
  assert.strictEqual(data.success, false);
  assert.strictEqual(data.error, 'Media URL is required');
});

test('server - POST /api/convert rejects SSRF targets before spawning conversion', async () => {
  const maliciousUrls = [
    'http://127.0.0.1:9000/internal',
    'http://169.254.169.254/meta-data',
    'http://device.localhost'
  ];

  for (const url of maliciousUrls) {
    const res = await fetch(`${baseUrl}/api/convert`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url, format: 'mp3' })
    });
    assert.strictEqual(res.status, 400);
    const data = await res.json();
    assert.strictEqual(data.success, false);
    assert.ok(/prohibited|invalid/i.test(data.error));
  }
});

test('server - GET /api/progress/:jobId handles client disconnect cleanly without crashing', async () => {
  await new Promise((resolve, reject) => {
    const req = http.get(`${baseUrl}/api/progress/test-disconnect-job-id`, (res) => {
      assert.strictEqual(res.statusCode, 200);
      assert.ok(res.headers['content-type'].includes('text/event-stream'));
      
      // Destroy client connection to test server cleanup
      req.destroy();

      // Give server 500ms to clean up the interval without crashing
      setTimeout(() => {
        resolve();
      }, 500);
    });

    req.on('error', (err) => {
      // Client aborted error is expected upon req.destroy()
      if (err.code === 'ECONNRESET' || err.message.includes('socket hang up')) {
        resolve();
      } else {
        reject(err);
      }
    });
  });
});

test('server - GET /api/stream/:jobId returns 404 for non-existent job', async () => {
  const res = await fetch(`${baseUrl}/api/stream/non-existent-uuid`);
  assert.strictEqual(res.status, 404);
});

test('server - GET /api/stream/:jobId supports RFC 7233 range requests and clamps bounds', async () => {
  const dummyFile = path.join(DOWNLOADS_DIR, 'test-stream-range.mp3');
  const dummyData = Buffer.alloc(1000, 0x41); // 1000 bytes
  fs.writeFileSync(dummyFile, dummyData);

  const jobId = 'test-stream-range-job';
  _jobs.set(jobId, {
    id: jobId,
    status: 'completed',
    filePath: dummyFile,
    fileName: 'test-stream-range.mp3',
    format: 'mp3'
  });

  try {
    // 1. Full stream without Range header
    const fullRes = await fetch(`${baseUrl}/api/stream/${jobId}`);
    assert.strictEqual(fullRes.status, 200);
    assert.strictEqual(fullRes.headers.get('content-length'), '1000');
    assert.strictEqual(fullRes.headers.get('accept-ranges'), 'bytes');

    // 2. Standard slice: bytes=0-499 (500 bytes)
    const partialRes = await fetch(`${baseUrl}/api/stream/${jobId}`, {
      headers: { Range: 'bytes=0-499' }
    });
    assert.strictEqual(partialRes.status, 206);
    assert.strictEqual(partialRes.headers.get('content-range'), 'bytes 0-499/1000');
    assert.strictEqual(partialRes.headers.get('content-length'), '500');

    // 3. Suffix range: bytes=-200 (last 200 bytes)
    const suffixRes = await fetch(`${baseUrl}/api/stream/${jobId}`, {
      headers: { Range: 'bytes=-200' }
    });
    assert.strictEqual(suffixRes.status, 206);
    assert.strictEqual(suffixRes.headers.get('content-range'), 'bytes 800-999/1000');
    assert.strictEqual(suffixRes.headers.get('content-length'), '200');

    // 4. Clamped range: bytes=900-2000 (clamped to 900-999)
    const clampRes = await fetch(`${baseUrl}/api/stream/${jobId}`, {
      headers: { Range: 'bytes=900-2000' }
    });
    assert.strictEqual(clampRes.status, 206);
    assert.strictEqual(clampRes.headers.get('content-range'), 'bytes 900-999/1000');
    assert.strictEqual(clampRes.headers.get('content-length'), '100');

    // 5. Unsatisfiable range: bytes=2000-3000 -> HTTP 416
    const unsatisfiableRes = await fetch(`${baseUrl}/api/stream/${jobId}`, {
      headers: { Range: 'bytes=2000-3000' }
    });
    assert.strictEqual(unsatisfiableRes.status, 416);
    assert.strictEqual(unsatisfiableRes.headers.get('content-range'), 'bytes */1000');

    // 6. Inverted range: bytes=500-200 -> HTTP 416
    const invertedRes = await fetch(`${baseUrl}/api/stream/${jobId}`, {
      headers: { Range: 'bytes=500-200' }
    });
    assert.strictEqual(invertedRes.status, 416);
    assert.strictEqual(invertedRes.headers.get('content-range'), 'bytes */1000');
  } finally {
    _jobs.delete(jobId);
    if (fs.existsSync(dummyFile)) fs.unlinkSync(dummyFile);
  }
});

test('server - GET /api/download/:jobId preserves Unicode characters in RFC 5987 Content-Disposition', async () => {
  const dummyFile = path.join(DOWNLOADS_DIR, 'test-unicode-download.mp3');
  fs.writeFileSync(dummyFile, Buffer.from('dummy audio content'));

  const jobId = 'test-unicode-download-job';
  const rawTitle = '日本語 🎵 Lo-Fi Beats (Remix)';
  _jobs.set(jobId, {
    id: jobId,
    status: 'completed',
    filePath: dummyFile,
    fileName: `${rawTitle}.mp3`,
    title: rawTitle,
    format: 'mp3'
  });

  try {
    const res = await fetch(`${baseUrl}/api/download/${jobId}`);
    assert.strictEqual(res.status, 200);
    const disposition = res.headers.get('content-disposition');
    assert.ok(disposition, 'Content-Disposition header must be present');
    assert.ok(disposition.includes("filename*=UTF-8''"), 'RFC 5987 UTF-8 encoding must be declared');
    assert.ok(disposition.includes(encodeURIComponent('日本語 🎵 Lo-Fi Beats (Remix).mp3')), 'UTF-8 filename must preserve full Unicode string');
  } finally {
    _jobs.delete(jobId);
    if (fs.existsSync(dummyFile)) fs.unlinkSync(dummyFile);
  }
});

test('server - GET /api/download/:jobId and /api/stream/:jobId reject path traversal outside DOWNLOADS_DIR with HTTP 403', async () => {
  const jobId = 'test-path-traversal-job';
  // Point filePath to an existing file outside DOWNLOADS_DIR
  const outsideFile = path.resolve(__dirname, '../server/index.js');
  assert.ok(fs.existsSync(outsideFile), 'Target outside file must exist for traversal check');

  _jobs.set(jobId, {
    id: jobId,
    status: 'completed',
    filePath: outsideFile,
    fileName: 'index.js',
    format: 'js'
  });

  try {
    // 1. Download endpoint
    const dlRes = await fetch(`${baseUrl}/api/download/${jobId}`);
    assert.strictEqual(dlRes.status, 403, 'Download endpoint must return HTTP 403 for file outside DOWNLOADS_DIR');
    const dlText = await dlRes.text();
    assert.ok(dlText.includes('Access denied'), 'Download response should mention access denied');

    // 2. Stream endpoint
    const streamRes = await fetch(`${baseUrl}/api/stream/${jobId}`);
    assert.strictEqual(streamRes.status, 403, 'Stream endpoint must return HTTP 403 for file outside DOWNLOADS_DIR');
    const streamText = await streamRes.text();
    assert.ok(streamText.includes('Access denied'), 'Stream response should mention access denied');
  } finally {
    _jobs.delete(jobId);
  }
});

test('server - GET /SonicWave.apk returns HTTP 200 with application/vnd.android.package-archive Content-Type', async () => {
  const res = await fetch(`${baseUrl}/SonicWave.apk`);
  assert.strictEqual(res.status, 200, 'GET /SonicWave.apk must return HTTP 200');
  const contentType = res.headers.get('content-type');
  assert.ok(
    contentType && contentType.includes('application/vnd.android.package-archive'),
    `Content-Type must be application/vnd.android.package-archive, got: ${contentType}`
  );
  const disposition = res.headers.get('content-disposition');
  assert.ok(
    disposition && disposition.includes('SonicWave.apk'),
    `Content-Disposition must reference SonicWave.apk, got: ${disposition}`
  );
  const buffer = await res.arrayBuffer();
  assert.ok(buffer.byteLength > 10 * 1024 * 1024, 'Downloaded APK must be a valid complete binary (>10MB)');
});

test('server - GET /SonicWave.apk returns HTTP 404 JSON when APK candidate files are missing', async () => {
  const candidates = [
    path.join(__dirname, '..', 'client', 'public', 'SonicWave.apk'),
    path.join(__dirname, '..', 'client', 'dist', 'SonicWave.apk'),
    path.join(__dirname, '..', 'android-app', 'app', 'build', 'outputs', 'apk', 'release', 'app-release.apk')
  ];
  const renamed = [];
  try {
    for (const p of candidates) {
      if (fs.existsSync(p)) {
        const tempPath = `${p}.bak_test_${Date.now()}`;
        fs.renameSync(p, tempPath);
        renamed.push({ original: p, temp: tempPath });
      }
    }

    const res = await fetch(`${baseUrl}/SonicWave.apk`);
    assert.strictEqual(res.status, 404, 'Must return 404 when no candidate APK exists');
    const data = await res.json();
    assert.strictEqual(data.success, false);
    assert.strictEqual(data.error, 'SonicWave.apk not found on server');
  } finally {
    for (const { original, temp } of renamed) {
      if (fs.existsSync(temp)) {
        fs.renameSync(temp, original);
      }
    }
  }
});

test('server - GET /SonicWave-Custom-Installer.exe returns HTTP 404 JSON when installer candidate files are missing', async () => {
  const candidates = [
    path.join(__dirname, '..', 'client', 'public', 'SonicWave-Custom-Installer.exe'),
    path.join(__dirname, '..', 'dist-installer', 'SonicWave-Custom-Installer.exe')
  ];
  const renamed = [];
  try {
    for (const p of candidates) {
      if (fs.existsSync(p)) {
        const tempPath = `${p}.bak_test_${Date.now()}`;
        fs.renameSync(p, tempPath);
        renamed.push({ original: p, temp: tempPath });
      }
    }

    const res = await fetch(`${baseUrl}/SonicWave-Custom-Installer.exe`);
    assert.strictEqual(res.status, 404, 'Must return 404 when no candidate installer exists');
    const data = await res.json();
    assert.strictEqual(data.success, false);
    assert.strictEqual(data.error, 'SonicWave-Custom-Installer.exe not found on server');
  } finally {
    for (const { original, temp } of renamed) {
      if (fs.existsSync(temp)) {
        fs.renameSync(temp, original);
      }
    }
  }
});
