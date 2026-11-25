const { spawn, execFile, execFileSync } = require('child_process');
const path = require('path');
const fs = require('fs');
const os = require('os');
const { getYtDlpPath, getFfmpegPath, getFfmpegLocation, getBinDir } = require('./binManager');
const {
  isPhotoSupportedUrl,
  resolvePhotoMetadata,
  downloadPhotoJob
} = require('./photoResolver');

const DOWNLOADS_DIR = path.join(__dirname, 'downloads');
if (!fs.existsSync(DOWNLOADS_DIR)) {
  fs.mkdirSync(DOWNLOADS_DIR, { recursive: true });
}

const DATA_DIR = path.join(__dirname, 'data');
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}
const HISTORY_FILE = path.join(DATA_DIR, 'history.json');
const SETTINGS_FILE = path.join(DATA_DIR, 'settings.json');
const DEFAULT_LIBRARY_DIR = path.join(os.homedir(), 'Downloads', 'SonicWave');

function isUnsafeSystemDirectory(dirPath) {
  const resolved = path.resolve(dirPath);
  const parsed = path.parse(resolved);
  if (resolved === parsed.root) return true;
  const lower = resolved.toLowerCase();
  const forbiddenPrefixes = [
    'c:\\windows',
    'c:\\program files',
    '/bin',
    '/sbin',
    '/usr',
    '/etc',
    '/system'
  ];
  return forbiddenPrefixes.some((p) => lower === p || lower.startsWith(`${p}${path.sep}`));
}

function getServerSettings() {
  const defaults = {
    libraryMode: 'temporary',
    libraryDir: DEFAULT_LIBRARY_DIR
  };
  try {
    if (fs.existsSync(SETTINGS_FILE)) {
      const parsed = JSON.parse(fs.readFileSync(SETTINGS_FILE, 'utf8'));
      const mode = parsed.libraryMode === 'permanent' ? 'permanent' : 'temporary';
      const candidateDir = typeof parsed.libraryDir === 'string' && parsed.libraryDir.trim()
        ? path.resolve(parsed.libraryDir.trim())
        : DEFAULT_LIBRARY_DIR;
      return {
        libraryMode: mode,
        libraryDir: isUnsafeSystemDirectory(candidateDir) ? DEFAULT_LIBRARY_DIR : candidateDir
      };
    }
  } catch {}
  return defaults;
}

function updateServerSettings(patch = {}) {
  const current = getServerSettings();
  const nextMode = patch.libraryMode === 'permanent'
    ? 'permanent'
    : (patch.libraryMode === 'temporary' ? 'temporary' : current.libraryMode);

  let nextDir = current.libraryDir;
  if (typeof patch.libraryDir === 'string' && patch.libraryDir.trim()) {
    const resolved = path.resolve(patch.libraryDir.trim());
    if (!path.isAbsolute(resolved) || isUnsafeSystemDirectory(resolved)) {
      throw new Error('Selected library directory is not permitted.');
    }
    nextDir = resolved;
  }

  if (nextMode === 'permanent') {
    fs.mkdirSync(nextDir, { recursive: true });
  }

  const next = { libraryMode: nextMode, libraryDir: nextDir };
  fs.writeFileSync(SETTINGS_FILE, JSON.stringify(next, null, 2), 'utf8');
  return next;
}

