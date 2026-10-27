# SonicWave — Project Memory & Architecture Knowledge Base

## 1. Project Identity & Purpose
- **Name**: SonicWave (repository name: `ytmp3-converter`)
- **Purpose**: High-fidelity YouTube and multi-platform media downloader, audio/video converter, and in-browser media player.
- **Operating Modes**:
  1. Full-stack web application (React frontend + Express backend).
  2. Standalone Windows offline package bundled as a portable zip distribution.

---

## 2. Current Implementation Status

### Verified Implemented Features
- **Multi-Platform Metadata Resolution**: Extracts title, artist, thumbnail, duration, and view count from YouTube, Instagram, TikTok, Twitter/X, SoundCloud, Reddit, Vimeo via `yt-dlp`.
- **Audio Extraction**: Multi-bitrate MP3 (`320k`, `256k`, `192k`, `128k`), M4A (instant stream copy), lossless WAV, and FLAC.
- **Video Conversion**: High-definition MP4 packaging (`1080p`, `720p`, `480p`, `best`) with direct stream copy audio muxing.
- **Live Progress Updates**: Server-Sent Events (SSE) tracking download percentage, speed, ETA, and re-encoding stage every 400ms.
- **In-Browser Playback**: HTTP 206 Partial Content media player supporting audio seeking and HD video preview modal.
- **Unicode Downloads**: RFC 5987 compliant `Content-Disposition` headers supporting international character sets.
- **Self-Bootstrapping Engine**: Automatic provisioning of `yt-dlp` executable and local bridge for `ffmpeg`.
- **Persistent History**: Server-side JSON storage (`server/data/history.json`, capped at 50 records) and client-side `localStorage` cache.
- **Desktop Packaging**: `scripts/package-desktop.mjs` generates `SonicWave-v1.0.0-Windows.zip` stripped of marketing landing components.
- **UI Design System**: Spotify-inspired dark theme (`#121212`, Spotify Green `#1ed760`) for converter studio, paired with a Linear-styled marketing landing page featuring an exclusive light mode toggle (`Sun` / `Moon`) that preserves dark mode in the converter. Integrated Easing Wizard physics-based animation curves (`--ease-page`, `--ease-modal`, `--ease-dropdown`, `--ease-button-spring`, `--ease-button-punch`, `--ease-card`, `--ease-hover`, `--ease-intro-spring`, `--ease-intro-overshoot`, `--ease-intro-bounce`, `--ease-intro-expo`, `--ease-intro-back`) with full `prefers-reduced-motion` compliance.
- **Cinematic Motion Intro & Video Pipeline**:
  1. *In-App Cinematic Intro (`SonicIntro.jsx`)*: Hardware-accelerated Full HD video presentation perfectly synchronized with the Remotion broadcast master (`sonicwave-intro.mp4`), featuring pop-free Web Audio API gain scheduling (`masterGainRef`) with isolated lifecycle architecture (preventing AudioContext teardown loops during mute/unmute), continuous 60fps requestAnimationFrame timeline tracking, radiating video shockwaves, background color alignment (`#080b09`), dynamic canvas audio dust, body scroll locking, and smooth expo-out dissolve exit. Coordinated with `LandingPage.jsx` so hero entrance animations wait for intro exit before playing. Plays on initial session with instant skip (`Esc`), sound unmute toggle, strict `prefers-reduced-motion` auto-exit, and replay triggers via Quick Menu (`⌘K`), studio top-bar button, and landing navigation.
  2. *Programmatic Remotion Composition (`remotion/`)*: Frame-accurate Remotion 4.0.539 Full HD video engine (`SonicWaveIntro`, 1920x1080 @ 30fps, 180 frames = 6.0s) rendering to `out/sonicwave-intro.mp4` with embedded 48kHz stereo AAC soundtrack, 320px commanding emblem scale, and FFmpeg encoding.
- **Technical SEO & Search Console Verification**:
  - Global Search Console verification meta tag (`vyi8Qkc4E4RP878V8Gc8VFv05oWR53YLsP0m6eWjYCI`) configured in `<head>` of `client/index.html`.
  - Canonical URL anchored to live production deployment (`https://ytmp-3-five.vercel.app/`).
  - Search engine crawler directives in `client/public/robots.txt` (`User-agent: *`, `Allow: /`, pointing to `https://ytmp-3-five.vercel.app/sitemap.xml`).
  - Standard compliant `client/public/sitemap.xml` strictly referencing public canonical URL without non-crawlable hash anchors.
  - HTML file verification backup preserved at `client/public/google18abb8e90c4c273e.html`.
- **Automated Test Suite**: Node.js native test runner (`node:test`) covering converter formatting, binary management, and workspace integrity.

