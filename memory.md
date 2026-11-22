# SonicWave : Project Memory & Architecture Knowledge Base

## 1. Project Identity & Purpose
- **Name**: SonicWave (repository name: `ytmp3-converter`)
- **Purpose**: High-fidelity YouTube and multi-platform media downloader, audio/video converter, and in-browser media player.
- **Operating Modes**:
  1. Full-stack web application (React frontend + Express backend).
  2. Standalone Windows package (1.3 MB portable zip distribution that provisions yt-dlp and FFmpeg on first launch via `binManager.js`).
  3. True Native Windows Application (Electron + Express background engine, Spotify-themed standalone window, zero browser address bar, and official NSIS installer `SonicWave-Setup-1.0.0.exe`).
  4. Custom Frameless GUI Installer (`dist-installer/SonicWave-Custom-Installer.exe`): A dedicated 740×500 frameless dark GUI installer (like TLauncher / Discord / Epic Games) with real-time soundwave visualizer, custom directory picker, desktop/start-menu shortcut creation, and registry uninstall registration.
  5. Standalone On-Device Android Application (`client/public/SonicWave.apk`): 100% on-device embedded Python/FFmpeg engine for Android smartphones (Android 8.0+) with system Share Sheet integration and direct downloads to phone storage.

---

## 2. Current Implementation Status

