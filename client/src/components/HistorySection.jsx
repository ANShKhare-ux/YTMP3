import React, { useState, useMemo } from 'react';
import { History, Play, Download, Trash2, Music, RotateCw, AlertTriangle, Search, X, Image as ImageIcon } from 'lucide-react';

const API_BASE = import.meta.env.VITE_API_URL || '';

const HISTORY_FILTERS = [
  { id: 'all', label: 'All' },
  { id: 'audio', label: 'Audio' },
  { id: 'video', label: 'Video' },
  { id: 'photos', label: 'Photos' }
];

function classifyHistoryCategory(item) {
  const fmt = (item.format || '').toLowerCase();
  if (item.isPhoto || ['zip', 'jpg', 'jpeg', 'png', 'webp', 'cover'].includes(fmt)) {
    return 'photos';
  }
  if (fmt === 'mp4') {
    return 'video';
  }
  return 'audio';
}

export default function HistorySection({
  history,
  onSelectTrack,
  onClearHistory,
  onDeleteItem,
  onReconvert
}) {
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');

  const filteredHistory = useMemo(() => {
    if (!history) return [];
    const term = searchQuery.trim().toLowerCase();
    return history.filter((item) => {
      if (typeFilter !== 'all' && classifyHistoryCategory(item) !== typeFilter) {
        return false;
      }
      if (!term) return true;
      return (
        (item.title || '').toLowerCase().includes(term) ||
        (item.artist || '').toLowerCase().includes(term) ||
        (item.format || '').toLowerCase().includes(term) ||
        (item.quality || '').toLowerCase().includes(term)
      );
    });
  }, [history, searchQuery, typeFilter]);

  if (!history || history.length === 0) return null;

  return (
    <div className="spotify-tracklist-section" id="conversion-history-section">
      <div className="tracklist-header-row">
        <h3 className="tracklist-title">
          <History size={20} style={{ color: 'var(--spotify-green)' }} />
          <span>Recent Library Conversions</span>
          <span className="badge-tag-small" style={{ marginLeft: '4px' }}>
            {filteredHistory.length}/{history.length}
          </span>
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

      {/* Search & Category Filter Bar */}
      <div className="history-controls-bar">
        <div className="history-search-box">
          <Search size={14} style={{ color: 'var(--text-subdued)', flexShrink: 0 }} aria-hidden="true" />
          <input
            type="search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search library by title, artist, or format..."
            aria-label="Search recent library conversions"
            className="history-search-input"
          />
          {searchQuery && (
            <button
              type="button"
              className="btn-icon"
              onClick={() => setSearchQuery('')}
              aria-label="Clear search query"
              style={{ padding: 2 }}
            >
              <X size={13} />
            </button>
          )}
        </div>

        <div className="history-filter-pills" role="group" aria-label="Filter history by media type">
          {HISTORY_FILTERS.map((f) => (
            <button
              key={f.id}
              type="button"
              onClick={() => setTypeFilter(f.id)}
              className={`history-filter-pill ${typeFilter === f.id ? 'active' : ''}`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      <div className="spotify-table-cols">
        <span>#</span>
        <span>Title</span>
        <span className="track-badge-col">Format</span>
        <span className="track-badge-col">Quality</span>
        <span style={{ textAlign: 'right' }}>Actions</span>
      </div>

      <div className="spotify-history-table">
        {filteredHistory.length === 0 ? (
          <div style={{ padding: '24px 16px', textAlign: 'center', color: 'var(--text-subdued)', fontSize: '13px' }}>
            No matching conversions in your library.{' '}
            <button
              type="button"
              onClick={() => {
                setSearchQuery('');
                setTypeFilter('all');
              }}
              style={{ background: 'none', border: 'none', color: 'var(--spotify-green)', cursor: 'pointer', fontWeight: 600 }}
            >
              Reset filters
            </button>
          </div>
        ) : (
          filteredHistory.map((item, idx) => {
            const isExpired = item.isAvailable === false;
            const isPhotoEntry = classifyHistoryCategory(item) === 'photos';
            return (
              <div
                key={item.id}
                className={`spotify-track-row ${isExpired ? 'track-expired' : ''}`}
                onClick={() => {
                  if (!isExpired && !isPhotoEntry) {
                    onSelectTrack(item);
                  } else if (onReconvert && item.url) {
                    onReconvert(item.url);
                  }
                }}
                title={
                  isExpired
                    ? (item.url ? 'File expired on local disk. Click to re-convert.' : 'File expired on local disk.')
                    : isPhotoEntry
                      ? 'Photo / ZIP package ready to download'
                      : 'Click to play in SonicWave player'
                }
                style={{ opacity: isExpired ? 0.65 : 1 }}
              >
                <div className="track-index-col">
                  <span>{idx + 1}</span>
                </div>

                <div className="track-main-col">
                  {item.thumbnail ? (
                    <img src={item.thumbnail} alt={item.title} className="track-table-thumb" loading="lazy" decoding="async" />
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
                      {isPhotoEntry ? (
                        <ImageIcon size={16} style={{ color: 'var(--spotify-green)' }} />
                      ) : (
                        <Music size={16} style={{ color: 'var(--spotify-green)' }} />
                      )}
                    </div>
                  )}

                  <div className="track-table-titles">
                    <span className="track-table-title" title={item.title}>
                      {item.title || 'Audio File'}
                    </span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span className="track-table-artist">
                        {item.artist || 'YouTube Artist'}
                      </span>
                      {isExpired && (
                        <span
                          style={{
                            fontSize: '10px',
                            color: 'var(--text-warning)',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 2,
                            fontWeight: 700
                          }}
                        >
                          <AlertTriangle size={10} />
                          EXPIRED
                        </span>
                      )}
                    </div>
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
                  {isExpired ? (
                    item.url && onReconvert && (
                      <button
                        type="button"
                        className="btn-icon"
                        onClick={() => onReconvert(item.url)}
                        title="Re-fetch & Re-convert track"
                        aria-label={`Re-convert ${item.title || 'track'}`}
                        style={{ padding: '6px', color: 'var(--spotify-green)' }}
                      >
                        <RotateCw size={15} />
                      </button>
                    )
                  ) : (
                    <>
                      {!isPhotoEntry && (
                        <button
                          type="button"
                          className="btn-icon"
                          onClick={() => onSelectTrack(item)}
                          title="Play in player"
                          aria-label={`Play ${item.title || 'track'}`}
                          style={{ padding: '6px' }}
                        >
                          <Play size={16} fill="var(--text-white)" />
                        </button>
                      )}

                      <a
                        href={`${API_BASE}/api/download/${item.id}`}
                        download
                        className="btn-icon"
                        title={`Download ${item.format?.toUpperCase()}`}
                        aria-label={`Download ${item.title || 'file'}`}
                        style={{ padding: '6px', textDecoration: 'none' }}
                      >
                        <Download size={16} style={{ color: 'var(--spotify-green)' }} />
                      </a>

                      {item.url && onReconvert && (
                        <button
                          type="button"
                          className="btn-icon"
                          onClick={() => onReconvert(item.url)}
                          title="Re-open / Re-convert source URL"
                          aria-label={`Re-convert ${item.title || 'source'}`}
                          style={{ padding: '6px' }}
                        >
                          <RotateCw size={14} />
                        </button>
                      )}
                    </>
                  )}

                  {onDeleteItem && (
                    <button
                      type="button"
                      className="btn-icon"
                      onClick={() => onDeleteItem(item.id)}
                      title="Remove from history"
                      aria-label={`Remove ${item.title || 'item'} from history`}
                      style={{ padding: '6px', color: 'var(--text-subdued)' }}
                    >
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
