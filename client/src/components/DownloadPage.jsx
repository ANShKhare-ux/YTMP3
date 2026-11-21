import React, { useState, useEffect } from 'react';
import DownloadSuccessModal, {
  triggerZipDownload,
  triggerExeDownload,
  triggerMacZipDownload,
  triggerApkDownload
} from './DownloadSuccessModal';
import TipJarModal from './TipJarModal';
import { useDocumentMetadata } from './legal/useDocumentMetadata';
import {
  Download,
  Terminal,
  ShieldCheck,
  CheckCircle2,
  FolderArchive,
  HardDrive,
  Cpu,
  Monitor,
  Smartphone,
  Sparkles,
  ArrowLeft,
  ExternalLink,
  Copy,
  Check,
  FileText,
  Layers,
  HelpCircle,
  Zap,
  Info,
  AlertTriangle,
  Coffee
} from 'lucide-react';

function WindowsIcon({ size = 16, className = '' }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className}
      aria-hidden="true"
    >
      <path d="M0 3.449L9.75 2.1v9.451H0m10.949-9.602L24 0v11.4H10.949M0 12.6h9.75v9.451L0 20.699M10.949 12.6H24V24l-12.951-1.801" />
    </svg>
  );
}

function AppleIcon({ size = 16, className = '' }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className}
      aria-hidden="true"
    >
      <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M15.97 6.37c.62-.75 1.04-1.8 0.92-2.85-.9.04-2 .6-2.65 1.35-.58.66-1.09 1.73-.95 2.76.99.08 2.06-.51 2.68-1.26z" />
    </svg>
  );
}

function AndroidIcon({ size = 16, className = '' }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className}
      aria-hidden="true"
    >
      <path d="M17.523 15.3414c-.5511 0-.9993-.4486-.9993-.9997s.4482-.9993.9993-.9993c.551 0 .9993.4482.9993.9993.0001.5511-.4483.9997-.9993.9997m-11.046 0c-.5511 0-.9993-.4486-.9993-.9997s.4482-.9993.9993-.9993c.5511 0 .9993.4482.9993.9993 0 .5511-.4482.9997-.9993.9997m11.4045-6.02l1.9973-3.4592a.416.416 0 00-.1521-.5676.416.416 0 00-.5676.1521l-2.0223 3.503C15.5902 8.4144 13.8533 8.082 12 8.082s-3.5902.3324-5.1368.8677L4.8409 5.4467a.4161.4161 0 00-.5677-.1521.4157.4157 0 00-.1521.5676l1.9973 3.4592C2.6889 11.1867.3432 14.6589 0 18.761h24c-.3432-4.1021-2.6889-7.5743-6.1185-9.4396" />
    </svg>
  );
}

function CursorBrandLogo({ size = 26 }) {
  return (
    <div className="cursor-brand-logo" style={{ width: size, height: size }}>
      <svg viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" width={size} height={size}>
        <rect width="32" height="32" rx="8" fill="#0f1011" stroke="#23252a" strokeWidth="1" />
        <rect x="7" y="13" width="2" height="6" rx="1" fill="#1ed760" opacity="0.6" />
        <rect x="11" y="9" width="2" height="14" rx="1" fill="#1ed760" opacity="0.8" />
        <rect x="15" y="6" width="2" height="20" rx="1" fill="#1ed760" />
        <rect x="19" y="10" width="2" height="12" rx="1" fill="#1ed760" opacity="0.8" />
        <rect x="23" y="14" width="2" height="4" rx="1" fill="#1ed760" opacity="0.6" />
      </svg>
    </div>
  );
}

