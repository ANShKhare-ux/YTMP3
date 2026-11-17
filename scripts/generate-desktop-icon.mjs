import fs from 'fs';
import path from 'path';
import { execFileSync } from 'child_process';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');
const electronDir = path.join(rootDir, 'electron');
const tempDir = path.join(process.env.TEMP || 'C:\\Windows\\Temp', 'sonicwave-desktop-icon-gen');

if (!fs.existsSync(electronDir)) fs.mkdirSync(electronDir, { recursive: true });
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

function renderHtmlToPng(htmlContent, outputPath, width, height) {
  const uniqueId = `${width}x${height}-${Date.now()}`;
  const tempHtml = path.join(tempDir, `render-${uniqueId}.html`);
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
    `--screenshot=${outputPath}`,
    `file:///${tempHtml.replace(/\\/g, '/')}`
  ];

  execFileSync(chromeExe, args, { stdio: 'pipe', timeout: 30000 });
}

function resizePngWithPowerShell(inputPath, outputPath, size) {
  const psScript = `
Add-Type -AssemblyName System.Drawing
$img = [System.Drawing.Image]::FromFile('${inputPath.replace(/'/g, "''")}')
$bmp = New-Object System.Drawing.Bitmap(${size}, ${size})
$graph = [System.Drawing.Graphics]::FromImage($bmp)
$graph.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
$graph.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
$graph.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
$graph.DrawImage($img, 0, 0, ${size}, ${size})
$bmp.Save('${outputPath.replace(/'/g, "''")}', [System.Drawing.Imaging.ImageFormat]::Png)
$graph.Dispose()
$bmp.Dispose()
$img.Dispose()
`;
  execFileSync('powershell.exe', ['-NoProfile', '-NonInteractive', '-Command', psScript], {
    stdio: 'pipe',
    timeout: 30000
  });
}

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
    entry.writeUInt8(0, 2);
    entry.writeUInt8(0, 3);
    entry.writeUInt16LE(1, 4);
    entry.writeUInt16LE(32, 6);
    entry.writeUInt32LE(buffer.length, 8);
    entry.writeUInt32LE(currentOffset, 12);
    dirBuffers.push(entry);
    currentOffset += buffer.length;
  }

  return Buffer.concat([header, ...dirBuffers, ...pngEntries.map(e => e.buffer)]);
}

function getFaviconHtml(size, borderRadiusPercent = 20) {
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
      <radialGradient id="bgGlow" cx="50%" cy="35%" r="60%">
        <stop offset="0%" stop-color="#0f172a" />
        <stop offset="65%" stop-color="#070a12" />
        <stop offset="100%" stop-color="#030508" />
      </radialGradient>
      <linearGradient id="waveGrad" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stop-color="#00f5d4" />
        <stop offset="40%" stop-color="#00d2ff" />
        <stop offset="80%" stop-color="#0284c7" />
        <stop offset="100%" stop-color="#0369a1" />
      </linearGradient>
      <linearGradient id="apexGrad" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stop-color="#ffffff" />
        <stop offset="25%" stop-color="#38bdf8" />
        <stop offset="70%" stop-color="#00d2ff" />
        <stop offset="100%" stop-color="#0284c7" />
      </linearGradient>
      <linearGradient id="borderGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#38bdf8" stop-opacity="0.5" />
        <stop offset="50%" stop-color="#1e293b" stop-opacity="0.3" />
        <stop offset="100%" stop-color="#0284c7" stop-opacity="0.4" />
      </linearGradient>
    </defs>
    <rect x="${scale * 3}" y="${scale * 3}" width="${size - scale * 6}" height="${size - scale * 6}" rx="${rx}" fill="url(#bgGlow)" stroke="url(#borderGrad)" stroke-width="${Math.max(1, scale * 1.5)}" />
    <circle cx="${size / 2}" cy="${size / 2}" r="${size * 0.32}" fill="#00f5d4" opacity="0.12" />
    <rect x="${scale * 20}" y="${scale * 32}" width="${scale * 8}" height="${scale * 32}" rx="${scale * 4}" fill="url(#waveGrad)" />
    <rect x="${scale * 32}" y="${scale * 21}" width="${scale * 8}" height="${scale * 54}" rx="${scale * 4}" fill="url(#waveGrad)" />
    <rect x="${scale * 44}" y="${scale * 12}" width="${scale * 8}" height="${scale * 72}" rx="${scale * 4}" fill="url(#apexGrad)" />
    <rect x="${scale * 56}" y="${scale * 25}" width="${scale * 8}" height="${scale * 46}" rx="${scale * 4}" fill="url(#waveGrad)" />
    <rect x="${scale * 68}" y="${scale * 38}" width="${scale * 8}" height="${scale * 20}" rx="${scale * 4}" fill="url(#waveGrad)" />
  </svg>
</body>
</html>`;
}

console.log('[ICON] Generating high-resolution 256x256 desktop icon for Electron...');
const icon256Path = path.join(electronDir, 'icon.png');
renderHtmlToPng(getFaviconHtml(256, 20), icon256Path, 256, 256);

const ico16Path = path.join(tempDir, 'ico-16.png');
const ico32Path = path.join(tempDir, 'ico-32.png');
const ico48Path = path.join(tempDir, 'ico-48.png');

resizePngWithPowerShell(icon256Path, ico16Path, 16);
resizePngWithPowerShell(icon256Path, ico32Path, 32);
resizePngWithPowerShell(icon256Path, ico48Path, 48);

const icoBuffer = createIco([
  { width: 16, height: 16, buffer: fs.readFileSync(ico16Path) },
  { width: 32, height: 32, buffer: fs.readFileSync(ico32Path) },
  { width: 48, height: 48, buffer: fs.readFileSync(ico48Path) },
  { width: 256, height: 256, buffer: fs.readFileSync(icon256Path) }
]);

const iconIcoPath = path.join(electronDir, 'icon.ico');
fs.writeFileSync(iconIcoPath, icoBuffer);
console.log(`[ICON] Successfully generated electron/icon.ico (Includes 256px layer, ${(icoBuffer.length / 1024).toFixed(1)} KB)`);
