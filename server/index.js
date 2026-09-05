const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const { verifyBinaries } = require('./binManager');
const { getVideoInfo, startConversion, getJob, getHistory, DOWNLOADS_DIR } = require('./converter');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Range']
}));
app.use(express.json());

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

// Fetch Media Metadata (YouTube, Instagram, TikTok, Twitter/X, SoundCloud, etc.)
app.post('/api/info', async (req, res) => {
  const { url } = req.body;
  if (!url) {
    return res.status(400).json({ success: false, error: 'Media URL is required' });
  }

  try {
    const info = await getVideoInfo(url);
    res.json({ success: true, data: info });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message || 'Failed to fetch media information' });
  }
});

// Start Audio/Video Conversion
app.post('/api/convert', (req, res) => {
  const { url, format = 'mp3', quality = '320k', title = '', artist = '', thumbnail = '', turbo = true } = req.body;

  if (!url) {
    return res.status(400).json({ success: false, error: 'Media URL is required' });
  }

  const jobId = crypto.randomUUID();
  try {
    const job = startConversion({ url, format, quality, jobId, turbo });
    if (title) job.title = title;
    if (artist) job.artist = artist;
    if (thumbnail) job.thumbnail = thumbnail;

    res.json({
      success: true,
      jobId,
      message: 'Conversion started'
    });
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

  const sendUpdate = () => {
    const job = getJob(jobId);
    if (!job) {
      res.write(`data: ${JSON.stringify({ status: 'not_found' })}\n\n`);
      clearInterval(interval);
      return res.end();
    }

    res.write(`data: ${JSON.stringify(job)}\n\n`);

    if (job.status === 'completed' || job.status === 'failed') {
      clearInterval(interval);
      res.end();
    }
  };

  const interval = setInterval(sendUpdate, 400);
  sendUpdate();

  req.on('close', () => {
    clearInterval(interval);
  });
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

  const filePath = job.filePath;
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

  if (range) {
    const parts = range.replace(/bytes=/, '').split('-');
    const start = parseInt(parts[0], 10);
    const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
    const chunksize = (end - start) + 1;
    const file = fs.createReadStream(filePath, { start, end });
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
    fs.createReadStream(filePath).pipe(res);
  }
});

// Download Audio File
app.get('/api/download/:jobId', (req, res) => {
  const { jobId } = req.params;
  const job = getJob(jobId);

  if (!job || !job.filePath || !fs.existsSync(job.filePath)) {
    return res.status(404).send('File not found or still processing.');
  }

  const filename = job.fileName || `${job.title || 'audio'}.${job.format}`;
  res.download(job.filePath, filename, (err) => {
    if (err) {
      console.error('[server] Download error:', err.message);
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

// Initialize server
async function startServer() {
  console.log('[server] Bootstrapping binaries...');
  const binStatus = await verifyBinaries();
  systemStatus = {
    ready: binStatus.ytDlp && binStatus.ffmpeg,
    ...binStatus
  };

  app.listen(PORT, () => {
    console.log(`[server] Server listening on http://localhost:${PORT}`);
    console.log(`[server] Status: ${systemStatus.ready ? 'Ready' : 'Binaries Pending'}`);
  });
}

startServer();
