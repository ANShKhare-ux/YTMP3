# AI Coding Agent Instructions & Rules

These root-level instructions apply to all AI coding agents working on the SonicWave codebase.

---

## 1. Fundamental Rules

1. **Read Before Writing**: Read `AGENTS.md` and `memory.md` before starting substantial development work.
2. **Inspect Existing Code**: Inspect the relevant source code before making changes. Never assume an implementation matches filename alone.
3. **Follow Local Instructions**: Follow any existing directory-specific agent instructions or design specifications (`DESIGN.md`, `DESIGN-cursor.md`).
4. **Preserve Functionality**: Preserve functioning features and the established dual-mode architecture (web application + packaged desktop bundle).
5. **Avoid Unnecessary Scope**: Avoid unrelated refactoring, speculative features, and unnecessary rewrites. Keep changes minimal and purposeful.
6. **Reuse Existing Utilities**: Reuse existing dependencies, components, and utilities (e.g. `server/binManager.js`, `server/converter.js`, UI components in `client/src/components/`).
7. **No Arbitrary Dependencies**: Do not add dependencies without a clear reason and authorization. Prefer built-in Node and React capabilities.
8. **Protect User Work**: Never overwrite user changes or discard uncommitted work without explicit authorization.
9. **Never Expose Secrets**: Never expose secrets or commit real credentials. Keep `cookies.txt`, token values, and `.env` credentials strictly sanitized.
10. **Respect Coding Conventions**:
    - Backend: CommonJS (`require` / `module.exports`) in `server/`.
    - Frontend: ESM React 19 (`import` / `export`) in `client/`.
    - CSS: Spotify design tokens (`--spotify-green`, `--bg-base`, etc.) in `client/src/index.css`.
11. **Run Validation Checks**: Run relevant tests (`node --test tests/*.test.js`) and build validation (`npm.cmd --prefix client run build`) when practical.
12. **Report Honestly**: Report actual execution results honestly. Never claim that an unrun test passed or that a build succeeded without verification.
13. **Maintain Memory**: Update `memory.md` when significant architectural decisions, feature statuses, constraints, or known issues change.
14. **Keep Docs Synchronized**: Keep documentation in `docs/` and `memory.md` consistent with the real implementation.
15. **Confirm Major Changes**: Ask before performing destructive operations, resetting git state, or making major architectural changes.

---

## 2. Project-Specific Operational Guidelines

### 2.1 Workspace Structure
- The repository uses npm workspaces (`client` and `server`).
- Root commands orchestrate subpackages via npm workspace flags (e.g., `npm --prefix client run build`).

### 2.2 Windows & PowerShell Execution
- In PowerShell on Windows, running `npm` directly may encounter a `PSSecurityException`.
- Always prefer `npm.cmd` when executing npm scripts via automated runners on Windows:
  ```powershell
  npm.cmd run dev
  npm.cmd --prefix client run build
  ```

### 2.3 Testing Protocol
- Tests live in `tests/` and execute via Node.js's built-in test runner:
  ```powershell
  node --test tests/*.test.js
  ```
- Do not introduce external test runners (Jest, Mocha, Vitest) unless explicitly instructed.
- When writing tests for `server/converter.js`, be aware that `cleanOldDownloads` runs on an interval; ensure test processes exit cleanly using `test.after(...)` or unref handlers.

### 2.4 Desktop Packaging Pipeline
- `scripts/package-desktop.mjs` temporarily swaps `client/src/App.jsx` with `client/src/AppDesktop.jsx` to exclude `LandingPage.jsx`.
- When modifying frontend root behavior or navigation, update both `App.jsx` and `AppDesktop.jsx` to keep the desktop client synchronized.

### 2.5 Media Engine & Binaries
- Do not check in newly compiled binaries or modify binary paths in `server/binManager.js` without cross-platform compatibility checks (`process.platform === 'win32'`).
- Always invoke `yt-dlp` via argument arrays (`execFile` / `spawn`), never via unescaped shell strings.

