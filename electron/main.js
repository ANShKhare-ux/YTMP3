const { app, BrowserWindow, shell, Menu, dialog, globalShortcut, ipcMain, Tray } = require('electron');
const path = require('path');
const http = require('http');
const net = require('net');
const fs = require('fs');

function getGpuFallbackFlagPath() {
  return path.join(app.getPath('userData'), 'gpu-fallback.flag');
}

// Enable hardware acceleration by default; disable only after a verified GPU crash fallback flag or --disable-gpu
try {
  const gpuFallbackFlag = getGpuFallbackFlagPath();
  if (
    process.platform === 'win32' &&
    (process.argv.includes('--disable-gpu') || fs.existsSync(gpuFallbackFlag))
  ) {
    app.disableHardwareAcceleration();
  }
} catch {}

let mainWindow = null;
let tray = null;
let serverInstance = null;
let activePort = Number(process.env.PORT) || 3001;
let isQuitting = false;
let minimizeToTrayOnClose = false;

function getTrayPrefsPath() {
  return path.join(app.getPath('userData'), 'tray-prefs.json');
}

function loadTrayPrefs() {
  try {
    const p = getTrayPrefsPath();
    if (fs.existsSync(p)) {
      const parsed = JSON.parse(fs.readFileSync(p, 'utf8'));
      minimizeToTrayOnClose = Boolean(parsed.minimizeToTray);
    }
  } catch {}
}

function saveTrayPrefs(enabled) {
  minimizeToTrayOnClose = Boolean(enabled);
  try {
    const p = getTrayPrefsPath();
    fs.mkdirSync(path.dirname(p), { recursive: true });
    fs.writeFileSync(p, JSON.stringify({ minimizeToTray: minimizeToTrayOnClose }, null, 2), 'utf8');
  } catch {}
}

function findAvailablePort(startPort = 3001, maxAttempts = 25) {
  return new Promise((resolve) => {
    let attempt = 0;

    const probe = (port) => {
      const tester = net.createServer();
      tester.unref();
      tester.once('error', () => {
        attempt += 1;
        if (attempt < maxAttempts) {
          probe(startPort + attempt);
        } else {
          // Ephemeral port fallback
          const eph = net.createServer();
          eph.unref();
          eph.listen(0, '127.0.0.1', () => {
            const picked = eph.address()?.port || startPort;
            eph.close(() => resolve(picked));
          });
          eph.once('error', () => resolve(startPort));
        }
      });
      tester.once('listening', () => {
        const picked = tester.address()?.port || port;
        tester.close(() => resolve(picked));
      });
      tester.listen(port, '127.0.0.1');
    };

    probe(startPort);
  });
}

// Log helper: writes to file in userData and console
function log(...args) {
  const line = `[${new Date().toISOString()}] ${args.join(' ')}\n`;
  console.log(...args);
  try {
    const userDir = app.getPath('userData');
    if (!fs.existsSync(userDir)) {
      fs.mkdirSync(userDir, { recursive: true });
    }
    const logPath = path.join(userDir, 'sonicwave.log');
    fs.appendFileSync(logPath, line);
  } catch {}
}

// Function to wait for backend server readiness
function waitForServer(url, timeoutMs = 25000) {
  const startTime = Date.now();
  return new Promise((resolve, reject) => {
    const check = () => {
      http.get(`${url}/api/status`, (res) => {
        if (res.statusCode === 200) {
          resolve();
        } else {
          retry();
        }
      }).on('error', () => {
        retry();
      });
    };

    const retry = () => {
      if (Date.now() - startTime > timeoutMs) {
        reject(new Error(`Timeout waiting for backend at ${url}`));
      } else {
        setTimeout(check, 350);
      }
    };

    check();
  });
}

