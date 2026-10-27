# 🎵 SonicWave — High-Fidelity Multi-Platform Media Converter & Player

[![Test Suite](https://github.com/ANShKhare-ux/YTMP3/actions/workflows/test.yml/badge.svg)](https://github.com/ANShKhare-ux/YTMP3/actions/workflows/test.yml)
[![Node.js](https://img.shields.io/badge/Node.js-v20%20%7C%20v22-green.svg)](https://nodejs.org/)
[![React](https://img.shields.io/badge/React-19-blue.svg)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-6.0-purple.svg)](https://vitejs.dev/)
[![Design System](https://img.shields.io/badge/Theme-Spotify%20Dark-1ed760.svg)](docs/architecture.md)

SonicWave is a high-performance audio & video extractor, converter, and in-browser media player. It features an automated Node.js Express backend powered by self-bootstrapping `yt-dlp` and `ffmpeg` engines, paired with an immersive Spotify-inspired dark glassmorphic React 19 frontend.

SonicWave operates as both a **full-stack web application** and a **standalone portable Windows desktop package**.

---

## ✨ Key Features

- **🌐 Multi-Platform Engine**: Extract media from YouTube, Instagram Reels, TikTok, Twitter/X, SoundCloud, Reddit, Facebook, Vimeo, Bilibili, and Threads.
- **⚡ 16-Stream Turbo Acceleration**: Concurrent 16-fragment chunk downloading (`-N 16`) with 16MB buffer caching for maximum bandwidth utilization.
- **🎧 High-Definition Formats & Bitrates**:
  - **MP4 (Video)**: `1080p Full HD`, `720p HD`, `480p SD`, `Best Quality` (Direct stream copy with zero re-encoding latency).
  - **MP3 (Audio)**: Multi-bitrate selection (`320 kbps Studio`, `256 kbps High`, `192 kbps Standard`, `128 kbps Light`).
  - **M4A (AAC)**: Instant stream copy preserving native digital audio untouched.
  - **Lossless Audio**: Studio-grade **WAV** and **FLAC**.
- **📻 In-Browser Media Player**: Listen to converted audio with waveform seek bars or watch HD video previews via HTTP 206 Partial Content range streaming before saving.
- **📊 Real-Time SSE Pipeline**: Server-Sent Events (SSE) stream percentage, throughput (`MiB/s`), ETA, and muxing phase every 400ms.
- **🏷️ Metadata & Tagging**: Embeds high-resolution cover artwork and ID3 metadata tags (title, artist, platform).
- **⌨️ Command Palette (`Ctrl+K` / `⌘K`)**: Fast keyboard-driven command palette for format switching, media playback control, and engine updates.
- **💾 Dual History**: Server-side JSON storage (`server/data/history.json`) and client-side `localStorage` caching with 1-click playback and re-download.
- **🤖 Zero-Setup Self-Bootstrapping**: Automatically provisions and updates `yt-dlp` and bridges `ffmpeg` locally without manual Python or PATH installation.
- **📦 Portable Desktop Distribution**: Build a standalone, marketing-free Windows desktop package using `npm run package`.

---

## 🚀 Quick Start

### 1. One-Click Launch (Windows)
Double-click `start.bat` in the project root:
```bat
start.bat
```
This automatically validates Node.js, installs dependencies if missing, starts the backend on `http://localhost:3001`, launches the Vite frontend on `http://localhost:5173`, and opens your default browser.

### 2. Manual Development Setup

> [!TIP]
> On Windows PowerShell, if script execution policies block `npm.ps1`, use **`npm.cmd`** instead of `npm`.

**Step 1: Install Dependencies**
```powershell
npm.cmd run setup
```

**Step 2: Run Full Dev Environment (Concurrent)**
```powershell
npm.cmd run dev
```

**Step 3: Run Services Individually**
- **Backend (Port 3001)**:
  ```powershell
  npm.cmd run server
  ```
- **Frontend (Port 5173)**:
  ```powershell
  npm.cmd run client
  ```

Visit **`http://localhost:5173`** in your browser.

---

## 🧪 Testing & Continuous Integration

SonicWave uses Node.js's native test runner (`node:test` and `node:assert/strict`) — requiring **zero external testing dependencies**.

### Run Test Suite
```powershell
npm.cmd test
# Or directly:
node --test tests/*.test.js
```

### Test Coverage
- [`tests/converter.test.js`](tests/converter.test.js) — Duration formatting edge cases, job query isolation, cancellation safety, and history sanitization.
- [`tests/binManager.test.js`](tests/binManager.test.js) — Engine binary resolution, path checks, and executable verification.
- [`tests/workspace.test.js`](tests/workspace.test.js) — NPM workspace integrity, manifest configuration, and CI workflow validation.

### GitHub Actions CI
The automated test pipeline runs on push and pull requests to `main` across a multi-platform matrix:
- **Node.js**: `20.x`, `22.x`
- **OS**: `windows-latest`, `ubuntu-latest`

Workflow configuration: [`.github/workflows/test.yml`](.github/workflows/test.yml).

---

## 📦 Building & Desktop Packaging

### Compile Web Production Build
```powershell
npm.cmd run build
```
Generates optimized chunks in `client/dist/` ready for web deployment (e.g. Vercel).

### Generate Standalone Windows Desktop Bundle
```powershell
npm.cmd run package
```
Runs `scripts/package-desktop.mjs` to:
1. Temporarily swap `App.jsx` with `AppDesktop.jsx` (stripping promotional landing page elements).
2. Build the production client bundle.
3. Package the Node backend, local binaries (`yt-dlp.exe`, `ffmpeg.exe`), and launcher into `SonicWave-v1.0.0-Windows.zip`.
4. Verify archive purity and mirror it to `client/public/` and `client/dist/`.

---

## 📖 Architecture & Documentation

Comprehensive project documentation is available in the [`docs/`](docs/) directory and repository knowledge files:

- **[Architecture & System Design](docs/architecture.md)** — Detailed system diagrams, module responsibilities, streaming protocols, and data flows.
- **[Development & Workflow Guide](docs/development.md)** — In-depth setup, PowerShell tips, packaging guidelines, and coding conventions.
- **[API Specification](docs/api.md)** — REST endpoints, Server-Sent Events payloads, and streaming query parameters.
- **[Project Memory & Knowledge Base](memory.md)** — Current status, tech stack inventory, constraints, known issues, and roadmap.
- **[AI Coding Agent Rules](AGENTS.md)** — Operational instructions, safety guidelines, and conventions for AI assistants.

---

## 🛠️ Tech Stack

| Layer | Technologies |
| :--- | :--- |
| **Frontend** | React 19, Vite 6, Lucide Icons, GSAP, Canvas Confetti |
| **Backend** | Node.js (v20+ / v22+), Express 4.21, CORS |
| **Media Engines** | `yt-dlp` (v2026.08+), FFmpeg 6.1 (`ffmpeg-static`) |
| **Design System** | Spotify-inspired dark UI (`#121212`, Spotify Green `#1ed760`), Glassmorphism |
| **Testing** | Node.js Built-in Test Runner (`node:test`, `node:assert/strict`) |
| **CI/CD** | GitHub Actions |

---

## 🔒 Security & Privacy

- **Local Execution**: All conversions and audio extractions execute locally on your machine. No media is sent to third-party conversion servers.
- **Automatic TTL Eviction**: Downloaded media in `server/downloads/` is automatically evicted after 2 hours to prevent disk saturation.
- **Sanitized Execution**: All child process calls pass explicit argument arrays (`execFile` / `spawn`) to prevent shell injection vulnerabilities.
- **Bot Bypass**: Supports optional `server/cookies.txt` for authenticating with YouTube or Instagram without exposing credentials in code.

---

## 📄 License

This project is licensed under the MIT License. See [LICENSE](LICENSE) for details (or repository license terms).
