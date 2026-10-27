const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const rootDir = path.resolve(__dirname, '..');

test('workspace - root package.json configuration', () => {
  const rootPkgPath = path.join(rootDir, 'package.json');
  assert.ok(fs.existsSync(rootPkgPath), 'Root package.json must exist');
  const pkg = JSON.parse(fs.readFileSync(rootPkgPath, 'utf8'));
  assert.strictEqual(pkg.name, 'ytmp3-converter');
  assert.deepStrictEqual(pkg.workspaces, ['client', 'server']);
  assert.ok(pkg.scripts.start, 'Root start script must be defined');
  assert.ok(pkg.scripts.build, 'Root build script must be defined');
  assert.ok(pkg.scripts.test, 'Root test script must be defined');
});

test('workspace - client package.json configuration', () => {
  const clientPkgPath = path.join(rootDir, 'client', 'package.json');
  assert.ok(fs.existsSync(clientPkgPath), 'Client package.json must exist');
  const pkg = JSON.parse(fs.readFileSync(clientPkgPath, 'utf8'));
  assert.strictEqual(pkg.type, 'module', 'Client should be ESM');
  assert.ok(pkg.dependencies.react, 'React must be in client dependencies');
  assert.ok(pkg.devDependencies.vite, 'Vite must be in devDependencies');
});

test('workspace - server package.json configuration', () => {
  const serverPkgPath = path.join(rootDir, 'server', 'package.json');
  assert.ok(fs.existsSync(serverPkgPath), 'Server package.json must exist');
  const pkg = JSON.parse(fs.readFileSync(serverPkgPath, 'utf8'));
  assert.strictEqual(pkg.name, 'ytmp3-server');
  assert.ok(pkg.dependencies.express, 'Express must be in server dependencies');
  assert.ok(pkg.dependencies.cors, 'CORS must be in server dependencies');
});

test('workspace - vercel.json configuration', () => {
  const vercelPath = path.join(rootDir, 'vercel.json');
  assert.ok(fs.existsSync(vercelPath), 'vercel.json must exist');
  const config = JSON.parse(fs.readFileSync(vercelPath, 'utf8'));
  assert.strictEqual(config.outputDirectory, 'client/dist');
  assert.strictEqual(config.framework, 'vite');
});

test('workspace - packaging script scripts/package-desktop.mjs exists', () => {
  const scriptPath = path.join(rootDir, 'scripts', 'package-desktop.mjs');
  assert.ok(fs.existsSync(scriptPath), 'Desktop packaging script must exist');
});

test('workspace - GitHub Actions CI workflow exists', () => {
  const ciPath = path.join(rootDir, '.github', 'workflows', 'test.yml');
  assert.ok(fs.existsSync(ciPath), 'GitHub Actions workflow file must exist');
  const content = fs.readFileSync(ciPath, 'utf8');
  assert.ok(content.includes('npm test'), 'CI workflow must execute npm test');
});

test('workspace - LICENSE file exists', () => {
  const licensePath = path.join(rootDir, 'LICENSE');
  assert.ok(fs.existsSync(licensePath), 'LICENSE file must exist');
});

