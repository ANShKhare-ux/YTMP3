import React, { useEffect, useRef } from 'react';
import confetti from 'canvas-confetti';
import {
  CheckCircle2,
  Download,
  FolderArchive,
  Terminal,
  Zap,
  ShieldCheck,
  X,
  Sparkles,
  ArrowRight
} from 'lucide-react';

/**
 * Programmatically triggers the download of the Windows zip distribution.
 */
export function triggerZipDownload() {
  const link = document.createElement('a');
  link.href = '/SonicWave-v1.0.0-Windows.zip';
  link.setAttribute('download', 'SonicWave-v1.0.0-Windows.zip');
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
  onNavigate
}) {
  const modalRef = useRef(null);

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
              <span className="cursor-success-kicker">WINDOWS 64-BIT &bull; PORTABLE UTILITY</span>
              <h2 id="download-success-title" className="cursor-success-title">
                Download Started!
              </h2>
              <p className="cursor-success-subtitle">
                SonicWave is downloading. Follow these 3 simple steps to start converting media in seconds:
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
                <span className="cursor-success-filename">SonicWave-v1.0.0-Windows.zip</span>
                <span className="cursor-success-filemeta">1.3 MB &bull; Windows 10 &amp; 11 &bull; SHA-256 Verified</span>
              </div>
            </div>
            <div className="cursor-success-file-badge">
              <span className="cursor-pulse-dot" aria-hidden="true" />
              <span>Downloading</span>
            </div>
          </div>

          {/* 3 Quick Setup Steps */}
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

          {/* Windows Defender SmartScreen Tip */}
          <div className="cursor-success-smartscreen-tip">
            <ShieldCheck size={16} className="cursor-smartscreen-shield" aria-hidden="true" />
            <div className="cursor-smartscreen-text">
              <strong>Windows Defender Notice:</strong> If Windows prompts <em>&quot;Windows protected your PC&quot;</em>, click <strong>More info</strong> &rarr; <strong>Run anyway</strong>. SonicWave is 100% open source with zero telemetry or background daemons.
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
              className="cursor-button-secondary cursor-success-studio-btn"
              onClick={() => {
                onClose();
                if (onNavigate) onNavigate('app', '/#app');
                else window.location.hash = '#app';
              }}
            >
              <Zap size={14} />
              <span>Try Web Studio Now</span>
            </button>
          </div>

          <div className="cursor-success-retry-row">
            <span className="cursor-success-retry-text">
              Download didn&apos;t start?{' '}
              <button
                type="button"
                className="cursor-success-retry-link"
                onClick={() => {
                  triggerZipDownload();
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
