# SonicWave : Project Memory & Architecture Knowledge Base

## 1. Project Identity & Purpose
- **Name**: SonicWave (repository name: `ytmp3-converter`)
- **Purpose**: High-fidelity YouTube and multi-platform media downloader, audio/video converter, and in-browser media player.
- **Operating Modes**:
  1. Full-stack web application (React frontend + Express backend).
  2. Standalone Windows package (1.3 MB portable zip distribution that provisions yt-dlp and FFmpeg on first launch via `binManager.js`).

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
- **UI Design System**: Spotify-inspired dark theme (`#121212`, Spotify Green `#1ed760`) for converter studio, paired with a Linear-styled marketing landing page featuring a light mode toggle (`Sun` / `Moon`) that preserves dark mode in the converter. Configured CSS easing variables and `prefers-reduced-motion` media queries.
- **Technical SEO & Search Console Verification**:
  - Global Search Console verification meta tag (`vyi8Qkc4E4RP878V8Gc8VFv05oWR53YLsP0m6eWjYCI`) configured in `<head>` of `client/index.html`.
  - Canonical URL anchored to live production deployment (`https://ytmp-3-five.vercel.app/`).
  - Search engine crawler directives in `client/public/robots.txt` (`User-agent: *`, `Allow: /`, pointing to `https://ytmp-3-five.vercel.app/sitemap.xml`).
  - Standard compliant `client/public/sitemap.xml` strictly referencing public canonical URL without non-crawlable hash anchors.
  - HTML file verification backup preserved at `client/public/google18abb8e90c4c273e.html`.
- **Accessibility & WCAG 2.2 AA Compliance**:
  - Prohibited ARIA resolution: Removed invalid `aria-label` from generic `div.cursor-waveform-spectrum`, added `aria-hidden="true"` for decorative spectrum animation.
  - Semantic Heading Hierarchy: Restructured interactive track preview to use `<p className="cursor-vis-title">` instead of skipped `h3`/`h4` under hero `h1`.
  - Landmark Structure: Wrapped landing page sections in `<main id="main-content" tabIndex={-1} aria-label="SonicWave Product Overview">` with matching skip-link destination.
  - Contrast AA/AAA Remediation: Replaced low-contrast lavender text (`#5e6ad2`, 3.89:1) with high-contrast `--cursor-primary-text` (`#96a1ff`, 8.78:1 dark, `#414cae` 6.88:1 light), updated tertiary/subtle ink tokens (`#9fa6b2` and `#9ca3af`, >7:1), and adjusted halftone wordmark footer opacities.
  - Touch Target Sizing: Standardized navigation links (`.cursor-nav-link`, `.cursor-mobile-nav-link`) with >= 44px hit heights and >= 8px padding, plus verified footer touch spacing and eliminated fake `href="#"` dummy links.
- **Production Legal & Support Infrastructure**:
  - Four dedicated, accessible pages: Privacy Policy (`/privacy`), Terms of Use (`/terms`), Copyright & Acceptable Use (`/copyright-acceptable-use`), and Contact & Support (`/contact`).
  - SPA routing integrated with browser History API (`pushState`, `popstate`), hash fallbacks, and Vercel wildcard rewrite compatibility (`vercel.json`).
  - Dynamic document metadata via `useDocumentMetadata`: descriptive page titles, unique meta descriptions, and self-referencing canonical URLs for all four routes.
  - Full sitemap integration in `client/public/sitemap.xml` referencing real canonical URLs.
  - Shared `LegalLayout` with tabbed cross-navigation, theme toggle, and dedicated legal footer, harmonized with Spotify/Linear design tokens.
  - Automated test assertions in `tests/workspace.test.js` validating legal component existence and sitemap URL coverage.
