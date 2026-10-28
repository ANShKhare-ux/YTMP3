import React, { useState, useEffect } from 'react';
import { trackAppDownload } from '../../utils/analytics';
import {
  ShieldCheck,
  FileText,
  Scale,
  HelpCircle,
  ArrowLeft,
  Sun,
  Moon,
  ExternalLink,
  ChevronRight,
  Download,
  CheckCircle2
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

function CursorBrandLogo({ size = 26 }) {
  return (
    <div className="cursor-brand-logo" style={{ width: size, height: size }}>
      <svg viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" width={size} height={size}>
        <rect width="32" height="32" rx="8" fill="#0f1011" stroke="#23252a" strokeWidth="1" />
        <rect x="7" y="13" width="2" height="6" rx="1" fill="#5e6ad2" opacity="0.6" />
        <rect x="11" y="9" width="2" height="14" rx="1" fill="#5e6ad2" opacity="0.8" />
        <rect x="15" y="6" width="2" height="20" rx="1" fill="#828fff" />
        <rect x="19" y="10" width="2" height="12" rx="1" fill="#5e6ad2" opacity="0.8" />
        <rect x="23" y="14" width="2" height="4" rx="1" fill="#5e6ad2" opacity="0.6" />
      </svg>
    </div>
  );
}

const LEGAL_TABS = [
  { id: 'privacy', label: 'Privacy Policy', path: '/privacy', icon: ShieldCheck },
  { id: 'terms', label: 'Terms of Use', path: '/terms', icon: FileText },
  { id: 'copyright', label: 'Copyright & Abuse', path: '/copyright-acceptable-use', icon: Scale },
  { id: 'contact', label: 'Contact & Support', path: '/contact', icon: HelpCircle },
];

export default function LegalLayout({
  activeTab,
  onNavigate,
  children
}) {
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

  const handleLinkClick = (e, path, view) => {
    e.preventDefault();
    if (onNavigate) {
      onNavigate(view, path);
    } else {
      window.location.href = path;
    }
  };

  const handleDownload = () => {
    trackAppDownload({ source: 'legal_header' });
    window.location.href = '/SonicWave-v1.0.0-Windows.zip';
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
            <span className="cursor-nav-version-badge">Legal</span>
          </a>

          <nav className="cursor-nav-links" aria-label="Legal Navigation">
            <a
              href="/"
              className="cursor-nav-link"
              onClick={(e) => handleLinkClick(e, '/', 'landing')}
            >
              <ArrowLeft size={13} style={{ marginRight: 4 }} aria-hidden="true" />
              Back to Home
            </a>
          </nav>

          <div className="cursor-nav-actions">
            <button
              type="button"
              className="cursor-button-secondary cursor-nav-theme-btn"
              onClick={toggleTheme}
              title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
              aria-label={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            >
              {theme === 'dark' ? <Sun size={14} aria-hidden="true" /> : <Moon size={14} aria-hidden="true" />}
            </button>

            <button
              type="button"
              className="cursor-button-primary cursor-nav-download-btn"
              onClick={handleDownload}
              aria-label="Download SonicWave for Windows"
            >
              <WindowsIcon size={14} />
              <span className="cursor-nav-download-text">Download (.zip)</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Legal Content Container */}
      <main id="main-content" tabIndex={-1} className="legal-main" role="main">
        <div className="legal-container">
          {/* Sub-Navigation Tabs */}
          <nav className="legal-tabs-bar" aria-label="Legal document tabs">
            {LEGAL_TABS.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <a
                  key={tab.id}
                  href={tab.path}
                  className={`legal-tab-item ${isActive ? 'active' : ''}`}
                  onClick={(e) => handleLinkClick(e, tab.path, tab.id)}
                  aria-current={isActive ? 'page' : undefined}
                >
                  <Icon size={14} aria-hidden="true" />
                  <span>{tab.label}</span>
                </a>
              );
            })}
          </nav>

          {/* Page Body */}
          <article className="legal-article">
            {children}
          </article>

          {/* Quick Cross-Navigation Cards */}
          <div className="legal-crossnav-grid">
            {LEGAL_TABS.filter((t) => t.id !== activeTab).map((t) => {
              const Icon = t.icon;
              return (
                <a
                  key={t.id}
                  href={t.path}
                  className="legal-crossnav-card"
                  onClick={(e) => handleLinkClick(e, t.path, t.id)}
                >
                  <div className="legal-crossnav-icon-wrap">
                    <Icon size={16} />
                  </div>
                  <div>
                    <h4 className="legal-crossnav-title">{t.label}</h4>
                    <span className="legal-crossnav-desc">View official policy &rarr;</span>
                  </div>
                </a>
              );
            })}
          </div>
        </div>
      </main>

      {/* Dedicated Legal Footer */}
      <footer className="legal-footer" role="contentinfo">
        <div className="legal-footer-container">
          <div className="legal-footer-top">
            <div className="legal-footer-brand">
              <strong>SonicWave Media Converter</strong>
              <p>Windows 64-bit Native Utility &bull; MIT Licensed Open Source</p>
            </div>
            <div className="legal-footer-links">
              <a href="/" onClick={(e) => handleLinkClick(e, '/', 'landing')}>Home</a>
              <a href="/install" onClick={(e) => handleLinkClick(e, '/install', 'install')}>Installation</a>
              <a href="/supported-platforms" onClick={(e) => handleLinkClick(e, '/supported-platforms', 'platforms-guide')}>Platforms &amp; Formats</a>
              <a href="/troubleshooting" onClick={(e) => handleLinkClick(e, '/troubleshooting', 'troubleshooting')}>Troubleshooting</a>
              <a href="/privacy" onClick={(e) => handleLinkClick(e, '/privacy', 'privacy')}>Privacy Policy</a>
              <a href="/terms" onClick={(e) => handleLinkClick(e, '/terms', 'terms')}>Terms of Use</a>
              <a href="/copyright-acceptable-use" onClick={(e) => handleLinkClick(e, '/copyright-acceptable-use', 'copyright')}>Copyright &amp; Abuse</a>
              <a href="/contact" onClick={(e) => handleLinkClick(e, '/contact', 'contact')}>Contact &amp; Support</a>
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
            <span>&copy; {new Date().getFullYear()} SonicWave Contributors. All rights reserved.</span>
            <span>Released under the terms of the MIT License.</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