// Resolve server/index.js across development, unpacked, and packaged modes
function resolveServerPath() {
  const appPath = app.getAppPath();
  const candidates = [
    path.join(appPath, 'server', 'index.js'),
    path.join(__dirname, '..', 'server', 'index.js'),
    path.join(process.resourcesPath, 'app', 'server', 'index.js'),
    path.join(process.resourcesPath, 'app.asar.unpacked', 'server', 'index.js')
  ];

  for (const candidate of candidates) {
    if (fs.existsSync(candidate)) {
      log('[Electron] Found server/index.js at:', candidate);
      return candidate;
    }
  }

  throw new Error(`Unable to find server/index.js in any known location: \n${candidates.join('\n')}`);
}

async function startBackend() {
  try {
    const targetPath = resolveServerPath();
    const preferred = Number(process.env.PORT) || 3001;
    activePort = await findAvailablePort(preferred);
    process.env.PORT = String(activePort);
    log('[Electron] Starting backend server from:', targetPath, 'on port', activePort);
    const { startServer } = require(targetPath);
    serverInstance = await startServer(activePort);
    if (serverInstance && typeof serverInstance.address === 'function') {
      const addr = serverInstance.address();
      if (addr && typeof addr === 'object' && addr.port) {
        activePort = addr.port;
        process.env.PORT = String(activePort);
      }
    }
    log('[Electron] Backend server started successfully on port', activePort);
  } catch (err) {
    log('[Electron] CRITICAL: Failed to start backend server:', err.stack);
    dialog.showErrorBox(
      'SonicWave Media Engine Error',
      `SonicWave was unable to start the background conversion server.\n\nError: ${err.message}\n\nPlease check ${path.join(app.getPath('userData'), 'sonicwave.log')}`
    );
  }
}