### Planned / Inferred / Unimplemented Features
- *Inferred*: The Pricing Modal (`PricingModal.jsx`) is a presentation/comparison UI; no external payment processor (Stripe, LemonSqueezy) is integrated.
- *Inferred*: `server/cookies.txt` provides Netscape cookie authentication for bot bypass, but there is no automated cookie refresh UI or user credential management.
- *Unimplemented*: Multi-item playlist batch downloads (backend enforces `--no-playlist`).
- *Unimplemented*: Conversion queue prioritization or concurrency worker pools (conversions run concurrently on demand).

---

## 3. Verified Technology Stack

| Layer | Technology | Version | Evidence / Source |
| :--- | :--- | :--- | :--- |
| **Runtime** | Node.js | `v22.23.2` | System environment check |
| **Package Manager** | npm | `10.9.2` | Workspace setup in `package.json` |
| **Backend Framework** | Express | `^4.21.2` | `server/package.json` |
| **HTTP Middleware** | CORS | `^2.8.5` | `server/package.json` |
| **Media CLI Engine** | yt-dlp | `v2026.08.19` | `server/bin/yt-dlp.exe` verified |
| **Media Processing** | FFmpeg | `v6.1.1` (gyan.dev) / ffmpeg-static `^5.2.0` | `server/bin/ffmpeg.exe` & `server/binManager.js` |
| **Frontend Framework** | React / React DOM | `^19.0.0` | `client/package.json` |
| **Bundler & Dev Server**| Vite | `^6.0.0` | `client/vite.config.js` |
| **Icons** | Lucide React | `^1.16.0` | `client/package.json` |
| **Animations** | GSAP & @gsap/react | `^3.15.0` / `^2.1.2` | `client/package.json` |
| **Motion Video Engine** | Remotion & @remotion/cli | `4.0.539` | `remotion/package.json` |
| **Visual Effects** | canvas-confetti | `^1.9.4` | `client/package.json` |
| **Test Runner** | Node.js Test Runner | Native (`node:test`, `node:assert`) | Built-in to Node v22 |

---

## 4. Architecture & Data Flow

```
[Browser Client]
       │
       ├─► POST /api/info (URL) ────────► yt-dlp --dump-single-json ──► Metadata
       ├─► POST /api/convert ───────────► Spawn yt-dlp (Turbo 16x) ───► Job UUID
       ├─► GET /api/progress/:jobId ◄─── SSE EventSource (400ms) ─────► Real-time Stats
       ├─► GET /api/stream/:jobId ◄───── HTTP 206 Partial Content ────► In-browser Playback
       └─► GET /api/download/:jobId ◄─── RFC 5987 Unicode Attachment ─► File Save
```

1. **Proxy in Dev**: In development, `client/vite.config.js` proxies requests from `localhost:5173/api` to `localhost:3001/api`.
2. **Production Hosting**: Express serves static files from `client/dist/` in production if built.
3. **Desktop Packaging**: `scripts/package-desktop.mjs` temporarily swaps `App.jsx` with `AppDesktop.jsx`, builds client, and bundles with server & binaries.

---

## 5. Important Files & Responsibilities

| File Path | Role & Verified Responsibility |
| :--- | :--- |
| `package.json` | Root workspace orchestrator linking `client` and `server`. |
| `start.bat` | Windows batch launcher; checks Node/npm, installs deps if needed, starts server & client. |
| `vercel.json` | Static deployment config targeting `client/dist` with client-side SPA rewrites. |
| `server/index.js` | Express server, REST endpoints, SSE progress pipeline, HTTP 206 streaming. |
| `server/converter.js` | Core conversion orchestrator, `yt-dlp` spawn manager, progress parser, TTL disk cleaner. |
| `server/binManager.js` | Binary locator, auto-downloader for `yt-dlp`, and bridge for `ffmpeg`. |
| `server/cookies.txt` | Netscape cookie jar for bypassing YouTube/Instagram bot protection. |
| `client/src/App.jsx` | Web root with `#landing` vs `#app` hash routing, job state orchestration, and `SonicIntro`. |
| `client/src/AppDesktop.jsx` | Dedicated root component for packaged desktop release (no landing page). |
| `client/src/components/SonicIntro.jsx` | In-app cinematic animated intro with Web Audio synthesis & Easing Wizard physics curves. |
| `client/src/components/AudioPlayer.jsx` | Audio/video player with range-based stream seeking and download actions. |
| `client/src/components/CommandPalette.jsx` | `Ctrl+K` quick action menu with format switching, engine updates, and intro replay. |
| `client/src/index.css` | Spotify-inspired dark UI design tokens, Easing Wizard physics curves, and intro styling. |
| `remotion/src/SonicWaveIntro.tsx` | Full HD 1080p @ 30fps programmatic Remotion video composition component. |
| `remotion/src/Root.tsx` | Remotion root registering `SonicWaveIntro` composition. |
| `scripts/generate-intro-audio.js` | Synthesizes 48kHz stereo 16-bit PCM cinematic soundscape for Remotion and web. |
| `scripts/package-desktop.mjs` | Automated builder for `SonicWave-v1.0.0-Windows.zip`. |
| `tests/converter.test.js` | Duration formatting, job state isolation, and directory validation tests. |
| `tests/binManager.test.js` | Path validation, binary existence, and binary execution tests. |
| `tests/intro.test.js` | Video assets, audio synthesis, accessibility safeguards, and Easing Wizard tests. |
| `tests/workspace.test.js` | Package manifests and workspace configuration integrity tests. |

