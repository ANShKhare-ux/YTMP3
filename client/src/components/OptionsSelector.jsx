import React from 'react';
import { Sliders, Music, Video, Sparkles, Monitor, Zap, Info, ShieldCheck, VolumeX, Image as ImageIcon } from 'lucide-react';

const BITRATES = [
  { value: '320k', label: '320 kbps', badge: 'Ultra HQ', desc: 'Studio grade sound' },
  { value: '256k', label: '256 kbps', badge: 'High', desc: 'Crisp & clear' },
  { value: '192k', label: '192 kbps', badge: 'Standard', desc: 'Balanced file size' },
  { value: '128k', label: '128 kbps', badge: 'Light', desc: 'Fastest download' }
];

const RESOLUTIONS = [
  { value: '1080p', label: '1080p Full HD', badge: 'FHD', desc: 'Crisp 1080p high definition' },
  { value: '720p', label: '720p HD', badge: 'HD', desc: 'Standard high definition' },
  { value: '480p', label: '480p SD', badge: 'SD', desc: 'Compact file size' },
  { value: 'best', label: 'Best Quality', badge: 'Max', desc: 'Highest available stream' }
];

const FORMATS = [
  { value: 'mp3', label: 'MP3', isVideo: false, speedBadge: 'Multi-Core' },
  { value: 'mp4', label: 'MP4 (Video)', isVideo: true, speedBadge: 'Direct Stream Copy' },
  { value: 'm4a', label: 'M4A (AAC)', isVideo: false, speedBadge: 'Fast Stream Copy' },
  { value: 'wav', label: 'WAV', isVideo: false },
  { value: 'flac', label: 'FLAC', isVideo: false }
];

