const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const dns = require('dns');
const net = require('net');
const { Readable } = require('stream');
const crypto = require('crypto');
const { verifyBinaries, updateYtDlp, installAria2 } = require('./binManager');
const {
  getVideoInfo,
  startConversion,
  cancelConversion,
  getJob,
  getHistory,
  getActiveJobCount,
  getQueueLength,
  MAX_CONCURRENT_CONVERSIONS,
  MAX_QUEUE_SIZE,
  getServerSettings,
  updateServerSettings,
  getCookiesStatus,
  saveCookiesContent,
  deleteCookies,
  setAria2Available,
  normalizeUrl,
  DOWNLOADS_DIR
} = require('./converter');

const app = express();
const PORT = process.env.PORT || 3001;

// Security headers
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Permissions-Policy', 'geolocation=(), camera=(), microphone=()');
  next();
});

// CORS configuration
const ALLOWED_ORIGINS = new Set([
  'http://localhost:5173',
  'http://localhost:3001',
  'http://127.0.0.1:5173',
  'http://127.0.0.1:3001',
  'https://ytmp-3-five.vercel.app'
]);

app.use(cors({
  origin: (origin, callback) => {
    // Allow non-browser requests (null/undefined origin like desktop app, curl, electron)
    if (!origin) return callback(null, true);
    if (
      ALLOWED_ORIGINS.has(origin) ||
      origin.endsWith('.vercel.app') ||
      /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin)
    ) {
      return callback(null, true);
    }
    return callback(null, false);
  },
  methods: ['GET', 'POST', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Range']
}));

// Request body size limit
app.use(express.json({ limit: '512kb' }));

let systemStatus = {
  ready: false,
  ytDlp: false,
  ffmpeg: false,
  ytDlpVersion: null,
  ffmpegVersion: null
};

// System Health & Binary Status
app.get('/api/status', (req, res) => {
  res.json({
    success: true,
    status: {
      ...systemStatus,
      activeJobs: getActiveJobCount(),
      queuedJobs: getQueueLength(),
      maxConcurrency: MAX_CONCURRENT_CONVERSIONS
    }
  });
});

// Fetch Media Metadata
app.post('/api/info', async (req, res) => {
  if (!systemStatus.ready) {
    return res.status(503).json({
      success: false,
      error: 'Media engine is initializing components (yt-dlp / FFmpeg). Please try again shortly.'
    });
  }

  const { url, playlist = false } = req.body || {};
  if (!url || typeof url !== 'string' || !url.trim()) {
    return res.status(400).json({ success: false, error: 'Media URL is required' });
  }

  let cleanUrl;
  try {
    cleanUrl = normalizeUrl(url.trim());
  } catch (err) {
    return res.status(400).json({ success: false, error: err.message || 'Invalid media URL' });
  }

  try {
    const info = await getVideoInfo(cleanUrl, { playlist: Boolean(playlist) });
    res.json({ success: true, data: info });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message || 'Failed to fetch media information' });
  }
});

