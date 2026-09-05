# 🎵 SonicWave - YouTube to MP3 & MP4 Converter Web App

A high-fidelity YouTube to MP3 audio & MP4 video converter web application featuring an automated Node.js Express backend and a modern glassmorphic Vite + React frontend.

---

## ✨ Key Features

- **In-Browser Audio & Video Player**: Listen to converted audio or watch HD MP4 videos directly in your browser before or after downloading.
- **Audio & Video Formats**:
  - **MP4 (Video)**: High-definition video with merged stereo audio (`1080p Full HD`, `720p HD`, `480p SD`, `Best Quality`).
  - **MP3 (Audio)**: Multi-bitrate selection (`320 kbps`, `256 kbps`, `192 kbps`, `128 kbps`).
  - **M4A (AAC)**, **WAV**, and **FLAC**.
- **Real-Time Progress**: Live Server-Sent Events (SSE) tracking percentage, download speed, ETA, and stream merging phase.
- **Embedded Metadata**: Embeds ID3 metadata tags (title, artist) into audio files.
- **Conversion History**: Keeps local track history with instant in-browser playback and 1-click re-download.
- **Self-Bootstrapping Engine**: Automatically provisions `yt-dlp` and `ffmpeg` locally without requiring manual Python installation or PATH configuration.

---

## 🚀 Quick Start

### 1. One-Click Launch (Windows)
Double-click `start.bat` in this folder, or run:
```bat
start.bat
```
This automatically launches the backend server on `http://localhost:3001` and opens the frontend on `http://localhost:5173`.

### 2. Manual Launch
**Terminal 1 (Backend):**
```bash
cd server
npm start
```

**Terminal 2 (Frontend):**
```bash
cd client
npm run dev
```

Open **`http://localhost:5173`** in any web browser.

---

## 🛠️ Tech Stack

- **Frontend**: React 19, Vite, Lucide Icons, Canvas-Confetti, Vanilla CSS Glassmorphism Design System, Google Fonts (Outfit, Inter, JetBrains Mono).
- **Backend**: Node.js, Express, `yt-dlp.exe`, `ffmpeg.exe`.
