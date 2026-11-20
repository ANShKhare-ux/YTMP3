import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

const stagingDir = path.join(
  process.env.TEMP || 'C:\\Windows\\Temp',
  'SonicWave-Desktop-Staging'
);

const zipOutputFilePublic = path.join(rootDir, 'client', 'public', 'SonicWave-v1.0.0-Windows.zip');
const zipOutputFileDist = path.join(rootDir, 'client', 'dist', 'SonicWave-v1.0.0-Windows.zip');
const macZipOutputFilePublic = path.join(rootDir, 'client', 'public', 'SonicWave-v1.0.0-macOS.zip');
const macZipOutputFileDist = path.join(rootDir, 'client', 'dist', 'SonicWave-v1.0.0-macOS.zip');

console.log('==================================================');
console.log('   SonicWave Desktop Package Generator');
console.log('==================================================');

// 1. Build clean desktop frontend in client directory
console.log('[BUILD] Building clean desktop production bundle...');
const clientSrc = path.join(rootDir, 'client', 'src');
const appMainPath = path.join(clientSrc, 'App.jsx');
const appBackupPath = path.join(clientSrc, 'App.web.backup.jsx');
const appDesktopPath = path.join(clientSrc, 'AppDesktop.jsx');

// Recover if an earlier run was aborted
if (fs.existsSync(appBackupPath)) {
  console.log('[BUILD] Found existing App.web.backup.jsx from previous aborted run. Restoring...');
  fs.copyFileSync(appBackupPath, appMainPath);
  fs.unlinkSync(appBackupPath);
}

try {
  // Backup web App.jsx and swap with AppDesktop.jsx
  fs.copyFileSync(appMainPath, appBackupPath);
  fs.copyFileSync(appDesktopPath, appMainPath);

  // Run client build
  const npmCmd = process.platform === 'win32' ? 'npm.cmd' : 'npm';
  execSync(`${npmCmd} --prefix client run build`, {
    cwd: rootDir,
    stdio: 'inherit'
  });
  console.log('[BUILD] Desktop frontend build succeeded.');
} finally {
  // Always restore original App.jsx
  if (fs.existsSync(appBackupPath)) {
    fs.copyFileSync(appBackupPath, appMainPath);
    fs.unlinkSync(appBackupPath);
    console.log('[BUILD] Restored web App.jsx with LandingPage for marketing.');
  }
}

// 2. Clean & prepare staging directory
console.log('[STAGING] Assembling desktop package...');
if (fs.existsSync(stagingDir)) {
  fs.rmSync(stagingDir, { recursive: true, force: true });
}
fs.mkdirSync(stagingDir, { recursive: true });
fs.mkdirSync(path.join(stagingDir, 'server'), { recursive: true });
fs.mkdirSync(path.join(stagingDir, 'server', 'data'), { recursive: true });
fs.mkdirSync(path.join(stagingDir, 'server', 'downloads'), { recursive: true });
fs.mkdirSync(path.join(stagingDir, 'client'), { recursive: true });
fs.mkdirSync(path.join(stagingDir, 'client', 'public'), { recursive: true });
fs.mkdirSync(path.join(stagingDir, 'client', 'src'), { recursive: true });
fs.mkdirSync(path.join(stagingDir, 'client', 'src', 'components'), { recursive: true });
fs.mkdirSync(path.join(stagingDir, 'client', 'dist'), { recursive: true });

// 3. Compile native SonicWave.exe launcher & copy root files
const cscPath = 'C:\\Windows\\Microsoft.NET\\Framework64\\v4.0.30319\\csc.exe';
const launcherSrc = path.join(rootDir, 'launcher', 'SonicWaveApp.cs');
const launcherExe = path.join(rootDir, 'launcher', 'SonicWave.exe');
const iconPath = path.join(rootDir, 'electron', 'icon.ico');

if (process.platform === 'win32' && fs.existsSync(cscPath) && fs.existsSync(launcherSrc)) {
  console.log('[NATIVE] Compiling native standalone SonicWave.exe...');
  fs.mkdirSync(path.join(rootDir, 'launcher'), { recursive: true });
  execSync(`"${cscPath}" /target:winexe /optimize+ /win32icon:"${iconPath}" /r:System.Windows.Forms.dll /r:System.Drawing.dll /out:"${launcherExe}" "${launcherSrc}"`, { stdio: 'inherit' });
}