export default function OptionsSelector({
  bitrate,
  setBitrate,
  format,
  setFormat,
  isConverting,
  videoInfo,
  turbo = true,
  setTurbo
}) {
  const isVideo = format === 'mp4';
  const isLossless = format === 'wav' || format === 'flac';
  const isCover = format === 'cover';
  const isUltraLong = videoInfo && (videoInfo.isUltraLong || (videoInfo.duration && videoInfo.duration >= 7200));

  const presets = videoInfo?.presets || videoInfo?.tailoredOptions?.presets || [];
  const tailoredOptions = videoInfo?.tailoredOptions;

  const handlePresetClick = (preset) => {
    if (preset.format === 'cover') {
      setFormat('cover');
      setBitrate('original');
    } else {
      handleFormatChange(preset.format);
      if (preset.quality) {
        setBitrate(preset.quality);
      }
    }
  };

  const handleFormatChange = (newFormat) => {
    setFormat(newFormat);
    if (newFormat === 'mp4') {
      if (!['1080p', '720p', '480p', 'best'].includes(bitrate)) {
        setBitrate('1080p');
      }
    } else if (newFormat === 'wav' || newFormat === 'flac') {
      setBitrate('best');
    } else if (newFormat === 'cover' || newFormat === 'zip' || newFormat === 'jpg' || newFormat === 'png') {
      setBitrate('original');
    } else {
      if (!['320k', '256k', '192k', '128k'].includes(bitrate)) {
        setBitrate('320k');
      }
    }
  };

  return (
    <div className="selectors-wrapper">
      {/* Silent Media Notice */}
      {videoInfo?.hasAudio === false && (
        <div style={{ background: 'rgba(234, 179, 8, 0.1)', border: '1px solid rgba(234, 179, 8, 0.3)', borderRadius: '10px', padding: '10px 14px', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12.5px', color: '#facc15' }}>
          <VolumeX size={15} style={{ flexShrink: 0 }} />
          <span>
            <strong>Silent Media Detected:</strong> This post has no audio stream. <strong>MP4 (Video)</strong> or <strong>Cover/Photo</strong> is recommended.
          </span>
        </div>
      )}

      {/* 1-Click Tailored Social Media Presets */}
      {presets.length > 0 && (
        <div className="tailored-presets-section">
          <div className="tailored-presets-header">
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Sparkles size={14} style={{ color: tailoredOptions?.appColor || 'var(--spotify-green)' }} />
              <span className="tailored-presets-title">
                {tailoredOptions?.headline || 'Tailored Download Presets'}
              </span>
            </div>
            {tailoredOptions?.subhead && (
              <span className="tailored-presets-subhead">{tailoredOptions.subhead}</span>
            )}
          </div>
          <div className="tailored-presets-grid">
            {presets.map((preset) => {
              const isPresetActive =
                format === preset.format && (preset.format === 'cover' || bitrate === preset.quality);
              return (
                <button
                  key={preset.id}
                  type="button"
                  className={`tailored-preset-card ${isPresetActive ? 'active' : ''}`}
                  onClick={() => handlePresetClick(preset)}
                  disabled={isConverting}
                >
                  <div className="preset-card-top">
                    <span
                      className="preset-badge"
                      style={{
                        backgroundColor: isPresetActive
                          ? tailoredOptions?.appColor || 'var(--spotify-green)'
                          : 'rgba(255, 255, 255, 0.08)',
                        color: isPresetActive ? '#000000' : 'var(--text-subdued)'
                      }}
                    >
                      {preset.badge}
                    </span>
                    {preset.recommended && <span className="preset-recommended-tag">Best Pick</span>}
                  </div>
                  <div className="preset-card-title">{preset.label}</div>
                  <div className="preset-card-desc">{preset.desc}</div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* 100h+ Ultra-Speed Engine Banner */}
      <div className="turbo-engine-card">
        <div className="turbo-header">
          <div className="turbo-pill-active">
            <Zap size={13} />
            <span>100H+ Turbo Engine Active</span>
          </div>
          <div className="turbo-specs">
            <span>⚡ 16x Parallel Streams</span>
            <span>•</span>
            <span>16MB Buffer</span>
            <span>•</span>
            <span>Zero-Reencode Copy</span>
          </div>
        </div>
        {isUltraLong && (
          <div className="ultra-long-notice">
            <Info size={16} style={{ color: 'var(--spotify-green)', flexShrink: 0 }} />
            <div>
              <strong style={{ color: 'var(--text-white)' }}>Ultra-Long Media Detected ({videoInfo.durationFormatted}):</strong>
              <p style={{ marginTop: '2px', color: 'var(--text-subdued)' }}>
                16-connection parallel chunk downloading is active. For ultra-fast extraction on long media, selecting <strong>M4A (AAC)</strong> or <strong>MP4</strong> copies native streams directly with zero CPU transcoding delay!
              </p>
            </div>
          </div>
        )}
      </div>

      <div className="selectors-grid">
        {/* Format Selector */}
        <div className="selector-group">
          <label className="selector-label">
            {videoInfo?.isPhoto ? <ImageIcon size={14} style={{ color: 'var(--spotify-green)' }} /> : (isVideo ? <Video size={14} style={{ color: 'var(--spotify-green)' }} /> : <Music size={14} />)}
            <span>Target Output Format</span>
          </label>
          <div className="pills-container">
            {videoInfo?.isPhoto ? (
              (videoInfo.isCarousel
                ? [
                    { value: 'zip', label: `ZIP Archive (${videoInfo.itemCount || 'All'} Photos)`, speedBadge: 'All Slides' },
                    { value: 'jpg', label: 'Primary Photo (.JPG)', speedBadge: 'Slide 1' },
                    { value: 'png', label: 'Lossless Photo (.PNG)' }
                  ]
                : [
                    { value: 'jpg', label: 'Original Photo (.JPG)', speedBadge: 'Full Res' },
                    { value: 'png', label: 'Lossless Photo (.PNG)', speedBadge: 'Lossless' }
                  ]
              ).map((f) => (
                <button
                  key={f.value}
                  type="button"
                  id={`format-${f.value}`}
                  className={`spotify-pill-btn ${format === f.value ? 'active' : ''}`}
                  onClick={() => handleFormatChange(f.value)}
                  disabled={isConverting}
                >
                  <ImageIcon size={13} style={{ marginRight: 4 }} />
                  <span>{f.label}</span>
                  {f.speedBadge && (
                    <span className="badge-tag-small">
                      {f.speedBadge}
                    </span>
                  )}
                </button>
              ))
            ) : (
              FORMATS.map((f) => (
                <button
                  key={f.value}
                  type="button"
                  id={`format-${f.value}`}
                  className={`spotify-pill-btn ${format === f.value ? 'active' : ''}`}
                  onClick={() => handleFormatChange(f.value)}
                  disabled={isConverting}
                >
                  {f.isVideo ? (
                    <Video size={13} style={{ marginRight: 2 }} />
                  ) : (
                    <Music size={13} style={{ marginRight: 2 }} />
                  )}
                  <span>{f.label}</span>
                  {f.value === 'm4a' && (
                    <span className="badge-tag-small">
                      ⚡ &lt;5m
                    </span>
                  )}
                  {f.value === 'mp4' && (
                    <span className="badge-tag-small">
                      Video
                    </span>
                  )}
                </button>
              ))
            )}
          </div>
        </div>

        {/* Quality / Resolution Selector */}
        <div className="selector-group">
          <label className="selector-label">
            {videoInfo?.isPhoto ? <Sparkles size={14} style={{ color: 'var(--spotify-green)' }} /> : (isVideo ? <Monitor size={14} style={{ color: 'var(--spotify-green)' }} /> : <Sliders size={14} />)}
            <span>{videoInfo?.isPhoto ? 'Photo Resolution Quality' : (isVideo ? 'Video Resolution' : (isLossless ? 'Audio Quality' : 'Audio Bitrate Quality'))}</span>
          </label>
          <div className="pills-container">
            {videoInfo?.isPhoto ? (
              <div
                className="spotify-pill-btn active"
                style={{ cursor: 'default', background: 'rgba(30, 215, 96, 0.12)', borderColor: 'var(--spotify-green)', color: 'var(--spotify-green)' }}
              >
                <Sparkles size={12} style={{ display: 'inline', marginRight: 4 }} />
                <span>Original Source Resolution &bull; Direct Uncompressed Stream</span>
              </div>
            ) : isVideo
              ? RESOLUTIONS.map((r) => (
                  <button
                    key={r.value}
                    type="button"
                    id={`res-${r.value}`}
                    className={`spotify-pill-btn ${bitrate === r.value ? 'active' : ''}`}
                    onClick={() => setBitrate(r.value)}
                    disabled={isConverting}
                  >
                    <span>{r.label}</span>
                    {r.value === '1080p' && (
                      <span className="badge-tag-small">
                        <Sparkles size={10} style={{ display: 'inline', marginRight: 2 }} />
                        FHD
                      </span>
                    )}
                  </button>
                ))
              : isLossless ? (
                  <div
                    className="spotify-pill-btn active"
                    style={{ cursor: 'default', background: 'rgba(30, 215, 96, 0.12)', borderColor: 'var(--spotify-green)', color: 'var(--spotify-green)' }}
                  >
                    <Sparkles size={12} style={{ display: 'inline', marginRight: 4 }} />
                    <span>Lossless Master (Source Bitrate &bull; No Compression)</span>
                  </div>
                ) : (
                  BITRATES.map((b) => (
                    <button
                      key={b.value}
                      type="button"
                      id={`bitrate-${b.value}`}
                      className={`spotify-pill-btn ${bitrate === b.value ? 'active' : ''}`}
                      onClick={() => setBitrate(b.value)}
                      disabled={isConverting}
                    >
                      <span>{b.label}</span>
                      {b.value === '320k' && (
                        <span className="badge-tag-small">
                          <Sparkles size={10} style={{ display: 'inline', marginRight: 2 }} />
                          HQ
                        </span>
                      )}
                    </button>
                  ))
                )}
          </div>
        </div>
      </div>
    </div>
  );
}
