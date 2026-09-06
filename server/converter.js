const { spawn, execFile } = require('child_process');
const path = require('path');
const fs = require('fs');
const { getYtDlpPath, getFfmpegPath, getFfmpegLocation, getBinDir } = require('./binManager');

const DOWNLOADS_DIR = path.join(__dirname, 'downloads');
if (!fs.existsSync(DOWNLOADS_DIR)) {
  fs.mkdirSync(DOWNLOADS_DIR, { recursive: true });
}

// Clean up files older than 2 hours every 30 minutes to prevent disk exhaustion
function cleanOldDownloads() {
  try {
    const now = Date.now();
    const maxAge = 2 * 60 * 60 * 1000;
    const files = fs.readdirSync(DOWNLOADS_DIR);
    for (const file of files) {
      const fullPath = path.join(DOWNLOADS_DIR, file);
      try {
        const stats = fs.statSync(fullPath);
        if (now - stats.mtimeMs > maxAge) {
          fs.unlinkSync(fullPath);
        }
      } catch {}
    }
  } catch {}
}
setInterval(cleanOldDownloads, 30 * 60 * 1000);

// In-memory active jobs tracker
const jobs = new Map();

/**
 * Format seconds into HH:MM:SS or MM:SS
 */
function formatDuration(seconds) {
  if (!seconds || isNaN(seconds)) return '0:00';
  const sec = Math.floor(seconds % 60);
  const min = Math.floor((seconds / 60) % 60);
  const hrs = Math.floor(seconds / 3600);
  const pad = (n) => n.toString().padStart(2, '0');
  if (hrs > 0) {
    return `${hrs}:${pad(min)}:${pad(sec)}`;
  }
  return `${min}:${pad(sec)}`;
}

/**
 * Detect social media platform from URL
 */
function detectPlatform(url) {
  const lower = url.toLowerCase();
  if (lower.includes('youtube.com') || lower.includes('youtu.be')) return 'YouTube';
  if (lower.includes('instagram.com') || lower.includes('instagr.am')) return 'Instagram';
  if (lower.includes('tiktok.com')) return 'TikTok';
  if (lower.includes('twitter.com') || lower.includes('x.com') || lower.includes('t.co')) return 'Twitter / X';
  if (lower.includes('facebook.com') || lower.includes('fb.watch') || lower.includes('fb.com')) return 'Facebook';
  if (lower.includes('reddit.com') || lower.includes('redd.it')) return 'Reddit';
  if (lower.includes('soundcloud.com')) return 'SoundCloud';
  if (lower.includes('twitch.tv')) return 'Twitch';
  if (lower.includes('vimeo.com')) return 'Vimeo';
  if (lower.includes('pinterest.com') || lower.includes('pin.it')) return 'Pinterest';
  if (lower.includes('bilibili.com')) return 'Bilibili';
  if (lower.includes('threads.net')) return 'Threads';
  return 'Web Media';
}

/**
 * Clean & normalize any social media or web URL
 */
function normalizeUrl(rawUrl) {
  if (!rawUrl || typeof rawUrl !== 'string') {
    throw new Error('URL is required');
  }
  let url = rawUrl.trim();
  
  // Add protocol if omitted
  if (!/^https?:\/\//i.test(url)) {
    url = 'https://' + url;
  }

  try {
    const parsed = new URL(url);
    if (!parsed.hostname || !parsed.hostname.includes('.')) {
      throw new Error('Invalid domain');
    }
  } catch (e) {
    throw new Error('Please enter a valid link from YouTube, Instagram, TikTok, Twitter/X, Facebook, SoundCloud, Reddit, etc.');
  }

  return url;
}

/**
 * Check if a cookies.txt file exists in the server or root directory
 */
function getCookiePath() {
  const serverCookie = path.join(__dirname, 'cookies.txt');
  const rootCookie = path.join(__dirname, '..', 'cookies.txt');
  if (fs.existsSync(serverCookie)) return serverCookie;
  if (fs.existsSync(rootCookie)) return rootCookie;
  return null;
}

/**
 * Get Video/Audio Metadata via yt-dlp across all social platforms
 */
