import fs from 'fs';
import path from 'path';
import { execFileSync } from 'child_process';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');
const publicDir = path.join(rootDir, 'client', 'public');
const ogDir = path.join(publicDir, 'og');
const tempDir = path.join(process.env.TEMP || 'C:\\Windows\\Temp', 'sonicwave-asset-gen');

if (!fs.existsSync(ogDir)) fs.mkdirSync(ogDir, { recursive: true });
if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir, { recursive: true });

// Chrome executable discovery
const chromePaths = [
  'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
  'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe',
  'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe'
];
const chromeExe = chromePaths.find(p => fs.existsSync(p));
if (!chromeExe) {
  throw new Error('Neither Chrome nor Edge was found for headless asset rendering.');
}
console.log(`[ASSETS] Using browser: ${chromeExe}`);

/**
 * Render an HTML string into a PNG of exact dimensions using Chrome Headless
 */
function renderHtmlToPng(htmlContent, outputPath, width, height) {
  const uniqueId = `${width}x${height}-${Date.now()}`;
  const tempHtml = path.join(tempDir, `render-${uniqueId}.html`);
  const tempPng = path.join(tempDir, `render-${uniqueId}.png`);
  const profileDir = path.join(tempDir, `profile-${uniqueId}`);

  fs.mkdirSync(profileDir, { recursive: true });
  fs.writeFileSync(tempHtml, htmlContent, 'utf8');

  const args = [
    '--headless=new',
    '--disable-gpu',
    '--no-sandbox',
    '--disable-extensions',
    `--user-data-dir=${profileDir}`,
    '--force-device-scale-factor=1',
    `--window-size=${width},${height}`,
    '--default-background-color=00000000',
    '--hide-scrollbars',
    `--screenshot=${tempPng}`,
    `file:///${tempHtml.replace(/\\/g, '/')}`
  ];

  execFileSync(chromeExe, args, { stdio: 'pipe', timeout: 30000 });

  if (!fs.existsSync(tempPng)) {
    throw new Error(`Failed to render PNG at ${outputPath}`);
  }

  // Copy to destination
  fs.copyFileSync(tempPng, outputPath);

  // Clean up
  try {
    fs.unlinkSync(tempHtml);
    fs.unlinkSync(tempPng);
    fs.rmSync(profileDir, { recursive: true, force: true });
  } catch {}

  console.log(`[RENDERED] ${path.relative(rootDir, outputPath)} (${width}x${height}, ${(fs.statSync(outputPath).size / 1024).toFixed(1)} KB)`);
}

/**
 * High-quality bicubic downsampling of PNG using Windows native GDI+
 */
function resizePngWithPowerShell(srcPath, destPath, targetSize) {
  const psCommand = `Add-Type -AssemblyName System.Drawing; ` +
    `$src = [System.Drawing.Image]::FromFile('${srcPath.replace(/'/g, "''")}'); ` +
    `$bmp = [System.Drawing.Bitmap]::new(${targetSize}, ${targetSize}); ` +
    `$g = [System.Drawing.Graphics]::FromImage($bmp); ` +
    `$g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias; ` +
    `$g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic; ` +
    `$g.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality; ` +
    `$g.DrawImage($src, 0, 0, ${targetSize}, ${targetSize}); ` +
    `$bmp.Save('${destPath.replace(/'/g, "''")}', [System.Drawing.Imaging.ImageFormat]::Png); ` +
    `$g.Dispose(); $bmp.Dispose(); $src.Dispose();`;

  execFileSync('powershell.exe', ['-NoProfile', '-Command', psCommand], { stdio: 'pipe' });
  console.log(`[RESIZED] ${path.relative(rootDir, destPath)} (${targetSize}x${targetSize})`);
}

/**
 * Encode multiple PNG buffers into a valid Windows multi-resolution .ICO binary file
 */