### Verified Implemented Features
- **Multi-Platform Metadata Resolution & Tailored Social Options**:
  - Distinguishes between **Reels** (Instagram Reel, YouTube Short, TikTok, Facebook Reel) and **Posts** (Instagram feed photo/carousel/video, Facebook post, Twitter/X post, Reddit, SoundCloud audio) with precise aspect ratio tags (`9:16`, `1:1`, `16:9`).
  - Dynamic content classification via `classifyMediaContent(url, data)` in `server/converter.js`.
  - App-specific tailored download presets generated via `getTailoredDownloadOptions` (e.g. 1080p MP4, 320k MP3 audio track, M4A fast stream copy, high-res photo/cover download).
  - Spotify-themed interactive preview badges (`🎬 Reel • 9:16`, `⚡ YouTube Short`, `📄 Feed Post`, `📸 Carousel (N items)`, `🔇 Silent Source`) in `VideoPreview.jsx`.
  - 1-click tailored download presets with active highlights in `OptionsSelector.jsx` and direct photo/cover download in `AppDesktop.jsx`.
  - **Instagram Carousel & Silent Media Resolution**:
    - Multi-item sidecar posts (`_type === 'playlist'`, `data.entries`) resolve primary item thumbnail, title, uploader, and duration cleanly from `data.entries[0]`.
    - Detects silent media (`acodec === 'none'`), recommending pristine Full HD MP4 video and full-resolution photo downloads rather than failing postprocessing with `unable to obtain file audio codec with ffprobe`.
    - Added `--playlist-items 1` in `buildConversionArgs` for Instagram multi-item posts, preventing yt-dlp file output template collisions and downloading slide 1 cleanly in seconds.
    - Added clear user error messaging in `attachProcessListeners` when audio extraction is attempted on silent media without crashing the backend process.
    - **Full Social Media Photo & Carousel Downloading Engine (`server/photoResolver.js`)**:
      - Automatic fallback in `getVideoInfo`: When `yt-dlp` reports missing video formats on photo-only posts (`No video formats found`, `There is no video in this post`), SonicWave automatically invokes `resolvePhotoMetadata`.
      - **Instagram Support & Genuine Carousel Extraction**: Fetches Instagram post pages with crawler emulation (`Googlebot`/`facebookexternalhit`) to parse the full Relay SSR JSON payload (`carousel_media`, `image_versions2`). Extracts all slides in 1080p full resolution, whether given the root carousel URL or an individual slide's shortcode. Strictly sanitizes HTML to exclude author profile hover card previews (`HoverCardPhotos`/`HoverCardRoot`), preventing false-positive extraction of older recent carousels from the author's feed.
      - **Reddit & Twitter Support**: Native parsing for Reddit multi-image galleries (`media_metadata`) and Twitter/X photo tweets via `api.vxtwitter.com`.
      - **Direct PKZip Packaging (`createZipBuffer`)**: Zero-dependency, pure Node.js in-memory ZIP builder using standard PKZip local/central directory headers and `zlib.deflateRawSync` (bundles all slides into `${safeTitle}_photos.zip` in seconds with zero external npm dependencies).
      - **Single Photo Download**: Fast direct high-res image download (`.jpg` / `.png`).
      - **Frontend UX & Interactive Carousel Viewer (`VideoPreview.jsx`, `OptionsSelector.jsx`)**:
        - **Interactive Carousel Slider**: Live slide switching with previous/next navigation buttons, active slide counter pill (`📸 Slide {i} of {n}`), and full-size image preview.
        - **Scrollable Thumbnail Filmstrip**: Displays all carousel slides with visual index badges (`#1`, `#2`, ...), active Spotify-green border highlights, and instant click-to-preview.
        - **1-Click Individual Slide Downloads**: Instant download button on every thumbnail card and quick-action bar streaming high-res photos via dedicated non-blocking backend proxy (`GET /api/photo-download?url=...&filename=...`), avoiding conversion worker slot congestion.
        - **Fullscreen Lightbox Gallery Modal**: Expandable full-screen lightbox modal with keyboard navigation (`ArrowLeft`, `ArrowRight`, `Escape`), slide caption, and high-resolution display.
        - **Selective Slide Format Picker**: Dynamic format selector allowing users to choose between downloading the full multi-photo ZIP archive or specific slides (`Slide #1`, `Slide #2`, etc.) in `.JPG` or `.PNG`.
        - Responsive CTA button states dynamically updating between `DOWNLOAD ALL {N} PHOTOS (.ZIP)` and `DOWNLOAD SLIDE #{N} (.JPG)`.
      - Full test coverage in `tests/photoResolver.test.js` and `tests/converter.test.js` (**90/90 tests passing**).
    - **Sanitized Error Reporting & Photo Post Detection (`formatYtDlpError`)**:
      - Centralized error normalization in `formatYtDlpError` (`server/converter.js`) across both `getVideoInfo` and `attachProcessListeners`.
      - Detects Instagram photo carousel / photo-only posts (`No video formats found`, `There is no video in this post`, `no video in this post`) and provides a clear, friendly error explaining that the post contains only static photos/images and cannot be converted to media streams.
      - Strips internal yt-dlp bug report links (e.g. `; please report this issue on https://github.com/yt-dlp/yt-dlp/issues...`) so raw upstream stack traces and developer URLs are never exposed to end users.
      - Tested with comprehensive assertions in `tests/converter.test.js`.
