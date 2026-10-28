import React, { useState } from 'react';
import { useDocumentMetadata } from './legal/useDocumentMetadata';
import DownloadSuccessModal, { triggerZipDownload } from './DownloadSuccessModal';
import {
  Home,
  Zap,
  ArrowLeft,
  ArrowRight,
  BookOpen,
  HelpCircle,
  Cpu,
  ShieldCheck,
  ExternalLink,
  Sun,
  Moon,
  FileQuestion,
  Download
} from 'lucide-react';

function CursorBrandLogo({ size = 20, className = '' }) {
  return (
    <div
      className={`cursor-brand-logo ${className}`}
      style={{ width: size, height: size }}
      aria-hidden="true"
    >
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <rect x="2" y="2" width="20" height="20" rx="5" fill="#1ed760" fillOpacity="0.15" stroke="#1ed760" strokeWidth="1.5" />
        <rect x="6" y="8" width="2" height="8" rx="1" fill="#1ed760" />
        <rect x="10" y="5" width="2" height="14" rx="1" fill="#1ed760" />
        <rect x="14" y="9" width="2" height="6" rx="1" fill="#1ed760" />
        <rect x="18" y="11" width="2" height="2" rx="1" fill="#1ed760" />
      </svg>
    </div>
  );
}

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

const DESTINATION_CARDS = [
  {
    title: 'Download Windows Package',
    desc: 'Get SonicWave v1.0.0 (1.3 MB portable zip) with 1-click start.bat launcher and zero telemetry.',
    href: '/install',
    view: 'install',
    icon: Download,
    badge: 'Desktop'
  },
  {
    title: 'Installation Guide',
    desc: 'Step-by-step setup guide for the Windows 10 & 11 portable desktop edition.',
    href: '/install',
    view: 'install',
    icon: BookOpen,
    badge: 'Desktop'
  },
  {
    title: 'Supported Platforms',
    desc: 'Compatibility matrix for YouTube, Instagram, TikTok, Twitter/X, SoundCloud & 1000+ sites.',
    href: '/supported-platforms',
    view: 'platforms-guide',
    icon: Cpu,
    badge: 'Specs'
  },
  {
    title: 'Troubleshooting & FAQ',
    desc: 'Diagnostic guides for bot verification, network timeouts, and SmartScreen alerts.',
    href: '/troubleshooting',
    view: 'troubleshooting',
    icon: HelpCircle,
    badge: 'Help'
  },
  {
    title: 'Privacy Policy',
    desc: 'Zero telemetry, no server retention, and client-first privacy architecture.',
    href: '/privacy',
    view: 'privacy',
    icon: ShieldCheck,
    badge: 'Security'
  },
  {
    title: 'Contact & Support',
    desc: 'Get in touch with the development team or submit GitHub issues for assistance.',
    href: '/contact',
    view: 'contact',
    icon: FileQuestion,
    badge: 'Support'
  }
];

