import React from 'react';
import { Search, Clipboard, X, ArrowRight, Loader2 } from 'lucide-react';

export default function UrlInput({ url, setUrl, onSubmit, isLoading, onClear }) {
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
        />
        <div className="input-actions">
          {url ? (
            <button
              id="clear-btn"
              type="button"
              className="btn-icon"
              onClick={onClear}
              title="Clear input"
            >
              <X size={16} />
            </button>
          ) : (
            <button
              id="paste-btn"
              type="button"
              className="btn-dark-pill"
              onClick={handlePaste}
              title="Paste from clipboard"
            >
              <Clipboard size={13} />
              <span>PASTE</span>
            </button>
          )}

          <button
            id="fetch-btn"
            type="button"
            className="btn-spotify-green"
            onClick={onSubmit}
            disabled={!url || isLoading}
            style={{ padding: '8px 20px', fontSize: '13px' }}
          >
            {isLoading ? (
              <>
                <Loader2 size={15} className="spinner" />
                <span>FETCHING...</span>
              </>
            ) : (
              <>
                <span>EXPLORE</span>
                <ArrowRight size={15} />
              </>
            )}
          </button>
        </div>
      </div>

      {/* Social Platforms Row */}
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
