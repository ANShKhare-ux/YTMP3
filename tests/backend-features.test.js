const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { app, setSystemStatus } = require('../server/index');
const {
  analyzePlaylistUrl,
  buildConversionArgs,
  sanitizeTimestamp,
  updateServerSettings,
  getServerSettings,
  startConversion,
  cancelConversion,
  getQueueLength,
  _jobs
} = require('../server/converter');
const { createZipBuffer } = require('../server/photoResolver');

let server;
let baseUrl;

test.before(async () => {
  setSystemStatus({
    ready: true,
    ytDlp: true,
    ffmpeg: true,
    aria2: false,
    downloader: 'builtin',
    ytDlpVersion: '2026.11.23',
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
  await new Promise((resolve) => server.close(resolve));
});

test('M5 - GET /api/photo-download blocks SSRF, HTTP, and private IP targets', async () => {
  const blockedTargets = [
    'http://example.com/photo.jpg',
    'https://127.0.0.1/secret.jpg',
    'https://169.254.169.254/latest/meta-data.jpg',
    'https://192.168.1.1/cam.jpg',
    'https://10.0.0.5/internal.jpg'
  ];

  for (const target of blockedTargets) {
    const res = await fetch(`${baseUrl}/api/photo-download?url=${encodeURIComponent(target)}`);
    assert.strictEqual(res.status, 400, `Expected HTTP 400 for blocked URL ${target}, got ${res.status}`);
    const body = await res.json();
    assert.strictEqual(body.success, false);
  }
});

test('M7 - queued jobs enter queued status when 3 workers are active and cancel cleanly', () => {
  const activeIds = ['m7-active-1', 'm7-active-2', 'm7-active-3'];
  const queuedId = 'm7-queued-4';

  for (const id of activeIds) {
    _jobs.set(id, { id, status: 'downloading', progress: 25, url: 'https://example.com/v' });
  }

  try {
    const queuedJob = startConversion({
      url: 'https://example.com/watch?v=4',
      format: 'mp3',
      quality: '320k',
      jobId: queuedId
    });
    assert.strictEqual(queuedJob.status, 'queued');
    assert.ok(queuedJob.queuePosition >= 1);
    assert.ok(getQueueLength() >= 1);

    const cancelled = cancelConversion(queuedId);
    assert.strictEqual(cancelled, true);
    assert.strictEqual(_jobs.get(queuedId).status, 'cancelled');
  } finally {
    for (const id of activeIds) _jobs.delete(id);
    _jobs.delete(queuedId);
  }
});

test('M8 - analyzePlaylistUrl distinguishes explicit playlists from watch query hints & batch validates inputs', async () => {
  const explicit = analyzePlaylistUrl('https://www.youtube.com/playlist?list=PL123456');
  assert.strictEqual(explicit.isExplicitPlaylist, true);
  assert.strictEqual(explicit.hasPlaylistParam, true);

  const watchHint = analyzePlaylistUrl('https://www.youtube.com/watch?v=dQw4w9WgXcQ&list=RDdQw4w9WgXcQ');
  assert.strictEqual(watchHint.isExplicitPlaylist, false);
  assert.strictEqual(watchHint.hasPlaylistParam, true);

  const scSet = analyzePlaylistUrl('https://soundcloud.com/artist/sets/album-name');
  assert.strictEqual(scSet.isExplicitPlaylist, true);

  const badBatch = await fetch(`${baseUrl}/api/convert-batch`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ items: [{ url: 'http://127.0.0.1/ssrf' }] })
  });
  assert.strictEqual(badBatch.status, 400);
});

test('M9 - library settings reject unsafe system folders and preserve valid configuration', () => {
  const settingsPath = path.join(__dirname, '..', 'server', 'data', 'settings.json');
  const hadSettings = fs.existsSync(settingsPath);
  const prevRaw = hadSettings ? fs.readFileSync(settingsPath, 'utf8') : null;

  try {
    assert.throws(() => {
      updateServerSettings({
        libraryMode: 'permanent',
        libraryDir: process.platform === 'win32' ? 'C:\\Windows\\Temp' : '/etc'
      });
    }, /not permitted/i);

    const safeDir = path.join(__dirname, '..', 'server', 'downloads');
    const updated = updateServerSettings({ libraryMode: 'temporary', libraryDir: safeDir });
    assert.strictEqual(updated.libraryMode, 'temporary');
    assert.strictEqual(getServerSettings().libraryDir, path.resolve(safeDir));
  } finally {
    if (hadSettings) {
      fs.writeFileSync(settingsPath, prevRaw, 'utf8');
    } else if (fs.existsSync(settingsPath)) {
      fs.unlinkSync(settingsPath);
    }
  }
});

