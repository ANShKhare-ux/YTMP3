import React from 'react';
import { Search, Clipboard, X, ArrowRight, Loader2, Command, Sparkles } from 'lucide-react';

export default function UrlInput({
  url,
  setUrl,
  onSubmit,
  isLoading,
  onClear,
  onOpenCommandPalette
}) {
  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text) {
        setUrl(text.trim());
      }
    } catch (err) {
      console.warn('Clipboard read failed:', err);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && url && !isLoading) {
      onSubmit();
    }
  };

  const sampleLinks = [
    { label: '🎵 Lofi Chill Beats', url: 'https://www.youtube.com/watch?v=jfKfPfyJRdk' },
    { label: '🎧 Synthwave Beat', url: 'https://www.youtube.com/watch?v=5qap5aO4i9A' }
  ];

  const handleSelectSample = (sampleUrl) => {
    setUrl(sampleUrl);
  };

  return (
    <div className="search-wrapper">
      <div className="input-container">
        <div className="input-icon">
          <Search size={18} />
        </div>
        <input
          id="yt-url-input"
          type="text"
          className="search-input"
          placeholder="Paste any link from YouTube, Instagram, TikTok, Twitter/X, Facebook, SoundCloud, Reddit..."
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          onKeyDown={handleKeyDown}
          autoComplete="off"
          spellCheck="false"
          aria-label="Media URL from YouTube, Instagram, TikTok, or other supported platforms"
        />
        <div className="input-actions">
          {onOpenCommandPalette && (
            <button
              type="button"
              className="btn-dark-pill"
              onClick={onOpenCommandPalette}
              title="Open Command Palette (⌘K / Ctrl+K)"
              aria-label="Open Command Palette"
              style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '11px', padding: '6px 10px' }}
            >
              <Command size={11} aria-hidden="true" />
              <span>K</span>
            </button>
          )}

          {url ? (
            <button
              id="clear-btn"
              type="button"
              className="btn-icon"
              onClick={onClear}
              title="Clear input"
              aria-label="Clear media URL input"
            >
              <X size={16} aria-hidden="true" />
            </button>
          ) : (
            <button
              id="paste-btn"
              type="button"
              className="btn-dark-pill"
              onClick={handlePaste}
              title="Paste from clipboard"
              aria-label="Paste URL from clipboard"
            >
              <Clipboard size={13} aria-hidden="true" />
              <span>Paste</span>
            </button>
          )}

          <button
            id="fetch-btn"
            type="button"
            className="btn-spotify-green"
            onClick={onSubmit}
            disabled={!url || isLoading}
            style={{ padding: '8px 20px', fontSize: '13px' }}
            aria-label="Fetch media details and options"
          >
            {isLoading ? (
              <>
                <Loader2 size={15} className="spinner" aria-hidden="true" />
                <span>Fetching...</span>
              </>
            ) : (
              <>
                <span>Fetch media</span>
                <ArrowRight size={15} aria-hidden="true" />
              </>
            )}
          </button>
        </div>
      </div>

      {/* Onboarding Interactive Sample Links (When empty) */}
      {!url && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', padding: '2px 4px' }}>
          <span style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
            <Sparkles size={11} style={{ color: 'var(--spotify-green)' }} />
            <span>Try quick sample:</span>
          </span>
          {sampleLinks.map((s) => (
            <button
              key={s.label}
              type="button"
              onClick={() => handleSelectSample(s.url)}
              style={{
                background: 'rgba(255, 255, 255, 0.04)',
                border: '1px dashed rgba(255, 255, 255, 0.15)',
                borderRadius: 'var(--radius-pill)',
                padding: '3px 10px',
                color: 'var(--text-subdued)',
                fontSize: '11px',
                cursor: 'pointer',
                transition: 'all 0.18s var(--ease-hover)'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = 'var(--spotify-green)';
                e.currentTarget.style.color = '#ffffff';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.15)';
                e.currentTarget.style.color = 'var(--text-subdued)';
              }}
            >
              {s.label}
            </button>
          ))}
        </div>
      )}

      {/* Supported Social Platforms Row */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', padding: '0 4px', marginTop: '2px' }}>
        <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.8px' }}>
          Supported:
        </span>
        {['YouTube', 'Instagram', 'TikTok', 'Twitter / X', 'Facebook', 'SoundCloud', 'Reddit', 'Twitch', 'Vimeo', '1000+ sites'].map((app) => (
          <span
            key={app}
            style={{
              fontSize: '11px',
              padding: '2px 8px',
              borderRadius: '9999px',
              backgroundColor: 'rgba(255, 255, 255, 0.05)',
              color: 'var(--text-subdued)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              fontWeight: 500,
              userSelect: 'none'
            }}
          >
            {app}
          </span>
        ))}
      </div>
    </div>
  );
}