// Start Audio/Video Conversion
app.post('/api/convert', (req, res) => {
  if (!systemStatus.ready) {
    return res.status(503).json({
      success: false,
      error: 'Media engine is initializing components (yt-dlp / FFmpeg). Please try again shortly.'
    });
  }

  const {
    url,
    format = 'mp3',
    quality = '320k',
    title = '',
    artist = '',
    thumbnail = '',
    duration = 0,
    turbo = true,
    isPhoto = false,
    photos = [],
    slideIndex = null,
    trimStart = '',
    trimEnd = '',
    normalizeAudio = false,
    sponsorBlock = false
  } = req.body || {};

  if (!url) {
    return res.status(400).json({ success: false, error: 'Media URL is required' });
  }

  let cleanUrl;
  try {
    cleanUrl = normalizeUrl(url);
  } catch (err) {
    return res.status(400).json({ success: false, error: err.message || 'Invalid media URL' });
  }

  // Queue overflow protection (FIFO queue seamlessly accepts jobs when workers are busy)
  if (getQueueLength() >= MAX_QUEUE_SIZE) {
    return res.status(429).json({
      success: false,
      error: `Conversion queue is full (${MAX_QUEUE_SIZE} pending jobs). Please wait for active jobs to complete.`
    });
  }

  const jobId = crypto.randomUUID();
  try {
    const parsedDuration = (typeof duration === 'number' && duration > 0) ? duration : (Number(duration) > 0 ? Number(duration) : 0);
    const job = startConversion({
      url: cleanUrl,
      format,
      quality,
      jobId,
      duration: parsedDuration,
      turbo,
      isPhoto: Boolean(isPhoto),
      photos: Array.isArray(photos) ? photos : [],
      slideIndex: slideIndex ? Number(slideIndex) : null,
      title,
      artist,
      thumbnail,
      trimStart,
      trimEnd,
      normalizeAudio: Boolean(normalizeAudio),
      sponsorBlock: Boolean(sponsorBlock)
    });
    if (title) job.title = title;
    if (artist) job.artist = artist;
    if (thumbnail) job.thumbnail = thumbnail;
    if (parsedDuration > 0) job.duration = parsedDuration;

    res.json({
      success: true,
      jobId,
      status: job.status,
      queued: job.status === 'queued',
      queuePosition: job.queuePosition || null,
      message: job.status === 'queued'
        ? `Added to queue (position #${job.queuePosition})`
        : 'Conversion started'
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Batch playlist / multi-track queue endpoint
app.post('/api/convert-batch', (req, res) => {
  if (!systemStatus.ready) {
    return res.status(503).json({
      success: false,
      error: 'Media engine is initializing components (yt-dlp / FFmpeg). Please try again shortly.'
    });
  }

  const {
    items,
    format = 'mp3',
    quality = '320k',
    turbo = true,
    trimStart = '',
    trimEnd = '',
    normalizeAudio = false,
    sponsorBlock = false
  } = req.body || {};

  if (!Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ success: false, error: 'At least one track item is required for batch conversion.' });
  }

  if (items.length > 50) {
    return res.status(400).json({ success: false, error: 'Batch requests are capped at 50 items per submission.' });
  }

  if (getQueueLength() + items.length > MAX_QUEUE_SIZE) {
    return res.status(429).json({
      success: false,
      error: `Queue capacity (${MAX_QUEUE_SIZE}) exceeded. Please wait for active batch items to finish.`
    });
  }

  const normalizedItems = [];
  try {
    for (const item of items) {
      if (!item || !item.url) {
        return res.status(400).json({ success: false, error: 'Every batch track must include a valid URL.' });
      }
      normalizedItems.push({
        ...item,
        cleanUrl: normalizeUrl(item.url)
      });
    }
  } catch (err) {
    return res.status(400).json({ success: false, error: err.message || 'Invalid track URL in batch.' });
  }

  const createdJobs = normalizedItems.map((item) => {
    const jobId = crypto.randomUUID();
    const job = startConversion({
      url: item.cleanUrl,
      format,
      quality,
      jobId,
      duration: Number(item.duration) > 0 ? Number(item.duration) : 0,
      turbo,
      title: item.title || '',
      artist: item.uploader || item.artist || '',
      thumbnail: item.thumbnail || '',
      trimStart,
      trimEnd,
      normalizeAudio: Boolean(normalizeAudio),
      sponsorBlock: Boolean(sponsorBlock)
    });
    return {
      jobId: job.id,
      status: job.status,
      queuePosition: job.queuePosition || null,
      title: job.title,
      artist: job.artist,
      thumbnail: job.thumbnail,
      format: job.format,
      quality: job.quality,
      url: job.url
    };
  });

  res.json({
    success: true,
    count: createdJobs.length,
    jobs: createdJobs
  });
});

// Cancel Conversion Job
app.post('/api/cancel/:jobId', (req, res) => {
  const { jobId } = req.params;
  const success = cancelConversion(jobId);
  res.json({
    success,
    message: success ? 'Conversion cancelled' : 'Job not found or already finished'
  });
});

// Self-update yt-dlp binary
app.post('/api/binaries/update', requireLocalRequest, async (req, res) => {
  try {
    const result = await updateYtDlp();
    if (result.success && result.version) {
      systemStatus.ytDlpVersion = result.version;
    }
    res.json(result);
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Provision aria2c multi-connection downloader binary on Windows
app.post('/api/binaries/install-aria2', requireLocalRequest, async (req, res) => {
  try {
    const result = await installAria2();
    if (result.success) {
      systemStatus.aria2 = true;
      systemStatus.aria2Version = result.version || 'aria2c';
      systemStatus.downloader = 'aria2c';
      setAria2Available(true);
    }
    res.json(result);
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Real-time Progress (SSE)
app.get('/api/progress/:jobId', (req, res) => {
  const { jobId } = req.params;

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');

  let interval = null;

  const cleanup = () => {
    if (interval) {
      clearInterval(interval);
      interval = null;
    }
  };

  const sendUpdate = () => {
    if (res.writableEnded || res.destroyed) {
      cleanup();
      return;
    }

    try {
      const job = getJob(jobId);
      if (!job) {
        res.write(`data: ${JSON.stringify({ status: 'not_found' })}\n\n`);
        cleanup();
        return res.end();
      }

      res.write(`data: ${JSON.stringify(job)}\n\n`);

      if (job.status === 'completed' || job.status === 'failed' || job.status === 'cancelled') {
        cleanup();
        res.end();
      }
    } catch {
      cleanup();
      try { res.end(); } catch {}
    }
  };

  interval = setInterval(sendUpdate, 400);
  sendUpdate();

  req.on('close', cleanup);
  res.on('close', cleanup);
  res.on('error', cleanup);
});

// Polling fallback endpoint for progress
app.get('/api/job/:jobId', (req, res) => {
  const { jobId } = req.params;
  const job = getJob(jobId);
  if (!job) {
    return res.status(404).json({ success: false, error: 'Job not found' });
  }
  res.json({ success: true, job });
});

function isAuthorizedMediaPath(resolvedPath) {
  const isWin = process.platform === 'win32';
  const normalize = (p) => (isWin ? path.resolve(p).toLowerCase() : path.resolve(p));
  const target = normalize(resolvedPath);
  const authorizedRoots = [DOWNLOADS_DIR];
  const settings = getServerSettings();
  if (settings && settings.libraryDir) {
    authorizedRoots.push(settings.libraryDir);
  }
  return authorizedRoots.some((root) => {
    const prefix = normalize(root) + path.sep;
    return target.startsWith(prefix);
  });
}

function requireLocalRequest(req, res, next) {
  const remote = (req.ip || req.socket?.remoteAddress || '').toLowerCase();
  const isLocal = remote === '127.0.0.1' || remote === '::1' || remote === '::ffff:127.0.0.1';
  if (!isLocal) {
    return res.status(403).json({ success: false, error: 'Settings management is restricted to localhost requests.' });
  }
  return next();
}

// Library output mode settings (temporary 2h cache vs permanent user library)
app.get('/api/settings/library', requireLocalRequest, (req, res) => {
  res.json({ success: true, settings: getServerSettings() });
});

app.post('/api/settings/library', requireLocalRequest, (req, res) => {
  try {
    const updated = updateServerSettings(req.body || {});
    res.json({ success: true, settings: updated });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message || 'Invalid library setting.' });
  }
});

// Localhost-only Cookies & Bot-Bypass Manager (never returns raw secret tokens)
app.get('/api/settings/cookies', requireLocalRequest, (req, res) => {
  res.json({ success: true, cookies: getCookiesStatus() });
});

app.post('/api/settings/cookies', requireLocalRequest, (req, res) => {
  try {
    const status = saveCookiesContent(req.body?.content);
    res.json({ success: true, cookies: status });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message || 'Failed to save cookies file.' });
  }
});

app.delete('/api/settings/cookies', requireLocalRequest, (req, res) => {
  const status = deleteCookies();
  res.json({ success: true, cookies: status });
});

// Stream audio for in-browser playback
app.get('/api/stream/:jobId', (req, res) => {
  const { jobId } = req.params;
  const job = getJob(jobId);

  if (!job || !job.filePath || !fs.existsSync(job.filePath)) {
    return res.status(404).send('Audio file not found or still processing.');
  }

  // Path traversal prevention: verify file is within authorized downloads or permanent library directory
  const resolvedPath = path.resolve(job.filePath);
  if (!isAuthorizedMediaPath(resolvedPath)) {
    return res.status(403).send('Access denied: file path is outside authorized downloads directory.');
  }

  const filePath = resolvedPath;
  const stat = fs.statSync(filePath);
  const fileSize = stat.size;
  const range = req.headers.range;

  const contentTypeMap = {
    mp3: 'audio/mpeg',
    m4a: 'audio/mp4',
    wav: 'audio/wav',
    flac: 'audio/flac',
    mp4: 'video/mp4',
    zip: 'application/zip',
    jpg: 'image/jpeg',
    jpeg: 'image/jpeg',
    png: 'image/png',
    webp: 'image/webp'
  };
  const ext = path.extname(filePath).replace('.', '').toLowerCase();
  const contentType = contentTypeMap[ext] || (ext === 'mp4' ? 'video/mp4' : 'audio/mpeg');

  if (range && range.startsWith('bytes=')) {
    const parts = range.replace(/bytes=/, '').split('-');
    let start;
    let end;

    // Suffix byte range: bytes=-500 (last 500 bytes)
    if (parts[0] === '' && parts[1]) {
      const suffix = parseInt(parts[1], 10);
      if (isNaN(suffix) || suffix <= 0) {
        return res.status(416).set({ 'Content-Range': `bytes */${fileSize}` }).end();
      }
      start = Math.max(0, fileSize - suffix);
      end = fileSize - 1;
    } else {
      start = parseInt(parts[0], 10);
      end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
    }

    // Validate range satisfaction
    if (isNaN(start) || start < 0 || start >= fileSize || (parts[1] && end < start)) {
      return res.status(416).set({
        'Content-Range': `bytes */${fileSize}`
      }).end();
    }

    if (end >= fileSize) {
      end = fileSize - 1;
    }

    const chunksize = (end - start) + 1;
    const file = fs.createReadStream(filePath, { start, end });
    file.on('error', (err) => {
      if (!res.headersSent) res.status(500).end();
      file.destroy();
    });
    req.on('close', () => {
      file.destroy();
    });

    const head = {
      'Content-Range': `bytes ${start}-${end}/${fileSize}`,
      'Accept-Ranges': 'bytes',
      'Content-Length': chunksize,
      'Content-Type': contentType,
      'Access-Control-Expose-Headers': 'Content-Range, Content-Length, Accept-Ranges',
      'Cross-Origin-Resource-Policy': 'cross-origin'
    };
    res.writeHead(206, head);
    file.pipe(res);
  } else {
    const head = {
      'Content-Length': fileSize,
      'Content-Type': contentType,
      'Accept-Ranges': 'bytes',
      'Access-Control-Expose-Headers': 'Content-Range, Content-Length, Accept-Ranges',
      'Cross-Origin-Resource-Policy': 'cross-origin'
    };
    res.writeHead(200, head);
    const file = fs.createReadStream(filePath);
    file.on('error', (err) => {
      if (!res.headersSent) res.status(500).end();
      file.destroy();
    });
    req.on('close', () => {
      file.destroy();
    });
    file.pipe(res);
  }
});

// Download Audio/Video File with RFC 5987 Unicode Support
app.get('/api/download/:jobId', (req, res) => {
  const { jobId } = req.params;
  const job = getJob(jobId);

  if (!job || !job.filePath || !fs.existsSync(job.filePath)) {
    return res.status(404).send('File not found or still processing.');
  }

  // Path traversal prevention: verify file is within authorized downloads or permanent library directory
  const resolvedPath = path.resolve(job.filePath);
  if (!isAuthorizedMediaPath(resolvedPath)) {
    return res.status(403).send('Access denied: file path is outside authorized downloads directory.');
  }

  const rawFilename = job.fileName || `${job.title || 'audio'}.${job.format}`;
  const safeFilename = path.basename(rawFilename).replace(/[/\\?%*:|"<>/\0\r\n]/g, '_');
  const asciiFallback = safeFilename.replace(/[^\x20-\x7E]/g, '_').replace(/["\r\n]/g, '_');
  const utf8Encoded = encodeURIComponent(safeFilename);

  res.setHeader('Content-Disposition', `attachment; filename="${asciiFallback}"; filename*=UTF-8''${utf8Encoded}`);
  res.sendFile(resolvedPath, (err) => {
    if (err && !res.headersSent) {
      console.error('[server] Download error:', err.message);
      res.status(500).send('Error downloading file.');
    }
  });
});

const MAX_PHOTO_BYTES = 25 * 1024 * 1024; // 25 MB strict limit for photo proxy

function isPrivateOrReservedIp(ip) {
  if (!ip || typeof ip !== 'string') return true;
  let normalized = ip.toLowerCase().trim();
  if (normalized.startsWith('::ffff:')) {
    normalized = normalized.slice(7);
  }

  const family = net.isIP(normalized);
  if (family === 4) {
    const parts = normalized.split('.').map(Number);
    if (parts.length !== 4 || parts.some((n) => !Number.isInteger(n) || n < 0 || n > 255)) return true;
    const [a, b] = parts;
    return (
      a === 0 ||
      a === 10 ||
      a === 127 ||
      (a === 100 && b >= 64 && b <= 127) ||
      (a === 169 && b === 254) ||
      (a === 172 && b >= 16 && b <= 31) ||
      (a === 192 && b === 168)
    );
  }
  if (family === 6) {
    return (
      normalized === '::' ||
      normalized === '::1' ||
      normalized.startsWith('fc') ||
      normalized.startsWith('fd') ||
      normalized.startsWith('fe8') ||
      normalized.startsWith('fe9') ||
      normalized.startsWith('fea') ||
      normalized.startsWith('feb')
    );
  }
  return true;
}

async function validateSafeHttpsPhotoUrl(rawUrl) {
  const cleanUrl = normalizeUrl(rawUrl);
  const parsed = new URL(cleanUrl);
  if (parsed.protocol !== 'https:') {
    throw new Error('Only HTTPS photo URLs are permitted.');
  }

  const hostname = parsed.hostname.replace(/^\[|\]$/g, '');
  if (net.isIP(hostname)) {
    if (isPrivateOrReservedIp(hostname)) {
      throw new Error('Access to private or internal IP addresses is strictly prohibited.');
    }
    return cleanUrl;
  }

  const records = await dns.promises.lookup(hostname, { all: true });
  if (!Array.isArray(records) || records.length === 0) {
    throw new Error('Unable to resolve remote image host.');
  }
  if (records.some((rec) => isPrivateOrReservedIp(rec.address))) {
    throw new Error('Image host resolved to a restricted internal network address.');
  }
  return cleanUrl;
}

async function fetchSafePhotoResponse(initialUrl, signal) {
  let currentUrl = await validateSafeHttpsPhotoUrl(initialUrl);
  const MAX_REDIRECTS = 5;

  for (let hop = 0; hop <= MAX_REDIRECTS; hop += 1) {
    const res = await fetch(currentUrl, {
      redirect: 'manual',
      signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });

    if (res.status >= 300 && res.status < 400 && res.headers.get('location')) {
      try { await res.body?.cancel(); } catch {}
      const nextUrl = new URL(res.headers.get('location'), currentUrl).href;
      currentUrl = await validateSafeHttpsPhotoUrl(nextUrl);
      continue;
    }

    return res;
  }

  throw new Error('Too many redirects while fetching photo.');
}

// Direct photo proxy download (enables instant 1-click download of any carousel slide)
app.get('/api/photo-download', async (req, res) => {
  const { url, filename } = req.query;
  if (!url || typeof url !== 'string' || !url.trim()) {
    return res.status(400).json({ success: false, error: 'Valid HTTPS photo URL is required' });
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 30000);
  const clearPhotoTimer = () => clearTimeout(timeout);
  req.on('close', () => {
    clearPhotoTimer();
    controller.abort();
  });
  res.once('finish', clearPhotoTimer);
  res.once('close', clearPhotoTimer);

  try {
    const upstreamRes = await fetchSafePhotoResponse(url.trim(), controller.signal);

    if (!upstreamRes.ok) {
      clearPhotoTimer();
      try { await upstreamRes.body?.cancel(); } catch {}
      return res.status(upstreamRes.status).json({ success: false, error: `Upstream error (${upstreamRes.status})` });
    }

    const rawContentType = (upstreamRes.headers.get('content-type') || '').split(';')[0].trim().toLowerCase();
    if (!rawContentType.startsWith('image/')) {
      clearPhotoTimer();
      try { await upstreamRes.body?.cancel(); } catch {}
      return res.status(415).json({ success: false, error: 'Upstream URL did not return a valid image content type.' });
    }

    const contentLengthHeader = Number(upstreamRes.headers.get('content-length') || 0);
    if (Number.isFinite(contentLengthHeader) && contentLengthHeader > MAX_PHOTO_BYTES) {
      clearPhotoTimer();
      try { await upstreamRes.body?.cancel(); } catch {}
      return res.status(413).json({ success: false, error: 'Remote image exceeds 25 MB maximum size limit.' });
    }

    const safeName = path.basename(filename || 'photo.jpg')
      .replace(/[/\\?%*:|"<>/\0\r\n]/g, '_')
      .slice(0, 100);
    const asciiName = safeName.replace(/[^\x20-\x7E]/g, '_').replace(/["\r\n]/g, '_');
    const utf8Encoded = encodeURIComponent(safeName);

    res.setHeader('Content-Type', rawContentType);
    res.setHeader('Content-Disposition', `attachment; filename="${asciiName}"; filename*=UTF-8''${utf8Encoded}`);
    res.setHeader('Cache-Control', 'public, max-age=86400');

    if (!upstreamRes.body) {
      clearPhotoTimer();
      return res.status(502).json({ success: false, error: 'Empty image stream received from upstream.' });
    }

    const nodeStream = Readable.fromWeb(upstreamRes.body);
    let receivedBytes = 0;

    nodeStream.on('data', (chunk) => {
      receivedBytes += chunk.length;
      if (receivedBytes > MAX_PHOTO_BYTES) {
        clearPhotoTimer();
        nodeStream.destroy(new Error('Image stream exceeded 25 MB size limit.'));
        controller.abort();
      }
    });

    nodeStream.on('error', (streamErr) => {
      clearPhotoTimer();
      if (!res.headersSent) {
        res.status(413).json({ success: false, error: streamErr.message || 'Image transfer aborted.' });
      } else {
        res.destroy();
      }
    });

    nodeStream.pipe(res);
  } catch (err) {
    clearPhotoTimer();
    if (!res.headersSent) {
      const msg = err.message || 'Failed to download photo';
      const isPolicyErr = /prohibited|authorized|https|valid link|restricted/i.test(msg);
      return res.status(isPolicyErr ? 400 : 500).json({ success: false, error: msg });
    }
  }
});

// Get conversion history
app.get('/api/history', (req, res) => {
  res.json({ success: true, history: getHistory() });
});

// Download endpoint for SonicWave Custom Installer (.exe)
app.get('/SonicWave-Custom-Installer.exe', (req, res, next) => {
  const candidates = [
    path.join(__dirname, '..', 'client', 'public', 'SonicWave-Custom-Installer.exe'),
    path.join(__dirname, '..', 'dist-installer', 'SonicWave-Custom-Installer.exe')
  ];
  const found = candidates.find(p => fs.existsSync(p));
  if (found) {
    return res.download(found, 'SonicWave-Custom-Installer.exe');
  }
  return res.status(404).json({ success: false, error: 'SonicWave-Custom-Installer.exe not found on server' });
});

// Download endpoint for SonicWave Android APK (.apk)
app.get('/SonicWave.apk', (req, res, next) => {
  const candidates = [
    path.join(__dirname, '..', 'client', 'public', 'SonicWave.apk'),
    path.join(__dirname, '..', 'client', 'dist', 'SonicWave.apk'),
    path.join(__dirname, '..', 'android-app', 'app', 'build', 'outputs', 'apk', 'release', 'app-release.apk')
  ];
  const found = candidates.find(p => fs.existsSync(p));
  if (found) {
    res.setHeader('Content-Type', 'application/vnd.android.package-archive');
    return res.download(found, 'SonicWave.apk');
  }
  return res.status(404).json({ success: false, error: 'SonicWave.apk not found on server' });
});

// Serve frontend static build in production
const clientDist = path.join(__dirname, '../client/dist');
if (fs.existsSync(clientDist)) {
  app.use(express.static(clientDist));
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api')) {
      return next();
    }
    res.sendFile(path.join(clientDist, 'index.html'));
  });
}

// Global error handling middleware
app.use((err, req, res, next) => {
  if (res.headersSent) return next(err);
  const isSyntax = err instanceof SyntaxError || (err.status === 400 && 'body' in err);
  const status = isSyntax ? 400 : (err.status || 500);
  res.status(status).json({
    success: false,
    error: isSyntax ? 'Invalid JSON payload' : (err.message || 'Internal Server Error')
  });
});

function setSystemStatus(newStatus) {
  systemStatus = { ...systemStatus, ...newStatus };
}

// Initialize server with dynamic free-port fallback when preferred port is busy
async function startServer(portOverride) {
  const initialPort = Number(portOverride ?? PORT) || 3001;

  const listenOnAvailablePort = (startPort, maxAttempts = 20) => {
    return new Promise((resolve, reject) => {
      let attempt = 0;

      const tryPort = (candidatePort) => {
        const server = app.listen(candidatePort, () => {
          resolve(server);
        });

        server.once('error', (err) => {
          if (err && err.code === 'EADDRINUSE' && attempt < maxAttempts) {
            attempt += 1;
            const nextPort = attempt < maxAttempts ? candidatePort + 1 : 0;
            console.warn(`[server] Port ${candidatePort} in use, trying ${nextPort === 0 ? 'ephemeral port' : nextPort}...`);
            tryPort(nextPort);
          } else {
            reject(err);
          }
        });
      };

      tryPort(initialPort);
    });
  };

  const server = await listenOnAvailablePort(initialPort);
  const actualPort = server.address()?.port || initialPort;
  systemStatus.port = actualPort;
  console.log(`[server] Server listening on http://localhost:${actualPort}`);
  console.log(`[server] Status: ${systemStatus.ready ? 'Ready' : 'Bootstrapping Binaries'}`);

  try {
    const binStatus = await verifyBinaries();
    systemStatus = {
      ready: Boolean(binStatus.ytDlp && binStatus.ffmpeg),
      port: actualPort,
      ...binStatus
    };
    console.log(`[server] Status: ${systemStatus.ready ? 'Ready' : 'Binaries Pending'}`);
  } catch (err) {
    console.error('[server] Error bootstrapping binaries:', err.message);
  }

  return server;
}

if (require.main === module) {
  startServer();
}

module.exports = { app, startServer, setSystemStatus };