export default function NotFound({ onNavigate }) {
  const [isDownloadSuccessOpen, setIsDownloadSuccessOpen] = useState(false);
  const [theme, setTheme] = useState(() => {
    try {
      return localStorage.getItem('sonicwave_landing_theme') || 'dark';
    } catch {
      return 'dark';
    }
  });

  const toggleTheme = () => {
    setTheme((prev) => {
      const next = prev === 'dark' ? 'light' : 'dark';
      try {
        localStorage.setItem('sonicwave_landing_theme', next);
      } catch {}
      return next;
    });
  };

  useDocumentMetadata({
    title: '404: Page Not Found — SonicWave',
    description: 'The requested page or media frequency could not be found. Return to the SonicWave homepage or launch the converter studio.',
    canonical: 'https://ytmp-3-five.vercel.app/404',
    noindex: true
  });

  const handleLinkClick = (e, path, view) => {
    if (e) e.preventDefault();
    if (onNavigate) {
      onNavigate(view, path);
    } else {
      window.location.href = path;
    }
  };

  const handleDownload = (e) => {
    if (e && e.preventDefault) e.preventDefault();
    triggerZipDownload();
    setIsDownloadSuccessOpen(true);
  };

  return (
    <div className={`cursor-canvas-root legal-shell ${theme === 'light' ? 'light-mode' : ''}`} data-theme={theme}>
      {/* Top Navigation */}
      <header className="cursor-top-nav" role="banner">
        <div className="cursor-nav-container">
          <a
            href="/"
            className="cursor-nav-brand"
            onClick={(e) => handleLinkClick(e, '/', 'landing')}
            aria-label="SonicWave Home"
          >
            <CursorBrandLogo size={24} />
            <span className="cursor-brand-title">SonicWave</span>
            <span className="cursor-nav-version-badge">404</span>
          </a>

          <nav className="cursor-nav-links" aria-label="Quick Navigation">
            <a href="/" className="cursor-nav-link" onClick={(e) => handleLinkClick(e, '/', 'landing')}>Home</a>
            <a href="/install" className="cursor-nav-link" onClick={(e) => handleLinkClick(e, '/install', 'install')}>Docs</a>
            <a href="/supported-platforms" className="cursor-nav-link" onClick={(e) => handleLinkClick(e, '/supported-platforms', 'platforms-guide')}>Platforms</a>
            <a href="/contact" className="cursor-nav-link" onClick={(e) => handleLinkClick(e, '/contact', 'contact')}>Support</a>
          </nav>

          <div className="cursor-nav-actions">
            <button
              type="button"
              className="cursor-button-secondary cursor-theme-toggle"
              onClick={toggleTheme}
              aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
              title={theme === 'dark' ? 'Light mode' : 'Dark mode'}
            >
              {theme === 'dark' ? <Sun size={15} /> : <Moon size={15} />}
            </button>
            <button
              type="button"
              className="cursor-button-primary cursor-nav-download-btn"
              onClick={handleDownload}
            >
              <WindowsIcon size={14} />
              <span>Download .zip</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main 404 Hero */}
      <main className="not-found-main" id="main-content">
        <div className="not-found-hero">
          {/* Status Badge */}
          <div className="not-found-badge">
            <span className="not-found-dot" aria-hidden="true" />
            <span>HTTP 404 &bull; FREQUENCY UNRESOLVED</span>
          </div>

          {/* Decorative Waveform */}
          <div className="not-found-waveform" aria-hidden="true">
            <span className="nf-bar nf-bar-1" />
            <span className="nf-bar nf-bar-2" />
            <span className="nf-bar nf-bar-3" />
            <span className="nf-bar nf-bar-4" />
            <span className="nf-bar nf-bar-5" />
          </div>

          {/* Large Typographic 404 */}
          <h1 className="not-found-code">404</h1>

          <h2 className="not-found-title">
            Audio Frequency Lost in Static
          </h2>

          <p className="not-found-desc">
            The page, route, or resource you are looking for does not exist, has been relocated, or is temporarily out of broadcast range. The converter engine is running smoothly.
          </p>

          {/* Action Buttons */}
          <div className="not-found-actions">
            <button
              type="button"
              className="cursor-button-primary cursor-btn-lg not-found-btn"
              onClick={(e) => handleLinkClick(e, '/', 'landing')}
            >
              <Home size={16} />
              <span>Return to Homepage</span>
            </button>

            <button
              type="button"
              className="cursor-button-secondary cursor-btn-lg not-found-btn"
              onClick={(e) => handleLinkClick(e, '/install', 'install')}
            >
              <BookOpen size={16} />
              <span>Installation Guide</span>
            </button>

            <button
              type="button"
              className="cursor-button-ghost cursor-btn-lg not-found-back-btn"
              onClick={() => window.history.back()}
            >
              <ArrowLeft size={16} />
              <span>Go Back</span>
            </button>
          </div>
        </div>

        {/* Directory of Suggested Destinations */}
        <section className="not-found-directory" aria-label="Suggested Destinations">
          <div className="not-found-directory-header">
            <h3 className="not-found-directory-title">Popular Destinations</h3>
            <p className="not-found-directory-sub">Find what you were looking for across SonicWave:</p>
          </div>

          <div className="not-found-grid">
            {DESTINATION_CARDS.map((card) => {
              const IconComponent = card.icon;
              return (
                <a
                  key={card.title}
                  href={card.href}
                  className="not-found-card"
                  onClick={(e) => handleLinkClick(e, card.href, card.view)}
                >
                  <div className="not-found-card-top">
                    <div className="not-found-card-icon">
                      <IconComponent size={18} />
                    </div>
                    <span className="not-found-card-badge">{card.badge}</span>
                  </div>
                  <h4 className="not-found-card-title">{card.title}</h4>
                  <p className="not-found-card-desc">{card.desc}</p>
                  <div className="not-found-card-footer">
                    <span>Navigate</span>
                    <ArrowRight size={13} className="not-found-arrow" />
                  </div>
                </a>
              );
            })}
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="legal-footer">
        <div className="legal-footer-container">
          <div className="legal-footer-top">
            <div className="legal-footer-brand">
              <CursorBrandLogo size={20} />
              <span className="legal-footer-name">SonicWave</span>
            </div>
            <div className="legal-footer-nav" aria-label="Footer Navigation">
              <a href="/" onClick={(e) => handleLinkClick(e, '/', 'landing')}>Home</a>
              <a href="/install" onClick={(e) => handleLinkClick(e, '/install', 'install')}>Install Guide</a>
              <a href="/supported-platforms" onClick={(e) => handleLinkClick(e, '/supported-platforms', 'platforms-guide')}>Platforms &amp; Formats</a>
              <a href="/troubleshooting" onClick={(e) => handleLinkClick(e, '/troubleshooting', 'troubleshooting')}>Troubleshooting</a>
              <a href="/privacy" onClick={(e) => handleLinkClick(e, '/privacy', 'privacy')}>Privacy Policy</a>
              <a href="/terms" onClick={(e) => handleLinkClick(e, '/terms', 'terms')}>Terms</a>
              <a href="/contact" onClick={(e) => handleLinkClick(e, '/contact', 'contact')}>Contact</a>
              <a
                href="https://github.com/ANShKhare-ux/YTMP3"
                target="_blank"
                rel="noopener noreferrer"
                className="legal-external-link"
              >
                GitHub <ExternalLink size={11} aria-hidden="true" />
              </a>
            </div>
          </div>
          <div className="legal-footer-bottom">
            <span>&copy; {new Date().getFullYear()} SonicWave Contributors. 404 Error Handler &bull; Open Source Media Utility.</span>
            <span>MIT License.</span>
          </div>
        </div>
      </footer>

      {/* SaaS Download Success Dialogbox */}
      <DownloadSuccessModal
        isOpen={isDownloadSuccessOpen}
        onClose={() => setIsDownloadSuccessOpen(false)}
        onNavigate={onNavigate}
      />
    </div>
  );
}
