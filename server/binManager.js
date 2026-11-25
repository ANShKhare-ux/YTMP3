const path = require('path');
const fs = require('fs');
const https = require('https');
const { execFileSync, execFile } = require('child_process');

const isWin = process.platform === 'win32';
const BIN_DIR = path.join(__dirname, 'bin');
const YT_DLP_NAME = isWin ? 'yt-dlp.exe' : 'yt-dlp';
const YT_DLP_PATH = path.join(BIN_DIR, YT_DLP_NAME);
const ARIA2_NAME = isWin ? 'aria2c.exe' : 'aria2c';
const ARIA2_PATH = path.join(BIN_DIR, ARIA2_NAME);
const ARIA2_WIN_ZIP_URL = 'https://github.com/aria2/aria2/releases/download/release-1.37.0/aria2-1.37.0-win-64bit-build1.zip';
const YT_DLP_URL = isWin
  ? 'https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp.exe'
  : 'https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp';

let ffmpegPath = null;
try {
  ffmpegPath = require('ffmpeg-static');
} catch (err) {
  console.warn('ffmpeg-static require error, will check fallback paths:', err.message);
}

// Ensure bin directory exists
if (!fs.existsSync(BIN_DIR)) {
  fs.mkdirSync(BIN_DIR, { recursive: true });
}

/**
 * Downloads a file following redirects
 */
function downloadFile(url, dest) {
  return new Promise((resolve, reject) => {
    let file = fs.createWriteStream(dest);

    const cleanupAndReject = (err) => {
      try {
        file.close(() => {
          fs.unlink(dest, () => {});
        });
      } catch {
        fs.unlink(dest, () => {});
      }
      reject(err);
    };

    const get = (targetUrl) => {
      https.get(targetUrl, {
        headers: { 'User-Agent': 'Mozilla/5.0' }
      }, (response) => {
        if (response.statusCode >= 300 && response.statusCode < 400 && response.headers.location) {
          const redirectUrl = new URL(response.headers.location, targetUrl).href;
          return get(redirectUrl);
        }

        if (response.statusCode !== 200) {
          return cleanupAndReject(new Error(`Download failed with HTTP ${response.statusCode}`));
        }

        response.pipe(file);
        file.on('finish', () => {
          file.close(() => {
            if (!isWin) {
              try {
                fs.chmodSync(dest, 0o755);
              } catch {}
            }
            resolve(dest);
          });
        });
      }).on('error', (err) => {
        cleanupAndReject(err);
      });
    };

    get(url);
  });
}

/**
 * Detects and removes 0-byte corrupt binary files
 * @param {string} filePath
 * @returns {boolean} True if a 0-byte file was unlinked, false otherwise
 */
function cleanCorruptBinary(filePath) {
  if (fs.existsSync(filePath)) {
    try {
      if (fs.statSync(filePath).size === 0) {
        fs.unlinkSync(filePath);
        return true;
      }
    } catch {}
  }
  return false;
}

/**
 * Ensures yt-dlp and ffmpeg are ready
 * @param {Object} [options]
 * @param {boolean} [options.skipDownload=false]
 */
async function verifyBinaries(options = {}) {
  const status = {
    ytDlp: false,
    ytDlpVersion: null,
    ffmpeg: false,
    ffmpegVersion: null,
    aria2: false,
    aria2Version: null,
    downloader: 'builtin',
    binDir: BIN_DIR
  };

  // 1. Check / Download yt-dlp
  cleanCorruptBinary(YT_DLP_PATH);

  if (!fs.existsSync(YT_DLP_PATH) && !options.skipDownload) {
    console.log(`[binManager] ${YT_DLP_NAME} not found, downloading latest release...`);
    try {
      await downloadFile(YT_DLP_URL, YT_DLP_PATH);
      console.log(`[binManager] ${YT_DLP_NAME} downloaded successfully!`);
    } catch (err) {
      console.error(`[binManager] Failed to download ${YT_DLP_NAME}:`, err.message);
    }
  }

  if (fs.existsSync(YT_DLP_PATH)) {
    try {
      if (!isWin) {
        try { fs.chmodSync(YT_DLP_PATH, 0o755); } catch {}
      }
      const output = execFileSync(YT_DLP_PATH, ['--version'], { encoding: 'utf8' }).trim();
      status.ytDlp = true;
      status.ytDlpVersion = output;
      console.log(`[binManager] yt-dlp verified (v${output})`);
    } catch (err) {
      console.error('[binManager] yt-dlp execution error:', err.message);
    }
  }

  // 2. Check ffmpeg
  const localFfmpeg = path.join(BIN_DIR, isWin ? 'ffmpeg.exe' : 'ffmpeg');
  if (!fs.existsSync(localFfmpeg) && ffmpegPath && fs.existsSync(ffmpegPath)) {
    try {
      fs.copyFileSync(ffmpegPath, localFfmpeg);
      if (!isWin) {
        try { fs.chmodSync(localFfmpeg, 0o755); } catch {}
      }
      console.log(`[binManager] Copied ffmpeg-static to local bin/${path.basename(localFfmpeg)}`);
    } catch (copyErr) {
      console.warn('[binManager] Failed to copy ffmpeg-static:', copyErr.message);
    }
  }

  if (fs.existsSync(localFfmpeg)) {
    ffmpegPath = localFfmpeg;
  }

  if (ffmpegPath && fs.existsSync(ffmpegPath)) {
    try {
      if (!isWin) {
        try { fs.chmodSync(ffmpegPath, 0o755); } catch {}
      }
      const output = execFileSync(ffmpegPath, ['-version'], { encoding: 'utf8' }).split(/\r?\n/)[0].trim();
      status.ffmpeg = true;
      status.ffmpegVersion = output;
      console.log(`[binManager] ffmpeg verified: ${output}`);
    } catch (err) {
      console.error('[binManager] ffmpeg execution error:', err.message);
    }
  } else {
    // Check if system ffmpeg is available
    try {
      const output = execFileSync('ffmpeg', ['-version'], { encoding: 'utf8' }).split(/\r?\n/)[0].trim();
      ffmpegPath = 'ffmpeg';
      status.ffmpeg = true;
      status.ffmpegVersion = output;
      console.log(`[binManager] system ffmpeg verified: ${output}`);
    } catch {
      console.warn('[binManager] ffmpeg not found');
    }
  }

  // 3. Detect aria2c external accelerator (local bin/ first, then system PATH)
  cleanCorruptBinary(ARIA2_PATH);
  const aria2Candidates = fs.existsSync(ARIA2_PATH) ? [ARIA2_PATH, 'aria2c'] : ['aria2c'];
  for (const candidate of aria2Candidates) {
    try {
      const output = execFileSync(candidate, ['-v'], { encoding: 'utf8', timeout: 3000 })
        .split(/\r?\n/)[0]
        .trim();
      status.aria2 = true;
      status.aria2Version = output || 'aria2c';
      status.downloader = 'aria2c';
      break;
    } catch {}
  }

  return status;
}

