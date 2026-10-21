import React, { useState } from 'react';
import {
  X,
  Check,
  Zap,
  Sparkles,
  ShieldCheck,
  Crown,
  HardDrive,
  Cpu,
  Layers,
  ArrowRight
} from 'lucide-react';

export default function PricingModal({ isOpen, onClose }) {
  const [billingPeriod, setBillingPeriod] = useState('annual'); // 'monthly' | 'annual'

  // Close modal on Escape key press
  React.useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="cmd-palette-backdrop"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="SonicWave Edition Plans and Capabilities"
    >
      <div
        className="pricing-modal-window"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="pricing-modal-header">
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span className="hero-pill-badge" style={{ marginBottom: 0 }}>
                <Crown size={12} style={{ color: '#ffd700' }} />
                <span>Enterprise Engine Tier</span>
              </span>
              <span className="badge-tag-small" style={{ backgroundColor: 'rgba(30, 215, 96, 0.2)', color: 'var(--spotify-green)' }}>
                LOCAL LICENSE: ACTIVE
              </span>
            </div>
            <h2 className="pricing-title">SonicWave Windows Edition</h2>
            <p className="pricing-subtitle">
              Transparent feature comparison: Standard cloud web converters vs. your unlocked multi-threaded local engine.
            </p>
          </div>

          <button
            type="button"
            className="btn-icon"
            onClick={onClose}
            title="Close modal"
            aria-label="Close modal"
          >
            <X size={20} />
          </button>
        </div>

        {/* Billing / Cadence Toggle */}
        <div className="pricing-toggle-container">
          <div className="pricing-toggle-pill">
            <button
              type="button"
              className={`pricing-toggle-btn ${billingPeriod === 'monthly' ? 'active' : ''}`}
              onClick={() => setBillingPeriod('monthly')}
            >
              Cloud Monthly
            </button>
            <button
              type="button"
              className={`pricing-toggle-btn ${billingPeriod === 'annual' ? 'active' : ''}`}
              onClick={() => setBillingPeriod('annual')}
            >
              <span>Local Self-Host</span>
              <span className="discount-pill">100% FREE</span>
            </button>
          </div>
        </div>

        {/* Pricing Cards Grid */}
        <div className="pricing-cards-grid">
          {/* Card 1: Standard Web Converters */}
          <div className="pricing-card standard-tier">
            <div className="pricing-card-top">
              <span className="tier-name">Typical Web Converters</span>
              <div className="tier-price-box">
                <span className="tier-currency">$</span>
                <span className="tier-amount">0</span>
                <span className="tier-period">/mo with ads</span>
              </div>
              <p className="tier-summary">
                Generic browser tools with popups, rate limits, and slow single-thread downloads.
              </p>
            </div>

            <div className="tier-divider" />

            <ul className="tier-feature-list">
              <li className="tier-feature muted">
                <X size={15} style={{ color: 'var(--text-negative)', flexShrink: 0 }} />
                <span>128 kbps audio compression only</span>
              </li>
              <li className="tier-feature muted">
                <X size={15} style={{ color: 'var(--text-negative)', flexShrink: 0 }} />
                <span>Full CPU re-encoding lag (slow)</span>
              </li>
              <li className="tier-feature muted">
                <X size={15} style={{ color: 'var(--text-negative)', flexShrink: 0 }} />
                <span>No embedded ID3 album cover art</span>
              </li>
              <li className="tier-feature muted">
                <X size={15} style={{ color: 'var(--text-negative)', flexShrink: 0 }} />
                <span>Single thread (breaks on &gt;10min clips)</span>
              </li>
              <li className="tier-feature muted">
                <X size={15} style={{ color: 'var(--text-negative)', flexShrink: 0 }} />
                <span>No in-browser seeking or playback player</span>
              </li>
            </ul>

            <button
              type="button"
              className="btn-dark-pill"
              disabled
              style={{ width: '100%', marginTop: 'auto', justifyContent: 'center', opacity: 0.5 }}
            >
              Standard Tier
            </button>
          </div>

          {/* Card 2: SonicWave Windows Pro (Active) */}
          <div className="pricing-card pro-tier">
            <div className="pricing-pro-badge">
              <Sparkles size={12} />
              <span>CURRENT LOCAL ENGINE</span>
            </div>

            <div className="pricing-card-top">
              <span className="tier-name" style={{ color: 'var(--spotify-green)' }}>SonicWave Windows Pro</span>
              <div className="tier-price-box">
                <span className="tier-amount" style={{ fontSize: '32px' }}>UNLOCKED</span>
                <span className="tier-period">Lifetime Local</span>
              </div>
              <p className="tier-summary">
                16-stream accelerated engine running directly on your hardware with zero tracking.
              </p>
            </div>

            <div className="tier-divider" />

            <ul className="tier-feature-list">
              <li className="tier-feature highlight">
                <Check size={15} style={{ color: 'var(--spotify-green)', flexShrink: 0 }} />
                <span><strong>Studio 320 kbps MP3 & 1080p FHD MP4</strong></span>
              </li>
              <li className="tier-feature highlight">
                <Check size={15} style={{ color: 'var(--spotify-green)', flexShrink: 0 }} />
                <span><strong>16x Concurrent Parallel Streams (-N 16)</strong></span>
              </li>
              <li className="tier-feature">
                <Check size={15} style={{ color: 'var(--spotify-green)', flexShrink: 0 }} />
                <span>Direct stream extraction for long sets &amp; mixes (Zero transcoding)</span>
              </li>
              <li className="tier-feature">
                <Check size={15} style={{ color: 'var(--spotify-green)', flexShrink: 0 }} />
                <span>Embedded high-resolution ID3 Album Cover Art</span>
              </li>
              <li className="tier-feature">
                <Check size={15} style={{ color: 'var(--spotify-green)', flexShrink: 0 }} />
                <span>Docked Spotify audio/video player with seeking</span>
              </li>
              <li className="tier-feature">
                <Check size={15} style={{ color: 'var(--spotify-green)', flexShrink: 0 }} />
                <span>Command Palette (⌘K) &amp; desktop hotkeys</span>
              </li>
            </ul>

            <button
              type="button"
              className="btn-spotify-green"
              onClick={onClose}
              style={{ width: '100%', marginTop: 'auto', justifyContent: 'center' }}
            >
              <span>Continue with Windows Edition</span>
              <ArrowRight size={15} />
            </button>
          </div>
        </div>

        {/* Footer Guarantee */}
        <div className="pricing-modal-footer">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <ShieldCheck size={16} style={{ color: 'var(--spotify-green)' }} />
            <span>100% Private, Localhost Native &amp; Ad-Free</span>
          </div>
          <span>Powered by yt-dlp &amp; FFmpeg 6.1</span>
        </div>
      </div>
    </div>
  );
}