function allocateFriendlyFilePath(targetDir, desiredName) {
  const safeBase = path
    .basename(desiredName || 'SonicWave-media.mp3')
    .replace(/[/\\?%*:|"<>\0\r\n]/g, '_')
    .trim() || 'SonicWave-media.mp3';
  const parsed = path.parse(safeBase);
  let candidate = path.join(targetDir, safeBase);
  let index = 1;
  while (fs.existsSync(candidate)) {
    candidate = path.join(targetDir, `${parsed.name} (${index})${parsed.ext}`);
    index += 1;
  }
  return candidate;
}

function moveToPermanentLibrary(srcFile, friendlyName) {
  const settings = getServerSettings();
  if (settings.libraryMode !== 'permanent' || !srcFile || !fs.existsSync(srcFile)) {
    return { filePath: srcFile, isPermanent: false };
  }
  try {
    fs.mkdirSync(settings.libraryDir, { recursive: true });
    const destPath = allocateFriendlyFilePath(settings.libraryDir, friendlyName);
    try {
      fs.renameSync(srcFile, destPath);
    } catch {
      fs.copyFileSync(srcFile, destPath);
      fs.unlinkSync(srcFile);
    }
    return { filePath: destPath, isPermanent: true };
  } catch (err) {
    console.warn('[converter] Failed to move file into permanent library:', err.message);
    return { filePath: srcFile, isPermanent: false };
  }
}

const MAX_CONCURRENT_CONVERSIONS = 3;
const MAX_QUEUE_SIZE = 100;

// In-memory active jobs tracker + FIFO queue
const jobs = new Map();
const jobQueue = [];

function updateQueuePositions() {
  jobQueue.forEach((id, index) => {
    const queuedJob = jobs.get(id);
    if (queuedJob && queuedJob.status === 'queued') {
      queuedJob.queuePosition = index + 1;
    }
  });
}

function getQueueLength() {
  return jobQueue.length;
}

/**
 * Load completed jobs from persistent history file into memory on startup
 */
function loadPersistentHistory() {
  try {
    if (fs.existsSync(HISTORY_FILE)) {
      const data = JSON.parse(fs.readFileSync(HISTORY_FILE, 'utf8'));
      if (Array.isArray(data)) {
        for (const item of data) {
          if (item && item.id) {
            jobs.set(item.id, item);
          }
        }
        console.log(`[converter] Loaded ${data.length} persistent history records.`);
      }
    }
  } catch (err) {
    console.warn('[converter] Failed to load persistent history:', err.message);
  }
}
loadPersistentHistory();

/**
 * Append or update a completed job in persistent history
 */
function savePersistentHistory(job) {
  try {
    let list = [];
    if (fs.existsSync(HISTORY_FILE)) {
      try {
        list = JSON.parse(fs.readFileSync(HISTORY_FILE, 'utf8'));
      } catch {}
    }
    const cleanJob = {
      id: job.id,
      url: job.url,
      format: job.format,
      quality: job.quality,
      isVideo: job.isVideo,
      status: 'completed',
      progress: 100,
      title: job.title || 'Audio File',
      artist: job.artist || 'Media Artist',
      thumbnail: job.thumbnail || '',
      duration: job.duration || 0,
      filePath: job.filePath,
      fileName: job.fileName,
      isPermanent: Boolean(job.isPermanent),
      createdAt: job.createdAt || Date.now()
    };
    list = [cleanJob, ...list.filter(item => item.id !== job.id)].slice(0, 50);
    fs.writeFileSync(HISTORY_FILE, JSON.stringify(list, null, 2), 'utf8');
  } catch (err) {
    console.warn('[converter] Failed to save history to disk:', err.message);
  }
}

// Clean up temporary downloads older than 2 hours every 30 minutes (preserves Permanent Library files)
async function cleanOldDownloads(maxAge = 2 * 60 * 60 * 1000) {
  try {
    const now = Date.now();
    try {
      await fs.promises.access(DOWNLOADS_DIR, fs.constants.F_OK);
      const files = await fs.promises.readdir(DOWNLOADS_DIR);
      for (const file of files) {
        const fullPath = path.join(DOWNLOADS_DIR, file);
        try {
          const stats = await fs.promises.stat(fullPath);
          if (stats.isFile() && (now - stats.mtimeMs > maxAge)) {
            try {
              await fs.promises.unlink(fullPath);
            } catch (unlinkErr) {
              console.warn(`[converter] Could not unlink ${file}:`, unlinkErr.message);
            }
          }
        } catch {}
      }
    } catch {}

    // Evict old temporary jobs from memory when their files expire; preserve permanent library entries
    for (const [id, job] of jobs.entries()) {
      let existsOnDisk = false;
      if (job.filePath) {
        try {
          await fs.promises.access(job.filePath, fs.constants.F_OK);
          existsOnDisk = true;
        } catch {}
      }
      if (job.isPermanent && existsOnDisk) {
        continue;
      }
      if ((job.status === 'completed' || job.status === 'failed' || job.status === 'cancelled') &&
          now - (job.createdAt || 0) > maxAge) {
        if (!existsOnDisk) {
          jobs.delete(id);
        }
      }
    }
  } catch (err) {
    console.warn('[converter] cleanOldDownloads caught outer error:', err.message);
  }
}
setInterval(() => {
  cleanOldDownloads().catch(() => {});
}, 30 * 60 * 1000).unref();

/**
 * Format seconds into HH:MM:SS or MM:SS
 */
function formatDuration(seconds) {
  if (!Number.isFinite(seconds) || seconds <= 0) return '0:00';
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
  if (!url || typeof url !== 'string') return 'Web Media';
  let hostname = '';
  try {
    hostname = new URL(url.includes('://') ? url : `https://${url}`).hostname.toLowerCase();
  } catch {
    return 'Web Media';
  }
  const isDomain = (dom) => hostname === dom || hostname.endsWith('.' + dom);
  if (isDomain('youtube.com') || isDomain('youtu.be')) return 'YouTube';
  if (isDomain('instagram.com') || isDomain('instagr.am')) return 'Instagram';
  if (isDomain('tiktok.com')) return 'TikTok';
  if (isDomain('twitter.com') || isDomain('x.com') || isDomain('t.co')) return 'Twitter / X';
  if (isDomain('facebook.com') || isDomain('fb.watch') || isDomain('fb.com')) return 'Facebook';
  if (isDomain('reddit.com') || isDomain('redd.it')) return 'Reddit';
  if (isDomain('soundcloud.com')) return 'SoundCloud';
  if (isDomain('twitch.tv')) return 'Twitch';
  if (isDomain('vimeo.com')) return 'Vimeo';
  if (isDomain('pinterest.com') || isDomain('pin.it')) return 'Pinterest';
  if (isDomain('bilibili.com')) return 'Bilibili';
  if (isDomain('threads.net')) return 'Threads';
  return 'Web Media';
}

/**
 * Classify media content between Posts, Reels, Shorts, and standard media
 * along with specific social media platform detection and aspect ratios.
 */
function classifyMediaContent(url, data = {}, flags = {}) {
  const isCarousel = Boolean(flags.isCarousel || data.isCarousel || data._type === 'playlist' || (Array.isArray(data.entries) && data.entries.length > 0));
  const itemCount = flags.itemCount || (Array.isArray(data.entries) ? data.entries.length : 1);
  const hasAudio = flags.hasAudio !== undefined ? flags.hasAudio : true;

  if (!url || typeof url !== 'string') {
    return {
      platform: 'Web Media',
      platformId: 'web',
      contentType: isCarousel ? 'carousel' : 'video',
      contentCategory: isCarousel ? 'Carousel' : 'Media',
      contentLabel: isCarousel ? `Media Carousel (${itemCount} items)` : 'Web Media',
      isReel: false,
      isPost: false,
      isCarousel: isCarousel,
      itemCount: itemCount,
      hasAudio: hasAudio,
      isShort: false,
      isAudio: false,
      isPhoto: false,
      badge: isCarousel ? `Media Carousel \u2022 ${itemCount} items` : 'Web Media',
      aspectRatio: '16:9'
    };
  }

  let hostname = '';
  let pathname = '';
  try {
    const parsed = new URL(url.includes('://') ? url : `https://${url}`);
    hostname = parsed.hostname.toLowerCase();
    pathname = parsed.pathname.toLowerCase();
  } catch {
    return {
      platform: 'Web Media',
      platformId: 'web',
      contentType: isCarousel ? 'carousel' : 'video',
      contentCategory: isCarousel ? 'Carousel' : 'Media',
      contentLabel: isCarousel ? `Media Carousel (${itemCount} items)` : 'Web Media',
      isReel: false,
      isPost: false,
      isCarousel: isCarousel,
      itemCount: itemCount,
      hasAudio: hasAudio,
      isShort: false,
      isAudio: false,
      isPhoto: false,
      badge: isCarousel ? `Media Carousel \u2022 ${itemCount} items` : 'Web Media',
      aspectRatio: '16:9'
    };
  }

  const isDomain = (dom) => hostname === dom || hostname.endsWith('.' + dom);

  const duration = Number(data.duration) || 0;
  const width = Number(data.width) || 0;
  const height = Number(data.height) || 0;
  const isVertical = height > width && width > 0;
  const isSquare = Math.abs(width - height) < 25 && width > 0;
  const aspectRatio = isVertical ? '9:16' : (isSquare ? '1:1' : '16:9');

  // 1. Instagram: Distinguish between Reels (/reel/, /reels/) and Posts (/p/)
  if (isDomain('instagram.com') || isDomain('instagr.am')) {
    const isReelUrl = pathname.includes('/reel/') || pathname.includes('/reels/') || pathname.includes('reels_video');
    const isPostUrl = pathname.includes('/p/');
    const isStoryUrl = pathname.includes('/stories/');
    const isTvUrl = pathname.includes('/tv/');

    // Handle Instagram Carousel (multiple slides, photos, or videos)
    if (isCarousel) {
      return {
        platform: 'Instagram',
        platformId: 'instagram',
        contentType: 'post',
        contentCategory: 'Post',
        contentLabel: `Instagram Carousel (${itemCount} items)`,
        isReel: false,
        isPost: true,
        isCarousel: true,
        itemCount: itemCount,
        hasAudio: hasAudio,
        isShort: false,
        isAudio: false,
        isPhoto: !hasAudio,
        badge: `Instagram Carousel \u2022 ${itemCount} items`,
        aspectRatio: aspectRatio
      };
    }

    if (isReelUrl || isStoryUrl || (!isPostUrl && !isTvUrl && isVertical)) {
      return {
        platform: 'Instagram',
        platformId: 'instagram',
        contentType: 'reel',
        contentCategory: 'Reel',
        contentLabel: 'Instagram Reel',
        isReel: true,
        isPost: false,
        isCarousel: false,
        itemCount: 1,
        hasAudio: hasAudio,
        isShort: false,
        isAudio: false,
        isPhoto: false,
        badge: 'Instagram Reel \u2022 9:16',
        aspectRatio: '9:16'
      };
    }

    if (isTvUrl) {
      return {
        platform: 'Instagram',
        platformId: 'instagram',
        contentType: 'video',
        contentCategory: 'IGTV',
        contentLabel: 'Instagram Video',
        isReel: false,
        isPost: true,
        isCarousel: false,
        itemCount: 1,
        hasAudio: hasAudio,
        isShort: false,
        isAudio: false,
        isPhoto: false,
        badge: 'Instagram Video',
        aspectRatio: aspectRatio
      };
    }

    // Default Instagram post (/p/)
    const hasOnlyImages = (data.ext === 'jpg' || data.ext === 'png' || data.ext === 'webp') || 
      (duration === 0 && Array.isArray(data.formats) && !data.formats.some(f => f.vcodec && f.vcodec !== 'none'));

    if (hasOnlyImages) {
      return {
        platform: 'Instagram',
        platformId: 'instagram',
        contentType: 'photo',
        contentCategory: 'Post',
        contentLabel: 'Instagram Post (Photo)',
        isReel: false,
        isPost: true,
        isCarousel: false,
        itemCount: 1,
        hasAudio: false,
        isShort: false,
        isAudio: false,
        isPhoto: true,
        badge: 'Instagram Post \u2022 Photo',
        aspectRatio: aspectRatio
      };
    }

    return {
      platform: 'Instagram',
      platformId: 'instagram',
      contentType: 'post',
      contentCategory: 'Post',
      contentLabel: 'Instagram Post (Video)',
      isReel: false,
      isPost: true,
      isCarousel: false,
      itemCount: 1,
      hasAudio: hasAudio,
      isShort: false,
      isAudio: false,
      isPhoto: false,
      badge: 'Instagram Post \u2022 Video',
      aspectRatio: aspectRatio
    };
  }

  // 2. YouTube: Distinguish between Shorts (/shorts/) and standard Videos (/watch)
  if (isDomain('youtube.com') || isDomain('youtu.be')) {
    const isShortUrl = pathname.includes('/shorts/');
    const isShortByDims = duration > 0 && duration <= 65 && isVertical;

    if (isShortUrl || isShortByDims) {
      return {
        platform: 'YouTube',
        platformId: 'youtube',
        contentType: 'reel',
        contentCategory: 'Short',
        contentLabel: 'YouTube Short',
        isReel: true,
        isPost: false,
        isShort: true,
        isAudio: false,
        isPhoto: false,
        badge: 'YouTube Short \u2022 9:16',
        aspectRatio: '9:16'
      };
    }

    return {
      platform: 'YouTube',
      platformId: 'youtube',
      contentType: 'video',
      contentCategory: 'Video',
      contentLabel: 'YouTube Video',
      isReel: false,
      isPost: false,
      isShort: false,
      isAudio: false,
      isPhoto: false,
      badge: 'YouTube Video \u2022 16:9',
      aspectRatio: '16:9'
    };
  }

  // 3. TikTok: Vertical video clips / Reels
  if (isDomain('tiktok.com')) {
    return {
      platform: 'TikTok',
      platformId: 'tiktok',
      contentType: 'reel',
      contentCategory: 'Reel',
      contentLabel: 'TikTok Video / Reel',
      isReel: true,
      isPost: false,
      isShort: false,
      isAudio: false,
      isPhoto: false,
      badge: 'TikTok Reel \u2022 9:16',
      aspectRatio: '9:16'
    };
  }

  // 4. Facebook: Distinguish between Reels (/reel/, /share/r/) and Posts (/posts/, /videos/)
  if (isDomain('facebook.com') || isDomain('fb.watch') || isDomain('fb.com')) {
    const isReelUrl = pathname.includes('/reel/') || pathname.includes('/reels/') || pathname.includes('/share/r/') || isDomain('fb.watch');
    if (isReelUrl || (isVertical && duration <= 90)) {
      return {
        platform: 'Facebook',
        platformId: 'facebook',
        contentType: 'reel',
        contentCategory: 'Reel',
        contentLabel: 'Facebook Reel',
        isReel: true,
        isPost: false,
        isShort: false,
        isAudio: false,
        isPhoto: false,
        badge: 'Facebook Reel \u2022 9:16',
        aspectRatio: '9:16'
      };
    }

    return {
      platform: 'Facebook',
      platformId: 'facebook',
      contentType: 'post',
      contentCategory: 'Post',
      contentLabel: 'Facebook Post',
      isReel: false,
      isPost: true,
      isShort: false,
      isAudio: false,
      isPhoto: false,
      badge: 'Facebook Post',
      aspectRatio: aspectRatio
    };
  }

  // 5. Twitter / X: Posts / Tweets
  if (isDomain('twitter.com') || isDomain('x.com') || isDomain('t.co')) {
    return {
      platform: 'Twitter / X',
      platformId: 'twitter',
      contentType: 'post',
      contentCategory: 'Post',
      contentLabel: 'X / Twitter Post',
      isReel: false,
      isPost: true,
      isShort: false,
      isAudio: false,
      isPhoto: false,
      badge: 'X / Twitter Post',
      aspectRatio: aspectRatio
    };
  }

  // 6. Reddit: Posts / Clips
  if (isDomain('reddit.com') || isDomain('redd.it')) {
    return {
      platform: 'Reddit',
      platformId: 'reddit',
      contentType: 'post',
      contentCategory: 'Post',
      contentLabel: 'Reddit Post',
      isReel: false,
      isPost: true,
      isShort: false,
      isAudio: false,
      isPhoto: false,
      badge: 'Reddit Post',
      aspectRatio: aspectRatio
    };
  }

  // 7. SoundCloud: Audio Tracks
  if (isDomain('soundcloud.com')) {
    return {
      platform: 'SoundCloud',
      platformId: 'soundcloud',
      contentType: 'audio',
      contentCategory: 'Audio',
      contentLabel: 'SoundCloud Track',
      isReel: false,
      isPost: false,
      isShort: false,
      isAudio: true,
      isPhoto: false,
      badge: 'SoundCloud Audio',
      aspectRatio: '1:1'
    };
  }

  // 8. Pinterest: Pins / Video Pins
  if (isDomain('pinterest.com') || isDomain('pin.it')) {
    return {
      platform: 'Pinterest',
      platformId: 'pinterest',
      contentType: isVertical ? 'reel' : 'post',
      contentCategory: 'Pin',
      contentLabel: isVertical ? 'Pinterest Video Pin' : 'Pinterest Pin',
      isReel: isVertical,
      isPost: !isVertical,
      isShort: false,
      isAudio: false,
      isPhoto: !isVertical,
      badge: 'Pinterest Pin',
      aspectRatio: aspectRatio
    };
  }

  // 9. Threads: Posts
  if (isDomain('threads.net')) {
    return {
      platform: 'Threads',
      platformId: 'threads',
      contentType: 'post',
      contentCategory: 'Post',
      contentLabel: 'Threads Post',
      isReel: false,
      isPost: true,
      isShort: false,
      isAudio: false,
      isPhoto: false,
      badge: 'Threads Post',
      aspectRatio: aspectRatio
    };
  }

  // 10. Vimeo / Twitch / Other
  if (isDomain('vimeo.com')) {
    return {
      platform: 'Vimeo',
      platformId: 'vimeo',
      contentType: 'video',
      contentCategory: 'Video',
      contentLabel: 'Vimeo Video',
      isReel: false,
      isPost: false,
      isShort: false,
      isAudio: false,
      isPhoto: false,
      badge: 'Vimeo Video',
      aspectRatio: '16:9'
    };
  }

  const detected = detectPlatform(url);
  return {
    platform: detected,
    platformId: detected.toLowerCase().replace(/[^a-z0-9]/g, ''),
    contentType: 'video',
    contentCategory: 'Media',
    contentLabel: `${detected} Media`,
    isReel: false,
    isPost: false,
    isShort: false,
    isAudio: false,
    isPhoto: false,
    badge: `${detected} Media`,
    aspectRatio: aspectRatio
  };
}

/**
 * Generate tailored download presets specifically customized for each social
 * media app and content type (Reel vs Post vs Video).
 */
function getTailoredDownloadOptions({ platformId, contentType, isReel, isPost, duration, data = {}, isCarousel = false, itemCount = 1, hasAudio = true }) {
  // 1. Instagram Reel
  if (platformId === 'instagram' && isReel) {
    return {
      appTheme: 'instagram',
      appColor: '#e1306c',
      headline: 'Instagram Reel Options',
      subhead: 'Optimized vertical 9:16 video & viral sound extraction',
      presets: [
        {
          id: 'reel-hd-video',
          label: 'HD Reel Video',
          format: 'mp4',
          quality: '1080p',
          badge: '1080p FHD',
          icon: 'video',
          desc: 'Original vertical MP4 video with reel audio',
          recommended: true
        },
        {
          id: 'reel-audio-320',
          label: 'Reel Sound (MP3)',
          format: 'mp3',
          quality: '320k',
          badge: '320 kbps HQ',
          icon: 'music',
          desc: 'Extract trending reel background audio'
        },
        {
          id: 'reel-stream-copy',
          label: 'Fast Audio Stream',
          format: 'm4a',
          quality: 'best',
          badge: 'Direct AAC',
          icon: 'zap',
          desc: 'Instant direct audio copy (<5s)'
        },
        {
          id: 'reel-cover-art',
          label: 'Reel Cover Art',
          format: 'cover',
          quality: 'original',
          badge: 'HD Image',
          icon: 'image',
          desc: 'Download full-res reel cover image'
        }
      ]
    };
  }

  // 2. Instagram Post & Carousel
  if (platformId === 'instagram' && isPost) {
    const isPhoto = contentType === 'photo';

    if (isCarousel || hasAudio === false) {
      return {
        appTheme: 'instagram',
        appColor: '#c13584',
        headline: isCarousel ? `Instagram Carousel (${itemCount} items)` : 'Instagram Post (Silent Media)',
        subhead: hasAudio ? 'Slide 1 Video & High-Resolution Photos' : 'Slide 1 Video & Photo Frames (No Audio Stream)',
        presets: [
          {
            id: 'carousel-video-hd',
            label: 'Slide 1 Video (MP4)',
            format: 'mp4',
            quality: '1080p',
            badge: '1080p HD',
            icon: 'video',
            desc: hasAudio ? 'Full HD slide 1 video with sound' : 'Full HD slide 1 video (silent)',
            recommended: true
          },
          {
            id: 'carousel-cover-hd',
            label: 'Slide 1 Cover / Photo',
            format: 'cover',
            quality: 'original',
            badge: 'HD Image',
            icon: 'image',
            desc: 'Download slide 1 full-resolution photo'
          },
          ...(hasAudio ? [{
            id: 'carousel-audio-320',
            label: 'Post Audio (MP3)',
            format: 'mp3',
            quality: '320k',
            badge: '320 kbps HQ',
            icon: 'music',
            desc: 'Extract audio track from post'
          }] : [])
        ]
      };
    }

    return {
      appTheme: 'instagram',
      appColor: '#c13584',
      headline: isPhoto ? 'Instagram Photo Post Options' : 'Instagram Video Post Options',
      subhead: isPhoto ? 'High-resolution photo & audio extraction' : 'Feed video & audio options',
      presets: isPhoto ? [
        {
          id: 'post-photo-hd',
          label: 'Original Photo (HD)',
          format: 'cover',
          quality: 'original',
          badge: 'Full Res Image',
          icon: 'image',
          desc: 'Download uncompressed original photo',
          recommended: true
        },
        {
          id: 'post-audio-extract',
          label: 'Attached Music (MP3)',
          format: 'mp3',
          quality: '320k',
          badge: '320 kbps',
          icon: 'music',
          desc: 'Extract post background music track'
        }
      ] : [
        {
          id: 'post-video-hd',
          label: 'Feed Video (MP4)',
          format: 'mp4',
          quality: '1080p',
          badge: '1080p HD',
          icon: 'video',
          desc: 'High-definition feed video with audio',
          recommended: true
        },
        {
          id: 'post-audio-320',
          label: 'Post Audio (MP3)',
          format: 'mp3',
          quality: '320k',
          badge: '320 kbps HQ',
          icon: 'music',
          desc: 'Extract audio track from video post'
        },
        {
          id: 'post-cover-thumb',
          label: 'Post Cover Art',
          format: 'cover',
          quality: 'original',
          badge: 'HD Image',
          icon: 'image',
          desc: 'Download original post preview image'
        }
      ]
    };
  }

  // 3. YouTube Short
  if (platformId === 'youtube' && isReel) {
    return {
      appTheme: 'youtube-shorts',
      appColor: '#ff0000',
      headline: 'YouTube Shorts Options',
      subhead: 'Optimized 1080x1920 Short video & music extraction',
      presets: [
        {
          id: 'short-hd-video',
          label: 'Full HD Short (MP4)',
          format: 'mp4',
          quality: '1080p',
          badge: '1080p Vertical',
          icon: 'video',
          desc: 'Pristine 1080x1920 Full HD short video',
          recommended: true
        },
        {
          id: 'short-audio-320',
          label: 'Shorts Music (MP3)',
          format: 'mp3',
          quality: '320k',
          badge: '320 kbps HQ',
          icon: 'music',
          desc: 'Extract full audio track from this Short'
        },
        {
          id: 'short-stream-m4a',
          label: 'Direct Stream Copy',
          format: 'm4a',
          quality: 'best',
          badge: 'Instant AAC',
          icon: 'zap',
          desc: 'Ultra-fast direct AAC copy'
        },
        {
          id: 'short-cover-thumb',
          label: 'Short Thumbnail',
          format: 'cover',
          quality: 'maxres',
          badge: 'HD Art',
          icon: 'image',
          desc: 'Download high-res short cover'
        }
      ]
    };
  }

  // 4. YouTube Standard Video
  if (platformId === 'youtube') {
    return {
      appTheme: 'youtube',
      appColor: '#ff0000',
      headline: 'YouTube Video & Audio Options',
      subhead: 'Select studio audio or high-definition MP4 video',
      presets: [
        {
          id: 'yt-mp3-320',
          label: 'Studio Audio (MP3)',
          format: 'mp3',
          quality: '320k',
          badge: '320 kbps Ultra',
          icon: 'music',
          desc: 'Maximum 320 kbps studio sound with ID3 tags',
          recommended: true
        },
        {
          id: 'yt-mp4-1080',
          label: 'Full HD Video (MP4)',
          format: 'mp4',
          quality: '1080p',
          badge: '1080p FHD',
          icon: 'video',
          desc: 'Crisp 1080p video with AAC audio stream'
        },
        {
          id: 'yt-m4a-fast',
          label: 'Fast Copy (M4A)',
          format: 'm4a',
          quality: 'best',
          badge: 'Direct Copy',
          icon: 'zap',
          desc: 'Direct AAC copy with zero CPU transcoding'
        },
        {
          id: 'yt-wav-lossless',
          label: 'Lossless WAV',
          format: 'wav',
          quality: 'best',
          badge: 'Lossless Master',
          icon: 'music',
          desc: 'Uncompressed audio master for editing'
        }
      ]
    };
  }

  // 5. TikTok Reel / Video
  if (platformId === 'tiktok') {
    return {
      appTheme: 'tiktok',
      appColor: '#00f2fe',
      headline: 'TikTok Video & Sound Options',
      subhead: 'Pristine vertical video stream & trending sound extraction',
      presets: [
        {
          id: 'tiktok-hd-video',
          label: 'TikTok HD Video (MP4)',
          format: 'mp4',
          quality: 'best',
          badge: 'Direct Stream',
          icon: 'video',
          desc: 'Clean MP4 video stream with audio',
          recommended: true
        },
        {
          id: 'tiktok-audio-320',
          label: 'Trending Sound (MP3)',
          format: 'mp3',
          quality: '320k',
          badge: '320 kbps HQ',
          icon: 'music',
          desc: 'Extract viral background audio track'
        },
        {
          id: 'tiktok-stream-m4a',
          label: 'Fast Audio Copy',
          format: 'm4a',
          quality: 'best',
          badge: 'Direct AAC',
          icon: 'zap',
          desc: 'Instant audio extraction'
        },
        {
          id: 'tiktok-cover-art',
          label: 'TikTok Cover Poster',
          format: 'cover',
          quality: 'original',
          badge: 'HD Image',
          icon: 'image',
          desc: 'Download high-res video poster'
        }
      ]
    };
  }

  // 6. Facebook (Reel vs Post)
  if (platformId === 'facebook') {
    return {
      appTheme: 'facebook',
      appColor: '#1877f2',
      headline: isReel ? 'Facebook Reel Options' : 'Facebook Post Options',
      subhead: isReel ? 'Vertical Reel video & audio extraction' : 'Standard video & audio extraction',
      presets: [
        {
          id: 'fb-video-hd',
          label: isReel ? 'Facebook Reel (MP4)' : 'Post Video (MP4)',
          format: 'mp4',
          quality: 'best',
          badge: 'Best HD',
          icon: 'video',
          desc: 'Original high-definition video with audio',
          recommended: true
        },
        {
          id: 'fb-audio-320',
          label: 'Extract Audio (MP3)',
          format: 'mp3',
          quality: '320k',
          badge: '320 kbps HQ',
          icon: 'music',
          desc: 'High-quality MP3 audio extraction'
        },
        {
          id: 'fb-audio-m4a',
          label: 'Fast Copy (M4A)',
          format: 'm4a',
          quality: 'best',
          badge: 'Instant Copy',
          icon: 'zap',
          desc: 'Direct audio stream copy'
        }
      ]
    };
  }

  // 7. Twitter / X Post
  if (platformId === 'twitter') {
    return {
      appTheme: 'twitter',
      appColor: '#1d9bf0',
      headline: 'X / Twitter Post Options',
      subhead: 'Direct video clip & voice track extraction',
      presets: [
        {
          id: 'twitter-video-hd',
          label: 'Tweet Video (MP4)',
          format: 'mp4',
          quality: 'best',
          badge: 'Best MP4',
          icon: 'video',
          desc: 'Highest bitrate video stream from post',
          recommended: true
        },
        {
          id: 'twitter-audio-320',
          label: 'Tweet Audio (MP3)',
          format: 'mp3',
          quality: '320k',
          badge: '320 kbps',
          icon: 'music',
          desc: 'Extract speech and audio from tweet'
        },
        {
          id: 'twitter-cover-art',
          label: 'Media Thumbnail',
          format: 'cover',
          quality: 'original',
          badge: 'HD Image',
          icon: 'image',
          desc: 'Download media preview image'
        }
      ]
    };
  }

  // 8. SoundCloud
  if (platformId === 'soundcloud') {
    return {
      appTheme: 'soundcloud',
      appColor: '#ff5500',
      headline: 'SoundCloud Audio Options',
      subhead: 'Studio audio extraction & lossless downloads',
      presets: [
        {
          id: 'sc-mp3-320',
          label: 'Studio Audio (MP3)',
          format: 'mp3',
          quality: '320k',
          badge: '320 kbps Ultra',
          icon: 'music',
          desc: 'Maximum fidelity MP3 with album artwork',
          recommended: true
        },
        {
          id: 'sc-wav-lossless',
          label: 'Lossless WAV',
          format: 'wav',
          quality: 'best',
          badge: 'Master Quality',
          icon: 'music',
          desc: 'Studio master without compression'
        },
        {
          id: 'sc-flac-lossless',
          label: 'FLAC Audio',
          format: 'flac',
          quality: 'best',
          badge: 'Lossless FLAC',
          icon: 'music',
          desc: 'Lossless compressed audio'
        },
        {
          id: 'sc-art-hd',
          label: 'Album Artwork',
          format: 'cover',
          quality: 'original',
          badge: 'HD Cover Art',
          icon: 'image',
          desc: 'Download original track artwork'
        }
      ]
    };
  }

  // Default Web Media
  return {
    appTheme: 'web',
    appColor: '#1ed760',
    headline: 'Media Download Options',
    subhead: 'Select your preferred audio or video format',
    presets: [
      {
        id: 'web-mp3-320',
        label: 'High-Quality MP3',
        format: 'mp3',
        quality: '320k',
        badge: '320 kbps HQ',
        icon: 'music',
        desc: 'Studio-grade MP3 audio extraction',
        recommended: true
      },
      {
        id: 'web-mp4-video',
        label: 'HD Video (MP4)',
        format: 'mp4',
        quality: 'best',
        badge: 'Best Available',
        icon: 'video',
        desc: 'Original video format with sound'
      },
      {
        id: 'web-m4a-fast',
        label: 'Fast Copy (M4A)',
        format: 'm4a',
        quality: 'best',
        badge: 'Direct Copy',
        icon: 'zap',
        desc: 'Direct audio stream copy'
      }
    ]
  };
}

/**
 * Clean & normalize any media URL with SSRF & protocol validation
 */
function normalizeUrl(rawUrl) {
  if (!rawUrl || typeof rawUrl !== 'string') {
    throw new Error('URL is required');
  }
  let url = rawUrl.trim();

  // Prevent null-byte injection
  if (url.includes('\0')) {
    throw new Error('Invalid URL format: null bytes detected.');
  }

  // If protocol scheme is provided, verify it is strictly HTTP or HTTPS
  const schemeMatch = url.match(/^([a-zA-Z][a-zA-Z0-9+.-]*):/);
  if (schemeMatch) {
    const scheme = schemeMatch[1].toLowerCase();
    if (scheme !== 'http' && scheme !== 'https') {
      throw new Error('Only HTTP and HTTPS URLs are authorized.');
    }
  } else {
    // Add default https protocol if omitted
    url = 'https://' + url;
  }

  let parsed;
  try {
    parsed = new URL(url);
  } catch (e) {
    throw new Error('Please enter a valid link from YouTube, Instagram, TikTok, Twitter/X, Facebook, SoundCloud, Reddit, etc.');
  }

  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
    throw new Error('Only HTTP and HTTPS URLs are authorized.');
  }

  const rawHostname = parsed.hostname.toLowerCase();
  const hostname = rawHostname.replace(/\.+$/, '');
  if (!hostname) {
    throw new Error('Please enter a valid link from YouTube, Instagram, TikTok, Twitter/X, Facebook, SoundCloud, Reddit, etc.');
  }

  // SSRF & Local/Private IP / Cloud Metadata Prevention
  const isLoopback = (
    hostname === 'localhost' ||
    hostname === '127.0.0.1' ||
    hostname === '0.0.0.0' ||
    hostname === '::1' ||
    hostname === '[::1]' ||
    hostname.startsWith('127.') ||
    hostname.endsWith('.localhost') ||
    hostname === 'localhost.localdomain' ||
    hostname.endsWith('.localhost.localdomain') ||
    hostname === 'local' ||
    hostname.endsWith('.local') ||
    hostname === '169.254.169.254' ||
    hostname === 'metadata.google.internal'
  );

  // Private RFC 1918 & Carrier-grade NAT IPv4 check
  const isPrivateIp = (
    /^10\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(hostname) ||
    /^172\.(1[6-9]|2\d|3[0-1])\.\d{1,3}\.\d{1,3}$/.test(hostname) ||
    /^192\.168\.\d{1,3}\.\d{1,3}$/.test(hostname) ||
    /^100\.(6[4-9]|[7-9]\d|1[0-1]\d|12[0-7])\.\d{1,3}\.\d{1,3}$/.test(hostname) ||
    /^169\.254\.\d{1,3}\.\d{1,3}$/.test(hostname)
  );

  if (isLoopback || isPrivateIp) {
    throw new Error('Access to local, internal, or cloud metadata network addresses is strictly prohibited.');
  }

  if (!hostname.includes('.')) {
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
 * Parses Netscape cookie file metadata without ever returning secret cookie values
 */
function parseNetscapeCookieEntries(rawContent) {
  if (!rawContent || typeof rawContent !== 'string') return [];
  const lines = rawContent.split(/\r?\n/);
  const entries = [];
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || (trimmed.startsWith('#') && !trimmed.startsWith('#HttpOnly_'))) {
      continue;
    }
    const cleanLine = trimmed.startsWith('#HttpOnly_') ? trimmed.slice('#HttpOnly_'.length) : trimmed;
    const cols = cleanLine.split('\t');
    if (cols.length >= 7 && cols[0]) {
      entries.push(cols[0].replace(/^\./, '').toLowerCase());
    }
  }
  return entries;
}

function getCookiesStatus() {
  const cookiePath = getCookiePath();
  if (!cookiePath) {
    return {
      configured: false,
      source: null,
      entryCount: 0,
      domainCount: 0,
      sampleDomains: [],
      updatedAt: null
    };
  }
  try {
    const raw = fs.readFileSync(cookiePath, 'utf8');
    const stat = fs.statSync(cookiePath);
    const domains = parseNetscapeCookieEntries(raw);
    const uniqueDomains = Array.from(new Set(domains));
    return {
      configured: true,
      source: cookiePath.startsWith(__dirname) ? 'server/cookies.txt' : 'cookies.txt',
      entryCount: domains.length,
      domainCount: uniqueDomains.length,
      sampleDomains: uniqueDomains.slice(0, 6),
      updatedAt: stat.mtimeMs
    };
  } catch {
    return {
      configured: false,
      source: null,
      entryCount: 0,
      domainCount: 0,
      sampleDomains: [],
      updatedAt: null
    };
  }
}

function saveCookiesContent(rawContent) {
  if (typeof rawContent !== 'string' || !rawContent.trim()) {
    throw new Error('Cookie file contents cannot be empty.');
  }
  if (rawContent.length > 512 * 1024) {
    throw new Error('Cookie file exceeds 512 KB limit.');
  }
  const domains = parseNetscapeCookieEntries(rawContent);
  if (domains.length === 0) {
    throw new Error('Invalid cookie format. Please paste or upload a Netscape cookies.txt export with tab-separated entries.');
  }
  const normalized = rawContent.startsWith('#')
    ? rawContent
    : `# Netscape HTTP Cookie File\n${rawContent}`;
  const targetPath = path.join(__dirname, 'cookies.txt');
  fs.writeFileSync(targetPath, normalized, { encoding: 'utf8', mode: 0o600 });
  return getCookiesStatus();
}

function deleteCookies() {
  const targets = [path.join(__dirname, 'cookies.txt'), path.join(__dirname, '..', 'cookies.txt')];
  for (const p of targets) {
    try {
      if (fs.existsSync(p)) {
        fs.unlinkSync(p);
      }
    } catch {}
  }
  return getCookiesStatus();
}

/**
 * Normalizes and translates raw yt-dlp error output into user-friendly error messages.
 * Prevents raw stack traces and internal bug-report URLs from leaking to the frontend.
 *
 * @param {string|Error} rawErrorText - Raw stderr or error string from yt-dlp / FFmpeg
 * @param {string} [fallbackMessage] - Default fallback message if no pattern matches
 * @returns {string} Sanitized, user-friendly error message
 */
function formatYtDlpError(rawErrorText, fallbackMessage = 'Unable to process media. Please verify the URL or try again.') {
  const errText = (rawErrorText || '').toString();

  if (errText.includes('This video is unavailable') || errText.includes('Video unavailable')) {
    return 'This media is unavailable or has been deleted.';
  }
  if (errText.includes('Private') || errText.includes('private')) {
    return 'This content is marked private or restricted.';
  }
  if (
    errText.includes('No video formats found') ||
    errText.includes('There is no video in this post') ||
    errText.includes('no video in this post') ||
    errText.includes('does not contain any video')
  ) {
    return 'This Instagram post contains only photos/images (no video or audio stream). SonicWave converts video and audio media (Reels, Videos, MP3, MP4). Photo-only posts cannot be converted to media files.';
  }
  if (errText.includes('unable to obtain file audio codec with ffprobe') || errText.includes('does not contain any audio stream')) {
    return 'This post does not contain an audio stream (silent video or photo). Please select MP4 to download the video or Cover for the photo.';
  }
  if (errText.includes('Sign in to confirm your age')) {
    return 'This media is age-restricted and requires sign-in.';
  }
  if (errText.includes('Sign in') || errText.includes('bot')) {
    return 'Platform verification or login required. Please try another link or export cookies.txt.';
  }

  const match = errText.match(/ERROR:\s*(?:\[[^\]]+\]\s*)?([^\r\n]+)/i);
  if (match && match[1]) {
    return match[1].replace(/;\s*please report this issue on\s*https?:\/\/[^\s]+/i, '').trim();
  }

  return fallbackMessage;
}

