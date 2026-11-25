import React, { useEffect, useRef } from 'react';
import confetti from 'canvas-confetti';
import {
  CheckCircle2,
  Download,
  FolderArchive,
  Terminal,
  HelpCircle,
  ShieldCheck,
  X,
  Sparkles,
  ArrowRight
} from 'lucide-react';
import { resolveReleaseAssetUrl } from '../utils/releaseAssets';

/**
 * Shared programmatic binary download helper supporting optional CDN mirrors
 * via `VITE_RELEASE_CDN_URL` with local `/filename` fallback.
 */
function triggerBinaryDownload(filename) {
  const link = document.createElement('a');
  link.href = resolveReleaseAssetUrl(filename);
  link.setAttribute('download', filename);
  link.style.display = 'none';
  document.body.appendChild(link);
  link.click();
  setTimeout(() => {
    try {
      if (document.body.contains(link)) {
        document.body.removeChild(link);
      }
    } catch {}
  }, 500);
}

/**
 * Programmatically triggers the download of the Windows standalone installer executable.
 */
export function triggerExeDownload() {
  triggerBinaryDownload('SonicWave-Custom-Installer.exe');
}

/**
 * Programmatically triggers the download of the Windows zip distribution.
 */
export function triggerZipDownload() {
  triggerBinaryDownload('SonicWave-v1.0.0-Windows.zip');
}

/**
 * Programmatically triggers the download of the macOS zip distribution.
 */
export function triggerMacZipDownload() {
  triggerBinaryDownload('SonicWave-v1.0.0-macOS.zip');
}

/**
 * Programmatically triggers the download of the Android standalone APK package.
 */
export function triggerApkDownload() {
  triggerBinaryDownload('SonicWave.apk');
}

/**
 * Fires a celebratory confetti particle blast across the screen.
 */
export function fireCelebrationConfetti() {
  try {
    // Primary upward burst from center
    confetti({
      particleCount: 65,
      spread: 75,
      origin: { y: 0.65 },
      colors: ['#1ed760', '#5e6ad2', '#38bdf8', '#ffffff', '#a855f7'],
      disableForReducedMotion: true
    });

    // Dual flank fireworks
    setTimeout(() => {
      try {
        confetti({
          particleCount: 35,
          angle: 60,
          spread: 55,
          origin: { x: 0.15, y: 0.7 },
          colors: ['#1ed760', '#5e6ad2', '#38bdf8'],
          disableForReducedMotion: true
        });
        confetti({
          particleCount: 35,
          angle: 120,
          spread: 55,
          origin: { x: 0.85, y: 0.7 },
          colors: ['#1ed760', '#5e6ad2', '#38bdf8'],
          disableForReducedMotion: true
        });
      } catch {}
    }, 180);
  } catch {}
}

