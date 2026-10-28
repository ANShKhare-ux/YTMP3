const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const rootDir = path.resolve(__dirname, '..');

test('analytics - client/src/utils/analytics.js module structure and exports', () => {
  const analyticsPath = path.join(rootDir, 'client', 'src', 'utils', 'analytics.js');
  assert.ok(fs.existsSync(analyticsPath), 'client/src/utils/analytics.js must exist');

  const content = fs.readFileSync(analyticsPath, 'utf8');
  assert.ok(content.includes('export function recordAnalyticsEvent'), 'Must export recordAnalyticsEvent');
  assert.ok(content.includes('export function trackAppDownload'), 'Must export trackAppDownload');
  assert.ok(content.includes('export function trackDownloadIntent'), 'Must export trackDownloadIntent');
  assert.ok(content.includes("'app_download'"), 'Must track app_download event name');
  assert.ok(content.includes("'app_download_intent'"), 'Must track app_download_intent event name');
});

test('analytics - LandingPage.jsx hooks download success metrics and intents across all touchpoints', () => {
  const landingPath = path.join(rootDir, 'client', 'src', 'components', 'LandingPage.jsx');
  const content = fs.readFileSync(landingPath, 'utf8');

  // Verify import
  assert.ok(content.includes("from '../utils/analytics'"), 'LandingPage.jsx must import from ../utils/analytics');
  assert.ok(content.includes('trackAppDownload'), 'LandingPage.jsx must reference trackAppDownload');
  assert.ok(content.includes('trackDownloadIntent'), 'LandingPage.jsx must reference trackDownloadIntent');

  // Verify intent tracking on buttons
  assert.ok(content.includes("handleDownloadClick(e, 'nav_header')"), 'Nav header must pass nav_header intent');
  assert.ok(content.includes("handleDownloadClick(e, 'mobile_nav')"), 'Mobile nav drawer must pass mobile_nav intent');
  assert.ok(content.includes("handleDownloadClick(e, 'hero_cta')"), 'Hero section must pass hero_cta intent');
  assert.ok(content.includes("handleDownloadClick(e, 'preview_cta')"), 'Interactive preview must pass preview_cta intent');
  assert.ok(content.includes("handleDownloadClick(e, 'bottom_cta')"), 'Bottom CTA must pass bottom_cta intent');

  // Verify modal download success metric
  assert.ok(
    content.includes("trackAppDownload({ source: 'modal_primary' })"),
    'Modal primary download button must track app_download with source modal_primary'
  );

  // Verify footer direct download link
  assert.ok(
    content.includes("trackAppDownload({ source: 'footer_link' })"),
    'Footer direct zip link must track app_download with source footer_link'
  );
});

test('analytics - Docs and Legal layouts track download actions', () => {
  const docsLayoutPath = path.join(rootDir, 'client', 'src', 'components', 'docs', 'DocsLayout.jsx');
  const docsContent = fs.readFileSync(docsLayoutPath, 'utf8');
  assert.ok(
    docsContent.includes("trackAppDownload({ source: 'docs_header' })"),
    'DocsLayout header download button must track app_download with source docs_header'
  );

  const legalLayoutPath = path.join(rootDir, 'client', 'src', 'components', 'legal', 'LegalLayout.jsx');
  const legalContent = fs.readFileSync(legalLayoutPath, 'utf8');
  assert.ok(
    legalContent.includes("trackAppDownload({ source: 'legal_header' })"),
    'LegalLayout header download button must track app_download with source legal_header'
  );

  const installGuidePath = path.join(rootDir, 'client', 'src', 'components', 'docs', 'InstallGuide.jsx');
  const installContent = fs.readFileSync(installGuidePath, 'utf8');
  assert.ok(
    installContent.includes("trackAppDownload({ source: 'install_guide_step1' })"),
    'InstallGuide step 1 link must track app_download with source install_guide_step1'
  );
});

test('analytics - pre-rendered index.html fallback contains inline analytics hooks', () => {
  const indexHtmlPath = path.join(rootDir, 'client', 'index.html');
  const content = fs.readFileSync(indexHtmlPath, 'utf8');

  assert.ok(
    content.includes("data:{source:'prerendered_nav'}"),
    'Pre-rendered nav download link must contain analytics fallback'
  );
  assert.ok(
    content.includes("data:{source:'prerendered_hero'}"),
    'Pre-rendered hero download link must contain analytics fallback'
  );
});

test('analytics - server/index.js provides /api/metrics/event endpoint', () => {
  const serverIndexPath = path.join(rootDir, 'server', 'index.js');
  const content = fs.readFileSync(serverIndexPath, 'utf8');

  assert.ok(content.includes('/api/metrics/event'), 'Server must provide /api/metrics/event endpoint');
  assert.ok(content.includes('app_download'), 'Server endpoint must acknowledge app_download events');
});
