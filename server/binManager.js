const path = require('path');
const fs = require('fs');
const https = require('https');
const { execSync } = require('child_process');

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
    const file = fs.createWriteStream(dest);

    const get = (targetUrl) => {
      https.get(targetUrl, {
        headers: { 'User-Agent': 'Mozilla/5.0' }
      }, (response) => {
        if (response.statusCode >= 300 && response.statusCode < 400 && response.headers.location) {
          return get(response.headers.location);
        }

        if (response.statusCode !== 200) {
          return reject(new Error(`Download failed with HTTP ${response.statusCode}`));
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
        fs.unlink(dest, () => {});
        reject(err);
      });
    };

    get(url);
  });
}

/**
 * Ensures yt-dlp and ffmpeg are ready
 */
async function verifyBinaries() {
  const status = {
    ytDlp: false,
    ytDlpVersion: null,
    ffmpeg: false,
    ffmpegVersion: null,
    binDir: BIN_DIR
  };

  // 1. Check / Download yt-dlp
  if (!fs.existsSync(YT_DLP_PATH)) {
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
      const output = execSync(`"${YT_DLP_PATH}" --version`, { encoding: 'utf8' }).trim();
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
      const output = execSync(`"${ffmpegPath}" -version`, { encoding: 'utf8' }).split('\n')[0];
      status.ffmpeg = true;
      status.ffmpegVersion = output;
      console.log(`[binManager] ffmpeg verified: ${output}`);
    } catch (err) {
      console.error('[binManager] ffmpeg execution error:', err.message);
    }
  } else {
    // Check if system ffmpeg is available
    try {
      const output = execSync('ffmpeg -version', { encoding: 'utf8' }).split('\n')[0];
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

module.exports = {
  verifyBinaries,
  getYtDlpPath,
  getFfmpegPath,
  getFfmpegLocation,
  getBinDir,
  YT_DLP_PATH,
  BIN_DIR
};
