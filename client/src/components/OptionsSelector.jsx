import React from 'react';
import { Sliders, Music, Video, Sparkles, Monitor, Zap, Info, ShieldCheck } from 'lucide-react';

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
  { value: 'mp3', label: 'MP3', isVideo: false, speedBadge: 'Turbo Multi-Core' },
  { value: 'mp4', label: 'MP4 (Video)', isVideo: true, speedBadge: 'Direct Stream Copy' },
  { value: 'm4a', label: 'M4A (AAC)', isVideo: false, speedBadge: '⚡ Instant 0-Reencode' },
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
  const isUltraLong = videoInfo && (videoInfo.isUltraLong || (videoInfo.duration && videoInfo.duration >= 7200));

  const handleFormatChange = (newFormat) => {
    setFormat(newFormat);
    if (newFormat === 'mp4') {
      if (!['1080p', '720p', '480p', 'best'].includes(bitrate)) {
        setBitrate('1080p');
      }
    } else {
      if (!['320k', '256k', '192k', '128k'].includes(bitrate)) {
        setBitrate('320k');
      }
    }
  };

  return (
    <div className="selectors-wrapper">
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
                16-connection parallel chunk downloading is active. To finish 100+ hours in <strong>less than 5 minutes</strong>, selecting <strong>M4A (AAC)</strong> or <strong>MP4</strong> copies native streams directly with zero CPU transcoding lag!
              </p>
            </div>
          </div>
        )}
      </div>

      <div className="selectors-grid">
        {/* Format Selector */}
        <div className="selector-group">
          <label className="selector-label">
            {isVideo ? <Video size={14} style={{ color: 'var(--spotify-green)' }} /> : <Music size={14} />}
            <span>Target Output Format</span>
          </label>
          <div className="pills-container">
            {FORMATS.map((f) => (
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
            ))}
          </div>
        </div>

        {/* Quality / Resolution Selector */}
        <div className="selector-group">
          <label className="selector-label">
            {isVideo ? <Monitor size={14} style={{ color: 'var(--spotify-green)' }} /> : <Sliders size={14} />}
            <span>{isVideo ? 'Video Resolution' : 'Audio Bitrate Quality'}</span>
          </label>
          <div className="pills-container">
            {isVideo
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
              : BITRATES.map((b) => (
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
                ))}
          </div>
        </div>
      </div>
    </div>
  );
}
