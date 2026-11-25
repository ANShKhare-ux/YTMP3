import React, { useState, useEffect } from 'react';
import {
  User,
  Eye,
  Zap,
  Film,
  FileText,
  Image,
  Smartphone,
  Layers,
  VolumeX,
  ChevronLeft,
  ChevronRight,
  Download,
  Maximize2,
  X,
  FolderArchive,
  Sparkles,
  ListMusic
} from 'lucide-react';

export default function VideoPreview({
  video,
  activeSlideIndex = 0,
  setActiveSlideIndex,
  onDownloadSlide,
  onDownloadAll,
  isConverting = false,
  selectedPlaylistIndices = [],
  onTogglePlaylistItem,
  onToggleAllPlaylistItems,
  onLoadPlaylist
}) {
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);

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

  // Carousel photo calculations
  const photos = Array.isArray(video.photos) && video.photos.length > 0 ? video.photos : [];
  const isMultiPhoto = video.isCarousel && photos.length > 1;
  const safeIdx = activeSlideIndex >= 0 && activeSlideIndex < photos.length ? activeSlideIndex : 0;
  const currentPhoto = isMultiPhoto ? photos[safeIdx] : null;
  const currentPhotoUrl = currentPhoto?.url || video.thumbnail;

  const handlePrevSlide = (e) => {
    e?.stopPropagation();
    if (setActiveSlideIndex && safeIdx > 0) {
      setActiveSlideIndex(safeIdx - 1);
    }
  };

  const handleNextSlide = (e) => {
    e?.stopPropagation();
    if (setActiveSlideIndex && safeIdx < photos.length - 1) {
      setActiveSlideIndex(safeIdx + 1);
    }
  };

  // Keyboard navigation for Lightbox
  useEffect(() => {
    if (!isLightboxOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === 'ArrowLeft') handlePrevSlide();
      else if (e.key === 'ArrowRight') handleNextSlide();
      else if (e.key === 'Escape') setIsLightboxOpen(false);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isLightboxOpen, safeIdx, photos.length]);

  return (
    <div className="spotify-video-card" id="video-preview-card">
      {/* Thumbnail Box / Interactive Carousel Slide */}
      <div className="spotify-thumb-box carousel-thumb-container">
        <img
          src={currentPhotoUrl}
          alt={video.title}
          className="spotify-thumb-img"
          fetchPriority="high"
          decoding="async"
          onClick={() => isMultiPhoto && setIsLightboxOpen(true)}
          style={{ cursor: isMultiPhoto ? 'pointer' : 'default' }}
        />

        {/* Carousel Navigation Arrows Overlaid on Preview */}
        {isMultiPhoto && (
          <>
            <button
              type="button"
              className="carousel-arrow-btn prev"
              onClick={handlePrevSlide}
              disabled={safeIdx === 0}
              aria-label="Previous Slide"
              title="Previous Slide"
            >
              <ChevronLeft size={16} />
            </button>
            <button
              type="button"
              className="carousel-arrow-btn next"
              onClick={handleNextSlide}
              disabled={safeIdx === photos.length - 1}
              aria-label="Next Slide"
              title="Next Slide"
            >
              <ChevronRight size={16} />
            </button>

            {/* Expand / Lightbox Button */}
            <button
              type="button"
              className="carousel-expand-btn"
              onClick={() => setIsLightboxOpen(true)}
              title="Expand Carousel Gallery (Fullscreen View)"
              aria-label="Expand Gallery"
            >
              <Maximize2 size={12} />
              <span>Full View</span>
            </button>
          </>
        )}

        {/* Duration / Carousel Slide Counter Pill */}
        <div className="spotify-duration-pill">
          {video.isPhoto
            ? (isMultiPhoto ? `📸 Slide ${safeIdx + 1} of ${photos.length}` : 'Photo')
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
              Carousel ({photos.length || video.itemCount || 'Multi'} photos)
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

          {video.isPlaylist && (
            <span className="spotify-tag-badge" style={{ borderColor: 'rgba(30, 215, 96, 0.45)', background: 'rgba(30, 215, 96, 0.12)', color: 'var(--spotify-green)' }}>
              <ListMusic size={11} />
              Playlist ({video.playlistEntries?.length || video.itemCount} tracks)
            </span>
          )}

          {!video.isPlaylist && video.hasPlaylistHint && onLoadPlaylist && (
            <button
              type="button"
              onClick={onLoadPlaylist}
              disabled={isConverting}
              className="btn-dark-pill"
              style={{ fontSize: '11px', padding: '4px 10px', borderColor: 'rgba(30, 215, 96, 0.45)', color: 'var(--spotify-green)' }}
              title="Detected a playlist URL — load all tracks to select & batch queue"
            >
              <ListMusic size={12} />
              <span>Load Full Playlist</span>
            </button>
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

        {/* Playlist Track Checklist */}
        {video.isPlaylist && Array.isArray(video.playlistEntries) && video.playlistEntries.length > 0 && (
          <div className="playlist-checklist-box">
            <div className="playlist-checklist-header">
              <span>
                Selected <strong>{selectedPlaylistIndices.length}</strong> of {video.playlistEntries.length} tracks
              </span>
              {onToggleAllPlaylistItems && (
                <button
                  type="button"
                  className="btn-dark-pill"
                  onClick={onToggleAllPlaylistItems}
                  disabled={isConverting}
                  style={{ fontSize: '11px', padding: '4px 10px' }}
                >
                  {selectedPlaylistIndices.length === video.playlistEntries.length ? 'Deselect All' : 'Select All'}
                </button>
              )}
            </div>
            <div className="playlist-checklist-scroll">
              {video.playlistEntries.map((entry, idx) => {
                const isChecked = selectedPlaylistIndices.includes(idx);
                return (
                  <label
                    key={`${entry.id}-${idx}`}
                    className={`playlist-checklist-item ${isChecked ? 'checked' : ''}`}
                  >
                    <input
                      type="checkbox"
                      checked={isChecked}
                      disabled={isConverting}
                      onChange={() => onTogglePlaylistItem && onTogglePlaylistItem(idx)}
                      style={{ accentColor: 'var(--spotify-green)', cursor: 'pointer', flexShrink: 0 }}
                    />
                    <span className="playlist-item-idx">#{idx + 1}</span>
                    <span className="playlist-item-title" title={entry.title}>{entry.title}</span>
                    <span className="playlist-item-meta">{entry.durationFormatted || '--:--'}</span>
                  </label>
                );
              })}
            </div>
          </div>
        )}

        {/* Carousel 1-Click Quick Download Action Buttons */}
        {isMultiPhoto && (
          <div className="carousel-quick-bar">
            <button
              type="button"
              className="carousel-action-btn primary"
              onClick={() => onDownloadSlide && onDownloadSlide(safeIdx)}
              disabled={isConverting}
              title={`Download Slide #${safeIdx + 1} as high-resolution JPG`}
            >
              <Download size={13} />
              <span>Download Slide #{safeIdx + 1} (.JPG)</span>
            </button>

            <button
              type="button"
              className="carousel-action-btn secondary"
              onClick={() => onDownloadAll && onDownloadAll()}
              disabled={isConverting}
              title="Download all carousel photos in a single .ZIP archive"
            >
              <FolderArchive size={13} />
              <span>Download All ({photos.length} Photos .ZIP)</span>
            </button>

            <button
              type="button"
              className="carousel-action-btn ghost"
              onClick={() => setIsLightboxOpen(true)}
              title="Open full interactive carousel gallery"
            >
              <Maximize2 size={13} />
              <span>View Gallery</span>
            </button>
          </div>
        )}

        {/* Carousel Thumbnail Strip: View and Download any individual photo */}
        {isMultiPhoto && (
          <div className="carousel-strip-wrapper">
            <div className="carousel-strip-header">
              <span>All Photos in Carousel ({photos.length}) &bull; Click to preview &bull; 1-click download</span>
            </div>
            <div className="carousel-strip-scroll">
              {photos.map((item, idx) => (
                <div
                  key={item.index || idx}
                  className={`carousel-strip-item ${idx === safeIdx ? 'active' : ''}`}
                  onClick={() => setActiveSlideIndex && setActiveSlideIndex(idx)}
                  role="button"
                  tabIndex={0}
                  aria-label={`Select Slide ${idx + 1}`}
                  title={`Slide ${idx + 1} (Click to preview)`}
                >
                  <img src={item.url} alt={`Slide ${idx + 1}`} loading="lazy" />
                  <span className="strip-slide-num">#{idx + 1}</span>
                  <button
                    type="button"
                    className="strip-download-btn"
                    title={`Download Slide #${idx + 1} (.JPG)`}
                    onClick={(e) => {
                      e.stopPropagation();
                      if (onDownloadSlide) onDownloadSlide(idx);
                    }}
                    disabled={isConverting}
                    aria-label={`Download Slide ${idx + 1}`}
                  >
                    <Download size={11} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Fullscreen Interactive Lightbox Modal */}
      {isLightboxOpen && isMultiPhoto && (
        <div
          className="carousel-lightbox-overlay"
          onClick={() => setIsLightboxOpen(false)}
          role="dialog"
          aria-modal="true"
          aria-label="Carousel Gallery Lightbox"
        >
          <div
            className="carousel-lightbox-modal"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Lightbox Header */}
            <div className="carousel-lightbox-header">
              <div className="lightbox-title-box">
                <span className="lightbox-counter">
                  Slide {safeIdx + 1} of {photos.length}
                </span>
                <span className="lightbox-caption" title={video.title}>
                  {video.title}
                </span>
              </div>
              <div className="lightbox-actions">
                <button
                  type="button"
                  className="carousel-action-btn primary"
                  onClick={() => onDownloadSlide && onDownloadSlide(safeIdx)}
                  disabled={isConverting}
                  title="Download active photo"
                >
                  <Download size={14} />
                  <span>Download This Photo (.JPG)</span>
                </button>
                <button
                  type="button"
                  className="carousel-action-btn secondary"
                  onClick={() => onDownloadAll && onDownloadAll()}
                  disabled={isConverting}
                  title="Download all photos in ZIP"
                >
                  <FolderArchive size={14} />
                  <span>Download All ({photos.length} Photos .ZIP)</span>
                </button>
                <button
                  type="button"
                  className="lightbox-close-btn"
                  onClick={() => setIsLightboxOpen(false)}
                  aria-label="Close Lightbox"
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            {/* Lightbox Main View */}
            <div className="carousel-lightbox-body">
              <button
                type="button"
                className="lightbox-nav-btn prev"
                onClick={handlePrevSlide}
                disabled={safeIdx === 0}
                aria-label="Previous Photo"
              >
                <ChevronLeft size={30} />
              </button>

              <div className="lightbox-img-wrapper">
                <img
                  src={currentPhotoUrl}
                  alt={`Slide ${safeIdx + 1}`}
                  className="carousel-lightbox-img"
                />
              </div>

              <button
                type="button"
                className="lightbox-nav-btn next"
                onClick={handleNextSlide}
                disabled={safeIdx === photos.length - 1}
                aria-label="Next Photo"
              >
                <ChevronRight size={30} />
              </button>
            </div>

            {/* Lightbox Bottom Thumbnail Filmstrip */}
            <div className="carousel-lightbox-footer">
              <div className="lightbox-filmstrip">
                {photos.map((item, idx) => (
                  <div
                    key={item.index || idx}
                    className={`lightbox-filmstrip-item ${idx === safeIdx ? 'active' : ''}`}
                    onClick={() => setActiveSlideIndex && setActiveSlideIndex(idx)}
                  >
                    <img src={item.url} alt={`Thumbnail ${idx + 1}`} />
                    <span className="strip-slide-num">#{idx + 1}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