function createIco(pngEntries) {
  const count = pngEntries.length;
  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0); // reserved
  header.writeUInt16LE(1, 2); // type 1 = icon
  header.writeUInt16LE(count, 4); // count

  let currentOffset = 6 + (16 * count);
  const dirBuffers = [];

  for (const { width, height, buffer } of pngEntries) {
    const entry = Buffer.alloc(16);
    entry.writeUInt8(width >= 256 ? 0 : width, 0);
    entry.writeUInt8(height >= 256 ? 0 : height, 1);
    entry.writeUInt8(0, 2); // color count 0 = >= 8bpp
    entry.writeUInt8(0, 3); // reserved
    entry.writeUInt16LE(1, 4); // planes
    entry.writeUInt16LE(32, 6); // bpp
    entry.writeUInt32LE(buffer.length, 8); // size of image data
    entry.writeUInt32LE(currentOffset, 12); // offset of image data
    dirBuffers.push(entry);
    currentOffset += buffer.length;
  }

  return Buffer.concat([header, ...dirBuffers, ...pngEntries.map(e => e.buffer)]);
}

// -----------------------------------------------------------------------------
// 1. GENERATE FAVICON SVG & HTML TEMPLATES
// -----------------------------------------------------------------------------

function getFaviconHtml(size, borderRadiusPercent = 22) {
  // 5 Waveform bars geometry
  const scale = size / 96;
  const rx = Math.round(size * (borderRadiusPercent / 100));

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    html, body { width: ${size}px; height: ${size}px; overflow: hidden; background: transparent; }
    svg { display: block; width: ${size}px; height: ${size}px; }
  </style>
</head>
<body>
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size} ${size}" fill="none">
    <defs>
      <!-- Squircle Radial Lighting -->
      <radialGradient id="bgGlow" cx="50%" cy="35%" r="60%">
        <stop offset="0%" stop-color="#0f172a" />
        <stop offset="65%" stop-color="#070a12" />
        <stop offset="100%" stop-color="#030508" />
      </radialGradient>

      <!-- Waveform Cyan-to-Blue Linear Gradient -->
      <linearGradient id="waveGrad" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stop-color="#00f5d4" />
        <stop offset="40%" stop-color="#00d2ff" />
        <stop offset="80%" stop-color="#0284c7" />
        <stop offset="100%" stop-color="#0369a1" />
      </linearGradient>

      <!-- Center Peak Highlight Gradient -->
      <linearGradient id="apexGrad" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stop-color="#ffffff" />
        <stop offset="25%" stop-color="#38bdf8" />
        <stop offset="70%" stop-color="#00d2ff" />
        <stop offset="100%" stop-color="#0284c7" />
      </linearGradient>

      <!-- Border Stroke Gradient -->
      <linearGradient id="borderGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#38bdf8" stop-opacity="0.5" />
        <stop offset="50%" stop-color="#1e293b" stop-opacity="0.3" />
        <stop offset="100%" stop-color="#0284c7" stop-opacity="0.4" />
      </linearGradient>
    </defs>

    <!-- Base Squircle Surface -->
    <rect x="${scale * 3}" y="${scale * 3}" width="${size - scale * 6}" height="${size - scale * 6}" rx="${rx}" fill="url(#bgGlow)" stroke="url(#borderGrad)" stroke-width="${Math.max(1, scale * 1.5)}" />

    <!-- Ambient Sound Aura -->
    <circle cx="${size / 2}" cy="${size / 2}" r="${size * 0.32}" fill="#00f5d4" opacity="0.12" filter="blur(${scale * 4}px)" />

    <!-- 5 Balanced Acoustic Waveform Bars -->
    <!-- Bar 1 (Left Low) -->
    <rect x="${scale * 20}" y="${scale * 32}" width="${scale * 8}" height="${scale * 32}" rx="${scale * 4}" fill="url(#waveGrad)" />

    <!-- Bar 2 (Mid-Left Rise) -->
    <rect x="${scale * 32}" y="${scale * 21}" width="${scale * 8}" height="${scale * 54}" rx="${scale * 4}" fill="url(#waveGrad)" />

    <!-- Bar 3 (Center Apex Peak) -->
    <rect x="${scale * 44}" y="${scale * 12}" width="${scale * 8}" height="${scale * 72}" rx="${scale * 4}" fill="url(#apexGrad)" />

    <!-- Bar 4 (Mid-Right Energetic) -->
    <rect x="${scale * 56}" y="${scale * 24}" width="${scale * 8}" height="${scale * 48}" rx="${scale * 4}" fill="url(#waveGrad)" />

    <!-- Bar 5 (Right Tail) -->
    <rect x="${scale * 68}" y="${scale * 35}" width="${scale * 8}" height="${scale * 26}" rx="${scale * 4}" fill="url(#waveGrad)" />
  </svg>
