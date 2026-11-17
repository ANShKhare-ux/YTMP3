import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');
const npmCmd = process.platform === 'win32' ? 'npm.cmd' : 'npm';

console.log('==================================================');
console.log('[INSTALLER] Building Custom Frameless GUI Installer...');
console.log('==================================================');

// 1. Ensure the desktop payload (win-unpacked) is built
const winUnpackedDir = path.join(rootDir, 'dist-electron', 'win-unpacked');
if (!fs.existsSync(path.join(winUnpackedDir, 'SonicWave.exe'))) {
  console.log('[INSTALLER] win-unpacked payload missing. Generating via electron-builder...');
  execSync(`${npmCmd} run package:exe`, { cwd: rootDir, stdio: 'inherit' });
}

// 2. Build the portable installer executable using electron-builder into dist-installer
const installerConfigPath = path.join(rootDir, 'installer', 'electron-builder.json');
const installerConfig = {
  appId: 'com.sonicwave.installer',
  productName: 'SonicWave-Installer',
  artifactName: 'SonicWave-Custom-Installer.${ext}',
  directories: {
    output: 'dist-installer'
  },
  extraMetadata: {
    main: 'installer/main.js'
  },
  asar: false,
  files: [
    'installer/main.js',
    'installer/engine.js',
    'installer/ui/**/*'
  ],
  extraResources: [
    {
      from: 'dist-electron/win-unpacked',
      to: 'payload',
      filter: ['**/*']
    }
  ],
  win: {
    target: 'portable',
    icon: 'electron/icon.ico'
  }
};

fs.writeFileSync(installerConfigPath, JSON.stringify(installerConfig, null, 2), 'utf8');

console.log('[INSTALLER] Compiling standalone SonicWave-Custom-Installer.exe into dist-installer...');
execSync(`npx electron-builder --config installer/electron-builder.json`, {
  cwd: rootDir,
  stdio: 'inherit'
});

console.log('==================================================');
console.log('[SUCCESS] Custom Frameless Installer Built:');
console.log('dist-installer/SonicWave-Custom-Installer.exe');
console.log('==================================================');