export default function DownloadPage({ onNavigate }) {
  const [isDownloadSuccessOpen, setIsDownloadSuccessOpen] = useState(false);
  const [downloadType, setDownloadType] = useState('exe');
  const [copiedCmd, setCopiedCmd] = useState('');
  const [isTipJarOpen, setIsTipJarOpen] = useState(false);

  const [userPlatform, setUserPlatform] = useState(() => {
    if (typeof window === 'undefined' || typeof navigator === 'undefined') return 'win';
    const ua = navigator.userAgent || '';
    if (/Android/i.test(ua)) return 'android';
    if (/Macintosh|Mac OS X/i.test(ua)) return 'mac';
    return 'win';
  });

  useDocumentMetadata({
    title: 'Download SonicWave : Official Windows, Android & macOS Installers',
    description: 'Download SonicWave v1.0.0 for Windows (Custom Native Installer & Portable ZIP), Android (Embedded Engine APK), and macOS. 100% free, open-source, with 16x parallel turbo media conversion.',
    canonical: 'https://ytmp-3-five.vercel.app/download'
  });

  const handleCopy = (text, id) => {
    navigator.clipboard.writeText(text);
    setCopiedCmd(id);
    setTimeout(() => setCopiedCmd(''), 2500);
  };

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const checkHash = () => {
        if (window.location.hash === '#tipjar' || window.location.hash === '#donate') {
          setIsTipJarOpen(true);
        }
      };
      checkHash();
      window.addEventListener('hashchange', checkHash);
      return () => window.removeEventListener('hashchange', checkHash);
    }
  }, []);

  const startDownload = (type) => {
    setDownloadType(type);
    if (type === 'exe') triggerExeDownload();
    else if (type === 'apk') triggerApkDownload();
    else if (type === 'zip') triggerZipDownload();
    else if (type === 'mac') triggerMacZipDownload();
    setIsDownloadSuccessOpen(true);
  };

  return (
    <div className="cursor-canvas-root legal-shell" data-theme="dark" style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Top Navbar */}
      <header className="cursor-top-nav" role="banner">
        <div className="cursor-nav-container">
          <a
            href="/"
            className="cursor-nav-brand"
            style={{ textDecoration: 'none', color: 'inherit', display: 'flex', alignItems: 'center', gap: '10px' }}
            onClick={(e) => {
              e.preventDefault();
              if (onNavigate) onNavigate('landing', '/');
              else window.location.href = '/';
            }}
            aria-label="SonicWave Home"
          >
            <CursorBrandLogo size={26} />
            <span className="cursor-brand-title" style={{ color: 'var(--cursor-ink, #ffffff)', fontWeight: 600, fontSize: '15px' }}>SonicWave</span>
            <span className="cursor-nav-version-badge" style={{ fontSize: '11px', padding: '2px 7px', borderRadius: '4px' }}>v1.0.0</span>
          </a>

          <nav className="cursor-nav-links" aria-label="Download Center Navigation">
            <a
              href="/"
              className="cursor-nav-link"
              onClick={(e) => {
                e.preventDefault();
                if (onNavigate) onNavigate('landing', '/');
                else window.location.href = '/';
              }}
            >
              <ArrowLeft size={13} style={{ marginRight: 4 }} aria-hidden="true" />
              Back to Home
            </a>
          </nav>

          <div className="cursor-nav-actions" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button
              type="button"
              className="cursor-nav-tip-btn"
              onClick={() => setIsTipJarOpen(true)}
              aria-label="Tip Jar"
              title="Tip Jar & Support"
            >
              <Coffee size={13} style={{ color: '#ffd700' }} />
              <span>Tip Jar</span>
            </button>

            <button
              type="button"
              className="cursor-button-secondary cursor-btn-sm"
              onClick={(e) => {
                e.preventDefault();
                if (onNavigate) onNavigate('landing', '/');
                else window.location.href = '/';
              }}
              style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
            >
              <ArrowLeft size={13} aria-hidden="true" />
              <span>Back to Home</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Download Hub Container */}
      <main className="legal-main download-page-main" id="main-content">
        {/* Breadcrumb Navigation */}
        <nav aria-label="Breadcrumb" style={{ marginBottom: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: 'var(--cursor-ink-muted)' }}>
            <button
              type="button"
              onClick={() => onNavigate && onNavigate('landing', '/')}
              style={{ background: 'none', border: 'none', color: 'var(--cursor-ink-muted)', cursor: 'pointer', padding: 0, fontSize: 'inherit', textDecoration: 'none' }}
            >
              Home
            </button>
            <span style={{ opacity: 0.5 }}>&rsaquo;</span>
            <span style={{ color: 'var(--spotify-green)', fontWeight: 600 }}>Download Center</span>
          </div>
        </nav>

        {/* Hero Header Block */}
        <div className="legal-header-block" style={{ textAlign: 'center', maxWidth: '780px', margin: '0 auto 40px' }}>
          <div className="legal-eyebrow-tag">
            OFFICIAL DISTRIBUTIONS &bull; WINDOWS &bull; ANDROID &bull; MACOS
          </div>
          <h1 className="legal-page-h1" style={{ fontSize: 'clamp(32px, 5vw, 44px)', marginTop: '8px' }}>
            Download SonicWave
          </h1>
          <p style={{ fontSize: '15px', color: 'var(--cursor-ink-muted)', lineHeight: 1.6, margin: '10px 0 0' }}>
            Choose the package tailored to your device. Every version is 100% free, open-source, features our 16-stream parallel turbo engine, and operates with zero telemetry, ads, or artificial limits.
          </p>
        </div>

        {/* Dynamic OS Detection Banner */}
        <div
          style={{
            backgroundColor: 'rgba(30, 215, 96, 0.08)',
            border: '1px solid rgba(30, 215, 96, 0.25)',
            borderRadius: '12px',
            padding: '16px 20px',
            marginBottom: '36px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '14px'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            {userPlatform === 'android' ? (
              <AndroidIcon size={24} style={{ color: '#1ed760' }} />
            ) : userPlatform === 'mac' ? (
              <AppleIcon size={24} style={{ color: '#1ed760' }} />
            ) : (
              <WindowsIcon size={24} style={{ color: '#1ed760' }} />
            )}
            <div>
              <div style={{ fontSize: '14px', fontWeight: 700, color: '#ffffff' }}>
                Detected Operating System: {userPlatform === 'android' ? 'Android Smartphone' : userPlatform === 'mac' ? 'Apple macOS' : 'Microsoft Windows'}
              </div>
              <div style={{ fontSize: '13px', color: 'var(--text-subdued)' }}>
                {userPlatform === 'android'
                  ? 'Recommended: Android Standalone APK (73 MB) — on-device extraction with Share Sheet support.'
                  : userPlatform === 'mac'
                  ? 'Recommended: macOS Portable Terminal Package (1.45 MB) — Apple Silicon & Intel ready.'
                  : 'Recommended: Windows Custom GUI Installer (.exe, 1.5 MB) — native desktop window & shortcuts.'}
              </div>
            </div>
          </div>

          <button
            type="button"
            className="cursor-button-primary cursor-btn-sm"
            onClick={() => startDownload(userPlatform === 'android' ? 'apk' : userPlatform === 'mac' ? 'mac' : 'exe')}
            style={{ fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '6px' }}
          >
            <Download size={14} />
            <span>Download for {userPlatform === 'android' ? 'Android' : userPlatform === 'mac' ? 'macOS' : 'Windows'}</span>
          </button>
        </div>

        {/* 4 Download Methods Grid: 4 Aligned in a Single Line */}
        <div className="download-methods-grid">
          
          {/* METHOD 1: Windows Native Custom Installer */}
          <div className={`download-method-card ${userPlatform === 'win' ? 'is-recommended' : ''}`}>
            {userPlatform === 'win' && (
              <div
                style={{
                  position: 'absolute',
                  top: '-11px',
                  right: '24px',
                  background: 'var(--spotify-green)',
                  color: '#000000',
                  fontSize: '10px',
                  fontWeight: 800,
                  textTransform: 'uppercase',
                  letterSpacing: '0.8px',
                  padding: '2px 10px',
                  borderRadius: '10px'
                }}
              >
                Recommended For You
              </div>
            )}

            <div className="download-card-header">
              <div className="download-card-icon-box brand-accent">
                <WindowsIcon size={20} />
              </div>
              <div>
                <span className="download-card-method-tag brand-accent">
                  Method 01 &bull; Native Desktop App
                </span>
                <h3 className="download-card-title">
                  Windows Custom Installer (.exe)
                </h3>
              </div>
            </div>

            <p className="download-card-desc">
              Frameless Spotify-dark GUI installer. Automatically provisions <code>SonicWave.exe</code>, configures Desktop &amp; Start Menu shortcuts, and runs in a dedicated native window without browser address bars.
            </p>

            <div className="download-card-specs">
              <div><strong>File:</strong> <code>SonicWave-Custom-Installer.exe</code></div>
              <div><strong>Size:</strong> 1.5 MB &bull; <strong>OS:</strong> Windows 11 &amp; 10 (64-bit)</div>
              <div><strong>Status:</strong> SHA-256 Verified &bull; Zero Registry Bloat</div>
            </div>

            <button
              type="button"
              className="cursor-button-primary download-card-btn"
              onClick={() => startDownload('exe')}
            >
              <Download size={15} />
              <span>Download Custom Installer (.exe)</span>
            </button>

            {/* Step-by-Step Guide */}
            <div className="download-card-guide">
              <h4 className="download-card-guide-title">
                How to Install &amp; Use:
              </h4>
              <ol className="download-card-guide-list">
                <li>Double-click <code>SonicWave-Custom-Installer.exe</code>.</li>
                <li>Click <strong>Install Now</strong> (or choose your custom install folder).</li>
                <li>Launch SonicWave from your new Desktop shortcut &mdash; starts instantly with no console window.</li>
                <li style={{ marginTop: '6px', color: '#a3a3a3' }}>
                  <em>SmartScreen Note:</em> If Windows Defender prompts "Windows protected your PC", click <u>More info</u> &rarr; <u>Run anyway</u>.
                </li>
              </ol>
            </div>
          </div>

          {/* METHOD 2: Android Standalone On-Device APK */}
          <div className={`download-method-card ${userPlatform === 'android' ? 'is-recommended' : ''}`}>
            {userPlatform === 'android' && (
              <div
                style={{
                  position: 'absolute',
                  top: '-11px',
                  right: '24px',
                  background: 'var(--spotify-green)',
                  color: '#000000',
                  fontSize: '10px',
                  fontWeight: 800,
                  textTransform: 'uppercase',
                  letterSpacing: '0.8px',
                  padding: '2px 10px',
                  borderRadius: '10px'
                }}
              >
                Recommended For You
              </div>
            )}

            <div className="download-card-header">
              <div className="download-card-icon-box brand-accent">
                <AndroidIcon size={20} />
              </div>
              <div>
                <span className="download-card-method-tag brand-accent">
                  Method 02 &bull; 100% On-Device Mobile
                </span>
                <h3 className="download-card-title">
                  Android Standalone APK (.apk)
                </h3>
              </div>
            </div>

            <p className="download-card-desc">
              True standalone mobile app bundling embedded Python 3.11, FFmpeg, and yt-dlp. Converts directly on phone hardware with system Share Sheet integration &mdash; zero PC or server required.
            </p>

            <div className="download-card-specs">
              <div><strong>File:</strong> <code>SonicWave.apk</code></div>
              <div><strong>Size:</strong> 73 MB &bull; <strong>OS:</strong> Android 8.0+ through Android 15</div>
              <div><strong>Signature:</strong> Release Keystore (v1, v2, v3) &bull; Target SDK 34</div>
            </div>

            <button
              type="button"
              className="cursor-button-primary download-card-btn"
              onClick={() => startDownload('apk')}
            >
              <Download size={15} />
              <span>Download Android APK (73 MB)</span>
            </button>

            {/* Step-by-Step Guide */}
            <div className="download-card-guide">
              <h4 className="download-card-guide-title">
                How to Install &amp; Use:
              </h4>
              <ol className="download-card-guide-list">
                <li>Tap <strong>Download Android APK</strong> on your phone.</li>
                <li>If prompted "File might be harmful", tap <strong>Download anyway</strong>.</li>
                <li>Tap the downloaded file. If prompted, enable <strong>Install unknown apps</strong> for your browser.</li>
                <li>Open SonicWave! Tap <strong>Share</strong> on any YouTube video, Instagram Reel, or TikTok and select SonicWave to convert directly to phone storage.</li>
              </ol>
            </div>
          </div>

          {/* METHOD 3: Windows Portable Web ZIP */}
          <div className="download-method-card">
            <div className="download-card-header">
              <div className="download-card-icon-box">
                <FolderArchive size={20} />
              </div>
              <div>
                <span className="download-card-method-tag">
                  Method 03 &bull; Portable Web Package
                </span>
                <h3 className="download-card-title">
                  Windows Portable ZIP (.zip)
                </h3>
              </div>
            </div>

            <p className="download-card-desc">
              Lightweight portable distribution with 1-click <code>start.bat</code> launcher. Perfect for running SonicWave inside your favorite desktop browser (Chrome, Edge, Firefox) without any installation.
            </p>

            <div className="download-card-specs">
              <div><strong>File:</strong> <code>SonicWave-v1.0.0-Windows.zip</code></div>
              <div><strong>Size:</strong> 1.45 MB &bull; <strong>OS:</strong> Windows 11 &amp; 10</div>
              <div><strong>Launcher:</strong> 1-click <code>start.bat</code> &bull; Self-Bootstrapping</div>
            </div>

            <button
              type="button"
              className="cursor-button-secondary download-card-btn"
              onClick={() => startDownload('zip')}
            >
              <Download size={15} />
              <span>Download Portable ZIP (.zip)</span>
            </button>

            {/* Step-by-Step Guide */}
            <div className="download-card-guide">
              <h4 className="download-card-guide-title">
                How to Install &amp; Use:
              </h4>
              <ol className="download-card-guide-list">
                <li>Extract <code>SonicWave-v1.0.0-Windows.zip</code> to any folder.</li>
                <li>Double-click <code>start.bat</code>.</li>
                <li>The script verifies local engine binaries and opens the studio at <code>http://localhost:5173</code> in your browser.</li>
              </ol>
            </div>
          </div>

          {/* METHOD 4: macOS Portable Package */}
          <div className={`download-method-card ${userPlatform === 'mac' ? 'is-recommended' : ''}`}>
            {userPlatform === 'mac' && (
              <div
                style={{
                  position: 'absolute',
                  top: '-11px',
                  right: '24px',
                  background: 'var(--spotify-green)',
                  color: '#000000',
                  fontSize: '10px',
                  fontWeight: 800,
                  textTransform: 'uppercase',
                  letterSpacing: '0.8px',
                  padding: '2px 10px',
                  borderRadius: '10px'
                }}
              >
                Recommended For You
              </div>
            )}

            <div className="download-card-header">
              <div className="download-card-icon-box">
                <AppleIcon size={20} />
              </div>
              <div>
                <span className="download-card-method-tag">
                  Method 04 &bull; Cross-Platform Apple
                </span>
                <h3 className="download-card-title">
                  macOS Portable ZIP (.zip)
                </h3>
              </div>
            </div>

            <p className="download-card-desc">
              Optimized for macOS 12+ (Sonoma, Ventura, Monterey). Features POSIX bash launcher <code>start.sh</code> with Apple Silicon (M1/M2/M3/M4) and Intel architecture support.
            </p>

            <div className="download-card-specs">
              <div><strong>File:</strong> <code>SonicWave-v1.0.0-macOS.zip</code></div>
              <div><strong>Size:</strong> 1.45 MB &bull; <strong>OS:</strong> macOS 12+ (Apple Silicon &amp; Intel)</div>
              <div><strong>Launcher:</strong> POSIX bash <code>start.sh</code> &bull; Signal Handled</div>
            </div>

            <button
              type="button"
              className="cursor-button-secondary download-card-btn"
              onClick={() => startDownload('mac')}
            >
              <Download size={15} />
              <span>Download macOS Package (.zip)</span>
            </button>

            {/* Step-by-Step Guide */}
            <div className="download-card-guide">
              <h4 className="download-card-guide-title">
                How to Install &amp; Use:
              </h4>
              <ol className="download-card-guide-list">
                <li>Unzip <code>SonicWave-v1.0.0-macOS.zip</code>.</li>
                <li>Open Terminal in the extracted folder and run:</li>
                <li style={{ listStyle: 'none', margin: '6px 0 6px -18px' }}>
                  <div style={{ background: '#0a0a0a', border: '1px solid #262626', borderRadius: '6px', padding: '6px 10px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <code style={{ color: 'var(--spotify-green)', fontSize: '12px' }}>bash start.sh</code>
                    <button
                      type="button"
                      onClick={() => handleCopy('bash start.sh', 'mac-cmd')}
                      style={{ background: 'none', border: 'none', color: '#a3a3a3', cursor: 'pointer', padding: 2 }}
                      title="Copy command"
                    >
                      {copiedCmd === 'mac-cmd' ? <Check size={14} style={{ color: '#1ed760' }} /> : <Copy size={14} />}
                    </button>
                  </div>
                </li>
                <li>The script provisions yt-dlp &amp; ffmpeg and opens your local studio in Safari or Chrome.</li>
              </ol>
            </div>
          </div>
        </div>

        {/* Feature Comparison Matrix */}
        <section style={{ marginBottom: '56px' }}>
          <h2 style={{ fontSize: '22px', fontWeight: 700, color: '#ffffff', marginBottom: '16px' }}>
            Package Comparison Matrix
          </h2>
          <div style={{ overflowX: 'auto', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: '12px' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px', textAlign: 'left' }}>
              <thead>
                <tr style={{ background: '#181818', borderBottom: '1px solid rgba(255, 255, 255, 0.1)' }}>
                  <th style={{ padding: '14px 16px', color: 'var(--text-subdued)' }}>Capability</th>
                  <th style={{ padding: '14px 16px', color: '#1ed760' }}>Windows Native (.exe)</th>
                  <th style={{ padding: '14px 16px', color: '#1ed760' }}>Android APK (.apk)</th>
                  <th style={{ padding: '14px 16px', color: '#ffffff' }}>Web Portable (.zip)</th>
                  <th style={{ padding: '14px 16px', color: '#ffffff' }}>macOS Package (.zip)</th>
                </tr>
              </thead>
              <tbody style={{ color: 'var(--text-subdued)' }}>
                <tr style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.05)' }}>
                  <td style={{ padding: '12px 16px', color: '#ffffff', fontWeight: 600 }}>Execution Mode</td>
                  <td style={{ padding: '12px 16px' }}>Native Frameless Window</td>
                  <td style={{ padding: '12px 16px' }}>On-Device Mobile App</td>
                  <td style={{ padding: '12px 16px' }}>Local Web Browser</td>
                  <td style={{ padding: '12px 16px' }}>Local Web Browser</td>
                </tr>
                <tr style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.05)' }}>
                  <td style={{ padding: '12px 16px', color: '#ffffff', fontWeight: 600 }}>Browser Tabs Required</td>
                  <td style={{ padding: '12px 16px', color: '#1ed760' }}>No (0 tabs)</td>
                  <td style={{ padding: '12px 16px', color: '#1ed760' }}>No (0 tabs)</td>
                  <td style={{ padding: '12px 16px' }}>Yes (1 tab)</td>
                  <td style={{ padding: '12px 16px' }}>Yes (1 tab)</td>
                </tr>
                <tr style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.05)' }}>
                  <td style={{ padding: '12px 16px', color: '#ffffff', fontWeight: 600 }}>16-Stream Turbo Acceleration</td>
                  <td style={{ padding: '12px 16px', color: '#1ed760' }}>Yes (Full 16x)</td>
                  <td style={{ padding: '12px 16px', color: '#1ed760' }}>Yes (Embedded Engine)</td>
                  <td style={{ padding: '12px 16px', color: '#1ed760' }}>Yes (Full 16x)</td>
                  <td style={{ padding: '12px 16px', color: '#1ed760' }}>Yes (Full 16x)</td>
                </tr>
                <tr style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.05)' }}>
                  <td style={{ padding: '12px 16px', color: '#ffffff', fontWeight: 600 }}>System Integration</td>
                  <td style={{ padding: '12px 16px' }}>Desktop &amp; Start Menu</td>
                  <td style={{ padding: '12px 16px' }}>System Share Sheet</td>
                  <td style={{ padding: '12px 16px' }}>Manual <code>start.bat</code></td>
                  <td style={{ padding: '12px 16px' }}>Terminal <code>start.sh</code></td>
                </tr>
                <tr>
                  <td style={{ padding: '12px 16px', color: '#ffffff', fontWeight: 600 }}>Download Archive Size</td>
                  <td style={{ padding: '12px 16px' }}>1.5 MB</td>
                  <td style={{ padding: '12px 16px' }}>73 MB</td>
                  <td style={{ padding: '12px 16px' }}>1.45 MB</td>
                  <td style={{ padding: '12px 16px' }}>1.45 MB</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        {/* Security & Installation FAQ */}
        <section style={{ marginBottom: '40px' }}>
          <h2 style={{ fontSize: '22px', fontWeight: 700, color: '#ffffff', marginBottom: '16px' }}>
            Frequently Asked Installation Questions
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div style={{ background: '#161616', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: '10px', padding: '18px 20px' }}>
              <h3 style={{ fontSize: '15px', fontWeight: 700, color: '#ffffff', margin: '0 0 6px' }}>
                Why does Windows Defender SmartScreen appear when running the Custom Installer?
              </h3>
              <p style={{ fontSize: '13px', color: 'var(--text-subdued)', margin: 0, lineHeight: 1.6 }}>
                Windows SmartScreen flags all newly released open-source binaries that do not carry expensive commercial EV code-signing certificates. SonicWave is 100% open-source and virus-free. Simply click <strong>"More info"</strong> and then <strong>"Run anyway"</strong>.
              </p>
            </div>

            <div style={{ background: '#161616', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: '10px', padding: '18px 20px' }}>
              <h3 style={{ fontSize: '15px', fontWeight: 700, color: '#ffffff', margin: '0 0 6px' }}>
                How do I install the Android APK without "App not installed as package appears to be invalid"?
              </h3>
              <p style={{ fontSize: '13px', color: 'var(--text-subdued)', margin: 0, lineHeight: 1.6 }}>
                Ensure you delete any older APK files from your Downloads folder and download the official <strong>73 MB release APK</strong> above. Our release APK is verified with full v1 (JAR), v2, and v3 signatures and 4-byte zip alignment, making it fully compatible with Android 8.0 through Android 15.
              </p>
            </div>

            <div style={{ background: '#161616', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: '10px', padding: '18px 20px' }}>
              <h3 style={{ fontSize: '15px', fontWeight: 700, color: '#ffffff', margin: '0 0 6px' }}>
                Do I need to install Python or FFmpeg manually?
              </h3>
              <p style={{ fontSize: '13px', color: 'var(--text-subdued)', margin: 0, lineHeight: 1.6 }}>
                No. SonicWave is self-bootstrapping. On Windows and macOS, the software automatically downloads and verifies the official yt-dlp and FFmpeg binaries on first run. On Android, the Python runtime and FFmpeg binaries are fully embedded directly inside the APK.
              </p>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer style={{ borderTop: '1px solid rgba(255, 255, 255, 0.08)', padding: '32px 20px', background: '#0e0e0e', fontSize: '13px', color: 'var(--text-subdued)', textAlign: 'center' }}>
        <div style={{ maxWidth: '1120px', margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
          <div>&copy; 2026 SonicWave Media Technologies. Licensed under MIT.</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '20px', flexWrap: 'wrap' }}>
            <button
              type="button"
              onClick={() => setIsTipJarOpen(true)}
              style={{ background: 'none', border: 'none', color: '#ffd700', cursor: 'pointer', padding: 0, display: 'inline-flex', alignItems: 'center', gap: '5px', fontWeight: 600 }}
              title="Tip Jar & Support"
            >
              <Coffee size={13} />
              <span>☕ Tip Jar</span>
            </button>
            <button type="button" onClick={() => onNavigate && onNavigate('install', '/install')} style={{ background: 'none', border: 'none', color: 'var(--text-subdued)', cursor: 'pointer', padding: 0 }}>Install Guide</button>
            <button type="button" onClick={() => onNavigate && onNavigate('platforms-guide', '/supported-platforms')} style={{ background: 'none', border: 'none', color: 'var(--text-subdued)', cursor: 'pointer', padding: 0 }}>Platforms</button>
            <button type="button" onClick={() => onNavigate && onNavigate('troubleshooting', '/troubleshooting')} style={{ background: 'none', border: 'none', color: 'var(--text-subdued)', cursor: 'pointer', padding: 0 }}>Troubleshooting</button>
            <button type="button" onClick={() => onNavigate && onNavigate('privacy', '/privacy')} style={{ background: 'none', border: 'none', color: 'var(--text-subdued)', cursor: 'pointer', padding: 0 }}>Privacy</button>
          </div>
        </div>
      </footer>

      {/* Tip Jar Modal */}
      <TipJarModal
        isOpen={isTipJarOpen}
        onClose={() => setIsTipJarOpen(false)}
      />

      {/* Download Success Dialogbox Modal */}
      <DownloadSuccessModal
        isOpen={isDownloadSuccessOpen}
        onClose={() => setIsDownloadSuccessOpen(false)}
        onNavigate={onNavigate}
        downloadType={downloadType}
        onSwitchType={(type) => setDownloadType(type)}
      />
    </div>
  );
}
