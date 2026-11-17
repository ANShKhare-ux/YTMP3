const fs = require('fs');
const path = require('path');
const os = require('os');
const { execFileSync, execFile } = require('child_process');

function getDefaultInstallPath() {
  const localAppData = process.env.LOCALAPPDATA || path.join(os.homedir(), 'AppData', 'Local');
  return path.join(localAppData, 'SonicWave');
}

/**
 * Creates a Windows .lnk shortcut using PowerShell & WScript.Shell
 */
function createShortcut({ targetPath, shortcutPath, iconPath, description }) {
  const psScript = `
$ws = New-Object -ComObject WScript.Shell
$s = $ws.CreateShortcut('${shortcutPath.replace(/'/g, "''")}')
$s.TargetPath = '${targetPath.replace(/'/g, "''")}'
$s.WorkingDirectory = '${path.dirname(targetPath).replace(/'/g, "''")}'
$s.IconLocation = '${(iconPath || targetPath).replace(/'/g, "''")},0'
$s.Description = '${(description || 'SonicWave').replace(/'/g, "''")}'
$s.Save()
`;
  execFileSync('powershell.exe', ['-NoProfile', '-NonInteractive', '-Command', psScript], {
    stdio: 'ignore',
    windowsHide: true
  });
}

/**
 * Registers an official uninstaller entry in Windows Add/Remove Programs (HKCU)
 */
function registerWindowsUninstaller({ installDir, exePath, iconPath }) {
  const uninstallBatPath = path.join(installDir, 'uninstall.bat');
  const desktopShortcut = path.join(os.homedir(), 'Desktop', 'SonicWave.lnk');
  const startMenuShortcut = path.join(
    process.env.APPDATA || path.join(os.homedir(), 'AppData', 'Roaming'),
    'Microsoft', 'Windows', 'Start Menu', 'Programs', 'SonicWave.lnk'
  );

  const uninstallScript = `@echo off
title SonicWave Uninstaller
echo Uninstalling SonicWave...
timeout /t 1 /nobreak >nul
del /q "${desktopShortcut}" 2>nul
del /q "${startMenuShortcut}" 2>nul
reg delete "HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Uninstall\\SonicWave" /f >nul 2>nul
cd /d "%TEMP%"
rd /s /q "${installDir}" 2>nul
echo SonicWave has been uninstalled.
exit /b 0
`;
  fs.writeFileSync(uninstallBatPath, uninstallScript, 'utf8');

  const regScript = `
$key = 'HKCU:\\Software\\Microsoft\\Windows\\CurrentVersion\\Uninstall\\SonicWave'
if (-not (Test-Path $key)) { New-Item -Path $key -Force | Out-Null }
Set-ItemProperty -Path $key -Name 'DisplayName' -Value 'SonicWave - Media Converter & Studio'
Set-ItemProperty -Path $key -Name 'DisplayVersion' -Value '1.0.0'
Set-ItemProperty -Path $key -Name 'Publisher' -Value 'SonicWave Team'
Set-ItemProperty -Path $key -Name 'InstallLocation' -Value '${installDir.replace(/'/g, "''")}'
Set-ItemProperty -Path $key -Name 'DisplayIcon' -Value '${iconPath.replace(/'/g, "''")}'
Set-ItemProperty -Path $key -Name 'UninstallString' -Value 'cmd.exe /c "${uninstallBatPath.replace(/'/g, "''")}"'
Set-ItemProperty -Path $key -Name 'NoModify' -Value 1 -Type DWord
Set-ItemProperty -Path $key -Name 'NoRepair' -Value 1 -Type DWord
`;
  execFileSync('powershell.exe', ['-NoProfile', '-NonInteractive', '-Command', regScript], {
    stdio: 'ignore',
    windowsHide: true
  });
}

module.exports = {
  getDefaultInstallPath,
  createShortcut,
  registerWindowsUninstaller
};