function analyzePlaylistUrl(rawUrl) {
  if (!rawUrl || typeof rawUrl !== 'string') {
    return { isExplicitPlaylist: false, hasPlaylistParam: false };
  }
  try {
    const parsed = new URL(rawUrl);
    const host = parsed.hostname.toLowerCase();
    const pathLower = parsed.pathname.toLowerCase();
    const listParam = parsed.searchParams.get('list');
    const isYt = host.includes('youtube.com') || host.includes('youtu.be');
    const isExplicitYtPlaylist = isYt && pathLower === '/playlist' && Boolean(listParam);
    const isSoundCloudSet = host.includes('soundcloud.com') && pathLower.includes('/sets/');
    const isBandcampAlbum = host.includes('bandcamp.com') && pathLower.includes('/album/');
    return {
      isExplicitPlaylist: Boolean(isExplicitYtPlaylist || isSoundCloudSet || isBandcampAlbum),
      hasPlaylistParam: Boolean((isYt && listParam) || isSoundCloudSet || isBandcampAlbum)
    };
  } catch {
    return { isExplicitPlaylist: false, hasPlaylistParam: false };
  }
}

/**
 * Fetch playlist / album track listing via yt-dlp --flat-playlist
 */
function getPlaylistInfo(rawUrl) {
  return new Promise((resolve, reject) => {
    let url;
    try {
      url = normalizeUrl(rawUrl);
    } catch (err) {
      return reject(err);
    }

    const ytDlp = getYtDlpPath();
    const cookiePath = getCookiePath();
    const cookieFlags = cookiePath ? ['--cookies', cookiePath] : [];
    const lowerUrl = url.toLowerCase();
    const isYouTube = lowerUrl.includes('youtube.com') || lowerUrl.includes('youtu.be');

    const args = [
      '--flat-playlist',
      '--dump-single-json',
      '--no-warnings',
      ...cookieFlags,
      '--user-agent', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
      '--js-runtimes', 'node',
      '--',
      url
    ];

    execFile(ytDlp, args, { maxBuffer: 25 * 1024 * 1024 }, (error, stdout, stderr) => {
      if (error) {
        return reject(new Error(formatYtDlpError(stderr || error.message, 'Unable to load playlist items.')));
      }
      try {
        const data = JSON.parse(stdout);
        const rawEntries = Array.isArray(data.entries) ? data.entries : [];
        if (rawEntries.length === 0) {
          return reject(new Error('No downloadable tracks found in this playlist.'));
        }

        const platform = detectPlatform(url);
        const playlistEntries = rawEntries
          .filter((entry) => entry && (entry.url || entry.webpage_url || entry.id))
          .slice(0, 100)
          .map((entry, idx) => {
            let entryUrl = entry.webpage_url || entry.url || '';
            if (entryUrl && !/^https?:\/\//i.test(entryUrl)) {
              entryUrl = isYouTube ? `https://www.youtube.com/watch?v=${entryUrl}` : url;
            }
            const itemDur = Number(entry.duration) || 0;
            const thumb = (Array.isArray(entry.thumbnails) && entry.thumbnails.length > 0)
              ? entry.thumbnails[entry.thumbnails.length - 1].url
              : (entry.thumbnail || '');
            return {
              id: entry.id || `track-${idx + 1}`,
              index: idx + 1,
              title: entry.title || `Track ${idx + 1}`,
              uploader: entry.uploader || entry.channel || data.uploader || data.channel || `${platform} Creator`,
              duration: itemDur,
              durationFormatted: formatDuration(itemDur),
              thumbnail: thumb,
              url: entryUrl
            };
          });

        const firstThumb = playlistEntries[0]?.thumbnail || '';
        const coverThumb = (Array.isArray(data.thumbnails) && data.thumbnails.length > 0)
          ? data.thumbnails[data.thumbnails.length - 1].url
          : (data.thumbnail || firstThumb);

        const presets = [
          {
            id: 'playlist_mp3_320',
            format: 'mp3',
            quality: '320k',
            label: 'All Selected Tracks (320k MP3)',
            badge: 'Batch HQ',
            recommended: true
          },
          {
            id: 'playlist_m4a',
            format: 'm4a',
            quality: '320k',
            label: 'Fast AAC Audio (M4A)',
            badge: 'Fast Copy'
          },
          {
            id: 'playlist_mp4_1080',
            format: 'mp4',
            quality: '1080p',
            label: 'Batch HD Video (1080p MP4)',
            badge: 'Full HD'
          }
        ];

        resolve({
          id: data.id || 'playlist',
          url: data.webpage_url || url,
          title: data.title || `${platform} Playlist`,
          uploader: data.uploader || data.channel || `${platform} Creator`,
          platform,
          platformId: platform.toLowerCase().includes('soundcloud') ? 'soundcloud' : 'youtube',
          contentType: 'playlist',
          contentCategory: 'playlist',
          contentLabel: 'Playlist',
          isPlaylist: true,
          isCarousel: false,
          isPhoto: false,
          hasAudio: true,
          itemCount: playlistEntries.length,
          playlistEntries,
          contentBadge: `🎶 Playlist • ${playlistEntries.length} tracks`,
          tailoredOptions: {
            appTheme: platform.toLowerCase().includes('soundcloud') ? 'soundcloud' : 'youtube',
            headline: `Batch Playlist Extraction (${playlistEntries.length} tracks)`,
            subhead: 'Select tracks below and queue multi-threaded conversions',
            presets
          },
          presets,
          duration: playlistEntries.reduce((acc, item) => acc + (item.duration || 0), 0),
          durationFormatted: `${playlistEntries.length} tracks`,
          thumbnail: coverThumb,
          viewCount: data.view_count || 0
        });
      } catch (parseErr) {
        reject(new Error('Failed to parse playlist metadata.'));
      }
    });
  });
}