- **Audio Extraction**: Multi-bitrate MP3 (`320k`, `256k`, `192k`, `128k`), M4A (instant stream copy), lossless WAV, and FLAC.
- **Video Conversion**: High-definition MP4 packaging (`1080p`, `720p`, `480p`, `best`) with direct stream copy audio muxing.
- **Live Progress Updates**: Server-Sent Events (SSE) tracking download percentage, speed, ETA, and re-encoding stage every 400ms.
- **In-Browser Playback**: HTTP 206 Partial Content media player supporting audio seeking and HD video preview modal.
- **Unicode Downloads**: RFC 5987 compliant `Content-Disposition` headers supporting international character sets.
- **Self-Bootstrapping Engine**: Automatic provisioning of `yt-dlp` executable and local bridge for `ffmpeg`.
- **Persistent History**: Server-side JSON storage (`server/data/history.json`, capped at 50 records) and client-side `localStorage` cache.
- **Desktop Packaging**: `scripts/package-desktop.mjs` generates `SonicWave-v1.0.0-Windows.zip` stripped of marketing landing components.
- **Main Website Installer Integration & Live Binary Delivery**:
  - Replaced browser-launching web scripts with a true native desktop application launcher (`SonicWave.exe` compiled from C# against .NET Framework 4.0/4.8) that starts the local engine silently in the background (no console window) and hosts the Spotify-dark Converter Studio inside a dedicated native desktop window (no browser address bar, no tabs).
  - Cleanly manages the backend process lifetime by automatically terminating the background Node engine upon window closure.
  - The standalone custom installer (`SonicWave-Custom-Installer.exe`, 1.52 MB) extracts `SonicWave.exe`, generates Desktop and Start Menu shortcuts targeting `SonicWave.exe`, and auto-launches the native window application.
  - The portable ZIP archive (`SonicWave-v1.0.0-Windows.zip`, 1.45 MB) serves the web version with `start.bat` for users wanting local browser execution.
  - Streamlined the landing page hero and bottom CTA rows: removed the cluttered 4-button cluster and replaced it with a prominent, high-converting **"DOWNLOAD NOW"** primary CTA button paired with subtle platform selector sublinks (`Windows Native (.exe)`, `Web Portable (.zip)`, `Android (.apk)`, `macOS (.zip)`).
  - **Dedicated Download Center Page (`client/src/components/DownloadPage.jsx`)**:
    - Opens directly when "DOWNLOAD NOW" is clicked from any landing page CTA (or directly via `/download`).
    - Presents all 4 official distributions: Windows Custom Installer (`SonicWave-Custom-Installer.exe`), Android Standalone APK (`SonicWave.apk`), Windows Portable ZIP (`SonicWave-v1.0.0-Windows.zip`), and macOS Portable Package (`SonicWave-v1.0.0-macOS.zip`).
    - Features dynamic client OS auto-detection highlighting the user's specific platform, actionable 1-click download buttons, complete step-by-step installation & usage walkthroughs for each package, comparison matrix, and SmartScreen / Android sideloading diagnostic FAQs.
    - Top header branding styled cleanly with design tokens (`cursor-nav-brand`, explicit text colors, version badge) and `Back to Home` navigation button.
    - Full SPA routing (`/download`, `/downloads`), sitemap indexing (`sitemap.xml` priority 1.0), and AI crawler discovery (`llms.txt`).
    - **4-Card Single-Line Aligned Grid**: Configured `.download-methods-grid` with `grid-template-columns: repeat(4, minmax(0, 1fr))` and flexible spacing (`clamp(12px, 1.4vw, 20px)`) ensuring all 4 cards align in a single horizontal row on desktop and laptop displays (down to 960px) with equalized heights, unbreakable specs pills, and pinned installation guides. Responsive fallback uses a balanced 2x2 grid (`repeat(2, minmax(0, 1fr))`) on tablets (<= 960px) and a single-column stack on mobile (<= 580px).
- **Electron Black Screen Remediation**:
  - Added `app.disableHardwareAcceleration()` for Windows (`process.platform === 'win32'`) in `electron/main.js` to eliminate Chromium D3D11/GPU driver black-screen hangs.
  - Implemented `show: false` paired with `mainWindow.once('ready-to-show', () => mainWindow.show())` to eliminate black window rendering before the DOM is painted.
  - Ensured `userData` directory creation before writing `sonicwave.log` to prevent unhandled I/O failures on clean installations.
- **UI Design System**: Unified Spotify-inspired dark theme (`#121212`, Spotify Green `#1ed760`) paired with Linear-styled dark surfaces across the entire application and website. Light mode and all light mode toggles (`Sun` / `Moon` buttons) have been completely removed from all pages (`LandingPage.jsx`, `DownloadPage.jsx`, `NotFound.jsx`, `DocsLayout.jsx`, `LegalLayout.jsx`, `PrivacyPolicy.jsx`, and `client/src/index.css`), ensuring a consistent, distraction-free dark experience everywhere. Configured CSS easing variables and `prefers-reduced-motion` media queries.
- **Modern Web Guidance Compliance**:
  - **Forms & IME Safety (`ime-safe-enter-submit`, `forms`)**: In `UrlInput.jsx`, guarded the `Enter` submission listener against IME composition collisions (`e.isComposing || e.keyCode === 229`), wrapped the search bar in semantic `<search role="search">` and `<form onSubmit={handleFormSubmit}>` with an explicit `type="submit"` button, and upgraded input attributes to `type="url"`, `inputMode="url"`, `enterKeyHint="go"`, `autoCorrect="off"`, `autoCapitalize="none"`, and `spellCheck="false"`.
  - **Typography Balancing (`improve-text-layout-and-legibility`)**: Applied `text-wrap: balance` to headings (`h1-h6`, hero titles, card titles) and `text-wrap: pretty` to body text (`p`, `li`, `blockquote`, FAQ answers) in `index.css`, preventing orphaned runts and creating publication-grade typography.
  - **Layout Stability & Accents (`css-layout`, `scrollbar-gutter`)**: Added `scrollbar-gutter: stable` to `html` to eliminate 15-17px layout shifts when navigating or toggling modals, added `accent-color: var(--spotify-green)` to `:root` for brand-matching native inputs, and added `overscroll-behavior: contain` to modal and drawer overlays.
  - **CWV Rendering Optimization (`defer-rendering-heavy-content`, `performance`)**: Added `content-visibility: auto` paired with `contain-intrinsic-size: auto none auto 600px` to heavy below-the-fold landing page sections, and optimized media image decoding (`decoding="async"`, `fetchPriority="high"` on active video preview, `loading="lazy"` on history items).
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
- **Cross-Platform macOS Support**:
  - `start.sh`: Production-grade POSIX bash launcher for macOS and Linux with Node/npm environment verification, Homebrew installation hints, automatic dependency installation, standalone vs dev routing, and process cleanup traps (`trap ... SIGINT SIGTERM EXIT`).
  - `electron-builder.json`: Added macOS target configuration producing `.dmg` and `.zip` for both Apple Silicon (`arm64`) and Intel (`x64`), `darkModeSupport: true`, `public.app-category.music`, and custom DMG window coordinates.
  - `package.json`: Added `package:mac` script (`node scripts/build-desktop-client.mjs && electron-builder --mac`).
  - `electron/main.js`: Added macOS window styling with native traffic lights (`hiddenInset`, `trafficLightPosition: { x: 16, y: 16 }`) and native application menu supporting standard keyboard shortcuts (`Cmd+C`, `Cmd+V`, `Cmd+A`, `Cmd+Q`, `Cmd+Z`, etc.).
  - `scripts/package-desktop.mjs`: Added generation of `SonicWave-v1.0.0-macOS.zip` (bundling `start.sh`, `server/`, `client/dist/`, `package.json`, and clean desktop entry).
  - Website & UI: Client OS auto-detection (`userPlatform`), dynamic download buttons (`Download for macOS (.zip)` vs `Download for Windows (.exe)`), interactive 3-step setup OS tabs (Windows vs macOS), and installation docs covering macOS Gatekeeper bypass instructions.
- **Standalone On-Device Android Application (Embedded Engine APK)**:
  - `android-app/`: Native standalone Android application (`com.sonicwave.app`) built with Jetpack Compose, Material 3, and Kotlin 2.3.
  - Embedded On-Device Engine: Bundles `youtubedl-android` (v0.18.1), embedded Python 3.11 runtime, FFmpeg, and aria2c native binaries (`arm64-v8a`) to execute 16-stream media extraction directly on phone hardware with zero PC or cloud server required.
  - Output Storage: Automatically writes converted media to `/storage/emulated/0/Download/SonicWave/` with ID3 metadata tags and album art embedding.
  - System Share Sheet Integration (`ACTION_SEND`): Listens for video URLs shared directly from YouTube, Instagram, and TikTok apps, auto-filling the input field and triggering conversion without copy-pasting.
  - Responsive Dark Spotify UI: Features URL input, clipboard paste, format selector (`MP3 320k/256k`, `M4A`, `FLAC`, `WAV`, `MP4 1080p/720p`), animated linear progress, speed/ETA metrics, and completed folder notifier.
  - Release Pipeline & Multi-Scheme Signing: Generated 2048-bit RSA release keystore (`android-app/app/release.keystore`), configured full v1 (JAR), v2, and v3 signature schemes (`apksigner verify --verbose` passes 100%), and 4-byte zip alignment (`zipalign -c -v 4`).
  - Target SDK Compatibility: Stabilized to `targetSdk = 34` (Android 14 UpsideDownCake) and `compileSdk = 34`, eliminating the preview SDK 36 parsing rejection and `INSTALL_FAILED_INVALID_APK` on consumer phones.
  - Manifest Schema Rectification: Relocated `android:windowSoftInputMode="adjustResize"` to `<activity>`, removed orphan service declaration.
  - Web Server & Distribution: Hardened `server/index.js` route for `/SonicWave.apk` returning `application/vnd.android.package-archive` with attachment headers and explicit 404 protection against SPA HTML fallback.
  - Distribution Packaging: Optimized release binary (`69.63 MB`, safely under the 100 MB GitHub & Vercel limits) placed at `client/public/SonicWave.apk` and `client/dist/SonicWave.apk`. Created `scripts/build-android-apk.mjs` and `npm run package:apk` for 1-command release packaging.
  - Website Integration: Dynamic Android detection (`/Android/i.test(navigator.userAgent)`), "Download for Android (.apk)" primary CTA with custom `AndroidIcon` SVG, quick setup tabs for Android, footer link, and Method 4 guide in `InstallGuide.jsx` and `TroubleshootingGuide.jsx`.
  - Automated Verification: All 75 Node integration tests (`tests/*.test.js`) and Android unit tests pass 100%. Tested and verified with Teamwork multi-agent team and Victory Auditor.
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
- **True Native Desktop Windows Application (Electron + NSIS Setup Wizard)**:
  - Added Electron runtime (`electron/main.js`, `electron/preload.js`) with Spotify dark theme (`#121212`), security isolation (`contextIsolation: true`, `nodeIntegration: false`, `sandbox: true`), and background Express lifecycle management.
  - Dedicated desktop compilation pipeline (`scripts/build-desktop-client.mjs`) builds `AppDesktop.jsx` into `client/dist/` without polluting web `App.jsx`.
  - Windows executable bundling via `electron-builder` (`electron-builder.json`) generating standalone `SonicWave.exe` in `dist-electron/win-unpacked` and NSIS installer `SonicWave-Setup-1.0.0.exe`.
  - High-resolution 256px icon generator (`scripts/generate-desktop-icon.mjs`) embedding 16, 32, 48, and 256px layers in `electron/icon.ico`.
  - Comprehensive automated test suite in `tests/electron.test.js` validating security isolation, context bridge APIs, builder configuration, and binary outputs.
- **100% Custom Frameless GUI Installer (`dist-installer/SonicWave-Custom-Installer.exe`)**:
  - Custom frameless 740×500 desktop window (`installer/main.js`, `installer/ui/index.html`) with Spotify dark theme (`#121212`), custom drag titlebar, animated soundwave equalizer, and glowing neon controls.
  - Native installer engine (`installer/engine.js`) providing destination folder selection (defaults to `%LocalAppData%\SonicWave`), Desktop & Start Menu shortcut generation via Windows Script Host, and official Windows Registry uninstaller registration (`HKCU\Software\Microsoft\Windows\CurrentVersion\Uninstall\SonicWave`).
  - Automated builder (`scripts/build-custom-installer.mjs`) compiling the standalone portable installer with embedded application payload.

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