- **Brand Favicon Suite & Social Share Preview**:
  - `client/public/favicon.ico`: Windows multi-resolution icon binary packaging 16x16, 32x32, and 48x48 PNG layers with 5-bar acoustic soundwave brand mark.
  - `client/public/favicon-96.png`: 96x96 PNG for modern browser tabs and Google Search desktop favicon snippet displays.
  - `client/public/apple-touch-icon.png`: 180x180 PNG for iOS home screen bookmarks and Apple Safari pinned tabs.
  - `client/public/og/sonicwave-share.png`: 1200x630 social preview image.
  - `client/public/og-image.png`: Mirrored for backwards compatibility with legacy crawlers.
  - `scripts/generate-assets.mjs` & `npm run generate:assets`: Automated generator leveraging Chrome headless with GDI+ bicubic downsampling.
  - `client/index.html`: Fully updated with standard `<link rel="icon">`, `<link rel="apple-touch-icon">`, Open Graph, Twitter Cards, and Schema.org metadata.
- **Download Success Modal**:
  - `client/src/components/DownloadSuccessModal.jsx`: Modal dialog appearing whenever a user triggers the `SonicWave-v1.0.0-Windows.zip` download.
  - Displays file metadata pill (`SonicWave-v1.0.0-Windows.zip` · 1.3 MB · SHA-256 Verified).
  - 3-step actionable quick start guide (1. Extract ZIP, 2. Run `start.bat`, 3. Convert & Enjoy).
  - Windows Defender SmartScreen notice informing users to click "More info" -> "Run anyway".
  - Quick action buttons ("View Full Installation Guide" -> `/install`, and "Click here to retry" link).
  - Full keyboard accessibility (`Escape` key dismiss, backdrop click, focus trap, `role="dialog"`, `aria-modal="true"`, `aria-labelledby`).
  - Integrated across `LandingPage.jsx`, `InstallGuide.jsx`, `DocsLayout.jsx`, and `LegalLayout.jsx`.
- **Custom 404 Error Page**:
  - `client/src/components/NotFound.jsx`: Error page featuring quick navigation cards (Install Guide, Platforms, Troubleshooting, Privacy, Support), and theme toggle.
  - Dynamically injects `meta[name="robots"] content="noindex, follow"` via `useDocumentMetadata` to maintain technical SEO hygiene.
  - SPA router in `client/src/App.jsx` cleanly catches all unknown routes (and explicit `/404`), rendering `NotFound` without page crashes or blank views.
  - `client/public/404.html`: Lightweight static fallback page for static hosting edge cases and non-JS clients.
- **Organic Visibility Growth Plan & Technical Documentation Architecture**:
  - Three dedicated, indexable technical documentation hubs: Installation Guide (`/install`), Supported Platforms & Codecs (`/supported-platforms`), and Troubleshooting & FAQ Hub (`/troubleshooting`).
  - Pre-rendered semantic footer navigation inside `<div id="root">` in `client/index.html` allowing crawlers to discover all 7 subpages on the very first byte without waiting for JavaScript execution.
  - Schema.org structured data expansions (`HowTo`, `TechArticle`, `FAQPage`) with explicit step and diagnostic definitions.
  - Full sitemap coverage in `client/public/sitemap.xml` with priority weighting (1.0, 0.9, 0.8) and `client/public/llms.txt` synchronization.
  - Standardized honest file size claims across all UI components and metadata to **1.3 MB** (matching the actual `SonicWave-v1.0.0-Windows.zip`).
- **Security Hardening (Cloudflare Security Audit Workflow)**:
  - Installed `cloudflare/security-audit-skill` globally to `C:\Users\shiv\.gemini\config\skills\security-audit`.
  - SSRF & IP confinement in `server/converter.js`: blocks loopback, private IPv4, Carrier-Grade NAT, and cloud metadata (`169.254.169.254`, `metadata.google.internal`).
  - Strict CORS origin allowlist in `server/index.js` preventing cross-origin localhost port hijacking by third-party websites.
  - Concurrency limiter in `server/index.js`: enforces `MAX_CONCURRENT_CONVERSIONS = 3` to prevent process fork bombing and memory exhaustion.
  - Path traversal protection in `/api/stream` and `/api/download`: strictly confines file access within `server/downloads/`.
  - Replaced `execSync` template string shell invocations in `server/binManager.js` with `execFileSync` argument arrays.
  - Defensive security headers: `X-Content-Type-Options: nosniff`, `X-Frame-Options: SAMEORIGIN`, `Referrer-Policy: strict-origin-when-cross-origin`.
  - Documented findings and verification in `docs/SECURITY_AUDIT_REPORT.md`.