/**
 * Get Video/Audio Metadata via yt-dlp across all social platforms
 */
function getVideoInfo(rawUrl, options = {}) {
  return new Promise((resolve, reject) => {
    let url;
    try {
      url = normalizeUrl(rawUrl);
    } catch (err) {
      return reject(err);
    }

    const playlistCheck = analyzePlaylistUrl(url);
    if (options.playlist || playlistCheck.isExplicitPlaylist) {
      return getPlaylistInfo(url).then(resolve).catch(reject);
    }

    const lowerUrl = typeof url === 'string' ? url.toLowerCase() : '';
    const isYouTube = lowerUrl.includes('youtube.com') || lowerUrl.includes('youtu.be');
    const ytDlp = getYtDlpPath();
    const cookiePath = getCookiePath();
    const cookieFlags = cookiePath ? ['--cookies', cookiePath] : [];

    const args = [
      '--dump-single-json',
      '--no-warnings',
      '--no-playlist',
      ...(isYouTube && !cookiePath ? ['--extractor-args', 'youtube:player_client=ios,android'] : []),
      ...cookieFlags,
      '--user-agent', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
      '--js-runtimes', 'node',
      '--',
      url
    ];

    execFile(ytDlp, args, { maxBuffer: 20 * 1024 * 1024 }, async (error, stdout, stderr) => {
      if (error) {
        console.error('[converter] Error fetching media info:', stderr || error.message);
        const errText = (stderr || error.message || '').toString();

        // If yt-dlp failed because the link contains static photos (e.g. Instagram photo/carousel, Reddit, Twitter)
        if (
          isPhotoSupportedUrl(url) ||
          errText.includes('No video formats found') ||
          errText.includes('There is no video in this post') ||
          errText.includes('no video in this post')
        ) {
          try {
            console.log(`[converter] Attempting photo/carousel fallback resolution for: ${url}`);
            const photoInfo = await resolvePhotoMetadata(url);
            if (photoInfo && Array.isArray(photoInfo.photos) && photoInfo.photos.length > 0) {
              return resolve(photoInfo);
            }
          } catch (photoErr) {
            console.warn(`[converter] Photo resolution fallback failed: ${photoErr.message}`);
          }
        }

        const errorMsg = formatYtDlpError(
          stderr || error.message,
          'Unable to fetch media details. Please verify the URL or try again.'
        );
        return reject(new Error(errorMsg));
      }

      try {
        const data = JSON.parse(stdout);

        const isCarousel = data._type === 'playlist' || (Array.isArray(data.entries) && data.entries.length > 0);
        const entries = isCarousel ? data.entries : [];
        const primaryItem = isCarousel && entries.length > 0 ? (entries[0] || {}) : data;

        // Pick highest resolution thumbnail
        let thumbnail = data.thumbnail || primaryItem.thumbnail;
        const candidateThumbs = (Array.isArray(primaryItem.thumbnails) && primaryItem.thumbnails.length > 0)
          ? primaryItem.thumbnails
          : (Array.isArray(data.thumbnails) ? data.thumbnails : []);
        if (candidateThumbs.length > 0) {
          const sorted = [...candidateThumbs].sort((a, b) => (b.width || 0) - (a.width || 0));
          thumbnail = sorted[0].url || thumbnail;
        }

        // Detect if media has an audio stream
        let hasAudio = false;
        if (isCarousel && entries.length > 0) {
          hasAudio = entries.some(e => Array.isArray(e.formats) && e.formats.some(f => f.acodec && f.acodec !== 'none'));
        } else if (Array.isArray(data.formats) && data.formats.length > 0) {
          hasAudio = data.formats.some(f => f.acodec && f.acodec !== 'none');
        } else if (data.acodec && data.acodec !== 'none') {
          hasAudio = true;
        }

        const duration = Number(primaryItem.duration || data.duration) || 0;
        const platform = detectPlatform(url);
        const classification = classifyMediaContent(url, primaryItem, {
          isCarousel,
          itemCount: entries.length,
          hasAudio
        });

        const tailoredOptions = getTailoredDownloadOptions({
          platformId: classification.platformId,
          contentType: classification.contentType,
          isReel: classification.isReel,
          isPost: classification.isPost,
          duration: duration,
          data: primaryItem,
          isCarousel,
          itemCount: entries.length,
          hasAudio
        });

        const info = {
          id: primaryItem.id || data.id,
          url: data.webpage_url || url,
          title: primaryItem.title || data.title || `${platform} Media`,
          uploader: primaryItem.uploader || data.uploader || primaryItem.channel || data.channel || `${platform} Creator`,
          platform: classification.platform || platform,
          platformId: classification.platformId,
          contentType: classification.contentType,
          contentCategory: classification.contentCategory,
          contentLabel: classification.contentLabel,
          isReel: classification.isReel,
          isPost: classification.isPost,
          isCarousel: isCarousel,
          itemCount: entries.length || 1,
          hasAudio: hasAudio,
          isShort: classification.isShort,
          isAudio: classification.isAudio,
          isPhoto: classification.isPhoto,
          aspectRatio: classification.aspectRatio,
          contentBadge: classification.badge,
          tailoredOptions: tailoredOptions,
          presets: tailoredOptions.presets || [],
          channelUrl: primaryItem.channel_url || data.channel_url || primaryItem.uploader_url || data.uploader_url || null,
          duration: duration,
          durationFormatted: formatDuration(duration),
          isUltraLong: duration >= 7200, // >= 2 hours (handles 10h, 24h, 100h+)
          thumbnail: thumbnail,
          viewCount: primaryItem.view_count || data.view_count || primaryItem.like_count || data.like_count || 0,
          uploadDate: primaryItem.upload_date || data.upload_date || '',
          description: (primaryItem.description || data.description || '').slice(0, 300),
          hasPlaylistHint: Boolean(playlistCheck.hasPlaylistParam)
        };

        resolve(info);
      } catch (parseErr) {
        console.error('[converter] JSON parse error:', parseErr.message);
        reject(new Error('Failed to parse media information.'));
      }
    });
  });
}

