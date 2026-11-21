import React, { useState, useEffect } from 'react';
import {
  X,
  Coffee,
  Heart,
  Copy,
  Check,
  ExternalLink,
  Coins,
  ShieldCheck,
  Sparkles
} from 'lucide-react';

// ============================================================================
// CONFIGURABLE DONATION DESTINATIONS & WALLET ADDRESSES
// Replace these with your real addresses or usernames at any time.
// ============================================================================
export const TIP_DESTINATIONS = {
  buyMeACoffee: {
    name: 'Buy Me a Coffee',
    url: 'https://buymeacoffee.com/sonicwave',
    handle: 'sonicwave',
    color: '#FFDD00',
    textColor: '#000000',
    desc: 'Support with a one-time coffee or membership'
  },
  kofi: {
    name: 'Ko-fi',
    url: 'https://ko-fi.com/sonicwave',
    handle: 'sonicwave',
    color: '#FF5E5B',
    textColor: '#FFFFFF',
    desc: '0% platform fee direct donations & tips'
  },
  crypto: [
    {
      id: 'btc',
      name: 'Bitcoin',
      ticker: 'BTC',
      network: 'Native SegWit (Bech32)',
      address: 'bc1qsonicwave497x7kv0089q4w38u7y6z7kmg5q4p3',
      color: '#F7931A'
    },
    {
      id: 'eth',
      name: 'Ethereum / USDT / USDC',
      ticker: 'ETH / EVM',
      network: 'Ethereum Mainnet & Arbitrum (ERC-20)',
      address: '0x71C934B8E19B141c2B66dF302D4439cE98aE0412',
      color: '#627EEA'
    },
    {
      id: 'sol',
      name: 'Solana',
      ticker: 'SOL',
      network: 'Solana SPL Network',
      address: 'SonicWave7v6X8Z1Q9W4M5R2K8P3Y4T6U7J8K9L0N1P2Q',
      color: '#14F195'
    },
    {
      id: 'xmr',
      name: 'Monero',
      ticker: 'XMR',
      network: 'Monero Privacy Network',
      address: '888t2512nRNUSFDz9ZVDDpFuCX4Ch6aqLjNDTnCCas6JMmWBhud5RtdBr8q4CQE6DeUi4PgnrF7i7238u6vDgnW',
      color: '#FF6600'
    }
  ]
};

