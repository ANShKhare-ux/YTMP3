import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

export function buildDesktopClient() {
  console.log('==================================================');
  console.log('[BUILD] Compiling desktop Converter Studio (AppDesktop.jsx)...');
  console.log('==================================================');
  const clientSrc = path.join(rootDir, 'client', 'src');
  const appMainPath = path.join(clientSrc, 'App.jsx');
  const appBackupPath = path.join(clientSrc, 'App.web.backup.jsx');
  const appDesktopPath = path.join(clientSrc, 'AppDesktop.jsx');

  if (fs.existsSync(appBackupPath)) {
    console.log('[BUILD] Found existing App.web.backup.jsx. Restoring before build...');
    fs.copyFileSync(appBackupPath, appMainPath);
    fs.unlinkSync(appBackupPath);
  }

  try {
    fs.copyFileSync(appMainPath, appBackupPath);
    fs.copyFileSync(appDesktopPath, appMainPath);

    const npmCmd = process.platform === 'win32' ? 'npm.cmd' : 'npm';
    execSync(`${npmCmd} --prefix client run build`, {
      cwd: rootDir,
      stdio: 'inherit'
    });
    console.log('[BUILD] Desktop frontend build succeeded.');
  } finally {
    if (fs.existsSync(appBackupPath)) {
      fs.copyFileSync(appBackupPath, appMainPath);
      fs.unlinkSync(appBackupPath);
      console.log('[BUILD] Restored web App.jsx.');
    }
  }
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  buildDesktopClient();
}