</body>
</html>`;
}

// -----------------------------------------------------------------------------
// 2. GENERATE SHARE PREVIEW IMAGE (1200x630) HTML TEMPLATE
// -----------------------------------------------------------------------------

function getSharePreviewHtml() {
  // Pre-generate 28 spectrum bar heights for authentic equalizer rhythm
  const spectrumHeights = [
    32, 45, 68, 52, 85, 95, 76, 62, 90, 100, 84, 70, 92, 78, 65, 88, 72, 58, 80, 94, 68, 54, 76, 60, 48, 38, 28, 20
  ];

  const barsHtml = spectrumHeights.map((h, i) => {
    const isActive = i < 14;
    const bg = isActive
      ? 'linear-gradient(180deg, #38bdf8 0%, #00f5d4 50%, #0284c7 100%)'
      : 'rgba(255, 255, 255, 0.12)';
    const shadow = isActive ? 'box-shadow: 0 0 10px rgba(0, 245, 212, 0.4);' : '';
    return `<div style="flex:1;height:${h}%;background:${bg};border-radius:3px;min-width:6px;${shadow}transition:height 0.2s ease;"></div>`;
  }).join('');

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    html, body {
      width: 1200px;
      height: 630px;
      overflow: hidden;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "SF Pro Display", Inter, sans-serif;
      background: #030509;
      color: #f8fafc;
      -webkit-font-smoothing: antialiased;
    }

    .canvas-wrap {
      position: relative;
      width: 1200px;
      height: 630px;
      padding: 56px 64px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 48px;
      background:
        radial-gradient(circle at 82% 45%, rgba(6, 182, 212, 0.18) 0%, transparent 48%),
        radial-gradient(circle at 20% 20%, rgba(99, 102, 241, 0.14) 0%, transparent 42%),
        radial-gradient(circle at 50% 90%, rgba(14, 165, 233, 0.10) 0%, transparent 50%),
        #030509;
    }

    /* Subtle grid overlay */
    .grid-pattern {
      position: absolute;
      inset: 0;
      background-image:
        linear-gradient(to right, rgba(255, 255, 255, 0.035) 1px, transparent 1px),
        linear-gradient(to bottom, rgba(255, 255, 255, 0.035) 1px, transparent 1px);
      background-size: 36px 36px;
      pointer-events: none;
    }

    /* Framing hairline border */
    .frame-border {
      position: absolute;
      inset: 0;
      border: 1px solid rgba(255, 255, 255, 0.12);
      box-shadow: inset 0 0 80px rgba(0, 0, 0, 0.6);
      pointer-events: none;
    }

    /* Left Content Column */
    .left-col {
      position: relative;
      z-index: 2;
      flex: 1.1;
      display: flex;
      flex-direction: column;
      gap: 22px;
      max-width: 540px;
    }

    /* Eyebrow badge */
    .pill-badge {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      background: rgba(15, 23, 42, 0.85);
      border: 1px solid rgba(56, 189, 248, 0.35);
      border-radius: 9999px;
      padding: 6px 14px;
      width: fit-content;
      box-shadow: 0 2px 12px rgba(6, 182, 212, 0.12);
    }
    .pill-dot {
      width: 7px;
      height: 7px;
      border-radius: 50%;
      background: #00f5a0;
      box-shadow: 0 0 8px #00f5a0;
    }
    .pill-text {
      font-size: 11.5px;
      font-weight: 600;
      letter-spacing: 0.8px;
      text-transform: uppercase;
      color: #7dd3fc;
    }

    /* Brand Header Lockup */
    .brand-lockup {
      display: flex;
      align-items: center;
      gap: 16px;
    }
    .brand-emblem {
      width: 52px;
      height: 52px;
      border-radius: 14px;
      background: linear-gradient(135deg, #0f172a 0%, #070a12 100%);
      border: 1.5px solid rgba(56, 189, 248, 0.4);
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 4px 20px rgba(6, 182, 212, 0.25);
    }
    .brand-name {
      font-size: 52px;
      font-weight: 800;
      letter-spacing: -2px;
      line-height: 1;
      color: #ffffff;
    }

    /* Title & Descriptor */
    .title-headline {
      font-size: 32px;
      font-weight: 700;
      line-height: 1.18;
      letter-spacing: -0.9px;
      color: #f1f5f9;
    }
    .title-headline span {
      background: linear-gradient(90deg, #38bdf8 0%, #818cf8 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
    }

    .desc-text {
      font-size: 15.5px;
      font-weight: 400;
      line-height: 1.55;
      color: #94a3b8;
    }

    /* Feature Pills */
    .feature-strip {
      display: flex;
      flex-wrap: wrap;
      gap: 9px;
      margin-top: 4px;
    }
    .feature-tag {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      background: rgba(15, 23, 42, 0.7);
      border: 1px solid rgba(255, 255, 255, 0.12);
      padding: 6px 12px;
      border-radius: 8px;
      font-size: 12.5px;
      font-weight: 500;
      color: #cbd5e1;
    }
    .feature-tag strong {
      color: #38bdf8;
      font-weight: 600;
    }

    /* Right Preview Window Card */
    .right-col {
      position: relative;
      z-index: 2;
      flex: 1;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .window-card {
      width: 480px;
      background: rgba(11, 15, 25, 0.92);
      border: 1px solid rgba(56, 189, 248, 0.3);
      border-radius: 16px;
      overflow: hidden;
      box-shadow:
        0 24px 60px rgba(0, 0, 0, 0.85),
        0 0 35px rgba(6, 182, 212, 0.15),
        inset 0 1px 0 rgba(255, 255, 255, 0.1);
    }

    .window-bar {
      height: 38px;
      background: rgba(15, 23, 42, 0.95);
      border-bottom: 1px solid rgba(255, 255, 255, 0.08);
      display: flex;
      align-items: center;
      padding: 0 14px;
      gap: 8px;
    }
    .dot { width: 9px; height: 9px; border-radius: 50%; }
    .dot-red { background: #ef4444; }
    .dot-yellow { background: #eab308; }
    .dot-green { background: #22c55e; }
    .window-title {
      margin-left: 8px;
      font-size: 11px;
      font-family: ui-monospace, Menlo, monospace;
      color: #94a3b8;
      letter-spacing: -0.2px;
    }
    .window-status-pill {
      margin-left: auto;
      font-size: 10px;
      font-family: ui-monospace, Menlo, monospace;
      font-weight: 600;
      color: #38bdf8;
      background: rgba(56, 189, 248, 0.12);
      border: 1px solid rgba(56, 189, 248, 0.3);
      padding: 2px 7px;
      border-radius: 4px;
    }

    .window-content {
      padding: 22px;
      display: flex;
      flex-direction: column;
      gap: 16px;
    }

    .track-meta-row {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      gap: 12px;
    }
    .track-title {
      font-size: 17px;
      font-weight: 700;
      color: #ffffff;
      letter-spacing: -0.3px;
    }
    .track-sub {
      font-size: 12px;
      color: #94a3b8;
      margin-top: 3px;
    }
    .track-badge {
      font-size: 11px;
      font-family: ui-monospace, Menlo, monospace;
      font-weight: 600;
      color: #00f5a0;
      background: rgba(0, 245, 160, 0.12);
      border: 1px solid rgba(0, 245, 160, 0.3);
      padding: 3px 8px;
      border-radius: 5px;
      white-space: nowrap;
    }

    .spectrum-panel {
      height: 78px;
      background: rgba(3, 7, 18, 0.7);
      border: 1px solid rgba(255, 255, 255, 0.08);
      border-radius: 10px;
      padding: 10px 12px;
      display: flex;
      align-items: flex-end;
      gap: 5px;
    }

    .progress-bar-wrap {
      display: flex;
      flex-direction: column;
      gap: 6px;
    }
    .progress-rail {
      width: 100%;
      height: 5px;
      background: rgba(255, 255, 255, 0.1);
      border-radius: 9999px;
      position: relative;
    }
    .progress-fill {
      width: 52%;
      height: 100%;
      background: linear-gradient(90deg, #00f5d4, #38bdf8);
      border-radius: 9999px;
      position: relative;
      box-shadow: 0 0 10px rgba(56, 189, 248, 0.6);
    }
    .progress-knob {
      position: absolute;
      right: -4px;
      top: -3.5px;
      width: 12px;
      height: 12px;
      border-radius: 50%;
      background: #ffffff;
      box-shadow: 0 0 8px #38bdf8;
    }
    .progress-times {
      display: flex;
      justify-content: space-between;
      font-size: 11px;
      font-family: ui-monospace, Menlo, monospace;
      color: #64748b;
    }

    .platforms-footer {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding-top: 10px;
      border-top: 1px solid rgba(255, 255, 255, 0.08);
      font-size: 11px;
      color: #94a3b8;
    }
    .platform-chips {
      display: flex;
      gap: 6px;
    }
    .chip {
      background: rgba(255, 255, 255, 0.06);
      border-radius: 4px;
      padding: 2px 6px;
      font-size: 10.5px;
      color: #cbd5e1;
    }
  </style>
</head>
<body>
  <div class="canvas-wrap">
    <div class="grid-pattern"></div>
    <div class="frame-border"></div>

    <!-- Left Branding & Descriptors -->
    <div class="left-col">
      <div class="pill-badge">
        <span class="pill-dot"></span>
        <span class="pill-text">WINDOWS 11 &amp; 10 · 64-BIT NATIVE · AD-FREE</span>
      </div>

      <div class="brand-lockup">
        <div class="brand-emblem">
          <svg width="34" height="34" viewBox="0 0 48 48" fill="none">
            <rect x="7" y="19" width="4" height="15" rx="2" fill="#00f5d4" />
            <rect x="15" y="11" width="4" height="28" rx="2" fill="#00d2ff" />
            <rect x="23" y="6" width="4" height="36" rx="2" fill="#ffffff" />
            <rect x="31" y="13" width="4" height="24" rx="2" fill="#00d2ff" />
            <rect x="39" y="19" width="4" height="13" rx="2" fill="#0284c7" />
          </svg>
        </div>
        <h1 class="brand-name">SonicWave</h1>
      </div>

      <div class="title-headline">
        Windows Media Downloader<br>
        <span>&amp; Offline Audio Player</span>
      </div>

      <p class="desc-text">
        High-performance local media converter powered by 16-stream parallel acceleration, 320 kbps MP3 &amp; 1080p MP4 extraction, and local FFmpeg engine.
      </p>

      <div class="feature-strip">
        <div class="feature-tag">⚡ <strong>16-Stream</strong> Turbo</div>
        <div class="feature-tag">🎧 <strong>320 kbps</strong> MP3</div>
        <div class="feature-tag">🎬 <strong>1080p</strong> MP4</div>
        <div class="feature-tag">🛡️ <strong>100% Local</strong> PC</div>
        <div class="feature-tag">🏷️ <strong>ID3</strong> Tags</div>
      </div>
    </div>

    <!-- Right Floating Application Card Preview -->
    <div class="right-col">
      <div class="window-card">
        <div class="window-bar">
          <div class="dot dot-red"></div>
          <div class="dot dot-yellow"></div>
          <div class="dot dot-green"></div>
          <span class="window-title">SonicWave Desktop — 16x Turbo</span>
          <span class="window-status-pill">● ACTIVE 16-STREAM</span>
        </div>

        <div class="window-content">
          <div class="track-meta-row">
            <div>
              <div class="track-title">Synthwave Odyssey — Neon Horizon</div>
              <div class="track-sub">Embedded ID3 Tags &bull; High-Res Album Art</div>
            </div>
            <span class="track-badge">MP3 &bull; 320 kbps</span>
          </div>

          <!-- Live Visualizer Spectrum -->
          <div class="spectrum-panel">
            ${barsHtml}
          </div>

          <!-- Progress Scrubber -->
          <div class="progress-bar-wrap">
            <div class="progress-rail">
              <div class="progress-fill">
                <div class="progress-knob"></div>
              </div>
            </div>
            <div class="progress-times">
              <span>01:34 (52%)</span>
              <span>03:04 &bull; 16.4 MiB/s</span>
            </div>
          </div>

          <!-- Supported Platforms Chips -->
          <div class="platforms-footer">
            <span>Supported Extraction Engines:</span>
            <div class="platform-chips">
              <span class="chip">YouTube</span>
              <span class="chip">SoundCloud</span>
              <span class="chip">Instagram</span>
              <span class="chip">TikTok</span>
              <span class="chip">1,000+</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</body>
</html>`;
}