- **Machine-Readable Pricing and Metadata**:
  - `client/public/pricing.md`: Standardized machine-readable pricing and license specifications ($0/mo free MIT license, unlimited conversions, 16-thread speed, zero telemetry/ads).
  - `client/public/llms.txt`: Summary of capabilities and conversion guide mappings.
  - `client/public/robots.txt`: Added explicit crawler permissions for search and AI crawlers.
  - Programmatic Conversion Guides (`client/src/components/convert/ConverterGuide.jsx` & `converterData.js`): 4 conversion guides with technical specifications tables, comparison tables, tutorials, and FAQs.
- **Converter Studio Desktop & Localhost Launcher Routing**:
  - `start.bat` starts the server and client dev environment, opening the website at `http://localhost:5173`.
  - Standalone portable desktop package (`SonicWave-v1.0.0-Windows.zip`) runs directly in dedicated Converter Studio mode (`AppDesktop.jsx`).
  - Web client (`App.jsx`) serves the marketing landing page, legal documents, technical guides, and download modals.
  - Dependency checking in `start.bat`: verifies local and hoisted `node_modules` before running `npm install`.
  - Server startup: `app.listen()` binds immediately to port 3001, allowing instant health checks while binary verification proceeds in background.
  - Auto-reconnecting status polling: `AppDesktop.jsx` polls `/api/status` every 3s during startup or disconnects.
  - Stream cancellation cleanup: `/api/progress/:jobId` cleans up SSE intervals on job cancellation.
  - Windows path containment normalization: case-insensitive downloads directory verification in `/api/stream` and `/api/download`.
  - CORS localhost resilience: permits local dev ports (5173, 5174, etc.).
- **Automated Test Suite**: Node.js native test runner (`node:test`) covering converter formatting, binary management, workspace integrity, brand assets, legal pages, technical documentation routing, download success dialogbox, custom 404 error page, security boundaries, AI-SEO / programmatic conversion guides, and server endpoints.
- **Marketing Launch Kit**: `docs/MARKETING_LAUNCH_KIT.md` provides launch checklist, copy templates, and feature highlights.
- **Programmatic Video Generation Pipeline (Remotion v4.0.543)**: Scaffolded `video/` workspace with `@remotion/cli` and React 19 to generate 15-second creator workflow demos (`SonicWaveShort` and `SonicWavePromo`).

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
| `client/src/App.jsx` | Web marketing and documentation router (LandingPage, Docs, Legal, 404, download modals). |
| `client/src/AppDesktop.jsx` | Dedicated root component for packaged desktop release (no landing page). |
| `client/src/components/AudioPlayer.jsx` | Audio/video player with range-based stream seeking and download actions. |
| `client/src/components/CommandPalette.jsx` | `Ctrl+K` quick action menu with format switching, engine updates, and navigation. |
| `client/src/index.css` | Spotify-inspired dark UI design tokens and animation easing curves. |
| `scripts/package-desktop.mjs` | Automated builder for `SonicWave-v1.0.0-Windows.zip`. |
| `tests/converter.test.js` | Duration formatting, argument building, progress parsing, and job state tests. |
| `tests/binManager.test.js` | Path validation, binary existence, and binary execution tests. |
| `tests/security.test.js` | SSRF prevention, URL normalization, and path confinement tests. |
| `tests/server.test.js` | Express API endpoints, SSE streams, range streaming, and error handling tests. |
| `tests/workspace.test.js` | Package manifests, routing, and workspace configuration integrity tests. |

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
  # Or directly (Node native test runner recursively discovers tests):
  node --test
  ```

---

## 8. Configuration Requirements (Without Secrets)
- **`PORT`**: Backend server listening port (Default: `3001`).
- **`VITE_API_URL`**: Client environment variable for API base URL (Default: empty string, routed via Vite proxy or relative path).
- **`server/cookies.txt`**: Optional Netscape cookie file for authenticating with media platforms.

---

## 9. Known Issues & Limitations
1. **Background Cleanup Interval in Converter**: (Resolved) `server/converter.js` uses `setInterval(...).unref()`, allowing clean process termination.
2. **Backend Server Syntax Error**: (Resolved) Removed duplicate callback closure in `server/index.js` `/api/download` route that previously prevented server bootstrapping.
3. **Desktop Launcher Routing**: (Resolved) `start.bat` updated to launch `#app` converter studio route and natively serve pre-compiled `client/dist` in standalone package mode without requiring client `node_modules` installation.
4. **PowerShell Script Execution**: Running `npm` directly in PowerShell fails if execution policies are restricted (`PSSecurityException`). Always use `npm.cmd`.
5. **Platform Bot Verification**: YouTube intermittently flags cloud server IPs or datacenter IPs. The application mitigates this with `--extractor-args "youtube:player_client=ios,android"` (bypassing web player n-sig throttling) and `--cookies`, but fresh cookies may be required if YouTube alters detection algorithms.
6. **Vercel Limitations**: Vercel configuration deploys only the frontend (`client/dist`). The backend converter requires a persistent Node.js runtime with binary execution support (`server/bin`).

