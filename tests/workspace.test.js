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
  assert.strictEqual(pkg.license, 'MIT');
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
  assert.strictEqual(pkg.license, 'MIT');
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

test('workspace - legal & support pages and sitemap integrity', () => {
  const legalFiles = [
    'PrivacyPolicy.jsx',
    'TermsOfUse.jsx',
    'CopyrightPolicy.jsx',
    'ContactSupport.jsx',
    'LegalLayout.jsx',
    'useDocumentMetadata.js'
  ];
  for (const f of legalFiles) {
    const filePath = path.join(rootDir, 'client', 'src', 'components', 'legal', f);
    assert.ok(fs.existsSync(filePath), `Legal component ${f} must exist`);
  }

  const sitemapPath = path.join(rootDir, 'client', 'public', 'sitemap.xml');
  assert.ok(fs.existsSync(sitemapPath), 'sitemap.xml must exist');
  const sitemapContent = fs.readFileSync(sitemapPath, 'utf8');
  assert.ok(sitemapContent.includes('/privacy'), 'sitemap.xml must include /privacy');
  assert.ok(sitemapContent.includes('/terms'), 'sitemap.xml must include /terms');
  assert.ok(sitemapContent.includes('/copyright-acceptable-use'), 'sitemap.xml must include /copyright-acceptable-use');
  assert.ok(sitemapContent.includes('/contact'), 'sitemap.xml must include /contact');
  assert.ok(sitemapContent.includes('/install'), 'sitemap.xml must include /install');
  assert.ok(sitemapContent.includes('/supported-platforms'), 'sitemap.xml must include /supported-platforms');
  assert.ok(sitemapContent.includes('/troubleshooting'), 'sitemap.xml must include /troubleshooting');
});

test('workspace - documentation pages and routing integrity', () => {
  const docsFiles = [
    'InstallGuide.jsx',
    'SupportedPlatforms.jsx',
    'TroubleshootingGuide.jsx',
    'DocsLayout.jsx'
  ];
  for (const f of docsFiles) {
    const filePath = path.join(rootDir, 'client', 'src', 'components', 'docs', f);
    assert.ok(fs.existsSync(filePath), `Documentation component ${f} must exist`);
  }

  // Verify App.jsx router includes docs routes
  const appJsx = fs.readFileSync(path.join(rootDir, 'client', 'src', 'App.jsx'), 'utf8');
  assert.ok(appJsx.includes("pathname === '/install'"), 'App.jsx must route /install');
  assert.ok(appJsx.includes("pathname === '/supported-platforms'"), 'App.jsx must route /supported-platforms');
  assert.ok(appJsx.includes("pathname === '/troubleshooting'"), 'App.jsx must route /troubleshooting');

  // Verify pre-rendered index.html includes links to docs in header and footer
  const indexHtml = fs.readFileSync(path.join(rootDir, 'client', 'index.html'), 'utf8');
  assert.ok(indexHtml.includes('href="/install"'), 'index.html must link to /install');
  assert.ok(indexHtml.includes('href="/supported-platforms"'), 'index.html must link to /supported-platforms');
  assert.ok(indexHtml.includes('href="/troubleshooting"'), 'index.html must link to /troubleshooting');
  assert.ok(indexHtml.includes('<nav aria-label="Documentation and Legal Links">'), 'index.html must contain pre-rendered footer links');
});

