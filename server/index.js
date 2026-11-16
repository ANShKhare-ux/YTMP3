const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const { verifyBinaries, updateYtDlp } = require('./binManager');
const { getVideoInfo, startConversion, cancelConversion, getJob, getHistory, getActiveJobCount, normalizeUrl, DOWNLOADS_DIR } = require('./converter');

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
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Range']
}));

// Request body size limit
app.use(express.json({ limit: '256kb' }));

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
    status: systemStatus
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

  const { url } = req.body || {};
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
    const info = await getVideoInfo(cleanUrl);
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

  const { url, format = 'mp3', quality = '320k', title = '', artist = '', thumbnail = '', duration = 0, turbo = true } = req.body || {};

  if (!url) {
    return res.status(400).json({ success: false, error: 'Media URL is required' });
  }

  let cleanUrl;
  try {
    cleanUrl = normalizeUrl(url);
  } catch (err) {
    return res.status(400).json({ success: false, error: err.message || 'Invalid media URL' });
  }

  // Concurrency limit
  const MAX_CONCURRENT_CONVERSIONS = 3;
  if (getActiveJobCount() >= MAX_CONCURRENT_CONVERSIONS) {
    return res.status(429).json({
      success: false,
      error: 'Server is currently processing maximum concurrent conversions (3). Please wait for active conversions to complete.'
    });
  }

  const jobId = crypto.randomUUID();
  try {
    const parsedDuration = (typeof duration === 'number' && duration > 0) ? duration : (Number(duration) > 0 ? Number(duration) : 0);
    const job = startConversion({ url: cleanUrl, format, quality, jobId, duration: parsedDuration, turbo });
    if (title) job.title = title;
    if (artist) job.artist = artist;
    if (thumbnail) job.thumbnail = thumbnail;
    if (parsedDuration > 0) job.duration = parsedDuration;

    res.json({
      success: true,
      jobId,
      message: 'Conversion started'
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
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
app.post('/api/binaries/update', async (req, res) => {
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

// Stream audio for in-browser playback
app.get('/api/stream/:jobId', (req, res) => {
  const { jobId } = req.params;
  const job = getJob(jobId);

  if (!job || !job.filePath || !fs.existsSync(job.filePath)) {
    return res.status(404).send('Audio file not found or still processing.');
  }

  // Path traversal prevention: verify file is within downloads directory
  const resolvedPath = path.resolve(job.filePath);
  const resolvedDownloads = path.resolve(DOWNLOADS_DIR);
  const isWin = process.platform === 'win32';
  const pathToCheck = isWin ? resolvedPath.toLowerCase() : resolvedPath;
  const downloadsToCheck = isWin ? (resolvedDownloads + path.sep).toLowerCase() : (resolvedDownloads + path.sep);
  if (!pathToCheck.startsWith(downloadsToCheck)) {
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
    mp4: 'video/mp4'
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
    };
    res.writeHead(206, head);
    file.pipe(res);
  } else {
    const head = {
      'Content-Length': fileSize,
      'Content-Type': contentType,
      'Accept-Ranges': 'bytes'
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

  // Path traversal prevention: verify file is within downloads directory
  const resolvedPath = path.resolve(job.filePath);
  const resolvedDownloads = path.resolve(DOWNLOADS_DIR);
  const isWin = process.platform === 'win32';
  const pathToCheck = isWin ? resolvedPath.toLowerCase() : resolvedPath;
  const downloadsToCheck = isWin ? (resolvedDownloads + path.sep).toLowerCase() : (resolvedDownloads + path.sep);
  if (!pathToCheck.startsWith(downloadsToCheck)) {
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

// Get conversion history
app.get('/api/history', (req, res) => {
  res.json({ success: true, history: getHistory() });
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

// Initialize server
async function startServer() {
  return new Promise((resolve) => {
    const server = app.listen(PORT, async () => {
      console.log(`[server] Server listening on http://localhost:${PORT}`);
      console.log(`[server] Status: ${systemStatus.ready ? 'Ready' : 'Bootstrapping Binaries'}`);

      try {
        const binStatus = await verifyBinaries();
        systemStatus = {
          ready: Boolean(binStatus.ytDlp && binStatus.ffmpeg),
          ...binStatus
        };
        console.log(`[server] Status: ${systemStatus.ready ? 'Ready' : 'Binaries Pending'}`);
      } catch (err) {
        console.error('[server] Error bootstrapping binaries:', err.message);
      }
      resolve(server);
    });
  });
}

if (require.main === module) {
  startServer();
}

module.exports = { app, startServer, setSystemStatus };
