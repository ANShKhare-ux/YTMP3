/**
 * Canonical distribution package metadata verified against binaries in `client/public/`.
 * Keep display sizes formatted consistently across landing, download, modal, and docs views.
 */
export const PACKAGE_SPECS = {
  version: '1.0.0',
  windowsExe: {
    id: 'exe',
    filename: 'SonicWave-Custom-Installer.exe',
    path: '/SonicWave-Custom-Installer.exe',
    sizeBytes: 1815552,
    sizeLabel: '1.82 MB',
    platform: 'Windows 10 & 11 (64-bit)',
    subtitle: 'Windows 10 & 11 \u2022 Native Standalone Desktop Window (.exe)'
  },
  windowsZip: {
    id: 'zip',
    filename: 'SonicWave-v1.0.0-Windows.zip',
    path: '/SonicWave-v1.0.0-Windows.zip',
    sizeBytes: 1740398,
    sizeLabel: '1.74 MB',
    platform: 'Windows 10 & 11',
    subtitle: 'Windows 10 & 11 \u2022 Web Portable Package in Browser (.zip)'
  },
  macZip: {
    id: 'mac',
    filename: 'SonicWave-v1.0.0-macOS.zip',
    path: '/SonicWave-v1.0.0-macOS.zip',
    sizeBytes: 1684648,
    sizeLabel: '1.68 MB',
    platform: 'macOS 12+ (Apple Silicon & Intel)',
    subtitle: 'macOS 12+ (Sonoma/Ventura/Monterey) \u2022 M1-M4 & Intel'
  },
  androidApk: {
    id: 'apk',
    filename: 'SonicWave.apk',
    path: '/SonicWave.apk',
    sizeBytes: 60664219,
    sizeLabel: '60.7 MB',
    platform: 'Android 8.0+ through Android 15',
    subtitle: 'Android 8.0+ \u2022 ARM64 (v8a) \u2022 Embedded Engine'
  }
};