// Inline HTML for splash/loading screen
const splashHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      background: #121212;
      color: #f8fafc;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      height: 100vh;
      user-select: none;
      -webkit-app-region: drag;
    }
    .container {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 20px;
    }
    .logo-wave {
      display: flex;
      align-items: center;
      gap: 6px;
      height: 48px;
    }
    .bar {
      width: 6px;
      border-radius: 4px;
      background: linear-gradient(180deg, #1ed760 0%, #00b0ff 100%);
      animation: pulse 1.2s ease-in-out infinite;
    }
    .bar:nth-child(1) { height: 24px; animation-delay: 0.0s; }
    .bar:nth-child(2) { height: 38px; animation-delay: 0.15s; }
    .bar:nth-child(3) { height: 48px; animation-delay: 0.3s; }
    .bar:nth-child(4) { height: 32px; animation-delay: 0.45s; }
    .bar:nth-child(5) { height: 18px; animation-delay: 0.6s; }
    @keyframes pulse {
      0%, 100% { transform: scaleY(0.5); opacity: 0.4; }
      50% { transform: scaleY(1); opacity: 1; }
    }
    .title {
      font-size: 20px;
      font-weight: 700;
      letter-spacing: -0.5px;
      color: #ffffff;
    }
    .subtitle {
      font-size: 13px;
      color: #94a3b8;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="logo-wave">
      <div class="bar"></div>
      <div class="bar"></div>
      <div class="bar"></div>
      <div class="bar"></div>
      <div class="bar"></div>
    </div>
    <div class="title">SonicWave</div>
    <div class="subtitle" id="status-text">Bootstrapping media engine...</div>
  </div>
</body>
</html>
`;

async function createWindow() {
  const isMac = process.platform === 'darwin';

  const windowOptions = {
    width: 1280,
    height: 840,
    minWidth: 960,
    minHeight: 640,
    title: 'SonicWave - High-Fidelity Media Converter & Studio',
    backgroundColor: '#121212',
    icon: path.join(__dirname, 'icon.ico'),
    autoHideMenuBar: true,
    show: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: true
    }
  };

  if (isMac) {
    windowOptions.titleBarStyle = 'hiddenInset';
    windowOptions.trafficLightPosition = { x: 16, y: 16 };
  }

  mainWindow = new BrowserWindow(windowOptions);

  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });

  if (isMac) {
    const template = [
      {
        label: app.name,
        submenu: [
          { role: 'about' },
          { type: 'separator' },
          { role: 'services' },
          { type: 'separator' },
          { role: 'hide' },
          { role: 'hideOthers' },
          { role: 'unhide' },
          { type: 'separator' },
          { role: 'quit' }
        ]
      },
      {
        label: 'Edit',
        submenu: [
          { role: 'undo' },
          { role: 'redo' },
          { type: 'separator' },
          { role: 'cut' },
          { role: 'copy' },
          { role: 'paste' },
          { role: 'selectAll' }
        ]
      },
      {
        label: 'View',
        submenu: [
          { role: 'reload' },
          { role: 'forceReload' },
          { role: 'toggleDevTools' },
          { type: 'separator' },
          { role: 'resetZoom' },
          { role: 'zoomIn' },
          { role: 'zoomOut' },
          { type: 'separator' },
          { role: 'togglefullscreen' }
        ]
      },
      {
        label: 'Window',
        submenu: [
          { role: 'minimize' },
          { role: 'zoom' },
          { type: 'separator' },
          { role: 'front' }
        ]
      }
    ];
    Menu.setApplicationMenu(Menu.buildFromTemplate(template));
  } else {
    Menu.setApplicationMenu(null);
  }

  // Handle external links safely in default web browser
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith('http://') || url.startsWith('https://')) {
      shell.openExternal(url);
    }
    return { action: 'deny' };
  });

  // Enable F12 and Ctrl+Shift+I for developer tools
  mainWindow.webContents.on('before-input-event', (event, input) => {
    if (input.key === 'F12' || (input.control && input.shift && input.key.toLowerCase() === 'i')) {
      mainWindow.webContents.toggleDevTools();
      event.preventDefault();
    }
  });

  mainWindow.webContents.on('console-message', (event, level, message, line, sourceId) => {
    log(`[Renderer Console] [Level ${level}] ${message} (at ${sourceId}:${line})`);
  });

  mainWindow.webContents.on('did-fail-load', (event, errorCode, errorDescription, validatedURL) => {
    log(`[Renderer Error] Failed to load ${validatedURL}: ${errorDescription} (${errorCode})`);
  });

  mainWindow.webContents.on('render-process-gone', (event, details) => {
    log(`[Renderer Crash] Render process gone: ${JSON.stringify(details)}`);
  });

  // Load splash screen first so user never sees a blank black screen
  mainWindow.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(splashHtml)}`);

  const serverUrl = `http://localhost:${activePort}`;

  try {
    log('[Electron] Waiting for server at', serverUrl);
    await waitForServer(serverUrl, 25000);
    log('[Electron] Server ready, loading Converter Studio...');
    mainWindow.loadURL(serverUrl);
  } catch (err) {
    log('[Electron] Server wait failed:', err.message);
    const errorHtml = `
      <!DOCTYPE html>
      <html>
      <body style="background:#121212;color:#ef4444;font-family:sans-serif;padding:40px;display:flex;flex-direction:column;align-items:center;justify-content:center;height:100vh;">
        <h2>Media Server Connection Timeout</h2>
        <p style="color:#94a3b8;margin:12px 0 24px;">The local media backend did not respond in time on port ${activePort}.</p>
        <button onclick="window.location.reload()" style="background:#1ed760;color:#000;border:none;padding:12px 24px;border-radius:20px;font-weight:700;cursor:pointer;">Retry Connection</button>
      </body>
      </html>
    `;
    mainWindow.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(errorHtml)}`);
  }

  mainWindow.on('close', (event) => {
    if (!isQuitting && minimizeToTrayOnClose && tray) {
      event.preventDefault();
      mainWindow.hide();
    }
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

function createTray() {
  if (tray) return tray;
  try {
    const iconPath = path.join(__dirname, 'icon.ico');
    if (!fs.existsSync(iconPath)) return null;
    tray = new Tray(iconPath);
    tray.setToolTip(`SonicWave Studio (Port ${activePort})`);
    const contextMenu = Menu.buildFromTemplate([
      {
        label: 'Open SonicWave Studio',
        click: () => {
          if (mainWindow) {
            if (mainWindow.isMinimized()) mainWindow.restore();
            mainWindow.show();
            mainWindow.focus();
          } else {
            createWindow();
          }
        }
      },
      {
        label: 'Hide to System Tray',
        click: () => {
          if (mainWindow) mainWindow.hide();
        }
      },
      { type: 'separator' },
      {
        label: 'Quit SonicWave',
        click: () => {
          isQuitting = true;
          app.quit();
        }
      }
    ]);
    tray.setContextMenu(contextMenu);
    tray.on('click', () => {
      if (mainWindow) {
        if (mainWindow.isVisible()) {
          mainWindow.focus();
        } else {
          mainWindow.show();
          mainWindow.focus();
        }
      }
    });
    return tray;
  } catch (err) {
    log('[Electron] Tray initialization skipped:', err.message);
    return null;
  }
}

function allocateUniqueFilePath(targetDir, desiredName) {
  const safeBase = path
    .basename(desiredName || 'SonicWave-media')
    .replace(/[/\\?%*:|"<>\0\r\n]/g, '_')
    .trim() || 'SonicWave-media';
  const parsed = path.parse(safeBase);
  let candidate = path.join(targetDir, safeBase);
  let counter = 1;
  while (fs.existsSync(candidate)) {
    candidate = path.join(targetDir, `${parsed.name} (${counter})${parsed.ext}`);
    counter += 1;
  }
  return candidate;
}

function downloadLocalJobToFile(downloadUrl, destPath) {
  return new Promise((resolve, reject) => {
    const fileStream = fs.createWriteStream(destPath);
    const req = http.get(downloadUrl, (res) => {
      if (res.statusCode !== 200) {
        fileStream.close();
        try {
          if (fs.existsSync(destPath)) fs.unlinkSync(destPath);
        } catch {}
        return reject(new Error(`Local download endpoint returned HTTP ${res.statusCode}`));
      }
      res.pipe(fileStream);
      fileStream.on('finish', () => {
        fileStream.close(() => resolve(destPath));
      });
    });

    req.on('error', (err) => {
      fileStream.close();
      try {
        if (fs.existsSync(destPath)) fs.unlinkSync(destPath);
      } catch {}
      reject(err);
    });

    fileStream.on('error', (err) => {
      try {
        if (fs.existsSync(destPath)) fs.unlinkSync(destPath);
      } catch {}
      reject(err);
    });
  });
}

function setupDesktopIpc() {
  ipcMain.handle('desktop:get-default-downloads', () => {
    return app.getPath('downloads');
  });

  ipcMain.handle('desktop:choose-download-folder', async () => {
    const result = await dialog.showOpenDialog(mainWindow || undefined, {
      title: 'Select SonicWave Save Folder',
      defaultPath: app.getPath('downloads'),
      properties: ['openDirectory', 'createDirectory']
    });
    if (result.canceled || !Array.isArray(result.filePaths) || result.filePaths.length === 0) {
      return null;
    }
    return result.filePaths[0];
  });

  ipcMain.handle('desktop:save-job-file', async (_event, payload = {}) => {
    const { jobId, filename, targetDir } = payload;
    if (typeof jobId !== 'string' || !/^[a-zA-Z0-9_-]{4,100}$/.test(jobId)) {
      return { success: false, error: 'Invalid job identifier.' };
    }

    let destDir = app.getPath('downloads');
    if (typeof targetDir === 'string' && targetDir.trim()) {
      const resolvedCandidate = path.resolve(targetDir.trim());
      if (fs.existsSync(resolvedCandidate) && fs.statSync(resolvedCandidate).isDirectory()) {
        destDir = resolvedCandidate;
      }
    }

    const destPath = allocateUniqueFilePath(destDir, filename || `${jobId}.mp3`);
    const localUrl = `http://127.0.0.1:${activePort}/api/download/${encodeURIComponent(jobId)}`;

    try {
      await downloadLocalJobToFile(localUrl, destPath);
      log('[Electron] Saved converted file to desktop folder:', destPath);
      return {
        success: true,
        savedPath: destPath,
        folder: destDir,
        fileName: path.basename(destPath)
      };
    } catch (err) {
      log('[Electron] Failed to auto-save file:', err.message);
      return { success: false, error: err.message };
    }
  });

  ipcMain.handle('desktop:show-item-in-folder', async (_event, payload = {}) => {
    const { filePath, folderPath } = payload;
    try {
      if (typeof filePath === 'string' && filePath.trim()) {
        const resolvedFile = path.resolve(filePath.trim());
        if (fs.existsSync(resolvedFile)) {
          shell.showItemInFolder(resolvedFile);
          return { success: true };
        }
      }
      if (typeof folderPath === 'string' && folderPath.trim()) {
        const resolvedFolder = path.resolve(folderPath.trim());
        if (fs.existsSync(resolvedFolder)) {
          await shell.openPath(resolvedFolder);
          return { success: true };
        }
      }
      await shell.openPath(app.getPath('downloads'));
      return { success: true };
    } catch (err) {
      return { success: false, error: err.message };
    }
  });

  ipcMain.handle('desktop:get-server-port', () => activePort);

  ipcMain.handle('desktop:minimize-to-tray', () => {
    createTray();
    if (mainWindow && tray) {
      mainWindow.hide();
      return { success: true };
    }
    if (mainWindow) {
      mainWindow.minimize();
      return { success: true, fallbackMinimize: true };
    }
    return { success: false };
  });

  ipcMain.handle('desktop:get-minimize-to-tray', () => ({ enabled: minimizeToTrayOnClose }));

  ipcMain.handle('desktop:set-minimize-to-tray', (_event, enabled) => {
    saveTrayPrefs(enabled);
    if (enabled) createTray();
    return { enabled: minimizeToTrayOnClose };
  });

  ipcMain.handle('desktop:get-gpu-mode', () => {
    let softwareFallback = false;
    try {
      softwareFallback = fs.existsSync(getGpuFallbackFlagPath()) || process.argv.includes('--disable-gpu');
    } catch {}
    return { softwareFallback };
  });
}

