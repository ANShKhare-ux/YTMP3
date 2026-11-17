const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const rootDir = path.resolve(__dirname, '..');

test('electron - main process script exists and enforces security isolation', () => {
  const mainPath = path.join(rootDir, 'electron', 'main.js');
  assert.ok(fs.existsSync(mainPath), 'electron/main.js must exist');

  const mainSrc = fs.readFileSync(mainPath, 'utf8');
  assert.ok(mainSrc.includes('BrowserWindow'), 'main.js must instantiate BrowserWindow');
  assert.ok(mainSrc.includes('contextIsolation: true'), 'main.js must enforce contextIsolation: true');
  assert.ok(mainSrc.includes('nodeIntegration: false'), 'main.js must enforce nodeIntegration: false');
  assert.ok(mainSrc.includes('sandbox: true'), 'main.js must enforce sandbox: true');
  assert.ok(mainSrc.includes('startBackend'), 'main.js must orchestrate backend startup');
  assert.ok(mainSrc.includes('shell.openExternal'), 'main.js must delegate external URLs to default browser');
});

test('electron - preload script exists and exposes safe desktop API', () => {
  const preloadPath = path.join(rootDir, 'electron', 'preload.js');
  assert.ok(fs.existsSync(preloadPath), 'electron/preload.js must exist');

  const preloadSrc = fs.readFileSync(preloadPath, 'utf8');
  assert.ok(preloadSrc.includes('contextBridge.exposeInMainWorld'), 'preload.js must use contextBridge');
  assert.ok(preloadSrc.includes('sonicWaveDesktop'), 'preload.js must expose sonicWaveDesktop API');
});

test('electron - electron-builder.json configuration validity', () => {
  const configPath = path.join(rootDir, 'electron-builder.json');
  assert.ok(fs.existsSync(configPath), 'electron-builder.json must exist');

  const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
  assert.strictEqual(config.productName, 'SonicWave', 'Product name must be SonicWave');
  assert.ok(config.win, 'Windows packaging configuration must be defined');
  assert.ok(config.nsis, 'NSIS configuration must be defined');
  assert.strictEqual(config.nsis.createDesktopShortcut, true, 'NSIS must create desktop shortcut');
  assert.strictEqual(config.nsis.createStartMenuShortcut, true, 'NSIS must create start menu shortcut');
});

test('electron - scripts and packaging integration in root package.json', () => {
  const pkgPath = path.join(rootDir, 'package.json');
  const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));

  assert.ok(pkg.scripts['desktop:build'], 'package.json must define desktop:build');
  assert.ok(pkg.scripts['desktop'], 'package.json must define desktop launch script');
  assert.ok(pkg.scripts['package:exe'], 'package.json must define package:exe');
  assert.strictEqual(pkg.main, 'electron/main.js', 'package.json main must point to electron/main.js');
});

test('electron - desktop client build script exists', () => {
  const scriptPath = path.join(rootDir, 'scripts', 'build-desktop-client.mjs');
  assert.ok(fs.existsSync(scriptPath), 'scripts/build-desktop-client.mjs must exist');
});

test('electron - desktop high-resolution icon exists', () => {
  const iconPath = path.join(rootDir, 'electron', 'icon.ico');
  assert.ok(fs.existsSync(iconPath), 'electron/icon.ico must exist');
  assert.ok(fs.statSync(iconPath).size > 1024, 'electron/icon.ico must be populated with high-res layers');
});

test('electron - compiled windows executable exists in dist-electron', () => {
  const exePath = path.join(rootDir, 'dist-electron', 'win-unpacked', 'SonicWave.exe');
  assert.ok(fs.existsSync(exePath), 'dist-electron/win-unpacked/SonicWave.exe must exist');
});

test('electron - standalone setup installer exe exists in dist-electron', () => {
  const setupExePath = path.join(rootDir, 'dist-electron', 'SonicWave-Setup-1.0.0.exe');
  assert.ok(fs.existsSync(setupExePath), 'dist-electron/SonicWave-Setup-1.0.0.exe must exist');
  assert.ok(fs.statSync(setupExePath).size > 10000000, 'SonicWave-Setup-1.0.0.exe must be a valid populated installer');
});