let aria2Cache = null;

/**
 * Check if aria2c external downloader is available on system or in bin directory
 */
function isAria2Available(forceRecheck = false) {
  if (!forceRecheck && aria2Cache !== null) {
    return aria2Cache;
  }

  // 1. Check local bin directory (server/bin)
  try {
    const binDir = getBinDir();
    const localAria2 = path.join(binDir, process.platform === 'win32' ? 'aria2c.exe' : 'aria2c');
    if (fs.existsSync(localAria2)) {
      execFileSync(localAria2, ['-v'], { stdio: 'ignore', timeout: 3000 });
      aria2Cache = true;
      return true;
    }
  } catch {}

  // 2. Check system PATH
  try {
    execFileSync('aria2c', ['-v'], { stdio: 'ignore', timeout: 3000 });
    aria2Cache = true;
    return true;
  } catch {
    aria2Cache = false;
    return false;
  }
}

/**
 * Manually set aria2 availability cache (useful for testing fallback paths)
 */
function setAria2Available(available) {
  aria2Cache = available;
}

/**
 * Validates clip trim timestamps (SS, MM:SS, HH:MM:SS, optional ms)
 */
function sanitizeTimestamp(raw) {
  if (raw === null || raw === undefined) return '';
  const trimmed = String(raw).trim();
  if (!trimmed) return '';
  if (/^(?:\d+(?:\.\d{1,3})?|\d{1,2}:\d{2}(?:\.\d{1,3})?|\d{1,2}:\d{2}:\d{2}(?:\.\d{1,3})?)$/.test(trimmed)) {
    return trimmed;
  }
  return '';
}

