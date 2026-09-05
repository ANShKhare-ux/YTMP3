import React from 'react';
import { User, Eye, Zap, Clock } from 'lucide-react';

export default function VideoPreview({ video }) {
  if (!video) return null;

  const isUltraLong = video.isUltraLong || (video.duration && video.duration >= 7200);

  const formatViews = (num) => {
    if (!num) return '0 views';
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M views`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K views`;
    return `${num} views`;
  };

  return (
    <div className="spotify-video-card" id="video-preview-card">
      <div className="spotify-thumb-box">
        <img
          src={video.thumbnail}
          alt={video.title}
          className="spotify-thumb-img"
          loading="lazy"
        />
        <div className="spotify-duration-pill">
          {video.durationFormatted || '0:00'}
        </div>
      </div>

      <div className="spotify-track-meta">
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <span style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '1.2px', color: 'var(--spotify-green)', textTransform: 'uppercase' }}>
            {video.platform ? `${video.platform} Media` : 'Social Media Track'}
          </span>
          {isUltraLong && (
            <span className="spotify-tag-badge">
              <Zap size={11} />
              100H+ Engine Ready
            </span>
          )}
        </div>

        <h2 className="spotify-track-title" title={video.title}>
          {video.title}
        </h2>

        <div className="spotify-track-details">
          <div className="spotify-artist-tag">
            <User size={14} style={{ color: 'var(--spotify-green)' }} />
            <span>{video.uploader}</span>
          </div>

          {video.viewCount ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <Eye size={14} />
              <span>{formatViews(video.viewCount)}</span>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