test('M10 - buildConversionArgs avoids -N 16 conflict with aria2c and omits forced quality transcode on M4A', () => {
  const ariaResult = buildConversionArgs({
    url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    format: 'm4a',
    quality: '320k',
    outputTemplate: 'out.%(ext)s',
    useAria2: true,
    turbo: true
  });

  assert.strictEqual(ariaResult.args.includes('--downloader'), true);
  assert.strictEqual(ariaResult.args.includes('-N'), false, '-N 16 must be omitted when aria2c is active');
  assert.strictEqual(ariaResult.args.includes('--audio-quality'), false, 'M4A should not pass forced --audio-quality bitrate');
});

test('M11 - localhost cookies endpoints save metadata without exposing secret cookie values', async () => {
  const cookiePath = path.join(__dirname, '..', 'server', 'cookies.txt');
  const hadCookie = fs.existsSync(cookiePath);
  const prevCookie = hadCookie ? fs.readFileSync(cookiePath, 'utf8') : null;

  try {
    const sampleCookies = '# Netscape HTTP Cookie File\n.youtube.com\tTRUE\t/\tTRUE\t1893456000\tSID\tSECRET_SESSION_TOKEN_VALUE\n';
    const saveRes = await fetch(`${baseUrl}/api/settings/cookies`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content: sampleCookies })
    });
    assert.strictEqual(saveRes.status, 200);
    const saveText = await saveRes.text();
    assert.strictEqual(saveText.includes('SECRET_SESSION_TOKEN_VALUE'), false, 'Response must never leak cookie secret values');
    const saveJson = JSON.parse(saveText);
    assert.strictEqual(saveJson.cookies.configured, true);
    assert.ok(saveJson.cookies.domainCount >= 1);

    const getRes = await fetch(`${baseUrl}/api/settings/cookies`);
    const getText = await getRes.text();
    assert.strictEqual(getText.includes('SECRET_SESSION_TOKEN_VALUE'), false);

    const delRes = await fetch(`${baseUrl}/api/settings/cookies`, { method: 'DELETE' });
    const delJson = await delRes.json();
    assert.strictEqual(delJson.success, true);
  } finally {
    if (hadCookie) {
      fs.writeFileSync(cookiePath, prevCookie, 'utf8');
    } else if (fs.existsSync(cookiePath)) {
      fs.unlinkSync(cookiePath);
    }
  }
});

test('M12 - clip trim, loudnorm, SponsorBlock flags and zero-deflate image ZIP store', () => {
  assert.strictEqual(sanitizeTimestamp('01:23.5'), '01:23.5');
  assert.strictEqual(sanitizeTimestamp('1:05:00'), '1:05:00');
  assert.strictEqual(sanitizeTimestamp('--exec rm -rf /'), '');

  const res = buildConversionArgs({
    url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    format: 'mp3',
    quality: '320k',
    outputTemplate: 'clip.%(ext)s',
    useAria2: false,
    trimStart: '0:15',
    trimEnd: '1:30',
    normalizeAudio: true,
    sponsorBlock: true
  });

  const secIdx = res.args.indexOf('--download-sections');
  assert.ok(secIdx !== -1);
  assert.strictEqual(res.args[secIdx + 1], '*0:15-1:30');
  assert.ok(res.args.includes('--force-keyframes-at-cuts'));
  assert.ok(res.args.includes('--sponsorblock-remove'));
  const ppIdx = res.args.indexOf('--postprocessor-args');
  assert.ok(res.args[ppIdx + 1].includes('loudnorm=I=-14:TP=-1.5:LRA=11'));

  const zipBuf = createZipBuffer([
    { filename: 'photo.jpg', data: Buffer.from('AAAAABBBBBCCCCCDDDDD') }
  ]);
  // Compression method uint16LE at offset 8 of PKZip local file header must be 0 (Store)
  assert.strictEqual(zipBuf.readUInt16LE(8), 0, 'Pre-compressed JPEG must use ZIP Store (method=0)');
});
