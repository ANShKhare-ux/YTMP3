const fs = require('fs');
const path = require('path');

const logFile = path.join(process.env.TEMP || 'C:\\Windows\\Temp', 'sonicwave_installer_debug.log');
function debugLog(...args) {
  const msg = `[${new Date().toISOString()}] ${args.join(' ')}\n`;
  try { fs.appendFileSync(logFile, msg); } catch {}
  console.log(...args);
}

debugLog('=== Installer Process Started ===');
debugLog('PID:', process.pid);
debugLog('ExecPath:', process.execPath);
debugLog('CWD:', process.cwd());

process.on('uncaughtException', (err) => {
  debugLog('CRITICAL Uncaught Exception:', err.stack);
});

const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const os = require('os');
const { spawn } = require('child_process');
const { getDefaultInstallPath, createShortcut, registerWindowsUninstaller } = require('./engine');

let mainWindow = null;
let installedExePath = null;

function createWindow() {
  debugLog('createWindow() called');
  try {
    mainWindow = new BrowserWindow({
      width: 740,
      height: 500,
      resizable: false,
      frame: false,
      backgroundColor: '#121212',
      show: true,
      webPreferences: {
        nodeIntegration: true,
        contextIsolation: false,
        sandbox: false
      }
    });

    const htmlPath = path.join(__dirname, 'ui', 'index.html');
    debugLog('Loading HTML from:', htmlPath, 'Exists:', fs.existsSync(htmlPath));
    mainWindow.loadFile(htmlPath);

    mainWindow.on('closed', () => {
      debugLog('mainWindow closed event');
      mainWindow = null;
    });

    mainWindow.webContents.on('did-fail-load', (e, code, desc) => {
      debugLog('did-fail-load:', code, desc);
    });

    debugLog('createWindow() completed successfully');
  } catch (err) {
    debugLog('Error in createWindow():', err.stack);
  }
}

app.whenReady().then(() => {
  debugLog('app.whenReady resolved');
  createWindow();
});

app.on('window-all-closed', () => {
  debugLog('app window-all-closed event');
  app.quit();
});

// IPC Handlers
ipcMain.on('window-minimize', () => {
  if (mainWindow) mainWindow.minimize();
});

ipcMain.on('window-close', () => {
  debugLog('window-close IPC received');
  app.quit();
});

ipcMain.handle('get-default-path', () => {
  return getDefaultInstallPath();
});

ipcMain.handle('browse-folder', async (event, currentPath) => {
  const result = await dialog.showOpenDialog(mainWindow, {
    defaultPath: currentPath || getDefaultInstallPath(),
    properties: ['openDirectory', 'createDirectory']
  });

  if (!result.canceled && result.filePaths && result.filePaths.length > 0) {
    return path.join(result.filePaths[0], 'SonicWave');
  }
  return null;
});

// Installation Worker
ipcMain.on('start-install', async (event, { targetDir, createDesktop, createStartMenu, autoLaunch }) => {
  debugLog('start-install received. Target:', targetDir);
  const sendProgress = (percent, message) => {
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send('install-progress', { percent, message });
    }
  };

  try {
    sendProgress(10, 'Initializing destination folder...');

    if (!fs.existsSync(targetDir)) {
      fs.mkdirSync(targetDir, { recursive: true });
    }

    // Locate application files to copy
    const candidatePayloads = [
      path.join(process.resourcesPath, 'payload'),
      path.join(__dirname, '..', '..', 'payload'),
      path.join(__dirname, '..', 'dist-electron', 'win-unpacked'),
      path.join(__dirname, 'payload')
    ];

    debugLog('Searching candidate payloads:', JSON.stringify(candidatePayloads));
    const sourceDir = candidatePayloads.find(p => fs.existsSync(p));
    if (!sourceDir) {
      throw new Error(`Application package files were not found. Checked:\n${candidatePayloads.join('\n')}`);
    }
    debugLog('Using payload source:', sourceDir);

    sendProgress(25, 'Copying SonicWave media engine and binaries...');
    fs.cpSync(sourceDir, targetDir, { recursive: true, force: true });

    sendProgress(70, 'Configuring Windows desktop integration...');
    const exePath = path.join(targetDir, 'SonicWave.exe');
    const iconPath = path.join(targetDir, 'resources', 'app', 'electron', 'icon.ico');
    const resolvedIcon = fs.existsSync(iconPath) ? iconPath : exePath;
    installedExePath = exePath;

    // Desktop Shortcut
    if (createDesktop) {
      sendProgress(80, 'Creating Desktop shortcut...');
      const desktopShortcut = path.join(os.homedir(), 'Desktop', 'SonicWave.lnk');
      createShortcut({
        targetPath: exePath,
        shortcutPath: desktopShortcut,
        iconPath: resolvedIcon,
        description: 'SonicWave - High-Fidelity Media Converter & Studio'
      });
    }

    // Start Menu Shortcut
    if (createStartMenu) {
      sendProgress(88, 'Registering Start Menu shortcut...');
      const startMenuDir = path.join(
        process.env.APPDATA || path.join(os.homedir(), 'AppData', 'Roaming'),
        'Microsoft', 'Windows', 'Start Menu', 'Programs'
      );
      if (!fs.existsSync(startMenuDir)) fs.mkdirSync(startMenuDir, { recursive: true });
      const startMenuShortcut = path.join(startMenuDir, 'SonicWave.lnk');
      createShortcut({
        targetPath: exePath,
        shortcutPath: startMenuShortcut,
        iconPath: resolvedIcon,
        description: 'SonicWave - High-Fidelity Media Converter & Studio'
      });
    }

    // Windows Registry Uninstaller Entry
    sendProgress(95, 'Registering Windows uninstaller...');
    registerWindowsUninstaller({
      installDir: targetDir,
      exePath,
      iconPath: resolvedIcon
    });

    sendProgress(100, 'Installation finished!');
    mainWindow.webContents.send('install-complete', { autoLaunch });
  } catch (err) {
    debugLog('Installation error:', err.stack);
    dialog.showErrorBox('Installation Failed', err.message);
    app.quit();
  }
});

ipcMain.on('launch-installed-app', () => {
  debugLog('launch-installed-app. Path:', installedExePath);
  if (installedExePath && fs.existsSync(installedExePath)) {
    const child = spawn(installedExePath, [], {
      detached: true,
      stdio: 'ignore'
    });
    child.unref();
  }
  app.quit();
});