function getAria2Path() {
  if (fs.existsSync(ARIA2_PATH)) return ARIA2_PATH;
  return null;
}

function installAria2() {
  return new Promise(async (resolve) => {
    cleanCorruptBinary(ARIA2_PATH);
    if (fs.existsSync(ARIA2_PATH)) {
      try {
        const ver = execFileSync(ARIA2_PATH, ['-v'], { encoding: 'utf8', timeout: 3000 }).split(/\r?\n/)[0].trim();
        return resolve({ success: true, version: ver, downloader: 'aria2c', alreadyInstalled: true });
      } catch {}
    }

    if (!isWin) {
      return resolve({
        success: false,
        error: 'Automatic aria2c provisioning is built-in for Windows x64; install via Homebrew/apt on macOS or Linux.'
      });
    }

    const tempZip = path.join(BIN_DIR, 'aria2-download.zip');
    const tempExtract = path.join(BIN_DIR, 'aria2-extract');
    try {
      await downloadFile(ARIA2_WIN_ZIP_URL, tempZip);
      if (fs.existsSync(tempExtract)) {
        fs.rmSync(tempExtract, { recursive: true, force: true });
      }
      fs.mkdirSync(tempExtract, { recursive: true });
      execFileSync(
        'powershell.exe',
        ['-NoProfile', '-NonInteractive', '-Command', 'Expand-Archive -Path $env:ARIA2_ZIP -DestinationPath $env:ARIA2_DEST -Force'],
        {
          env: { ...process.env, ARIA2_ZIP: tempZip, ARIA2_DEST: tempExtract },
          stdio: 'ignore',
          timeout: 30000
        }
      );

      const findBinary = (dir) => {
        for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
          const full = path.join(dir, entry.name);
          if (entry.isDirectory()) {
            const nested = findBinary(full);
            if (nested) return nested;
          } else if (entry.name.toLowerCase() === 'aria2c.exe') {
            return full;
          }
        }
        return null;
      };

      const extractedBin = findBinary(tempExtract);
      if (!extractedBin) {
        return resolve({ success: false, error: 'aria2c.exe was not found inside release archive.' });
      }
      fs.copyFileSync(extractedBin, ARIA2_PATH);
      const ver = execFileSync(ARIA2_PATH, ['-v'], { encoding: 'utf8', timeout: 3000 }).split(/\r?\n/)[0].trim();
      resolve({ success: true, version: ver, downloader: 'aria2c' });
    } catch (err) {
      resolve({ success: false, error: err.message || 'Failed to install aria2c.' });
    } finally {
      try { if (fs.existsSync(tempZip)) fs.unlinkSync(tempZip); } catch {}
      try { if (fs.existsSync(tempExtract)) fs.rmSync(tempExtract, { recursive: true, force: true }); } catch {}
    }
  });
}

function getYtDlpPath() {
  return YT_DLP_PATH;
}

function getFfmpegPath() {
  return ffmpegPath;
}

function getFfmpegLocation() {
  const localFfmpeg = path.join(BIN_DIR, isWin ? 'ffmpeg.exe' : 'ffmpeg');
  if (fs.existsSync(localFfmpeg)) return BIN_DIR;
  if (ffmpegPath && fs.existsSync(ffmpegPath)) return ffmpegPath;
  return null;
}

function getBinDir() {
  return BIN_DIR;
}

/**
 * Update yt-dlp binary via self-update
 */
function updateYtDlp() {
  return new Promise((resolve) => {
    if (!fs.existsSync(YT_DLP_PATH)) {
      return resolve({ success: false, message: 'yt-dlp binary not installed' });
    }
    execFile(YT_DLP_PATH, ['-U'], { encoding: 'utf8', timeout: 45000 }, (updateErr, updateStdout) => {
      if (updateErr) {
        return resolve({ success: false, error: updateErr.message });
      }
      execFile(YT_DLP_PATH, ['--version'], { encoding: 'utf8' }, (verErr, verStdout) => {
        const version = verErr ? null : (verStdout || '').trim();
        resolve({ success: true, output: (updateStdout || '').trim(), version });
      });
    });
  });
}

module.exports = {
  verifyBinaries,
  updateYtDlp,
  installAria2,
  getYtDlpPath,
  getFfmpegPath,
  getFfmpegLocation,
  getAria2Path,
  getBinDir,
  cleanCorruptBinary,
  YT_DLP_PATH,
  ARIA2_PATH,
  BIN_DIR
};
