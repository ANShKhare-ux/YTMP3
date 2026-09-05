import React from 'react';
import { History, Play, Download, Trash2, Music } from 'lucide-react';

const API_BASE = import.meta.env.VITE_API_URL || '';

export default function HistorySection({ history, onSelectTrack, onClearHistory }) {
  if (!history || history.length === 0) return null;

  return (
    <div className="spotify-tracklist-section" id="conversion-history-section">
      <div className="tracklist-header-row">
        <h3 className="tracklist-title">
          <History size={20} style={{ color: 'var(--spotify-green)' }} />
          <span>Recent Library Conversions</span>
        </h3>
        {history.length > 0 && (
          <button
            type="button"
            className="btn-dark-pill"
            onClick={onClearHistory}
            title="Clear conversion history"
            style={{ fontSize: '11px', padding: '6px 14px' }}
          >
            <Trash2 size={12} />
            <span>CLEAR ALL</span>
          </button>
        )}
      </div>

      <div className="spotify-table-cols">
        <span>#</span>
        <span>Title</span>
        <span className="track-badge-col">Format</span>
        <span className="track-badge-col">Quality</span>
        <span style={{ textAlign: 'right' }}>Actions</span>
      </div>

      <div className="spotify-history-table">
        {history.map((item, idx) => (
          <div
            key={item.id}
            className="spotify-track-row"
            onClick={() => onSelectTrack(item)}
            title="Click to play in Spotify player"
          >
            <div className="track-index-col">
              <span>{idx + 1}</span>
            </div>

            <div className="track-main-col">
              {item.thumbnail ? (
                <img src={item.thumbnail} alt={item.title} className="track-table-thumb" />
              ) : (
                <div
                  className="track-table-thumb"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: 'var(--bg-pill)'
                  }}
                >
                  <Music size={16} style={{ color: 'var(--spotify-green)' }} />
                </div>
              )}

              <div className="track-table-titles">
                <span className="track-table-title" title={item.title}>
                  {item.title || 'Audio File'}
                </span>
                <span className="track-table-artist">
                  {item.artist || 'YouTube Artist'}
                </span>
              </div>
            </div>

            <div className="track-badge-col">
              <span className="badge-tag-small" style={{ letterSpacing: '0.04em' }}>
                {item.format?.toUpperCase()}
              </span>
            </div>

            <div className="track-badge-col">
              <span style={{ fontSize: '12px', color: 'var(--text-subdued)', fontFamily: 'var(--font-mono)' }}>
                {item.quality}
              </span>
            </div>

            <div className="track-actions-col" onClick={(e) => e.stopPropagation()}>
              <button
                type="button"
                className="btn-icon"
                onClick={() => onSelectTrack(item)}
                title="Play in player"
                style={{ padding: '6px' }}
              >
                <Play size={16} fill="var(--text-white)" />
              </button>

              <a
                href={`${API_BASE}/api/download/${item.id}`}
                download
                className="btn-icon"
                title={`Download ${item.format?.toUpperCase()}`}
                style={{ padding: '6px', textDecoration: 'none' }}
              >
                <Download size={16} style={{ color: 'var(--spotify-green)' }} />
              </a>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