test('workspace - favicon suite and social share assets integrity', () => {
  const publicDir = path.join(rootDir, 'client', 'public');
  const favIco = path.join(publicDir, 'favicon.ico');
  const fav96 = path.join(publicDir, 'favicon-96.png');
  const appleTouch = path.join(publicDir, 'apple-touch-icon.png');
  const ogShare = path.join(publicDir, 'og', 'sonicwave-share.png');
  const ogLegacy = path.join(publicDir, 'og-image.png');

  assert.ok(fs.existsSync(favIco), 'favicon.ico must exist');
  assert.ok(fs.existsSync(fav96), 'favicon-96.png must exist');
  assert.ok(fs.existsSync(appleTouch), 'apple-touch-icon.png must exist');
  assert.ok(fs.existsSync(ogShare), 'og/sonicwave-share.png must exist');
  assert.ok(fs.existsSync(ogLegacy), 'og-image.png must exist for backwards compatibility');

  // Verify non-empty files (> 1 KB)
  assert.ok(fs.statSync(favIco).size > 1024, 'favicon.ico must be a populated ICO bundle');
  assert.ok(fs.statSync(fav96).size > 1024, 'favicon-96.png must have valid non-empty image data');
  assert.ok(fs.statSync(appleTouch).size > 1024, 'apple-touch-icon.png must have valid non-empty image data');
  assert.ok(fs.statSync(ogShare).size > 50000, 'sonicwave-share.png must have valid rich preview data');

  // Verify PNG dimensions from IHDR header
  function readPngDimensions(filePath) {
    const buf = fs.readFileSync(filePath);
    assert.strictEqual(buf.subarray(0, 8).toString('hex'), '89504e470d0a1a0a', `${filePath} must be valid PNG`);
    return { width: buf.readUInt32BE(16), height: buf.readUInt32BE(20) };
  }

  assert.deepStrictEqual(readPngDimensions(fav96), { width: 96, height: 96 }, 'favicon-96.png must be 96x96');
  assert.deepStrictEqual(readPngDimensions(appleTouch), { width: 180, height: 180 }, 'apple-touch-icon.png must be 180x180');
  assert.deepStrictEqual(readPngDimensions(ogShare), { width: 1200, height: 630 }, 'sonicwave-share.png must be 1200x630');

  // Verify favicon.ico directory entry count
  const icoBuf = fs.readFileSync(favIco);
  assert.strictEqual(icoBuf.readUInt16LE(0), 0, 'ICO reserved must be 0');
  assert.strictEqual(icoBuf.readUInt16LE(2), 1, 'ICO type must be 1 (icon)');
  const imageCount = icoBuf.readUInt16LE(4);
  assert.strictEqual(imageCount, 3, 'favicon.ico must contain 3 embedded resolutions (16, 32, 48)');

  // Verify HTML metadata links
  const indexHtml = fs.readFileSync(path.join(rootDir, 'client', 'index.html'), 'utf8');
  assert.ok(indexHtml.includes('href="/favicon.ico"'), 'index.html must link favicon.ico');
  assert.ok(indexHtml.includes('href="/favicon-96.png"'), 'index.html must link favicon-96.png');
  assert.ok(indexHtml.includes('href="/apple-touch-icon.png"'), 'index.html must link apple-touch-icon.png');
  assert.ok(indexHtml.includes('/og/sonicwave-share.png'), 'index.html must point Open Graph to sonicwave-share.png');
});

test('workspace - download success dialogbox component and trigger integration', () => {
  const modalPath = path.join(rootDir, 'client', 'src', 'components', 'DownloadSuccessModal.jsx');
  assert.ok(fs.existsSync(modalPath), 'DownloadSuccessModal.jsx must exist in client components');

  const modalSrc = fs.readFileSync(modalPath, 'utf8');
  assert.ok(modalSrc.includes('export function triggerZipDownload'), 'must export triggerZipDownload helper');
  assert.ok(modalSrc.includes('export default function DownloadSuccessModal'), 'must export DownloadSuccessModal component');
  assert.ok(modalSrc.includes('Download Started!'), 'modal must contain Download Started header');
  assert.ok(modalSrc.includes('Extract the ZIP'), 'modal must include Step 1 extraction guide');
  assert.ok(modalSrc.includes('start.bat'), 'modal must include Step 2 start.bat launcher guide');
  assert.ok(modalSrc.includes('Windows Defender'), 'modal must provide SmartScreen guidance');

  // Verify LandingPage.jsx integration
  const landingSrc = fs.readFileSync(path.join(rootDir, 'client', 'src', 'components', 'LandingPage.jsx'), 'utf8');
  assert.ok(landingSrc.includes('DownloadSuccessModal'), 'LandingPage must import and render DownloadSuccessModal');
  assert.ok(landingSrc.includes('isDownloadSuccessOpen'), 'LandingPage must track isDownloadSuccessOpen state');
  assert.ok(landingSrc.includes('triggerZipDownload'), 'LandingPage must use triggerZipDownload');

  // Verify DocsLayout and LegalLayout integration
  const docsLayoutSrc = fs.readFileSync(path.join(rootDir, 'client', 'src', 'components', 'docs', 'DocsLayout.jsx'), 'utf8');
  assert.ok(docsLayoutSrc.includes('DownloadSuccessModal'), 'DocsLayout must integrate DownloadSuccessModal');
  const legalLayoutSrc = fs.readFileSync(path.join(rootDir, 'client', 'src', 'components', 'legal', 'LegalLayout.jsx'), 'utf8');
  assert.ok(legalLayoutSrc.includes('DownloadSuccessModal'), 'LegalLayout must integrate DownloadSuccessModal');
});



