# SonicWave Architecture & System Design

## 1. Executive Summary

SonicWave is a full-stack media conversion and playback application designed for high-performance audio and video extraction from YouTube and other social media platforms (Instagram, TikTok, Twitter/X, SoundCloud, Reddit, Vimeo, etc.).

The system exists in two distribution models:
1. **Full-Stack Web Application**: A client-server architecture composed of a Vite + React frontend (port `5173`) and an Express.js backend (port `3001`) with live Server-Sent Events (SSE) progress streaming.
2. **Packaged Windows Desktop Bundle**: An offline-capable standalone distribution containing the Node.js backend, local binaries (`yt-dlp.exe`, `ffmpeg.exe`), a launcher batch script (`start.bat`), and a prebuilt desktop frontend that strips out promotional landing components.

---

## 2. System Architecture Diagram

```
+-------------------------------------------------------------------------------+
|                                CLIENT FRONTEND                                |
|  (Vite + React 19 + GSAP + Lucide Icons + Spotify Dark Glassmorphic Theme)     |
|                                                                               |
|  +-------------------------+  +-------------------+  +---------------------+  |
|  |  UrlInput & VideoPreview |  | OptionsSelector   |  |  ProgressBar (SSE)  |  |
|  +-------------------------+  +-------------------+  +---------------------+  |
|  +-------------------------+  +-------------------+  +---------------------+  |
|  |  AudioPlayer (Stream)   |  | HistorySection    |  |  CommandPalette /   |  |
|  |  (HTTP 206 Partial)     |  | (Local Storage)   |  |  PricingModal       |  |
|  +-------------------------+  +-------------------+  +---------------------+  |
+-------------------------------------------------------------------------------+
                                      |
                           HTTP API & SSE Events
                                      v
+-------------------------------------------------------------------------------+
|                            EXPRESS BACKEND (PORT 3001)                        |
|                                                                               |
|   server/index.js (REST Endpoints, SSE Pipeline, Range Media Streaming)       |
|                                                                               |
|            |                                            |                     |
|            v                                            v                     |
|   server/converter.js                          server/binManager.js           |
|   - In-memory jobs tracking (Map)              - Local bin/ provisioning     |
|   - Multi-stream spawn process                 - yt-dlp autodownload/update  |
|   - Regex stdout progress parsing              - ffmpeg-static bridging       |
|   - History persistence (history.json)                                        |
|   - TTL cleanup (downloads 2h TTL)                                            |
|            |                                            |                     |
+-------------------------------------------------------------------------------+
             |                                            |
             +--------------------+-----------------------+
                                  |
                                  v
                   LOCAL EXECUTABLES (server/bin/)
                    - yt-dlp.exe (Engine v2026.08+)
                    - ffmpeg.exe (v6.1.1+)
                    - cookies.txt (Bot bypass)
```

---

## 3. Core Modules & Responsibilities

### 3.1 Backend (`server/`)

| File | Primary Responsibility | Key Interactions |
| :--- | :--- | :--- |
| `server/index.js` | Express HTTP router, SSE streaming endpoints, HTTP 206 range-based audio/video streaming, static file serving. | Consumes `converter.js` and `binManager.js`. |
| `server/converter.js` | Job queue manager, CLI command builder for `yt-dlp`, progress line regex parser, file persistence in `server/data/history.json`, periodic download cleaner. | Spawns `yt-dlp` child process, references `server/downloads/`. |
| `server/binManager.js` | Platform detection, automated `yt-dlp` download from GitHub releases, `ffmpeg-static` detection and copying into `server/bin/`, self-update routine. | Executes child processes (`yt-dlp --version`, `ffmpeg -version`). |
| `server/cookies.txt` | Netscape HTTP cookie storage for platform authentication and bot-detection evasion. | Passed via `--cookies` flag to `yt-dlp`. |
| `server/downloads/` | Ephemeral staging folder where `yt-dlp` writes media outputs. | Cleaned automatically every 30 minutes for files older than 2 hours. |
| `server/data/history.json` | JSON store holding up to 50 recent completed conversion jobs. | Read on startup and written upon conversion completion. |

### 3.2 Frontend (`client/`)