if (fs.existsSync(launcherExe)) {
  fs.copyFileSync(launcherExe, path.join(stagingDir, 'SonicWave.exe'));
  console.log('[STAGING] Bundled native SonicWave.exe inside package.');
}

fs.copyFileSync(path.join(rootDir, 'start.bat'), path.join(stagingDir, 'start.bat'));
if (fs.existsSync(path.join(rootDir, 'start.sh'))) {
  fs.copyFileSync(path.join(rootDir, 'start.sh'), path.join(stagingDir, 'start.sh'));
}
fs.copyFileSync(path.join(rootDir, 'README.md'), path.join(stagingDir, 'README.md'));
fs.copyFileSync(path.join(rootDir, 'package.json'), path.join(stagingDir, 'package.json'));

// 4. Copy server files
const serverFiles = ['index.js', 'converter.js', 'binManager.js', 'package.json'];
for (const file of serverFiles) {
  const src = path.join(rootDir, 'server', file);
  if (fs.existsSync(src)) {
    fs.copyFileSync(src, path.join(stagingDir, 'server', file));
  }
}
const cookiesSrc = path.join(rootDir, 'server', 'cookies.txt');
if (fs.existsSync(cookiesSrc)) {
  fs.copyFileSync(cookiesSrc, path.join(stagingDir, 'server', 'cookies.txt'));
}

// 5. Copy client files (EXCLUDING LandingPage.jsx!)
fs.copyFileSync(path.join(rootDir, 'client', 'package.json'), path.join(stagingDir, 'client', 'package.json'));
fs.copyFileSync(path.join(rootDir, 'client', 'vite.config.js'), path.join(stagingDir, 'client', 'vite.config.js'));
fs.copyFileSync(path.join(rootDir, 'client', 'index.html'), path.join(stagingDir, 'client', 'index.html'));
fs.copyFileSync(path.join(rootDir, 'client', 'public', 'logo.svg'), path.join(stagingDir, 'client', 'public', 'logo.svg'));

fs.copyFileSync(path.join(rootDir, 'client', 'src', 'main.jsx'), path.join(stagingDir, 'client', 'src', 'main.jsx'));
fs.copyFileSync(path.join(rootDir, 'client', 'src', 'index.css'), path.join(stagingDir, 'client', 'src', 'index.css'));

// Use AppDesktop.jsx as the desktop App.jsx (NO LandingPage!)
fs.copyFileSync(path.join(rootDir, 'client', 'src', 'AppDesktop.jsx'), path.join(stagingDir, 'client', 'src', 'App.jsx'));