export default function TipJarModal({ isOpen, onClose }) {
  const [copiedId, setCopiedId] = useState(null);

  // Close modal on Escape key press
  useEffect(() => {
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

  const handleCopy = (id, address) => {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(address);
    } else {
      const textarea = document.createElement('textarea');
      textarea.value = address;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
    }
    setCopiedId(id);
    setTimeout(() => {
      setCopiedId(null);
    }, 2500);
  };

  return (
    <div
      className="cmd-palette-backdrop"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="tipjar-modal-title"
    >
      <div
        className="pricing-modal-window tipjar-modal-window"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="pricing-modal-header" style={{ marginBottom: '18px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
              <span className="hero-pill-badge" style={{ marginBottom: 0, background: 'rgba(255, 221, 0, 0.12)', border: '1px solid rgba(255, 221, 0, 0.3)' }}>
                <Coffee size={12} style={{ color: '#FFDD00' }} />
                <span style={{ color: '#FFDD00', fontWeight: 700 }}>SUPPORT OPEN SOURCE</span>
              </span>
              <span className="badge-tag-small" style={{ backgroundColor: 'rgba(30, 215, 96, 0.18)', color: 'var(--spotify-green)' }}>
                100% FREE FOREVER
              </span>
            </div>
            <h2 id="tipjar-modal-title" className="pricing-title" style={{ margin: '4px 0 2px' }}>
              SonicWave Tip Jar
            </h2>
            <p className="pricing-subtitle" style={{ fontSize: '13px', margin: 0 }}>
              Help keep SonicWave fast, private, and free of annoying popup ads. Every contribution directly funds high-speed server bandwidth, yt-dlp binary maintenance, and engine improvements.
            </p>
          </div>

          <button
            type="button"
            className="btn-icon"
            onClick={onClose}
            title="Close Tip Jar"
            aria-label="Close Tip Jar"
          >
            <X size={20} />
          </button>
        </div>

        {/* 1-Click Coffee & Ko-fi Buttons */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '12px', marginBottom: '22px' }}>
          {/* Buy Me a Coffee */}
          <a
            href={TIP_DESTINATIONS.buyMeACoffee.url}
            target="_blank"
            rel="noopener noreferrer"
            className="tipjar-service-card"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              padding: '14px 16px',
              borderRadius: '10px',
              background: 'linear-gradient(135deg, rgba(255, 221, 0, 0.1) 0%, rgba(24, 24, 24, 0.8) 100%)',
              border: '1px solid rgba(255, 221, 0, 0.3)',
              textDecoration: 'none',
              color: 'inherit',
              transition: 'all 0.2s ease'
            }}
          >
            <div
              style={{
                width: '40px',
                height: '40px',
                borderRadius: '8px',
                background: TIP_DESTINATIONS.buyMeACoffee.color,
                color: TIP_DESTINATIONS.buyMeACoffee.textColor,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0
              }}
            >
              <Coffee size={20} />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ fontSize: '14px', fontWeight: 700, color: '#ffffff' }}>Buy Me a Coffee</span>
                <ExternalLink size={12} style={{ color: 'var(--text-subdued)' }} />
              </div>
              <div style={{ fontSize: '11px', color: 'var(--text-subdued)', marginTop: '2px' }}>
                One-off support or monthly
              </div>
            </div>
          </a>

          {/* Ko-fi */}
          <a
            href={TIP_DESTINATIONS.kofi.url}
            target="_blank"
            rel="noopener noreferrer"
            className="tipjar-service-card"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              padding: '14px 16px',
              borderRadius: '10px',
              background: 'linear-gradient(135deg, rgba(255, 94, 91, 0.1) 0%, rgba(24, 24, 24, 0.8) 100%)',
              border: '1px solid rgba(255, 94, 91, 0.3)',
              textDecoration: 'none',
              color: 'inherit',
              transition: 'all 0.2s ease'
            }}
          >
            <div
              style={{
                width: '40px',
                height: '40px',
                borderRadius: '8px',
                background: TIP_DESTINATIONS.kofi.color,
                color: TIP_DESTINATIONS.kofi.textColor,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0
              }}
            >
              <Heart size={20} fill="#ffffff" />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ fontSize: '14px', fontWeight: 700, color: '#ffffff' }}>Ko-fi Tip</span>
                <ExternalLink size={12} style={{ color: 'var(--text-subdued)' }} />
              </div>
              <div style={{ fontSize: '11px', color: 'var(--text-subdued)', marginTop: '2px' }}>
                0% platform fee tip jar
              </div>
            </div>
          </a>
        </div>

        {/* Crypto Tip Jar Section */}
        <div style={{ borderTop: '1px solid rgba(255, 255, 255, 0.08)', paddingTop: '18px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px', flexWrap: 'wrap', gap: '6px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Coins size={16} style={{ color: 'var(--spotify-green)' }} />
              <h3 style={{ fontSize: '13px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.6px', color: '#ffffff', margin: 0 }}>
                Crypto Tip Addresses
              </h3>
            </div>
            <span style={{ fontSize: '11px', color: 'var(--text-subdued)', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <ShieldCheck size={12} style={{ color: 'var(--spotify-green)' }} />
              Click any address to copy
            </span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {TIP_DESTINATIONS.crypto.map((coin) => {
              const isCopied = copiedId === coin.id;
              return (
                <div
                  key={coin.id}
                  style={{
                    background: '#161616',
                    border: isCopied ? '1px solid var(--spotify-green)' : '1px solid rgba(255, 255, 255, 0.08)',
                    borderRadius: '8px',
                    padding: '10px 14px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '12px',
                    transition: 'all 0.2s ease'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0, flex: 1 }}>
                    <div
                      style={{
                        padding: '4px 8px',
                        borderRadius: '4px',
                        background: 'rgba(255, 255, 255, 0.06)',
                        border: `1px solid ${coin.color}40`,
                        color: coin.color,
                        fontWeight: 800,
                        fontSize: '11px',
                        fontFamily: 'monospace',
                        flexShrink: 0
                      }}
                    >
                      {coin.ticker}
                    </div>
                    <div style={{ minWidth: 0, flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span style={{ fontSize: '12.5px', fontWeight: 600, color: '#ffffff' }}>{coin.name}</span>
                        <span style={{ fontSize: '10.5px', color: 'var(--text-subdued)' }}>({coin.network})</span>
                      </div>
                      <div
                        style={{
                          fontSize: '11px',
                          color: '#a3a3a3',
                          fontFamily: 'monospace',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                          marginTop: '2px'
                        }}
                        title={coin.address}
                      >
                        {coin.address}
                      </div>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleCopy(coin.id, coin.address)}
                    className="cursor-button-secondary"
                    style={{
                      padding: '6px 12px',
                      fontSize: '11.5px',
                      fontWeight: 600,
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '5px',
                      borderRadius: '6px',
                      backgroundColor: isCopied ? 'rgba(30, 215, 96, 0.15)' : 'rgba(255, 255, 255, 0.05)',
                      color: isCopied ? 'var(--spotify-green)' : '#ffffff',
                      borderColor: isCopied ? 'var(--spotify-green)' : 'rgba(255, 255, 255, 0.12)',
                      flexShrink: 0
                    }}
                    title={`Copy ${coin.name} address`}
                  >
                    {isCopied ? (
                      <>
                        <Check size={13} />
                        <span>Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy size={13} />
                        <span>Copy</span>
                      </>
                    )}
                  </button>
                </div>
              );
            })}
          </div>
        </div>

        {/* Modal Footer Note */}
        <div style={{ marginTop: '20px', paddingTop: '14px', borderTop: '1px solid rgba(255, 255, 255, 0.06)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px' }}>
          <div style={{ fontSize: '11.5px', color: 'var(--text-subdued)', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Sparkles size={13} style={{ color: '#ffd700' }} />
            <span>Thank you for keeping independent open-source tools alive!</span>
          </div>

          <button
            type="button"
            className="cursor-button-secondary cursor-btn-sm"
            onClick={onClose}
            style={{ fontSize: '12px', padding: '6px 16px' }}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