| File / Directory | Primary Responsibility |
| :--- | :--- |
| `client/src/main.jsx` | React DOM root mounting and application entry point. |
| `client/src/App.jsx` | Web root component. Manages URL hash routing (`#landing` vs `#app`), conversion states, keyboard shortcuts (`Ctrl+K`), and persistent local history. |
| `client/src/AppDesktop.jsx` | Desktop variation of the root component. Excludes promotional landing page elements for the standalone distribution. |
| `client/src/components/UrlInput.jsx` | Media URL input bar, clipboard paste integration, and quick-load sample track triggers. |
| `client/src/components/VideoPreview.jsx` | Displays media metadata (thumbnail, title, uploader, duration, platform badge, views). |
| `client/src/components/OptionsSelector.jsx` | Format selector (`mp3`, `mp4`, `m4a`, `wav`, `flac`) and bitrate/resolution selector (`320k`–`128k`, `1080p`–`480p`). |
| `client/src/components/ProgressBar.jsx` | Live conversion progress bar, speed tracker, ETA display, and job cancellation button. |
| `client/src/components/AudioPlayer.jsx` | Custom persistent media player supporting in-browser audio playback and video modal playback with speed control, seek bar, and download triggers. |
| `client/src/components/HistorySection.jsx` | Displays previously converted tracks stored in `localStorage` with re-play and re-download capability. |
| `client/src/components/CommandPalette.jsx` | Fast modal search (`Ctrl+K` / `Cmd+K`) for switching formats, controlling playback, clearing history, and checking engine updates. |
| `client/src/components/PricingModal.jsx` | Feature comparison modal highlighting local multi-threaded engine capabilities. |
| `client/src/components/LandingPage.jsx` | Comprehensive marketing page with GSAP animations, feature breakdowns, and Windows download call-to-actions. |
| `client/src/index.css` | 4,600+ line Spotify-inspired dark theme design system using CSS custom properties (`--spotify-green`, `--bg-base`, `--bg-surface`). |
| `client/vite.config.js` | Vite bundler configuration with chunk splitting (`vendor`, `gsap`, `icons`), path alias `@`, and backend proxy on `/api`. |

### 3.3 Build & Distribution (`scripts/`)

| Script | Responsibility |
| :--- | :--- |
| `scripts/package-desktop.mjs` | Automated desktop packaging script. Swaps `App.jsx` with `AppDesktop.jsx`, runs client build, stages server and client assets excluding marketing components, compresses archive using PowerShell `Compress-Archive`, verifies archive integrity, and mirrors ZIP to `client/public/` and `client/dist/`. |

---

## 4. Verified Data Flow & Sequences

### 4.1 URL Metadata Resolution
1. User enters or pastes a media URL in `UrlInput.jsx`.
2. Frontend issues `POST /api/info` with JSON payload `{ url }`.
3. Backend normalizes URL and calls `getVideoInfo(url)` in `server/converter.js`.
4. `converter.js` executes `yt-dlp --dump-single-json --no-playlist [url]`.
5. JSON output is parsed for ID, title, uploader, duration, thumbnail, view count, and platform.
6. Sanitized metadata is returned to the client and rendered in `VideoPreview.jsx`.

### 4.2 Conversion Pipeline & SSE Progress Streaming
1. User selects target format/quality and triggers conversion.
2. Frontend calls `POST /api/convert` with parameters `{ url, format, quality, title, artist, thumbnail, turbo }`.
3. Backend generates a `crypto.randomUUID()` job ID, initializes job state in `jobs` Map, and spawns `yt-dlp`.
4. Conversion uses multi-threaded acceleration:
   - `-N 16` (16 concurrent fragment streams).
   - `--buffer-size 16M` and `--http-chunk-size 10M`.
   - `--merge-output-format mp4` with `-c copy` for video.
   - `--extract-audio` with multi-core encoding or stream copy for AAC/M4A.
5. Frontend opens an `EventSource` connection to `GET /api/progress/:jobId`.
6. Backend scans stdout for `[download]`, `[ExtractAudio]`, `[ffmpeg]`, and `[Metadata]`, updating state and streaming JSON payloads every 400ms.
7. Upon exit code `0`, job state becomes `completed`, metadata is written to `server/data/history.json`, and SSE stream closes.

### 4.3 In-Browser Media Streaming (HTTP 206 Partial Content)
1. User clicks play in `AudioPlayer.jsx` or `HistorySection.jsx`.
2. Browser sends `GET /api/stream/:jobId` with optional `Range: bytes=start-end` header.
3. Backend verifies file presence in `server/downloads/`.
4. If `Range` is requested:
   - Returns HTTP status `206 Partial Content`.
   - Sends `Content-Range: bytes start-end/total`.
   - Streams file slice using `fs.createReadStream`.
5. If no `Range`:
   - Returns HTTP `200 OK` with full stream.

### 4.4 File Download Flow
1. User clicks download trigger.
2. Request hits `GET /api/download/:jobId`.
3. Backend formats header using RFC 5987 Unicode standard:
   ```http
   Content-Disposition: attachment; filename="<ascii_fallback>"; filename*=UTF-8''<utf8_encoded>
   ```
4. Express streams file via `res.sendFile()`.

---

## 5. Security and Resource Management

1. **Local Execution**: Binaries execute strictly in local environment; no media is sent to third-party conversion APIs.
2. **Disk TTL Eviction**: Downloaded files are evicted after 2 hours to prevent disk saturation.
3. **URL Sanitization**: Inputs are strictly validated with Node's `new URL()` parser prior to passing to child processes.
4. **Child Process Arguments**: Arguments are passed as arrays to `execFile` and `spawn` rather than shell strings, preventing shell injection.
5. **No Secret Commits**: Sensitive platform authentication files (`cookies.txt`) and `.env` files are excluded from logs and sanitized in test environments.

