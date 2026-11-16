const path = require('path');
const fs = require('fs');
const https = require('https');
const { execFileSync, execFile } = require('child_process');

const isWin = process.platform === 'win32';
const BIN_DIR = path.join(__dirname, 'bin');
const YT_DLP_NAME = isWin ? 'yt-dlp.exe' : 'yt-dlp';
const YT_DLP_PATH = path.join(BIN_DIR, YT_DLP_NAME);
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

  return status;
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
  getYtDlpPath,
  getFfmpegPath,
  getFfmpegLocation,
  getBinDir,
  cleanCorruptBinary,
  YT_DLP_PATH,
  BIN_DIR
};
