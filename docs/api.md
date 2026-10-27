# SonicWave API Specification

The SonicWave backend exposes a RESTful API and a Server-Sent Events (SSE) stream on port `3001` (or `process.env.PORT`).

Base URL: `http://localhost:3001`

---

## 1. System Health & Binary Status

### `GET /api/status`
Returns the operational status of the server and the underlying `yt-dlp` and `ffmpeg` binaries.

**Response `200 OK`:**
```json
{
  "success": true,
  "status": {
    "ready": true,
    "ytDlp": true,
    "ffmpeg": true,
    "ytDlpVersion": "2026.08.19",
    "ffmpegVersion": "ffmpeg version 6.1.1-essentials_build-www.gyan.dev..."
  }
}
```

---

## 2. Media Metadata

### `POST /api/info`
Fetches media metadata from YouTube or any supported social media platform without downloading the file.

**Request Body (`application/json`):**
```json
{
  "url": "https://www.youtube.com/watch?v=example"
}
```

**Response `200 OK`:**
```json
{
  "success": true,
  "data": {
    "id": "example",
    "url": "https://www.youtube.com/watch?v=example",
    "title": "Song Title",
    "uploader": "Channel Name",
    "platform": "YouTube",
    "channelUrl": "https://www.youtube.com/channel/...",
    "duration": 215,
    "durationFormatted": "3:35",
    "isUltraLong": false,
    "thumbnail": "https://i.ytimg.com/vi/example/maxresdefault.jpg",
    "viewCount": 1045000,
    "uploadDate": "20240101",
    "description": "Video description preview..."
  }
}
```

**Error Response `400 / 500`:**
```json
{
  "success": false,
  "error": "Media URL is required"
}
```

---

## 3. Media Conversion

### `POST /api/convert`
Initiates an asynchronous media extraction and conversion job.

**Request Body (`application/json`):**
```json
{
  "url": "https://www.youtube.com/watch?v=example",
  "format": "mp3",
  "quality": "320k",
  "title": "Optional Custom Title",
  "artist": "Optional Custom Artist",
  "thumbnail": "Optional Thumbnail URL",
  "turbo": true
}
```

**Supported Formats & Qualities:**
- **`mp3`**: `320k`, `256k`, `192k`, `128k`
- **`mp4`**: `1080p`, `720p`, `480p`, `best`
- **`m4a`**: AAC Stream Copy
- **`wav`**, **`flac`**: Lossless Audio

**Response `200 OK`:**
```json
{
  "success": true,
  "jobId": "f47ac10b-58cc-4372-a567-0e02b2c3d479",
  "message": "Conversion started"
}
```

---

## 4. Live Progress Tracking (SSE)

### `GET /api/progress/:jobId`
Opens a Server-Sent Events stream delivering real-time progress updates every 400ms.

**Headers:**
- `Content-Type: text/event-stream`
- `Cache-Control: no-cache`
- `Connection: keep-alive`

**Event Payload (`data: <json>`):**
```json
{
  "id": "f47ac10b-58cc-4372-a567-0e02b2c3d479",
  "url": "https://www.youtube.com/watch?v=example",
  "format": "mp3",
  "quality": "320k",
  "isVideo": false,
  "status": "downloading",
  "progress": 45,
  "speed": "12.4MiB/s",
  "eta": "00:04",
  "totalSize": "8.5MiB",
  "title": "Song Title",
  "filePath": null
}
```

**Possible Job Statuses:**
- `starting`: Initializing child process and format extraction.
- `downloading`: Fetching DASH/HLS chunks via parallel fragment streams.
- `converting`: FFmpeg re-encoding or stream muxing.
- `tagging`: Embedding ID3 metadata and album thumbnail.
- `completed`: Media file ready in `server/downloads/`.
- `failed`: Conversion terminated with error.
- `cancelled`: Job aborted by client.

---

## 5. Job Management

### `GET /api/job/:jobId`
Polling fallback endpoint returning current job state.

### `POST /api/cancel/:jobId`
Aborts an in-progress job, terminates child `yt-dlp` process, and removes partial files.

**Response `200 OK`:**
```json
{
  "success": true,
  "message": "Conversion cancelled"
}
```

---

## 6. Media Streaming & Downloads

### `GET /api/stream/:jobId`
Streams converted audio or video with support for HTTP `Range` requests (`bytes=start-end`), enabling in-browser seeking and buffering.

**Response:**
- `206 Partial Content` (for range requests)
- `200 OK` (full stream)
- `404 Not Found` (job not found or file not ready)

### `GET /api/download/:jobId`
Forces a browser file download with RFC 5987 Unicode filename support:
```http
Content-Disposition: attachment; filename="<ascii_name>"; filename*=UTF-8''<encoded_name>
```

---

## 7. Engine Self-Update

### `POST /api/binaries/update`
Runs `yt-dlp -U` to update the local engine binary to the latest release.

**Response `200 OK`:**
```json
{
  "success": true,
  "output": "yt-dlp is up to date (2026.08.19)",
  "version": "2026.08.19"
}
```

---

## 8. History

### `GET /api/history`
Returns up to 50 recent completed conversions recorded on the server.

**Response `200 OK`:**
```json
{
  "success": true,
  "history": [
    {
      "id": "uuid",
      "title": "Track Name",
      "artist": "Artist Name",
      "format": "mp3",
      "quality": "320k",
      "duration": 180,
      "thumbnail": "https://...",
      "createdAt": 1729000000000,
      "isAvailable": true
    }
  ]
}
```