// Helper to copy directories recursively
function copyDirSync(src, dest) {
  fs.mkdirSync(dest, { recursive: true });
  const entries = fs.readdirSync(src, { withFileTypes: true });
  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    if (entry.isDirectory()) {
      copyDirSync(srcPath, destPath);
    } else {
      // Do not copy existing heavy binaries (zip, apk, exe) into client/dist/ in staging
      if (entry.name.endsWith('.zip') || entry.name.endsWith('.apk') || entry.name.endsWith('.exe')) continue;
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

// Copy all components EXCEPT LandingPage.jsx and AppDesktop.jsx
const componentsDir = path.join(rootDir, 'client', 'src', 'components');
const componentEntries = fs.readdirSync(componentsDir, { withFileTypes: true });
for (const entry of componentEntries) {
  if (entry.name === 'LandingPage.jsx' || entry.name === 'AppDesktop.jsx') {
    console.log(`[EXCLUDE] Excluded ${entry.name} from desktop software package.`);
    continue;
  }
  const srcPath = path.join(componentsDir, entry.name);
  const destPath = path.join(stagingDir, 'client', 'src', 'components', entry.name);
  if (entry.isDirectory()) {
    copyDirSync(srcPath, destPath);
  } else {
    fs.copyFileSync(srcPath, destPath);
  }
}

// Copy prebuilt desktop dist files into staging
copyDirSync(path.join(rootDir, 'client', 'dist'), path.join(stagingDir, 'client', 'dist'));

// Helper to run PowerShell with fallback from pwsh to powershell
function runPowerShell(cmd) {
  try {
    execSync(`pwsh -Command "${cmd}"`, { stdio: 'inherit' });
  } catch {
    execSync(`powershell -Command "${cmd}"`, { stdio: 'inherit' });
  }
}

// 6. Compress staging folder into zip using Compress-Archive
console.log('[ZIP] Packaging into Windows ZIP archive...');
if (fs.existsSync(zipOutputFilePublic)) {
  fs.unlinkSync(zipOutputFilePublic);
}

const psScript = `Compress-Archive -Path '${stagingDir}\\*' -DestinationPath '${zipOutputFilePublic}' -CompressionLevel Optimal`;
runPowerShell(psScript);

// Mirror to client/public/SonicWave-v1.0.0-macOS.zip
fs.copyFileSync(zipOutputFilePublic, macZipOutputFilePublic);

// Also mirror to client/dist if dist exists
if (fs.existsSync(path.dirname(zipOutputFileDist))) {
  fs.copyFileSync(zipOutputFilePublic, zipOutputFileDist);
  fs.copyFileSync(zipOutputFilePublic, macZipOutputFileDist);
}

// 7. Verification: Verify LandingPage is NOT inside the zip
console.log('[VERIFY] Verifying archive contents...');
const testExtractDir = path.join(process.env.TEMP || 'C:\\Windows\\Temp', 'SonicWave-Verify-Extract');
if (fs.existsSync(testExtractDir)) {
  fs.rmSync(testExtractDir, { recursive: true, force: true });
}
runPowerShell(`Expand-Archive -Path '${zipOutputFilePublic}' -DestinationPath '${testExtractDir}'`);

const extractedLandingPage = path.join(testExtractDir, 'client', 'src', 'components', 'LandingPage.jsx');
const hasLandingPage = fs.existsSync(extractedLandingPage);

const stat = fs.statSync(zipOutputFilePublic);
console.log('==================================================');
console.log(`Package created: ${zipOutputFilePublic}`);
console.log(`Size: ${(stat.size / 1024).toFixed(1)} KB`);
console.log(`LandingPage.jsx present in zip: ${hasLandingPage ? 'YES (ERROR)' : 'NO (VERIFIED CLEAN)'}`);
console.log('==================================================');

if (hasLandingPage) {
  console.error('[ERROR] LandingPage.jsx is still present in the zip!');
  process.exit(1);
} else {
  console.log('[SUCCESS] Downloadable ZIP package is 100% free of LandingPage.jsx!');
}

// 8. Compile standalone SonicWave-Custom-Installer.exe with embedded native package
const installerCs = path.join(rootDir, 'installer', 'native', 'InstallerForm.cs');
const installerOut = path.join(rootDir, 'client', 'public', 'SonicWave-Custom-Installer.exe');
if (process.platform === 'win32' && fs.existsSync(cscPath) && fs.existsSync(installerCs)) {
  console.log('[INSTALLER] Compiling native SonicWave-Custom-Installer.exe with embedded package...');
  const wpfLib = 'C:\\Windows\\Microsoft.NET\\Framework64\\v4.0.30319\\WPF';
  execSync(`"${cscPath}" /target:winexe /optimize+ /win32icon:"${iconPath}" /lib:"${wpfLib}" /r:PresentationCore.dll /r:PresentationFramework.dll /r:WindowsBase.dll /r:System.Xaml.dll /r:System.IO.Compression.dll /r:System.IO.Compression.FileSystem.dll /resource:"${zipOutputFilePublic}",SonicWavePackage.zip /out:"${installerOut}" "${installerCs}"`, { stdio: 'inherit' });
  if (fs.existsSync(path.join(rootDir, 'client', 'dist'))) {
    fs.copyFileSync(installerOut, path.join(rootDir, 'client', 'dist', 'SonicWave-Custom-Installer.exe'));
  }
  console.log('[SUCCESS] Native Custom Installer compiled and staged to client/public.');
}

// Copy direct standalone SonicWave.exe into client/public
if (fs.existsSync(launcherExe)) {
  const directExePublic = path.join(rootDir, 'client', 'public', 'SonicWave.exe');
  fs.copyFileSync(launcherExe, directExePublic);
  if (fs.existsSync(path.join(rootDir, 'client', 'dist'))) {
    fs.copyFileSync(launcherExe, path.join(rootDir, 'client', 'dist', 'SonicWave.exe'));
  }
  console.log('[SUCCESS] Standalone native SonicWave.exe staged to client/public.');
}