/**
 * Build yt-dlp CLI arguments for audio or video conversion
 */
function buildConversionArgs({
  url,
  format = 'mp3',
  quality = '320k',
  outputTemplate,
  cookiePath = null,
  ffmpegLocation = null,
  useAria2 = null,
  turbo = true,
  trimStart = '',
  trimEnd = '',
  normalizeAudio = false,
  sponsorBlock = false
}) {
  const validFormats = ['mp3', 'm4a', 'wav', 'flac', 'mp4'];
  const safeFormat = typeof format === 'string' ? format.toLowerCase() : 'mp3';
  const targetFormat = validFormats.includes(safeFormat) ? safeFormat : 'mp3';
  const isVideo = targetFormat === 'mp4';

  // Sanitize and whitelist quality values
  const validAudioQualities = ['320k', '256k', '192k', '128k', '0', '5', '9'];
  const validVideoQualities = ['1080p', '720p', '480p', 'best'];
  let targetQuality = quality;
  if (isVideo) {
    targetQuality = validVideoQualities.includes(quality) ? quality : '1080p';
  } else {
    targetQuality = validAudioQualities.includes(quality) ? quality : '320k';
  }

  const lowerUrl = typeof url === 'string' ? url.toLowerCase() : '';
  const isYouTube = lowerUrl.includes('youtube.com') || lowerUrl.includes('youtu.be');
  const cookieFlags = cookiePath ? ['--cookies', cookiePath] : [];
  const ffmpegFlags = ffmpegLocation ? ['--ffmpeg-location', ffmpegLocation] : [];

  const aria2Active = useAria2 !== null ? Boolean(useAria2) : (turbo ? isAria2Available() : false);
  const aria2Flags = aria2Active ? [
    '--downloader', 'aria2c',
    '--downloader-args', 'aria2c:-s 16 -x 16 -k 1M -j 16'
  ] : [];

  // Download and performance optimization flags (omit -N 16 when aria2c external downloader handles sockets)
  const speedFlags = [
    ...(turbo && !aria2Active ? ['-N', '16'] : []),
    ...(turbo ? ['--buffer-size', '16M', '--http-chunk-size', '5M'] : []),
    ...(isYouTube && !cookiePath ? ['--extractor-args', 'youtube:player_client=ios,android'] : []),
    ...cookieFlags,
    ...aria2Flags,
    '--user-agent', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
    '--js-runtimes', 'node',
    '--retries', '10',
    '--fragment-retries', '10',
    '--skip-unavailable-fragments',
    '--no-mtime'
  ];

  let hostname = '';
  let pathname = '';
  try {
    const parsed = new URL(url.includes('://') ? url : `https://${url}`);
    hostname = parsed.hostname.toLowerCase();
    pathname = parsed.pathname.toLowerCase();
  } catch {}

  const isInstagram = hostname === 'instagram.com' || hostname.endsWith('.instagram.com') || hostname === 'instagr.am' || hostname.endsWith('.instagr.am');
  const isMultiItemCandidate = isInstagram && (pathname.includes('/p/') || pathname.includes('/reel/') || pathname.includes('/reels/'));
  const itemFlags = isMultiItemCandidate ? ['--playlist-items', '1'] : [];

  const startTs = sanitizeTimestamp(trimStart);
  const endTs = sanitizeTimestamp(trimEnd);
  const trimFlags = (startTs || endTs)
    ? ['--download-sections', `*${startTs || '0'}-${endTs || 'inf'}`, '--force-keyframes-at-cuts']
    : [];
  const sponsorFlags = (isYouTube && Boolean(sponsorBlock))
    ? ['--sponsorblock-remove', 'sponsor']
    : [];

  let args = [];

  if (isVideo) {
    // Video download with resolution filter & Direct Stream Copy MP4 merge
    let formatFilter = 'bv*[ext=mp4]+ba[ext=m4a]/b[ext=mp4] / bv*+ba/b';
    if (targetQuality === '1080p') {
      formatFilter = 'bv*[height<=1080][ext=mp4]+ba[ext=m4a]/bv*[height<=1080]+ba/b[height<=1080] / bv*+ba/b';
    } else if (targetQuality === '720p') {
      formatFilter = 'bv*[height<=720][ext=mp4]+ba[ext=m4a]/bv*[height<=720]+ba/b[height<=720] / bv*+ba/b';
    } else if (targetQuality === '480p') {
      formatFilter = 'bv*[height<=480][ext=mp4]+ba[ext=m4a]/bv*[height<=480]+ba/b[height<=480] / bv*+ba/b';
    }

    args = [
      '-f', formatFilter,
      '--merge-output-format', 'mp4',
      '--postprocessor-args', 'Merger:-c copy -threads 0',
      '--output', outputTemplate,
      '--newline',
      '--no-playlist',
      ...itemFlags,
      ...trimFlags,
      ...sponsorFlags,
      '--embed-metadata',
      '--embed-thumbnail',
      ...ffmpegFlags,
      ...speedFlags,
      '--',
      url
    ];
  } else {
    // Audio extraction with multi-threaded encoding, stream copy, or loudnorm
    let audioFilter = 'ba/b';
    let postArgs = normalizeAudio
      ? 'ExtractAudio:-af loudnorm=I=-14:TP=-1.5:LRA=11 -threads 0'
      : 'ExtractAudio:-threads 0';

    if (targetFormat === 'm4a') {
      // Stream-copy native AAC/M4A tracks directly without forced re-encoding bitrate
      audioFilter = 'ba[ext=m4a][acodec^=mp4a]/ba[ext=m4a]/ba/b';
    }

    args = [
      '-f', audioFilter,
      '--extract-audio',
      '--audio-format', targetFormat,
      ...(targetFormat === 'm4a' ? [] : ['--audio-quality', targetQuality]),
      '--postprocessor-args', postArgs,
      '--output', outputTemplate,
      '--newline',
      '--no-playlist',
      ...itemFlags,
      ...trimFlags,
      ...sponsorFlags,
      '--embed-metadata',
      '--embed-thumbnail',
      '--convert-thumbnails', 'jpg',
      ...ffmpegFlags,
      ...speedFlags,
      '--',
      url
    ];
  }

  return {
    args,
    targetFormat,
    targetQuality,
    isVideo,
    useAria2: aria2Active
  };
}