function getVideoInfo(rawUrl) {
  return new Promise((resolve, reject) => {
    let url;
    try {
      url = normalizeUrl(rawUrl);
    } catch (err) {
      return reject(err);
    }

    const isYouTube = url.includes('youtube.com') || url.includes('youtu.be');
    const ytDlp = getYtDlpPath();
    const cookiePath = getCookiePath();
    const cookieFlags = cookiePath ? ['--cookies', cookiePath] : [];

    const args = [
      '--dump-single-json',
      '--no-warnings',
      '--no-playlist',
      '--no-check-certificates',
      ...(isYouTube && !cookiePath ? ['--extractor-args', 'youtube:player_client=android,web'] : []),
      ...cookieFlags,
      '--user-agent', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
      '--js-runtimes', 'node',
      url
    ];

    execFile(ytDlp, args, { maxBuffer: 20 * 1024 * 1024 }, (error, stdout, stderr) => {
      if (error) {
        console.error('[converter] Error fetching media info:', stderr || error.message);
        
        let errorMsg = 'Unable to fetch media details. Please verify the URL or try again.';
        const errText = (stderr || error.message || '').toString();

        if (errText.includes('This video is unavailable') || errText.includes('Video unavailable')) {
          errorMsg = 'This media is unavailable or has been deleted.';
        } else if (errText.includes('Private') || errText.includes('private')) {
          errorMsg = 'This content is marked private or restricted.';
        } else if (errText.includes('Sign in to confirm your age')) {
          errorMsg = 'This media is age-restricted and requires sign-in.';
        } else if (errText.includes('Sign in') || errText.includes('bot')) {
          errorMsg = 'Platform verification or login required. Please try another link.';
        } else {
          const match = errText.match(/ERROR:\s*(?:\[[^\]]+\]\s*)?([^\r\n]+)/i);
          if (match && match[1]) {
            errorMsg = match[1].trim();
          }
        }

        return reject(new Error(errorMsg));
      }

      try {
        const data = JSON.parse(stdout);

        // Pick highest resolution thumbnail
        let thumbnail = data.thumbnail;
        if (Array.isArray(data.thumbnails) && data.thumbnails.length > 0) {
          const sorted = [...data.thumbnails].sort((a, b) => (b.width || 0) - (a.width || 0));
          thumbnail = sorted[0].url || thumbnail;
        }

        const duration = data.duration || 0;
        const platform = detectPlatform(url);
        const info = {
          id: data.id,
          url: data.webpage_url || url,
          title: data.title || `${platform} Media`,
          uploader: data.uploader || data.channel || data.creator || `${platform} Creator`,
          platform: platform,
          channelUrl: data.channel_url || data.uploader_url || null,
          duration: duration,
          durationFormatted: formatDuration(duration),
          isUltraLong: duration >= 7200, // >= 2 hours (handles 10h, 24h, 100h+)
          thumbnail: thumbnail,
          viewCount: data.view_count || data.like_count || 0,
          uploadDate: data.upload_date || '',
          description: (data.description || '').slice(0, 300)
        };

        resolve(info);
      } catch (parseErr) {
        console.error('[converter] JSON parse error:', parseErr.message);
        reject(new Error('Failed to parse media information.'));
      }
    });
  });
}

/**
 * Start Conversion Job with 16-Stream Turbo Acceleration
 */
