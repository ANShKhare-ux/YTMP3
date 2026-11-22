const { spawn, execFile, execFileSync } = require('child_process');
const path = require('path');
const fs = require('fs');
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

// In-memory active jobs tracker
const jobs = new Map();

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
      createdAt: job.createdAt || Date.now()
    };
    list = [cleanJob, ...list.filter(item => item.id !== job.id)].slice(0, 50);
    fs.writeFileSync(HISTORY_FILE, JSON.stringify(list, null, 2), 'utf8');
  } catch (err) {
    console.warn('[converter] Failed to save history to disk:', err.message);
  }
}

// Clean up downloads older than 2 hours every 30 minutes
function cleanOldDownloads(maxAge = 2 * 60 * 60 * 1000) {
  try {
    const now = Date.now();
    if (fs.existsSync(DOWNLOADS_DIR)) {
      const files = fs.readdirSync(DOWNLOADS_DIR);
      for (const file of files) {
        const fullPath = path.join(DOWNLOADS_DIR, file);
        try {
          const stats = fs.statSync(fullPath);
          if (stats.isFile() && (now - stats.mtimeMs > maxAge)) {
            try {
              fs.unlinkSync(fullPath);
            } catch (unlinkErr) {
              console.warn(`[converter] Could not unlink ${file}:`, unlinkErr.message);
            }
          }
        } catch {}
      }
    }

    // Evict old jobs from memory if their physical files are deleted
    for (const [id, job] of jobs.entries()) {
      if ((job.status === 'completed' || job.status === 'failed' || job.status === 'cancelled') &&
          now - (job.createdAt || 0) > maxAge) {
        if (!job.filePath || !fs.existsSync(job.filePath)) {
          jobs.delete(id);
        }
      }
    }
  } catch (err) {
    console.warn('[converter] cleanOldDownloads caught outer error:', err.message);
  }
}
setInterval(cleanOldDownloads, 30 * 60 * 1000).unref();

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

    const lowerUrl = typeof url === 'string' ? url.toLowerCase() : '';
    const isYouTube = lowerUrl.includes('youtube.com') || lowerUrl.includes('youtu.be');
    const ytDlp = getYtDlpPath();
    const cookiePath = getCookiePath();
    const cookieFlags = cookiePath ? ['--cookies', cookiePath] : [];

    const args = [
      '--dump-single-json',
      '--no-warnings',
      '--no-playlist',
      '--no-check-certificates',
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
          description: (primaryItem.description || data.description || '').slice(0, 300)
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
  turbo = true
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

  // Download and performance optimization flags
  const speedFlags = [
    ...(turbo ? ['-N', '16', '--buffer-size', '16M', '--http-chunk-size', '5M'] : []),
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
      '--embed-metadata',
      '--embed-thumbnail',
      '--no-check-certificates',
      ...ffmpegFlags,
      ...speedFlags,
      '--',
      url
    ];
  } else {
    // Audio extraction with multi-threaded encoding or stream copy
    let audioFilter = 'ba/b';
    let postArgs = 'ExtractAudio:-threads 0';

    if (targetFormat === 'm4a') {
      // Stream copy AAC when available
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
      '--audio-quality', targetQuality,
      '--postprocessor-args', postArgs,
      '--output', outputTemplate,
      '--newline',
      '--no-playlist',
      ...itemFlags,
      '--embed-metadata',
      '--embed-thumbnail',
      '--convert-thumbnails', 'jpg',
      '--no-check-certificates',
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

  child.on('close', (code) => {
    // Preserve user cancellation - do not overwrite with 'failed' on exit code
    if (jobState.status === 'cancelled') {
      return;
    }

    if (code === 0) {
      const outputFile = findOutputFile(jobState.id, targetFormat);
      if (outputFile) {
        jobState.status = 'completed';
        jobState.progress = 100;
        jobState.filePath = outputFile;
        jobState.fileName = jobState.title
          ? `${jobState.title.replace(/[/\\?%*:|"<>]/g, '_')}.${targetFormat}`
          : path.basename(outputFile);
        savePersistentHistory(jobState);
        console.log(`[converter] Job ${jobState.id} completed successfully with file ${jobState.fileName}`);
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
      try {
        if (fs.existsSync(DOWNLOADS_DIR)) {
          const partials = fs.readdirSync(DOWNLOADS_DIR).filter(f => f.startsWith(jobState.id));
          for (const part of partials) {
            try {
              const partPath = path.join(DOWNLOADS_DIR, part);
              if (fs.statSync(partPath).isFile()) {
                fs.unlinkSync(partPath);
              }
            } catch {}
          }
        }
      } catch {}
    }
  });

  child.on('error', (err) => {
    console.error(`[converter] Job ${jobState.id} failed to spawn:`, err.message);
    jobState.status = 'failed';
    jobState.error = err.message;
  });
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
  slideIndex = null
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

    // Run photo download job asynchronously
    downloadPhotoJob(jobState, targetFmt, DOWNLOADS_DIR, savePersistentHistory);

    return jobState;
  }

  const ytDlp = getYtDlpPath();
  const ffmpeg = getFfmpegPath();

  // Output filename template
  const outputTemplate = path.join(DOWNLOADS_DIR, `${jobId}.%(ext)s`);

  const cookiePath = getCookiePath();
  const ffmpegLocation = getFfmpegLocation();

  const {
    args,
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
    turbo
  });

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
    status: 'starting', // starting, downloading, converting, completed, failed
    progress: 0,
    speed: '0 KiB/s',
    eta: '--:--',
    totalSize: 'Calculating...',
    title: '',
    artist: '',
    thumbnail: '',
    duration: typeof duration === 'number' && duration > 0 ? duration : 0,
    filePath: null,
    fileName: null,
    error: null,
    createdAt: Date.now()
  };

  jobs.set(jobId, jobState);

  console.log(`[converter] Starting job ${jobId} (Turbo: ${Boolean(turbo)}, downloader: ${activeAria2 ? 'aria2c' : 'builtin'}): ${url} (${targetFormat}, ${targetQuality})`);

  // Ensure binDir is in PATH so yt-dlp can locate local aria2c or ffmpeg
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
      clean.isAvailable = clean.filePath ? fs.existsSync(clean.filePath) : false;
      list.push(clean);
    }
  }
  return list.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
}

/**
 * Cancel an active conversion job
 */
function cancelConversion(jobId) {
  const job = jobs.get(jobId);
  if (!job) return false;
  if (job.process && job.status !== 'completed' && job.status !== 'failed') {
    job.status = 'cancelled';
    job.error = 'Conversion was cancelled by user.';
    const pid = job.process.pid;
    try {
      if (process.platform === 'win32' && pid) {
        require('child_process').execSync(`taskkill /pid ${pid} /T /F`, { stdio: 'ignore' });
      } else {
        job.process.kill('SIGTERM');
      }
    } catch {}
    console.log(`[converter] Job ${jobId} cancelled.`);

    // Clean up partial downloads on cancellation
    setTimeout(() => {
      try {
        if (fs.existsSync(DOWNLOADS_DIR)) {
          const partials = fs.readdirSync(DOWNLOADS_DIR).filter(f => f.startsWith(jobId));
          for (const part of partials) {
            try {
              const partPath = path.join(DOWNLOADS_DIR, part);
              if (fs.statSync(partPath).isFile()) {
                fs.unlinkSync(partPath);
              }
            } catch {}
          }
        }
      } catch {}
    }, 400);
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