export default function DownloadSuccessModal({
  isOpen,
  onClose,
  onNavigate,
  downloadType = 'exe',
  onSwitchType
}) {
  const modalRef = useRef(null);
  const isExe = downloadType === 'exe';
  const isMac = downloadType === 'mac';
  const isApk = downloadType === 'apk';

  // Trigger celebration on dialog appearance
  useEffect(() => {
    if (isOpen) {
      fireCelebrationConfetti();
    }
  }, [isOpen]);

  // Keyboard navigation & body scroll locking
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    };

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', handleKeyDown);

    if (modalRef.current) {
      modalRef.current.focus();
    }

    return () => {
      document.body.style.overflow = originalOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="cursor-modal-backdrop cursor-success-backdrop"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="download-success-title"
    >
      <div
        className="cursor-modal-window cursor-success-modal-window"
        onClick={(e) => e.stopPropagation()}
        tabIndex={-1}
        ref={modalRef}
      >
        {/* Modal Header */}
        <div className="cursor-modal-header cursor-success-modal-header">
          <div className="cursor-success-header-top">
            <div className="cursor-success-icon-badge" aria-hidden="true">
              <CheckCircle2 size={26} className="cursor-success-check-icon" />
            </div>
            <div className="cursor-success-header-text">
              <span className="cursor-success-kicker">
                {isApk
                  ? 'ANDROID 8.0+ \u2022 STANDALONE ON-DEVICE ENGINE \u2022 APK'
                  : isMac
                  ? 'MACOS \u2022 APPLE SILICON & INTEL \u2022 PORTABLE'
                  : isExe
                  ? 'WINDOWS 64-BIT \u2022 NATIVE GUI INSTALLER'
                  : 'WINDOWS 64-BIT \u2022 PORTABLE UTILITY'}
              </span>
              <h2 id="download-success-title" className="cursor-success-title">
                Download Started!
              </h2>
              <p className="cursor-success-subtitle">
                {isApk
                  ? 'SonicWave for Android (.apk) is downloading. Follow these 3 simple steps to install and convert media on your phone:'
                  : isMac
                  ? 'SonicWave for macOS is downloading. Follow these 3 simple steps to start converting media in seconds:'
                  : isExe
                  ? 'SonicWave Custom Installer is downloading. Follow these 3 simple steps to install the desktop studio:'
                  : 'SonicWave is downloading. Follow these 3 simple steps to start converting media in seconds:'}
              </p>
            </div>
          </div>
          <button
            type="button"
            className="cursor-close-btn cursor-success-close-btn"
            onClick={onClose}
            aria-label="Close download success dialog"
            title="Close"
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="cursor-modal-body cursor-success-modal-body">
          {/* File Card Pill */}
          <div className="cursor-success-file-card">
            <div className="cursor-success-file-left">
              <div className="cursor-success-file-icon" aria-hidden="true">
                <Download size={16} />
              </div>
              <div className="cursor-success-file-info">
                <span className="cursor-success-filename">
                  {isApk
                    ? 'SonicWave.apk'
                    : isMac
                    ? 'SonicWave-v1.0.0-macOS.zip'
                    : isExe
                    ? 'SonicWave-Custom-Installer.exe'
                    : 'SonicWave-v1.0.0-Windows.zip'}
                </span>
                <span className="cursor-success-filemeta">
                  {isApk
                    ? '73.0 MB \u2022 Android 8.0+ \u2022 ARM64 (v8a) \u2022 Embedded Engine'
                    : isMac
                    ? '1.49 MB \u2022 macOS 12+ (Sonoma/Ventura/Monterey) \u2022 M1-M4 & Intel'
                    : isExe
                    ? '1.56 MB \u2022 Windows 10 & 11 \u2022 Native Standalone Desktop Window (.exe)'
                    : '1.49 MB \u2022 Windows 10 & 11 \u2022 Web Portable Package in Browser (.zip)'}
                </span>
              </div>
            </div>
            <div className="cursor-success-file-badge">
              <span className="cursor-pulse-dot" aria-hidden="true" />
              <span>Downloading</span>
            </div>
          </div>

          {/* Setup Steps (Android APK vs macOS vs Windows Custom GUI Installer vs Portable ZIP) */}
          {isApk ? (
            <div className="cursor-success-steps-box">
              <h3 className="cursor-success-steps-heading">
                Quick Android Setup Guide:
              </h3>
              <div className="cursor-success-steps-list">
                <div className="cursor-success-step-item">
                  <div className="cursor-success-step-num">1</div>
                  <div className="cursor-success-step-content">
                    <div className="cursor-success-step-title-row">
                      <Download size={14} className="cursor-step-icon" />
                      <strong>Download SonicWave.apk</strong>
                    </div>
                    <p>Once downloaded, tap the notification or locate <code>SonicWave.apk</code> in your phone&apos;s Files/Downloads folder.</p>
                  </div>
                </div>

                <div className="cursor-success-step-item">
                  <div className="cursor-success-step-num">2</div>
                  <div className="cursor-success-step-content">
                    <div className="cursor-success-step-title-row">
                      <ShieldCheck size={14} className="cursor-step-icon" />
                      <strong>Allow Sideloading</strong>
                    </div>
                    <p>If prompted by Android, tap <em>Settings</em> and enable <strong>&quot;Allow from this source&quot;</strong> to permit installing the APK.</p>
                  </div>
                </div>

                <div className="cursor-success-step-item">
                  <div className="cursor-success-step-num">3</div>
                  <div className="cursor-success-step-content">
                    <div className="cursor-success-step-title-row">
                      <Sparkles size={14} className="cursor-step-icon" />
                      <strong>Tap Install &amp; Launch</strong>
                    </div>
                    <p>Open SonicWave! Paste any media link or tap <strong>Share</strong> directly from the YouTube or Instagram app to convert with zero PC needed.</p>
                  </div>
                </div>
              </div>
            </div>
          ) : isMac ? (
            <div className="cursor-success-steps-box">
              <h3 className="cursor-success-steps-heading">
                Quick Setup Guide (macOS):
              </h3>
              <div className="cursor-success-steps-list">
                <div className="cursor-success-step-item">
                  <div className="cursor-success-step-num">1</div>
                  <div className="cursor-success-step-content">
                    <div className="cursor-success-step-title-row">
                      <FolderArchive size={14} className="cursor-step-icon" />
                      <strong>Extract the ZIP</strong>
                    </div>
                    <p>Double-click <code>SonicWave-v1.0.0-macOS.zip</code> in your Downloads folder to unarchive the application.</p>
                  </div>
                </div>

                <div className="cursor-success-step-item">
                  <div className="cursor-success-step-num">2</div>
                  <div className="cursor-success-step-content">
                    <div className="cursor-success-step-title-row">
                      <Terminal size={14} className="cursor-step-icon" />
                      <strong>Run <code>start.sh</code></strong>
                    </div>
                    <p>Open Terminal in the extracted folder and execute: <code>chmod +x start.sh &amp;&amp; ./start.sh</code></p>
                  </div>
                </div>

                <div className="cursor-success-step-item">
                  <div className="cursor-success-step-num">3</div>
                  <div className="cursor-success-step-content">
                    <div className="cursor-success-step-title-row">
                      <Sparkles size={14} className="cursor-step-icon" />
                      <strong>Convert &amp; Enjoy</strong>
                    </div>
                    <p>Your browser opens to <code>localhost:5173</code>. Paste any link for high-speed 320 kbps MP3 or 1080p MP4 conversions!</p>
                  </div>
                </div>
              </div>
            </div>
          ) : isExe ? (
            <div className="cursor-success-steps-box">
              <h3 className="cursor-success-steps-heading">
                Quick Setup Guide:
              </h3>
              <div className="cursor-success-steps-list">
                <div className="cursor-success-step-item">
                  <div className="cursor-success-step-num">1</div>
                  <div className="cursor-success-step-content">
                    <div className="cursor-success-step-title-row">
                      <Terminal size={14} className="cursor-step-icon" />
                      <strong>Run the Installer</strong>
                    </div>
                    <p>Double-click <code>SonicWave-Custom-Installer.exe</code> in your Downloads folder to launch the custom setup.</p>
                  </div>
                </div>

                <div className="cursor-success-step-item">
                  <div className="cursor-success-step-num">2</div>
                  <div className="cursor-success-step-content">
                    <div className="cursor-success-step-title-row">
                      <FolderArchive size={14} className="cursor-step-icon" />
                      <strong>Choose Preferences</strong>
                    </div>
                    <p>Select your installation path and toggle Desktop or Start Menu shortcuts in the frameless installer UI.</p>
                  </div>
                </div>

                <div className="cursor-success-step-item">
                  <div className="cursor-success-step-num">3</div>
                  <div className="cursor-success-step-content">
                    <div className="cursor-success-step-title-row">
                      <Sparkles size={14} className="cursor-step-icon" />
                      <strong>Install &amp; Launch</strong>
                    </div>
                    <p>Click <strong>Install SonicWave</strong> to finish setup and launch your standalone desktop studio window!</p>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="cursor-success-steps-box">
              <h3 className="cursor-success-steps-heading">
                Quick Setup Guide:
              </h3>
              <div className="cursor-success-steps-list">
                <div className="cursor-success-step-item">
                  <div className="cursor-success-step-num">1</div>
                  <div className="cursor-success-step-content">
                    <div className="cursor-success-step-title-row">
                      <FolderArchive size={14} className="cursor-step-icon" />
                      <strong>Extract the ZIP</strong>
                    </div>
                    <p>Right-click <code>SonicWave-v1.0.0-Windows.zip</code> in your Downloads folder and select <strong>Extract All...</strong> to any directory.</p>
                  </div>
                </div>

                <div className="cursor-success-step-item">
                  <div className="cursor-success-step-num">2</div>
                  <div className="cursor-success-step-content">
                    <div className="cursor-success-step-title-row">
                      <Terminal size={14} className="cursor-step-icon" />
                      <strong>Double-Click <code>start.bat</code></strong>
                    </div>
                    <p>The launcher verifies your environment, auto-provisions <code>yt-dlp.exe</code> &amp; <code>ffmpeg.exe</code>, and launches the server.</p>
                  </div>
                </div>

                <div className="cursor-success-step-item">
                  <div className="cursor-success-step-num">3</div>
                  <div className="cursor-success-step-content">
                    <div className="cursor-success-step-title-row">
                      <Sparkles size={14} className="cursor-step-icon" />
                      <strong>Convert &amp; Enjoy</strong>
                    </div>
                    <p>Your browser opens to <code>localhost:5173</code>. Paste any link for high-speed 320 kbps MP3 or 1080p MP4 conversions!</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Alternative download switch row */}
          <div style={{ marginTop: '12px', fontSize: '13px', color: '#94a3b8', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 12px', background: 'rgba(255,255,255,0.03)', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.06)' }}>
            {isApk ? (
              <span>
                Looking for the desktop version instead?{' '}
                <button
                  type="button"
                  style={{ background: 'none', border: 'none', color: '#1ed760', fontWeight: 600, textDecoration: 'underline', cursor: 'pointer', padding: 0 }}
                  onClick={() => {
                    if (onSwitchType) onSwitchType('exe');
                    triggerExeDownload();
                  }}
                >
                  Download Windows (.exe)
                </button>
                {' '}&bull;{' '}
                <button
                  type="button"
                  style={{ background: 'none', border: 'none', color: '#5e6ad2', fontWeight: 600, textDecoration: 'underline', cursor: 'pointer', padding: 0 }}
                  onClick={() => {
                    if (onSwitchType) onSwitchType('mac');
                    triggerMacZipDownload();
                  }}
                >
                  macOS (.zip)
                </button>
              </span>
            ) : isMac ? (
              <span>
                Need the Windows or Android version instead?{' '}
                <button
                  type="button"
                  style={{ background: 'none', border: 'none', color: '#1ed760', fontWeight: 600, textDecoration: 'underline', cursor: 'pointer', padding: 0 }}
                  onClick={() => {
                    if (onSwitchType) onSwitchType('exe');
                    triggerExeDownload();
                  }}
                >
                  Windows (.exe)
                </button>
                {' '}&bull;{' '}
                <button
                  type="button"
                  style={{ background: 'none', border: 'none', color: '#1ed760', fontWeight: 600, textDecoration: 'underline', cursor: 'pointer', padding: 0 }}
                  onClick={() => {
                    if (onSwitchType) onSwitchType('apk');
                    triggerApkDownload();
                  }}
                >
                  Android (.apk)
                </button>
              </span>
            ) : isExe ? (
              <span>
                Looking for Android or portable zip?{' '}
                <button
                  type="button"
                  style={{ background: 'none', border: 'none', color: '#1ed760', fontWeight: 600, textDecoration: 'underline', cursor: 'pointer', padding: 0 }}
                  onClick={() => {
                    if (onSwitchType) onSwitchType('apk');
                    triggerApkDownload();
                  }}
                >
                  Download Android APK
                </button>
                {' '}&bull;{' '}
                <button
                  type="button"
                  style={{ background: 'none', border: 'none', color: '#94a3b8', fontWeight: 600, textDecoration: 'underline', cursor: 'pointer', padding: 0 }}
                  onClick={() => {
                    if (onSwitchType) onSwitchType('zip');
                    triggerZipDownload();
                  }}
                >
                  Portable ZIP
                </button>
              </span>
            ) : (
              <span>
                Want the full native desktop or Android app?{' '}
                <button
                  type="button"
                  style={{ background: 'none', border: 'none', color: '#1ed760', fontWeight: 600, textDecoration: 'underline', cursor: 'pointer', padding: 0 }}
                  onClick={() => {
                    if (onSwitchType) onSwitchType('exe');
                    triggerExeDownload();
                  }}
                >
                  Windows Installer (.exe)
                </button>
                {' '}&bull;{' '}
                <button
                  type="button"
                  style={{ background: 'none', border: 'none', color: '#1ed760', fontWeight: 600, textDecoration: 'underline', cursor: 'pointer', padding: 0 }}
                  onClick={() => {
                    if (onSwitchType) onSwitchType('apk');
                    triggerApkDownload();
                  }}
                >
                  Android APK
                </button>
              </span>
            )}
          </div>

          {/* OS Security Notice (Android Play Protect / Gatekeeper on Mac / SmartScreen on Windows) */}
          <div className="cursor-success-smartscreen-tip">
            <ShieldCheck size={16} className="cursor-smartscreen-shield" aria-hidden="true" />
            <div className="cursor-smartscreen-text">
              {isApk ? (
                <>
                  <strong>Android Play Protect Notice:</strong> If Android displays <em>&quot;Unrecognized app&quot;</em> or blocks installation, tap <strong>More details</strong> &rarr; <strong>Install anyway</strong>. SonicWave executes 100% on-device with zero ads, tracking, or cloud uploads.
                </>
              ) : isMac ? (
                <>
                  <strong>macOS Gatekeeper Notice:</strong> If macOS displays <em>&quot;Unidentified Developer&quot;</em>, right-click <code>start.sh</code> and select <strong>Open</strong>, or run <code>chmod +x start.sh</code> in Terminal. SonicWave is 100% open-source with zero telemetry.
                </>
              ) : (
                <>
                  <strong>Windows Defender Notice:</strong> If Windows prompts <em>&quot;Windows protected your PC&quot;</em>, click <strong>More info</strong> &rarr; <strong>Run anyway</strong>. SonicWave is 100% open source with zero telemetry or background daemons.
                </>
              )}
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="cursor-modal-footer cursor-success-modal-footer">
          <div className="cursor-success-footer-actions">
            <button
              type="button"
              className="cursor-button-primary cursor-success-guide-btn"
              onClick={() => {
                onClose();
                if (onNavigate) onNavigate('install', '/install');
                else window.location.href = '/install';
              }}
            >
              <span>View Full Installation Guide</span>
              <ArrowRight size={14} />
            </button>

            <button
              type="button"
              className="cursor-button-secondary"
              onClick={() => {
                onClose();
                if (onNavigate) onNavigate('troubleshooting', '/troubleshooting');
                else window.location.href = '/troubleshooting';
              }}
            >
              <HelpCircle size={14} />
              <span>Troubleshooting &amp; FAQ</span>
            </button>
          </div>

          <div className="cursor-success-retry-row">
            <span className="cursor-success-retry-text">
              Download didn&apos;t start?{' '}
              <button
                type="button"
                className="cursor-success-retry-link"
                onClick={() => {
                  if (isApk) triggerApkDownload();
                  else if (isMac) triggerMacZipDownload();
                  else if (isExe) triggerExeDownload();
                  else triggerZipDownload();
                  fireCelebrationConfetti();
                }}
              >
                Click here to retry
              </button>
            </span>
            <button
              type="button"
              className="cursor-button-ghost cursor-success-done-btn"
              onClick={onClose}
            >
              Done
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