/**
 * Parse a single stdout line from yt-dlp or aria2c to update job state
 */
function parseProgress(line, jobState) {
  if (!line || !jobState) return;

  // Examples:
  // [download]   5.4% of   10.23MiB at    1.24MiB/s ETA 00:08
  // [download] 100% of   10.23MiB in 00:03
  // [#123456 2.5MiB/23.4MiB(10%) CN:16 DL:2.8MiB ETA:7s]
  // [#366579 0B/23.4MiB CN:1 DL:0B]
  // [ExtractAudio] Destination: ...
  // [Metadata] Adding metadata...
  // [ThumbnailsConvertor] Converting thumbnail...

  const isYtDlpDownload = line.includes('[download]');
  const isAria2Download = line.includes('[#') && (line.includes('(') || line.includes('CN:') || line.includes('DL:'));

  if (isYtDlpDownload || isAria2Download) {
    jobState.status = 'downloading';
    const percentMatch = line.match(/(\d+(?:\.\d+)?)%/);
    if (percentMatch) {
      jobState.progress = Math.min(Math.round(parseFloat(percentMatch[1])), 95);
    }

    // Match high speeds (e.g., 28.5MiB/s, 1.2GiB/s, 450KiB/s, aria2 DL:2.8MiB or DL:2.8MiB/s, or initial DL:0B)
    const speedMatch = line.match(/(?:at|DL:)\s*([\d.]+\s*(?:[KMGTkmgt]i?)?B(?:\/s)?)/i);
    if (speedMatch) {
      const rawSpeed = speedMatch[1].trim();
      jobState.speed = rawSpeed.endsWith('/s') ? rawSpeed : `${rawSpeed}/s`;
    }

    // Match ETA (e.g., ETA 03:45, ETA:7s, ETA 01:23:45)
    const etaMatch = line.match(/ETA:?\s*([\d:smhd]+)/i);
    if (etaMatch) {
      jobState.eta = etaMatch[1];
    }

    // Match file sizes
    const sizeMatch = line.match(/(?:of\s+~?|\/)([\d.]+\s*(?:[KMGTkmgt]i?)?B)/i);
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
}

const VALID_MEDIA_EXTENSIONS = new Set(['.mp3', '.m4a', '.wav', '.flac', '.mp4']);

/**
 * Validates whether a file extension or filename corresponds to an authorized media output
 * @param {string} filenameOrExt
 * @returns {boolean}
 */
function isValidMediaExtension(filenameOrExt) {
  if (!filenameOrExt || typeof filenameOrExt !== 'string') return false;
  const ext = filenameOrExt.startsWith('.') ? filenameOrExt.toLowerCase() : path.extname(filenameOrExt).toLowerCase();
  return VALID_MEDIA_EXTENSIONS.has(ext);
}

/**
 * Locates the output media file for a job in DOWNLOADS_DIR, excluding metadata and partials
 * @param {string} jobId
 * @param {string} targetFormat
 * @returns {string|null} Full path to discovered file or null
 */
function findOutputFile(jobId, targetFormat) {
  const expectedFile = path.join(DOWNLOADS_DIR, `${jobId}.${targetFormat}`);
  if (fs.existsSync(expectedFile)) {
    return expectedFile;
  }
  const found = fs.readdirSync(DOWNLOADS_DIR).find(f => {
    if (!f.startsWith(jobId)) return false;
    const ext = path.extname(f).toLowerCase();
    return isValidMediaExtension(ext);
  });
  return found ? path.join(DOWNLOADS_DIR, found) : null;
}

/**
 * Non-blocking variant of findOutputFile for active child process completion.
 */
async function findOutputFileAsync(jobId, targetFormat) {
  const expectedFile = path.join(DOWNLOADS_DIR, `${jobId}.${targetFormat}`);
  try {
    await fs.promises.access(expectedFile, fs.constants.F_OK);
    return expectedFile;
  } catch {}
  try {
    const files = await fs.promises.readdir(DOWNLOADS_DIR);
    const found = files.find(f => {
      if (!f.startsWith(jobId)) return false;
      const ext = path.extname(f).toLowerCase();
      return isValidMediaExtension(ext);
    });
    return found ? path.join(DOWNLOADS_DIR, found) : null;
  } catch {
    return null;
  }
}

/**
 * Removes incomplete partial files for a given job ID without blocking the event loop.
 * @param {string} jobId
 */
async function cleanupJobPartialsAsync(jobId) {
  try {
    await fs.promises.access(DOWNLOADS_DIR, fs.constants.F_OK);
    const files = await fs.promises.readdir(DOWNLOADS_DIR);
    const partials = files.filter(f => f.startsWith(jobId));
    for (const part of partials) {
      try {
        const partPath = path.join(DOWNLOADS_DIR, part);
        const stat = await fs.promises.stat(partPath);
        if (stat.isFile()) {
          await fs.promises.unlink(partPath).catch(() => {});
        }
      } catch {}
    }
  } catch {}
}

/**
 * Attaches stdout, stderr, close, and error listeners to the conversion child process
 * @param {Object} jobState
 * @param {import('child_process').ChildProcess} child
 * @param {string} targetFormat
 */
function attachProcessListeners(jobState, child, targetFormat) {
  const parseProgressLine = (line) => {
    parseProgress(line, jobState);
  };

  if (child.stdout) {
    child.stdout.on('data', (chunk) => {
      const lines = chunk.toString().split(/\r?\n/);
      for (const line of lines) {
        if (line.trim()) {
          parseProgressLine(line.trim());
        }
      }
    });
  }

  let stderrBuffer = '';
  if (child.stderr) {
    child.stderr.on('data', (chunk) => {
      const errText = chunk.toString();
      stderrBuffer += errText;
      console.warn(`[converter ${jobState.id} stderr]:`, errText.trim());
    });
  }

  child.on('close', async (code) => {
    // Preserve user cancellation - do not overwrite with 'failed' on exit code
    if (jobState.status === 'cancelled') {
      return;
    }

    if (code === 0) {
      const outputFile = await findOutputFileAsync(jobState.id, targetFormat);
      if (outputFile) {
        const friendlyName = jobState.title
          ? `${jobState.title.replace(/[/\\?%*:|"<>]/g, '_')}.${targetFormat}`
          : path.basename(outputFile);
        const libraryPlacement = moveToPermanentLibrary(outputFile, friendlyName);
        jobState.status = 'completed';
        jobState.progress = 100;
        jobState.filePath = libraryPlacement.filePath;
        jobState.isPermanent = libraryPlacement.isPermanent;
        jobState.fileName = friendlyName;
        savePersistentHistory(jobState);
        console.log(`[converter] Job ${jobState.id} completed successfully with file ${jobState.fileName}${jobState.isPermanent ? ' (Permanent Library)' : ''}`);
      } else {
        jobState.status = 'failed';
        jobState.error = 'Output media file was not created.';
      }
    } else {
      jobState.status = 'failed';
      const errorMsg = formatYtDlpError(
        stderrBuffer,
        `Conversion failed (exit code ${code})`
      );
      jobState.error = errorMsg;
      console.error(`[converter] Job ${jobState.id} failed: ${errorMsg}`);

      // Clean up any incomplete partial files on error
      await cleanupJobPartialsAsync(jobState.id);
    }

    delete jobState.process;
    delete jobState._queuedOptions;
    setImmediate(processQueue);
  });

  child.on('error', (err) => {
    console.error(`[converter] Job ${jobState.id} failed to spawn:`, err.message);
    jobState.status = 'failed';
    jobState.error = err.message;
    delete jobState.process;
    delete jobState._queuedOptions;
    setImmediate(processQueue);
  });
}

function spawnQueuedConversion(jobState) {
  const opts = jobState._queuedOptions || {};
  const ytDlp = getYtDlpPath();
  const outputTemplate = path.join(DOWNLOADS_DIR, `${jobState.id}.%(ext)s`);
  const cookiePath = getCookiePath();
  const ffmpegLocation = getFfmpegLocation();

  const {
    args,
    targetFormat,
    targetQuality,
    isVideo,
    useAria2: activeAria2
  } = buildConversionArgs({
    url: jobState.url,
    format: opts.format || jobState.format,
    quality: opts.quality || jobState.quality,
    outputTemplate,
    cookiePath,
    ffmpegLocation,
    turbo: opts.turbo !== false,
    trimStart: opts.trimStart || '',
    trimEnd: opts.trimEnd || '',
    normalizeAudio: Boolean(opts.normalizeAudio),
    sponsorBlock: Boolean(opts.sponsorBlock)
  });

  jobState.format = targetFormat;
  jobState.quality = targetQuality;
  jobState.isVideo = isVideo;
  jobState.downloader = activeAria2 ? 'aria2c' : 'builtin';
  jobState.status = 'starting';
  jobState.queuePosition = null;
  jobState.speed = '0 KiB/s';
  jobState.eta = '--:--';

  console.log(`[converter] Starting job ${jobState.id} (Turbo: ${Boolean(jobState.turbo)}, downloader: ${activeAria2 ? 'aria2c' : 'builtin'}): ${jobState.url} (${targetFormat}, ${targetQuality})`);

  const binDir = getBinDir();
  const env = { ...process.env };
  const envPathKey = Object.keys(env).find(k => k.toLowerCase() === 'path') || (process.platform === 'win32' ? 'Path' : 'PATH');
  const currentPath = env[envPathKey] || '';
  if (binDir && !currentPath.includes(binDir)) {
    const updatedPath = `${binDir}${path.delimiter}${currentPath}`;
    for (const key of Object.keys(env)) {
      if (key.toLowerCase() === 'path') {
        env[key] = updatedPath;
      }
    }
    env[envPathKey] = updatedPath;
  }

  const child = spawn(ytDlp, args, { env });
  jobState.process = child;
  attachProcessListeners(jobState, child, targetFormat);
}

function processQueue() {
  while (jobQueue.length > 0 && getActiveJobCount() < MAX_CONCURRENT_CONVERSIONS) {
    const nextJobId = jobQueue.shift();
    const nextJob = jobs.get(nextJobId);
    if (!nextJob || nextJob.status !== 'queued') {
      continue;
    }
    spawnQueuedConversion(nextJob);
  }
  updateQueuePositions();
}

/**
 * Start Conversion Job
 */
function startConversion({
  url,
  format = 'mp3',
  quality = '320k',
  jobId,
  duration = 0,
  turbo = true,
  isPhoto = false,
  photos = [],
  title = '',
  artist = '',
  thumbnail = '',
  slideIndex = null,
  trimStart = '',
  trimEnd = '',
  normalizeAudio = false,
  sponsorBlock = false
}) {
  const targetFmt = (format || 'mp3').toLowerCase();
  const isPhotoJob = Boolean(isPhoto) || ['zip', 'jpg', 'jpeg', 'png', 'webp'].includes(targetFmt);

  if (isPhotoJob) {
    const jobState = {
      id: jobId,
      url,
      format: targetFmt,
      quality: quality || 'original',
      isVideo: false,
      isPhoto: true,
      turbo: Boolean(turbo),
      downloader: 'builtin',
      parallelStreams: 1,
      fragmentInfo: null,
      status: 'starting',
      progress: 0,
      speed: '0 KiB/s',
      eta: '--:--',
      totalSize: 'Calculating...',
      title: title || 'Photo',
      artist: artist || '',
      thumbnail: thumbnail || '',
      duration: 0,
      photos: Array.isArray(photos) ? photos : [],
      slideIndex: slideIndex ? Number(slideIndex) : null,
      filePath: null,
      fileName: null,
      error: null,
      createdAt: Date.now()
    };

    jobs.set(jobId, jobState);
    console.log(`[converter] Starting photo/carousel download job ${jobId}: ${url} (${targetFmt})`);

    // Run photo download job asynchronously and honor permanent library placement if configured
    downloadPhotoJob(jobState, targetFmt, DOWNLOADS_DIR, (completedPhotoJob) => {
      if (completedPhotoJob?.filePath) {
        const placement = moveToPermanentLibrary(
          completedPhotoJob.filePath,
          completedPhotoJob.fileName || path.basename(completedPhotoJob.filePath)
        );
        completedPhotoJob.filePath = placement.filePath;
        completedPhotoJob.isPermanent = placement.isPermanent;
      }
      savePersistentHistory(completedPhotoJob);
    });

    return jobState;
  }

  const outputTemplate = path.join(DOWNLOADS_DIR, `${jobId}.%(ext)s`);
  const cookiePath = getCookiePath();
  const ffmpegLocation = getFfmpegLocation();

  const {
    targetFormat,
    targetQuality,
    isVideo,
    useAria2: activeAria2
  } = buildConversionArgs({
    url,
    format,
    quality,
    outputTemplate,
    cookiePath,
    ffmpegLocation,
    turbo,
    trimStart,
    trimEnd,
    normalizeAudio: Boolean(normalizeAudio),
    sponsorBlock: Boolean(sponsorBlock)
  });

  const shouldQueue = getActiveJobCount() >= MAX_CONCURRENT_CONVERSIONS;
  const jobState = {
    id: jobId,
    url,
    format: targetFormat,
    quality: targetQuality,
    isVideo,
    turbo: Boolean(turbo),
    downloader: activeAria2 ? 'aria2c' : 'builtin',
    parallelStreams: turbo ? 16 : 1,
    fragmentInfo: null,
    status: shouldQueue ? 'queued' : 'starting',
    queuePosition: null,
    progress: 0,
    speed: shouldQueue ? 'Queued' : '0 KiB/s',
    eta: shouldQueue ? 'Waiting slot' : '--:--',
    totalSize: 'Calculating...',
    title: title || '',
    artist: artist || '',
    thumbnail: thumbnail || '',
    duration: typeof duration === 'number' && duration > 0 ? duration : 0,
    filePath: null,
    fileName: null,
    error: null,
    createdAt: Date.now(),
    _queuedOptions: { format, quality, turbo, trimStart, trimEnd, normalizeAudio: Boolean(normalizeAudio), sponsorBlock: Boolean(sponsorBlock) }
  };

  jobs.set(jobId, jobState);

  if (shouldQueue) {
    jobQueue.push(jobId);
    updateQueuePositions();
    console.log(`[converter] Queued job ${jobId} at position #${jobState.queuePosition}: ${url} (${targetFormat}, ${targetQuality})`);
  } else {
    spawnQueuedConversion(jobState);
  }

  return jobState;
}

/**
 * Get job state
 */
function getJob(jobId) {
  const job = jobs.get(jobId);
  if (!job) return null;
  // Return shallow copy without internal child/queue handles
  const { process, _queuedOptions, ...clean } = job;
  return clean;
}

/**
 * List completed history
 */
function getHistory() {
  const list = [];
  for (const [id, job] of jobs.entries()) {
    if (job.status === 'completed') {
      const { process, _queuedOptions, ...clean } = job;
      clean.isAvailable = clean.filePath ? fs.existsSync(clean.filePath) : false;
      list.push(clean);
    }
  }
  return list.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
}

/**
 * Cancel an active or queued conversion job
 */
function cancelConversion(jobId) {
  const job = jobs.get(jobId);
  if (!job) return false;

  if (job.status === 'queued') {
    job.status = 'cancelled';
    job.error = 'Conversion was cancelled by user.';
    job.queuePosition = null;
    delete job._queuedOptions;
    const idx = jobQueue.indexOf(jobId);
    if (idx !== -1) jobQueue.splice(idx, 1);
    updateQueuePositions();
    console.log(`[converter] Queued job ${jobId} cancelled.`);
    return true;
  }

  if (job.process && job.status !== 'completed' && job.status !== 'failed') {
    job.status = 'cancelled';
    job.error = 'Conversion was cancelled by user.';
    const pid = Number(job.process.pid);
    try {
      if (process.platform === 'win32' && Number.isInteger(pid) && pid > 0) {
        execFileSync('taskkill', ['/pid', String(pid), '/T', '/F'], { stdio: 'ignore' });
      } else if (job.process && typeof job.process.kill === 'function') {
        job.process.kill('SIGTERM');
      }
    } catch {}
    console.log(`[converter] Job ${jobId} cancelled.`);
    setImmediate(processQueue);

    // Clean up partial downloads on cancellation
    setTimeout(() => {
      cleanupJobPartialsAsync(jobId);
    }, 400).unref();
    return true;
  }
  return false;
}

/**
 * Get count of actively running conversions
 */
function getActiveJobCount() {
  let count = 0;
  for (const job of jobs.values()) {
    if (job.status === 'starting' || job.status === 'downloading' || job.status === 'converting' || job.status === 'tagging') {
      count++;
    }
  }
  return count;
}

module.exports = {
  getVideoInfo,
  getPlaylistInfo,
  analyzePlaylistUrl,
  formatYtDlpError,
  isPhotoSupportedUrl,
  resolvePhotoMetadata,
  downloadPhotoJob,
  startConversion,
  cancelConversion,
  getJob,
  getHistory,
  formatDuration,
  detectPlatform,
  classifyMediaContent,
  getTailoredDownloadOptions,
  getActiveJobCount,
  getQueueLength,
  processQueue,
  MAX_CONCURRENT_CONVERSIONS,
  MAX_QUEUE_SIZE,
  getServerSettings,
  updateServerSettings,
  getCookiesStatus,
  saveCookiesContent,
  deleteCookies,
  sanitizeTimestamp,
  DEFAULT_LIBRARY_DIR,
  normalizeUrl,
  DOWNLOADS_DIR,
  isAria2Available,
  setAria2Available,
  buildConversionArgs,
  parseProgress,
  VALID_MEDIA_EXTENSIONS,
  isValidMediaExtension,
  findOutputFile,
  attachProcessListeners,
  cleanOldDownloads,
  _jobs: jobs
};