function startConversion({ url, format = 'mp3', quality = '320k', jobId, turbo = true }) {
  const ytDlp = getYtDlpPath();
  const ffmpeg = getFfmpegPath();

  const validFormats = ['mp3', 'm4a', 'wav', 'flac', 'mp4'];
  const targetFormat = validFormats.includes(format.toLowerCase()) ? format.toLowerCase() : 'mp3';
  const isVideo = targetFormat === 'mp4';

  // Output filename template
  const outputTemplate = path.join(DOWNLOADS_DIR, `${jobId}.%(ext)s`);

  const jobState = {
    id: jobId,
    url,
    format: targetFormat,
    quality,
    isVideo,
    turbo: true,
    parallelStreams: 16,
    fragmentInfo: null,
    status: 'starting', // starting, downloading, converting, completed, failed
    progress: 0,
    speed: '0 KiB/s',
    eta: '--:--',
    totalSize: 'Calculating...',
    title: '',
    artist: '',
    thumbnail: '',
    duration: 0,
    filePath: null,
    fileName: null,
    error: null,
    createdAt: Date.now()
  };

  jobs.set(jobId, jobState);

  const binDir = getBinDir();

  const isYouTube = url.includes('youtube.com') || url.includes('youtu.be');

  const cookiePath = getCookiePath();
  const cookieFlags = cookiePath ? ['--cookies', cookiePath] : [];

  const ffmpegLocation = getFfmpegLocation();
  const ffmpegFlags = ffmpegLocation ? ['--ffmpeg-location', ffmpegLocation] : [];

  // High-speed multi-threaded acceleration flags (16 parallel chunk streams, 16MB buffer)
  const speedFlags = [
    '-N', '16', // 16 concurrent fragments for DASH/HLS
    '--buffer-size', '16M',
    '--http-chunk-size', '10M',
    ...(isYouTube && !cookiePath ? ['--extractor-args', 'youtube:player_client=android,web'] : []),
    ...cookieFlags,
    '--user-agent', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
    '--js-runtimes', 'node',
    '--retries', '10',
    '--fragment-retries', '10',
    '--skip-unavailable-fragments',
    '--no-mtime'
  ];

  let args = [];

  if (isVideo) {
    // Video download with resolution filter & Direct Stream Copy MP4 merge
    let formatFilter = 'bv*[ext=mp4]+ba[ext=m4a]/b[ext=mp4] / bv*+ba/b';
    if (quality === '1080p') {
      formatFilter = 'bv*[height<=1080][ext=mp4]+ba[ext=m4a]/bv*[height<=1080]+ba/b[height<=1080] / bv*+ba/b';
    } else if (quality === '720p') {
      formatFilter = 'bv*[height<=720][ext=mp4]+ba[ext=m4a]/bv*[height<=720]+ba/b[height<=720] / bv*+ba/b';
    } else if (quality === '480p') {
      formatFilter = 'bv*[height<=480][ext=mp4]+ba[ext=m4a]/bv*[height<=480]+ba/b[height<=480] / bv*+ba/b';
    }

    args = [
      '-f', formatFilter,
      '--merge-output-format', 'mp4',
      '--postprocessor-args', 'Merger:-c copy -threads 0',
      '--output', outputTemplate,
      '--newline',
      '--no-playlist',
      '--embed-metadata',
      '--no-check-certificates',
      ...ffmpegFlags,
      ...speedFlags,
      url
    ];
  } else {
    // Audio extraction with multi-threaded encoding or stream copy
    let audioFilter = 'ba/b';
    let postArgs = 'ExtractAudio:-threads 0';

    if (targetFormat === 'm4a') {
      // Native YouTube AAC stream copy (Instant 0-reencode)
      audioFilter = 'ba[ext=m4a]/ba/b';
      postArgs = 'ExtractAudio:-threads 0';
    } else if (targetFormat === 'mp3') {
      // Fastest multi-core MP3 encoding
      postArgs = 'ExtractAudio:-threads 0';
    }

    args = [
      '-f', audioFilter,
      '--extract-audio',
      '--audio-format', targetFormat,
      '--audio-quality', quality,
      '--postprocessor-args', postArgs,
      '--output', outputTemplate,
      '--newline',
      '--no-playlist',
      '--embed-metadata',
      '--no-check-certificates',
      ...ffmpegFlags,
      ...speedFlags,
      url
    ];
  }

  console.log(`[converter] Starting job ${jobId} (Turbo 16x): ${url} (${targetFormat}, ${quality})`);

  const child = spawn(ytDlp, args);
  jobState.process = child;

  const parseProgressLine = (line) => {
    // Examples:
    // [download]   5.4% of   10.23MiB at    1.24MiB/s ETA 00:08
    // [download] 100% of   10.23MiB in 00:03
    // [ExtractAudio] Destination: ...
    // [Metadata] Adding metadata...
    // [ThumbnailsConvertor] Converting thumbnail...

    if (line.includes('[download]')) {
      jobState.status = 'downloading';
      const percentMatch = line.match(/(\d+(?:\.\d+)?)%/);
      if (percentMatch) {
        jobState.progress = Math.min(Math.round(parseFloat(percentMatch[1])), 95);
      }

      // Match high speeds (e.g., 28.5MiB/s, 1.2GiB/s, 450KiB/s)
      const speedMatch = line.match(/at\s+([\d.]+\s*[KMGTkmgt]i?B\/s)/i);
      if (speedMatch) {
        jobState.speed = speedMatch[1];
      }

      // Match ETA (e.g., 03:45, 01:23:45)
      const etaMatch = line.match(/ETA\s+([\d:]+)/i);
      if (etaMatch) {
        jobState.eta = etaMatch[1];
      }

      // Match multi-gigabyte and multi-megabyte file sizes
      const sizeMatch = line.match(/of\s+~?([\d.]+\s*[KMGTkmgt]i?B)/i);
      if (sizeMatch) {
        jobState.totalSize = sizeMatch[1];
      }

      // Match fragment download progress (e.g. frag 250/1800)
      const fragMatch = line.match(/frag\s+(\d+\/\d+)/i);
      if (fragMatch) {
        jobState.fragmentInfo = fragMatch[1];
      }
    } else if (line.includes('[ExtractAudio]') || line.includes('[ffmpeg]') || line.includes('[Merger]')) {
      jobState.status = 'converting';
      jobState.progress = Math.max(jobState.progress, 92);
    } else if (line.includes('[Metadata]') || line.includes('[ThumbnailsConvertor]') || line.includes('[EmbedThumbnail]')) {
      jobState.status = 'tagging';
      jobState.progress = 98;
    }
  };

  child.stdout.on('data', (chunk) => {
    const lines = chunk.toString().split(/\r?\n/);
    for (const line of lines) {
      if (line.trim()) {
        parseProgressLine(line.trim());
      }
    }
  });

  let stderrBuffer = '';
  child.stderr.on('data', (chunk) => {
    const errText = chunk.toString();
    stderrBuffer += errText;
    console.warn(`[converter ${jobId} stderr]:`, errText.trim());
  });

  child.on('close', (code) => {
    if (code === 0) {
      // Find output file
      const expectedFile = path.join(DOWNLOADS_DIR, `${jobId}.${targetFormat}`);
      if (fs.existsSync(expectedFile)) {
        jobState.status = 'completed';
        jobState.progress = 100;
        jobState.filePath = expectedFile;
        jobState.fileName = `${(jobState.title || 'audio').replace(/[/\\?%*:|"<>]/g, '_')}.${targetFormat}`;
        console.log(`[converter] Job ${jobId} completed successfully!`);
      } else {
        // Look for any file with jobId prefix in downloads dir
        const found = fs.readdirSync(DOWNLOADS_DIR).find(f => f.startsWith(jobId));
        if (found) {
          jobState.status = 'completed';
          jobState.progress = 100;
          jobState.filePath = path.join(DOWNLOADS_DIR, found);
          jobState.fileName = found;
          console.log(`[converter] Job ${jobId} finished with file ${found}`);
        } else {
          jobState.status = 'failed';
          jobState.error = 'Output media file was not created.';
        }
      }
    } else {
      jobState.status = 'failed';
      let errorMsg = `Conversion failed (exit code ${code})`;
      if (stderrBuffer.includes('Sign in to confirm your age')) {
        errorMsg = 'This video is age-restricted and requires sign-in.';
      } else if (stderrBuffer.includes('Sign in') || stderrBuffer.includes('bot')) {
        errorMsg = 'YouTube flagged this video with bot/login verification. Try another video link or export cookies.txt.';
      } else {
        const match = stderrBuffer.match(/ERROR:\s*(?:\[[^\]]+\]\s*)?([^\r\n]+)/i);
        if (match && match[1]) {
          errorMsg = match[1].trim();
        }
      }
      jobState.error = errorMsg;
      console.error(`[converter] Job ${jobId} failed: ${errorMsg}`);

      // Clean up any incomplete partial files on error
      try {
        const partials = fs.readdirSync(DOWNLOADS_DIR).filter(f => f.startsWith(jobId));
        for (const part of partials) {
          fs.unlinkSync(path.join(DOWNLOADS_DIR, part));
        }
      } catch {}
    }
  });

  child.on('error', (err) => {
    console.error(`[converter] Job ${jobId} failed to spawn:`, err.message);
    jobState.status = 'failed';
    jobState.error = err.message;
  });

  return jobState;
}

/**
 * Get job state
 */
function getJob(jobId) {
  const job = jobs.get(jobId);
  if (!job) return null;
  // Return shallow copy without raw process object
  const { process, ...clean } = job;
  return clean;
}

/**
 * List completed history
 */
function getHistory() {
  const list = [];
  for (const [id, job] of jobs.entries()) {
    if (job.status === 'completed') {
      const { process, ...clean } = job;
      list.push(clean);
    }
  }
  return list.sort((a, b) => b.createdAt - a.createdAt);
}

module.exports = {
  getVideoInfo,
  startConversion,
  getJob,
  getHistory,
  formatDuration,
  DOWNLOADS_DIR
};
