import React from 'react';
import { User, Eye, Zap, Film, FileText, Image, Smartphone, Layers, VolumeX } from 'lucide-react';

export default function VideoPreview({ video }) {
  if (!video) return null;

  const isUltraLong = video.isUltraLong || (video.duration && video.duration >= 7200);

  const formatViews = (num) => {
    if (!num) return '0 views';
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M views`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K views`;
    return `${num} views`;
  };

  const getPlatformColor = (platform) => {
    const p = (platform || '').toLowerCase();
    if (p.includes('instagram')) return '#E1306C';
    if (p.includes('youtube')) return '#FF0000';
    if (p.includes('tiktok')) return '#FE2C55';
    if (p.includes('facebook')) return '#1877F2';
    if (p.includes('twitter') || p.includes('x')) return '#1DA1F2';
    if (p.includes('soundcloud')) return '#FF5500';
    return 'var(--spotify-green)';
  };

  const platformColor = getPlatformColor(video.platform);

  return (
    <div className="spotify-video-card" id="video-preview-card">
      <div className="spotify-thumb-box">
        <img
          src={video.thumbnail}
          alt={video.title}
          className="spotify-thumb-img"
          fetchPriority="high"
          decoding="async"
        />
        <div className="spotify-duration-pill">
          {video.isPhoto
            ? (video.isCarousel ? `${video.itemCount || 'Multi'} Photos` : 'Photo')
            : (video.durationFormatted || '0:00')}
        </div>
      </div>

      <div className="spotify-track-meta">
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
          <span style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '1.2px', color: platformColor, textTransform: 'uppercase' }}>
            {video.platform ? `${video.platform}` : 'Social Media Track'}
          </span>

          {video.isCarousel ? (
            <span className="spotify-tag-badge carousel-badge" style={{ borderColor: 'rgba(168, 85, 247, 0.4)', background: 'rgba(168, 85, 247, 0.12)', color: '#c084fc' }}>
              <Layers size={11} />
              Carousel ({video.itemCount || 'Multi'} items)
            </span>
          ) : video.isReel ? (
            <span className="spotify-tag-badge reel-badge" style={{ borderColor: 'rgba(254, 44, 85, 0.4)', background: 'rgba(254, 44, 85, 0.12)', color: '#ff4d6d' }}>
              <Film size={11} />
              {video.isShort ? 'YouTube Short' : 'Reel (9:16)'}
            </span>
          ) : video.isPost ? (
            <span className="spotify-tag-badge post-badge" style={{ borderColor: 'rgba(59, 130, 246, 0.4)', background: 'rgba(59, 130, 246, 0.12)', color: '#60a5fa' }}>
              {video.isPhoto ? <Image size={11} /> : <FileText size={11} />}
              {video.isPhoto ? 'Feed Post (Photo)' : 'Feed Post (Video)'}
            </span>
          ) : null}

          {video.hasAudio === false && (
            <span className="spotify-tag-badge silent-badge" style={{ borderColor: 'rgba(234, 179, 8, 0.4)', background: 'rgba(234, 179, 8, 0.12)', color: '#facc15' }}>
              <VolumeX size={11} />
              Silent Source
            </span>
          )}

          {video.aspectRatio && (
            <span className="spotify-tag-badge aspect-badge" style={{ opacity: 0.85 }}>
              <Smartphone size={10} />
              {video.aspectRatio}
            </span>
          )}

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
            <User size={14} style={{ color: platformColor }} />
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
