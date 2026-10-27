# SonicWave Development Guide

## 1. Prerequisites

Before developing or running SonicWave, ensure the following tools are installed:

- **Node.js**: Version 18.0.0 or higher (Tested and verified with **v22.23.2**).
- **npm**: Installed with Node.js.
- **Operating System**: Windows (primary target), macOS, or Linux.
- **PowerShell / Terminal**: PowerShell 7 or Windows PowerShell (see execution policy note below).

---

## 2. Windows Environment & PowerShell Execution Policy Note

> [!IMPORTANT]
> On Windows systems, running `npm` commands directly inside PowerShell may trigger a `PSSecurityException`:
> ```text
> npm : File C:\...\npm.ps1 cannot be loaded because running scripts is disabled on this system.
> ```
> To work around this without changing global system execution policies:
> - Use **`npm.cmd`** instead of `npm` in PowerShell:
>   ```powershell
>   npm.cmd run dev
>   npm.cmd --prefix client run build
>   ```
> - Or invoke via `cmd.exe`:
>   ```powershell
>   cmd /c npm run dev
>   ```
> - Or adjust current user execution policy:
>   ```powershell
>   Set-ExecutionPolicy -Scope CurrentUser RemoteSigned
>   ```

---

## 3. Project Structure & Workspaces

SonicWave uses npm workspaces to manage the backend and frontend in a single repository:

```text
YTMP3/
├── package.json          # Root workspace config and unified scripts
├── start.bat             # Windows one-click launcher
├── vercel.json           # Vercel deployment configuration
├── server/               # Express backend application
│   ├── package.json      # Backend dependencies (express, cors, ffmpeg-static)
│   ├── index.js          # API entry point & SSE stream handler
│   ├── converter.js      # Conversion pipeline & yt-dlp execution
│   ├── binManager.js     # yt-dlp & ffmpeg provisioning
│   ├── bin/              # Provisioned binaries (yt-dlp.exe, ffmpeg.exe)
│   ├── downloads/        # Temporary media output directory
│   └── data/             # Local JSON database (history.json)
├── client/               # Vite + React frontend application
│   ├── package.json      # Frontend dependencies (react, lucide-react, gsap)
│   ├── vite.config.js    # Vite configuration & /api proxy to localhost:3001
│   ├── src/              # React source code & components
│   └── dist/             # Production build artifacts
├── scripts/              # Build and distribution utilities
│   └── package-desktop.mjs # Desktop package bundler
├── tests/                # Automated tests (Node native test runner)
│   ├── converter.test.js # Conversion duration & job state tests
│   ├── binManager.test.js# Binary discovery & verification tests
│   └── workspace.test.js # Workspace integrity tests
└── docs/                 # Documentation directory
    ├── architecture.md   # Architectural overview
    ├── development.md    # Development & setup guide
    └── api.md            # HTTP and SSE API reference
```

---

## 4. Setup and Installation

### 4.1 Install Dependencies
Run the workspace setup script from the repository root:
```powershell
# Using npm.cmd on Windows:
npm.cmd run setup

# Or install manually:
cd server && npm.cmd install
cd ../client && npm.cmd install
cd ..
```

### 4.2 Provisioning Binaries
You do **not** need to manually download `yt-dlp` or install `ffmpeg` globally.
When the server starts (`server/index.js`), `binManager.js` will automatically:
1. Detect whether `server/bin/yt-dlp.exe` exists; if missing, it downloads the latest release from GitHub.
2. Locate `ffmpeg.exe` via `ffmpeg-static` and copy it to `server/bin/ffmpeg.exe`.
3. Verify both binaries by executing their `--version` flags.

---

## 5. Development Workflow & Commands

### 5.1 One-Click Launch (Windows)
Double-click `start.bat` in the root folder, or run:
```bat
start.bat
```
This launches the backend on `http://localhost:3001`, the Vite dev server on `http://localhost:5173`, and opens the browser.

### 5.2 Concurrent Development Server
From the root directory:
```powershell
npm.cmd run dev
```
Uses `concurrently` to run both the server and client concurrently.

### 5.3 Running Services Individually
- **Backend Only**:
  ```powershell
  npm.cmd run server
  # Or:
  cd server && node index.js
  ```
- **Frontend Only**:
  ```powershell
  npm.cmd run client
  # Or:
  cd client && npm.cmd run dev
  ```

---

## 6. Building and Packaging

### 6.1 Web Production Build
To compile the React frontend for web hosting:
```powershell
npm.cmd run build
```
Build artifacts are placed in `client/dist/`.

### 6.2 Packaged Windows Desktop Bundle
To generate the standalone Windows ZIP archive:
```powershell
npm.cmd run package
```
What this does:
1. Swaps `client/src/App.jsx` with `client/src/AppDesktop.jsx` (which omits the marketing `LandingPage.jsx`).
2. Builds the clean production bundle into `client/dist`.
3. Restores original web `App.jsx`.
4. Assembles a clean staging folder containing `start.bat`, `server/`, binaries, and prebuilt `client/`.
5. Compresses the staging directory into `SonicWave-v1.0.0-Windows.zip`.
6. Places the archive in `client/public/` and `client/dist/`.
7. Extracts and verifies that `LandingPage.jsx` was cleanly excluded.

---

## 7. Running Automated Tests

SonicWave uses Node.js's native test runner (`node:test` and `node:assert`), requiring zero third-party testing dependencies.

### 7.1 Run All Tests
```powershell
npm.cmd test
# Or directly via Node test runner:
node --test tests/*.test.js
```

### 7.2 Run Specific Test Suites
- **Converter & Utility Tests**:
  ```powershell
  node --test tests/converter.test.js
  ```
- **Binary Manager Tests**:
  ```powershell
  node --test tests/binManager.test.js
  ```
- **Workspace & Config Integrity Tests**:
  ```powershell
  node --test tests/workspace.test.js
  ```

---

## 8. Coding Conventions

- **Module Format**:
  - `server/` uses **CommonJS** (`require` / `module.exports`).
  - `client/` uses **ESM** (`import` / `export`).
- **Styling**:
  - Global styles are located in `client/src/index.css`.
  - Use established Spotify design system tokens (`--spotify-green`, `--bg-base`, `--bg-surface`, `--radius-pill`).
  - Do not introduce CSS frameworks (Tailwind, Bootstrap) without prior discussion.
- **Error Handling**:
  - Always handle `yt-dlp` child process stderr gracefully.
  - Wrap JSON parsing operations in try-catch blocks.
  - Return clean JSON error payloads (`{ success: false, error: 'message' }`) from API endpoints.

