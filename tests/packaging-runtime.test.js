const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const net = require('node:net');
const os = require('node:os');
const path = require('node:path');

const rootDir = path.resolve(__dirname, '..');

test('M13 - SonicWaveApp.cs supports bundled/auto-provisioned portable Node runtime and port discovery', () => {
  const launcherPath = path.join(rootDir, 'launcher', 'SonicWaveApp.cs');
  const src = fs.readFileSync(launcherPath, 'utf8');
  assert.ok(src.includes('AutoProvisionPortableNode'), 'SonicWaveApp.cs must auto-provision portable Node runtime when absent');
  assert.ok(src.includes('FindAvailablePort'), 'SonicWaveApp.cs must dynamically allocate a free port');
  assert.ok(src.includes('PrependPath'), 'SonicWaveApp.cs must add bundled Node dir to backend PATH');
  assert.strictEqual(src.includes('Would you like to open the official Node.js download page?'), false, 'Manual Node download blocker prompt must be removed');
});

test('M14 - zipBuilder enforces POSIX executable bit on start.sh and excludes Windows binaries for macOS', async () => {
  const { createZipFromDirectory, inspectZipEntries } = await import('../scripts/lib/zipBuilder.mjs');

  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'sonicwave-zip-test-'));
  const staging = path.join(tmpDir, 'staging');
  const outZip = path.join(tmpDir, 'mac-test.zip');

  try {
    fs.mkdirSync(path.join(staging, 'server'), { recursive: true });
    fs.writeFileSync(path.join(staging, 'SonicWave.exe'), 'MZ-dummy');
    fs.writeFileSync(path.join(staging, 'start.bat'), '@echo off\r\n');
    fs.writeFileSync(path.join(staging, 'start.sh'), '#!/usr/bin/env bash\r\necho "SonicWave"\r\n');
    fs.writeFileSync(path.join(staging, 'server', 'index.js'), 'console.log(1);\n');

    createZipFromDirectory(staging, outZip, {
      posixPermissions: true,
      filter: (relPath) => !/\.(exe|bat|dll)$/i.test(relPath) && !/^runtime\//i.test(relPath)
    });

    const entries = inspectZipEntries(outZip);
    assert.strictEqual(entries.some((e) => /\.exe$/i.test(e.name)), false, 'macOS zip must exclude .exe');
    assert.strictEqual(entries.some((e) => /\.bat$/i.test(e.name)), false, 'macOS zip must exclude .bat');

    const startSh = entries.find((e) => e.name === 'start.sh');
    assert.ok(startSh, 'macOS zip must contain start.sh');
    assert.strictEqual(startSh.isExecutable, true, 'start.sh must carry POSIX executable bits');
    assert.strictEqual(startSh.unixMode & 0o777, 0o755, 'start.sh must have 0o755 mode');
  } finally {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }
});

test('M14 - packaged macOS ZIP distribution excludes Windows binaries and preserves executable start.sh', async () => {
  const { inspectZipEntries } = await import('../scripts/lib/zipBuilder.mjs');
  const macZipPath = path.join(rootDir, 'client', 'public', 'SonicWave-v1.0.0-macOS.zip');
  assert.ok(fs.existsSync(macZipPath), 'client/public/SonicWave-v1.0.0-macOS.zip must exist');

  const entries = inspectZipEntries(macZipPath);
  assert.strictEqual(entries.some((e) => /LandingPage\.jsx$/i.test(e.name)), false, 'macOS zip must exclude LandingPage.jsx');
  assert.strictEqual(entries.some((e) => /\.(exe|bat|dll)$/i.test(e.name)), false, 'macOS zip must exclude Windows binaries/scripts');

  const startSh = entries.find((e) => e.name === 'start.sh');
  assert.ok(startSh, 'macOS zip must include start.sh');
  assert.strictEqual(startSh.isExecutable, true, 'start.sh in macOS zip must be POSIX executable (0o755)');
});

test('M15 - electron main & preload expose dynamic port, GPU fallback flag, and tray controls', () => {
  const mainSrc = fs.readFileSync(path.join(rootDir, 'electron', 'main.js'), 'utf8');
  const preloadSrc = fs.readFileSync(path.join(rootDir, 'electron', 'preload.js'), 'utf8');

  assert.ok(mainSrc.includes('findAvailablePort'), 'main.js must dynamically locate a free backend port');
  assert.ok(mainSrc.includes('gpu-fallback.flag'), 'main.js must use crash-driven GPU fallback instead of unconditional disable');
  assert.ok(mainSrc.includes('child-process-gone'), 'main.js must listen for GPU child-process-gone');
  assert.ok(mainSrc.includes('createTray'), 'main.js must support native System Tray');
  assert.ok(mainSrc.includes('desktop:minimize-to-tray'), 'main.js must register desktop:minimize-to-tray IPC');

  for (const method of [
    'getDefaultDownloadsDir',
    'chooseDownloadFolder',
    'saveJobFile',
    'showItemInFolder',
    'getServerPort',
    'minimizeToTray',
    'getMinimizeToTray',
    'setMinimizeToTray',
    'getGpuMode'
  ]) {
    assert.ok(preloadSrc.includes(method), `preload.js must expose ${method}`);
  }
});

test('M15 - server startServer dynamically skips occupied ports via EADDRINUSE fallback', async () => {
  const { startServer } = require('../server/index');
  const blocker = net.createServer();

  await new Promise((resolve) => blocker.listen(0, resolve));
  const occupiedPort = blocker.address().port;

  let srv = null;
  try {
    srv = await startServer(occupiedPort);
    const actualPort = srv.address().port;
    assert.notStrictEqual(actualPort, occupiedPort, 'startServer must pick a fallback port when preferred port is busy');
    assert.ok(actualPort > 0, 'Bound fallback port must be valid');
  } finally {
    if (srv) {
      await new Promise((resolve) => srv.close(resolve));
    }
    await new Promise((resolve) => blocker.close(resolve));
  }
});