---

## 6. Coding & Design Conventions
- **Backend Architecture**: CommonJS (`require`), error-resilient async functions, regex-driven stdout progress parsing.
- **Frontend Architecture**: React 19 functional components with hooks, strict separation between web marketing (`LandingPage.jsx`) and converter app (`App.jsx` / `AppDesktop.jsx`).
- **Styling**: Pure CSS variables defined in `:root` of `client/src/index.css` following Spotify color tokens (`--spotify-green: #1ed760`, `--bg-base: #121212`, `--bg-surface: #181818`).
- **Testing**: Zero new external testing dependencies; uses `node:test` and `node:assert/strict`.

---

## 7. Available Development Commands

> [!NOTE]
> On Windows PowerShell, use `npm.cmd` if script execution policy restricts `npm.ps1`.

- **Setup Dependencies**:
  ```powershell
  npm.cmd run setup
  ```
- **Run Full Dev Environment**:
  ```powershell
  npm.cmd run dev
  ```
- **Run Backend Only**:
  ```powershell
  npm.cmd run server
  ```
- **Run Frontend Only**:
  ```powershell
  npm.cmd run client
  ```
- **Build Client for Production**:
  ```powershell
  npm.cmd run build
  ```
- **Package Standalone Windows ZIP**:
  ```powershell
  npm.cmd run package
  ```
- **Execute All Tests**:
  ```powershell
  npm.cmd test
  # Or directly:
  node --test tests/*.test.js
  ```

---

## 8. Configuration Requirements (Without Secrets)
- **`PORT`**: Backend server listening port (Default: `3001`).
- **`VITE_API_URL`**: Client environment variable for API base URL (Default: empty string, routed via Vite proxy or relative path).
- **`server/cookies.txt`**: Optional Netscape cookie file for authenticating with media platforms.

---

## 9. Known Issues & Limitations
1. **Background Cleanup Interval in Converter**: (Resolved) `server/converter.js` uses `setInterval(...).unref()`, allowing clean process termination.
2. **PowerShell Script Execution**: Running `npm` directly in PowerShell fails if execution policies are restricted (`PSSecurityException`). Always use `npm.cmd`.
3. **Platform Bot Verification**: YouTube intermittently flags cloud server IPs or datacenter IPs. The application mitigates this with `--extractor-args "youtube:player_client=android,web"` and `--cookies`, but fresh cookies may be required if YouTube alters detection algorithms.
4. **Vercel Limitations**: Vercel configuration deploys only the frontend (`client/dist`). The backend converter requires a persistent Node.js runtime with binary execution support (`server/bin`).

---

## 10. Important Decisions & Constraints
- **Direct Stream Copy**: Video (`MP4`) and AAC (`M4A`) formats utilize stream copy (`-c copy`) when possible to avoid re-encoding latency.
- **16-Stream Turbo Acceleration**: Uses `-N 16` concurrent fragment downloads with 16MB buffer sizes for fast downloads.
- **Zero-Dependency Testing**: Tests run directly on Node's native test runner (`node:test`) to avoid altering testing dependencies.
- **Continuous Integration**: Lightweight multi-platform GitHub Actions workflow (`.github/workflows/test.yml`) runs tests on Node 20 and 22.
- **Decoupled Desktop App**: Desktop distribution automatically replaces `App.jsx` with `AppDesktop.jsx` to eliminate marketing overhead for installed desktop users.

---

## 11. Prioritized Next Steps
1. Add backend connection retry and graceful offline warning indicator in frontend when server is restarting.
2. Provide a health check polling indicator in the client header with auto-reconnect logic.
3. Investigate headless cookie generation or automated browser cookie sync for bot evasion.

---

## 12. Areas That Could Not Be Verified
- **Live YouTube Video Conversion During Automated Tests**: Intentionally skipped in automated tests to prevent IP rate-limiting and external network flakiness.
- **Vercel Production Deployment**: `vercel.json` is configured, but live cloud deployment status could not be verified from local environment.

