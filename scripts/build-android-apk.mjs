import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { execSync, spawnSync } from 'child_process';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');
const androidAppDir = path.join(rootDir, 'android-app');
const appDir = path.join(androidAppDir, 'app');

// 1. Setup JDK 17 environment
const defaultJdkPath = 'C:\\Program Files\\Microsoft\\jdk-17.0.21.21-hotspot';
const javaHome = process.env.JAVA_HOME && fs.existsSync(process.env.JAVA_HOME)
  ? process.env.JAVA_HOME
  : defaultJdkPath;

const javaBin = path.join(javaHome, 'bin');
const env = {
  ...process.env,
  JAVA_HOME: javaHome,
  PATH: `${javaBin};${process.env.PATH || ''}`
};

// 2. Discover Android SDK and Build-Tools
const defaultSdkDir = 'C:\\Users\\shiv\\AppData\\Local\\Android\\Sdk';
const sdkDir = process.env.ANDROID_HOME || process.env.ANDROID_SDK_ROOT || defaultSdkDir;
const buildToolsRoot = path.join(sdkDir, 'build-tools');

function findBuildTool(toolName) {
  if (fs.existsSync(buildToolsRoot)) {
    const versions = fs.readdirSync(buildToolsRoot).sort().reverse();
    for (const ver of versions) {
      const toolPath = path.join(buildToolsRoot, ver, toolName);
      if (fs.existsSync(toolPath)) return toolPath;
    }
  }
  return null;
}

const aaptPath = findBuildTool('aapt.exe');
const zipalignPath = findBuildTool('zipalign.exe');
const apksignerPath = findBuildTool('apksigner.bat');
const keytoolPath = path.join(javaBin, 'keytool.exe');

// 3. Ensure release keystore exists
const keystorePath = path.join(appDir, 'release.keystore');
if (!fs.existsSync(keystorePath)) {
  console.log('[ANDROID-BUILD] Generating release keystore...');
  execSync(
    `"${keytoolPath}" -genkeypair -v -keystore "${keystorePath}" -alias sonicwave -keyalg RSA -keysize 2048 -validity 10000 -storepass sonicwavekeystore -keypass sonicwavekeystore -dname "CN=SonicWave, OU=Mobile, O=SonicWave, L=San Francisco, ST=California, C=US"`,
    { env, stdio: 'inherit' }
  );
}

// 4. Assemble Release APK via Gradle
console.log('==================================================');
console.log('[ANDROID-BUILD] Building SonicWave Release APK with Gradle...');
console.log('==================================================');

const gradlew = process.platform === 'win32' ? '.\\gradlew.bat' : './gradlew';
execSync(`${gradlew} assembleRelease --no-daemon`, {
  cwd: androidAppDir,
  env,
  stdio: 'inherit'
});

const releaseApk = path.join(appDir, 'build', 'outputs', 'apk', 'release', 'app-release.apk');
if (!fs.existsSync(releaseApk)) {
  throw new Error(`Release APK not found at: ${releaseApk}`);
}

// 5. Ensure full v1, v2, v3 signing schemes via apksigner
if (apksignerPath && fs.existsSync(apksignerPath)) {
  console.log('[ANDROID-BUILD] Applying multi-scheme signing (v1, v2, v3)...');
  const signArgs = [
    'sign',
    '--ks', keystorePath,
    '--ks-key-alias', 'sonicwave',
    '--ks-pass', 'pass:sonicwavekeystore',
    '--key-pass', 'pass:sonicwavekeystore',
    '--v1-signing-enabled', 'true',
    '--v2-signing-enabled', 'true',
    '--v3-signing-enabled', 'true',
    releaseApk
  ];
  const signRes = spawnSync(apksignerPath, signArgs, { env, shell: true, encoding: 'utf8' });
  if (signRes.status !== 0) {
    throw new Error(`apksigner sign failed:\n${signRes.stderr || signRes.stdout}`);
  }
}

// 6. Verification: Zip alignment
if (zipalignPath && fs.existsSync(zipalignPath)) {
  console.log('[ANDROID-BUILD] Verifying 4-byte zip alignment...');
  const alignRes = spawnSync(zipalignPath, ['-c', '-v', '4', releaseApk], { env, shell: true, encoding: 'utf8' });
  if (alignRes.status !== 0) {
    throw new Error(`zipalign verification failed:\n${alignRes.stderr || alignRes.stdout}`);
  }
  console.log('  -> Alignment verified successfully.');
}