// -----------------------------------------------------------------------------
// 3. EXECUTE GENERATION
// -----------------------------------------------------------------------------

async function main() {
  console.log('==================================================');
  console.log('   SonicWave Favicon & Social Share Generator');
  console.log('==================================================');

  // A. High-res Master Icon 256x256 (crisp vector render for icons)
  const masterIconPath = path.join(tempDir, 'icon-master-256.png');
  renderHtmlToPng(getFaviconHtml(256, 20), masterIconPath, 256, 256);

  // B. Apple Touch Icon 180x180 downsampled from master
  const applePath = path.join(publicDir, 'apple-touch-icon.png');
  resizePngWithPowerShell(masterIconPath, applePath, 180);

  // C. Favicon 96x96 downsampled from master
  const fav96Path = path.join(publicDir, 'favicon-96.png');
  resizePngWithPowerShell(masterIconPath, fav96Path, 96);

  // D. ICO intermediate sizes (16, 32, 48) via high-quality bicubic downsampling
  const ico16Path = path.join(tempDir, 'favicon-16.png');
  const ico32Path = path.join(tempDir, 'favicon-32.png');
  const ico48Path = path.join(tempDir, 'favicon-48.png');

  resizePngWithPowerShell(masterIconPath, ico16Path, 16);
  resizePngWithPowerShell(masterIconPath, ico32Path, 32);
  resizePngWithPowerShell(masterIconPath, ico48Path, 48);

  const png16Buf = fs.readFileSync(ico16Path);
  const png32Buf = fs.readFileSync(ico32Path);
  const png48Buf = fs.readFileSync(ico48Path);

  const icoBuffer = createIco([
    { width: 16, height: 16, buffer: png16Buf },
    { width: 32, height: 32, buffer: png32Buf },
    { width: 48, height: 48, buffer: png48Buf }
  ]);

  const faviconIcoPath = path.join(publicDir, 'favicon.ico');
  fs.writeFileSync(faviconIcoPath, icoBuffer);
  console.log(`[GENERATED] client/public/favicon.ico (Multi-size: 16, 32, 48 px, ${(icoBuffer.length / 1024).toFixed(1)} KB)`);

  // E. Share Preview Image (1200x630)
  const shareImgPath = path.join(ogDir, 'sonicwave-share.png');
  renderHtmlToPng(getSharePreviewHtml(), shareImgPath, 1200, 630);

  // Also preserve og-image.png as backup for backwards compatibility
  const legacyOgPath = path.join(publicDir, 'og-image.png');
  fs.copyFileSync(shareImgPath, legacyOgPath);
  console.log(`[SYNCED] client/public/og-image.png mirrored from share preview.`);

  // Cleanup temp files
  try {
    fs.rmSync(tempDir, { recursive: true, force: true });
  } catch {}

  console.log('==================================================');
  console.log('   All image assets generated successfully!');
  console.log('==================================================');
}

main().catch(err => {
  console.error('[ERROR]', err);
  process.exit(1);
});