app.on('child-process-gone', (_event, details) => {
  if (details && details.type === 'GPU') {
    log(`[Electron] GPU process terminated (${details.reason}); enabling software fallback for next launch.`);
    try {
      const flagPath = getGpuFallbackFlagPath();
      fs.mkdirSync(path.dirname(flagPath), { recursive: true });
      fs.writeFileSync(flagPath, new Date().toISOString(), 'utf8');
    } catch {}
  }
});

app.on('before-quit', () => {
  isQuitting = true;
});

const gotTheLock = app.requestSingleInstanceLock();
if (!gotTheLock) {
  app.quit();
} else {
  app.on('second-instance', () => {
    if (mainWindow) {
      if (!mainWindow.isVisible()) mainWindow.show();
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.focus();
    }
  });

  app.whenReady().then(async () => {
    log('==================================================');
    log('SonicWave Desktop Application Launched');
    log('App Path:', app.getAppPath());
    log('Is Packaged:', app.isPackaged);
    log('==================================================');

    loadTrayPrefs();
    setupDesktopIpc();
    await startBackend();
    createTray();
    await createWindow();

    app.on('activate', () => {
      if (BrowserWindow.getAllWindows().length === 0) {
        createWindow();
      } else if (mainWindow) {
        mainWindow.show();
      }
    });
  });

  app.on('window-all-closed', () => {
    if (minimizeToTrayOnClose && tray && !isQuitting) {
      return;
    }
    if (process.platform !== 'darwin') {
      if (serverInstance && serverInstance.close) {
        try {
          serverInstance.close();
        } catch {}
      }
      app.quit();
    }
  });
}