// 7. Verification: APK Signature Schemes (v1, v2, v3)
if (apksignerPath && fs.existsSync(apksignerPath)) {
  console.log('[ANDROID-BUILD] Verifying APK signature schemes...');
  // Standard verification
  const signRes = spawnSync(apksignerPath, ['verify', '--verbose', '--print-certs', releaseApk], { env, shell: true, encoding: 'utf8' });
  const signOutput = (signRes.stdout || '') + (signRes.stderr || '');
  if (signRes.status !== 0 || !signOutput.includes('Verifies')) {
    throw new Error(`apksigner verification failed:\n${signOutput}`);
  }

  // Backwards compatibility verification (checks JAR v1 signing for pre-Android 7 devices)
  const legacySignRes = spawnSync(apksignerPath, ['verify', '--verbose', '--min-sdk-version', '23', releaseApk], { env, shell: true, encoding: 'utf8' });
  const legacyOutput = (legacySignRes.stdout || '') + (legacySignRes.stderr || '');

  const v1 = /Verified using v1 scheme[^:]*:\s*true/i.test(legacyOutput);
  const v2 = /Verified using v2 scheme[^:]*:\s*true/i.test(signOutput);
  const v3 = /Verified using v3 scheme[^:]*:\s*true/i.test(signOutput);
  console.log(`  -> v1 (JAR signing): ${v1 ? 'PASS' : 'FAIL'}`);
  console.log(`  -> v2 (APK Signature v2): ${v2 ? 'PASS' : 'FAIL'}`);
  console.log(`  -> v3 (APK Signature v3): ${v3 ? 'PASS' : 'FAIL'}`);

  if (!v1 || !v2 || !v3) {
    throw new Error(`Required signature scheme missing (v1: ${v1}, v2: ${v2}, v3: ${v3})`);
  }

  if (!signOutput.includes('CN=SonicWave')) {
    throw new Error('Release certificate does not match expected signer CN=SonicWave');
  }
  console.log('  -> Signer certificate verified: CN=SonicWave');
}

// 8. Verification: AAPT badging (targetSdk 34, no application-debuggable)
if (aaptPath && fs.existsSync(aaptPath)) {
  console.log('[ANDROID-BUILD] Verifying AAPT badging attributes...');
  const aaptRes = spawnSync(aaptPath, ['dump', 'badging', releaseApk], { env, shell: true, encoding: 'utf8' });
  const aaptOutput = (aaptRes.stdout || '') + (aaptRes.stderr || '');
  if (aaptOutput.includes('application-debuggable')) {
    throw new Error('Release APK must NOT contain application-debuggable flag');
  }
  if (!aaptOutput.includes("targetSdkVersion:'34'")) {
    throw new Error("Release APK must declare targetSdkVersion:'34'");
  }
  console.log("  -> targetSdkVersion:'34' confirmed, application-debuggable ABSENT (PASS)");
}

// 9. Copy to distribution targets
const publicDest = path.join(rootDir, 'client', 'public', 'SonicWave.apk');
fs.copyFileSync(releaseApk, publicDest);
console.log(`[ANDROID-BUILD] Staged release APK to: ${publicDest}`);

const distDir = path.join(rootDir, 'client', 'dist');
if (fs.existsSync(distDir)) {
  const distDest = path.join(distDir, 'SonicWave.apk');
  fs.copyFileSync(releaseApk, distDest);
  console.log(`[ANDROID-BUILD] Staged release APK to: ${distDest}`);
}

// 10. Compute and report stats
const apkStats = fs.statSync(publicDest);
const apkHash = crypto.createHash('sha256').update(fs.readFileSync(publicDest)).digest('hex');
console.log('==================================================');
console.log(`[ANDROID-BUILD] BUILD & PACKAGING COMPLETE`);
console.log(`  Size: ${apkStats.size.toLocaleString()} bytes (${(apkStats.size / (1024 * 1024)).toFixed(2)} MB)`);
console.log(`  SHA-256: ${apkHash}`);
console.log('==================================================');