---

## 10. Important Decisions & Constraints
- **Direct Stream Copy**: Video (`MP4`) and AAC (`M4A`) formats utilize stream copy (`-c copy`) when possible to avoid re-encoding latency.
- **16-Stream Turbo Acceleration**: Uses `-N 16` concurrent fragment downloads with 16MB buffer sizes for fast downloads.
- **Backend Engine Optimizations**: YouTube extractor client updated to `youtube:player_client=ios,android` to bypass n-sig throttling; integrates `aria2c` external multi-connection downloader (`-s 16 -x 16 -k 1M -j 16`) with automatic fallback to yt-dlp native downloader; `--http-chunk-size` optimized to 5M to prevent TCP window stalls.
- **Zero-Dependency Testing**: Tests run directly on Node's native test runner (`node:test`) to avoid altering testing dependencies.
- **Continuous Integration**: Lightweight multi-platform GitHub Actions workflow (`.github/workflows/test.yml`) runs tests on Node 20 and 22.
- **Decoupled Desktop App & Clean Website**: Desktop distribution automatically replaces `App.jsx` with `AppDesktop.jsx` to package the full converter studio. The website (`client/src/App.jsx`) is strictly decoupled from the converter application, serving only the marketing landing page, legal, documentation, and download hubs with zero Web Studio buttons or converter app chunks in the web bundle.
- **Persistent Floating Navigation**: `.cursor-top-nav` is configured with `position: fixed; top: 0; left: 0; right: 0; width: 100%; z-index: 1000;`, paired with `.cursor-canvas-root { padding-top: 56px; overflow-x: clip; }`. This ensures the dynamic navbar (frosted glass, reading progress bar, and active section tracking) persistently follows the user as they scroll without being clipped by overflow containers or causing hero content shifts.

---

## 11. Prioritized Next Steps
1. Add backend connection retry and graceful offline warning indicator in frontend when server is restarting.
2. Provide a health check polling indicator in the client header with auto-reconnect logic.
3. Investigate headless cookie generation or automated browser cookie sync for bot evasion.

---

## 12. Areas That Could Not Be Verified
- **Live YouTube Video Conversion During Automated Tests**: Intentionally skipped in automated tests to prevent IP rate-limiting and external network flakiness.
- **Vercel Production Deployment**: `vercel.json` is configured, but live cloud deployment status could not be verified from local environment.

