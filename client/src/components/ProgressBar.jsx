import React from 'react';
import { DownloadCloud, Cpu, Tag, CheckCircle2, AlertCircle, Loader2, Video, Zap } from 'lucide-react';

export default function ProgressBar({ job }) {
  if (!job) return null;

  const isVideo = job.format === 'mp4';

  const getStatusDetails = () => {
    switch (job.status) {
      case 'starting':
        return {
          icon: <Loader2 size={16} className="spinner" style={{ color: 'var(--spotify-green)' }} />,
          label: isVideo ? 'Initializing 16-stream parallel video pipeline...' : 'Initializing 16-stream audio pipeline...',
          color: 'var(--spotify-green)'
        };
      case 'downloading':
        return {
          icon: isVideo ? <Video size={16} style={{ color: 'var(--spotify-green)' }} /> : <DownloadCloud size={16} style={{ color: 'var(--spotify-green)' }} />,
          label: isVideo
            ? 'Downloading video & audio chunks via 16 parallel fragment streams...'
            : 'Downloading audio stream at turbo multi-fragment speed...',
          color: 'var(--spotify-green)'
        };
      case 'converting':
        return {
          icon: <Cpu size={16} style={{ color: 'var(--text-warning)' }} />,
          label: isVideo
            ? `⚡ Fast Stream-Copy: Muxing MP4 (${job.quality}) with zero re-encoding...`
            : `⚡ Multi-Core Encoding: Packaging ${job.format?.toUpperCase()} (${job.quality})...`,
          color: 'var(--text-warning)'
        };
      case 'tagging':
        return {
          icon: <Tag size={16} style={{ color: 'var(--text-announcement)' }} />,
          label: 'Embedding metadata tags & cover art...',
          color: 'var(--text-announcement)'
        };
      case 'completed':
        return {
          icon: <CheckCircle2 size={16} style={{ color: 'var(--spotify-green)' }} />,
          label: isVideo ? 'MP4 Video ready! Watch in-browser or download.' : 'Audio ready! Play in-browser or save file.',
          color: 'var(--spotify-green)'
        };
      case 'failed':
        return {
          icon: <AlertCircle size={16} style={{ color: 'var(--text-negative)' }} />,
          label: job.error || 'Conversion encountered an error.',
          color: 'var(--text-negative)'
        };
      default:
        return {
          icon: <Loader2 size={16} className="spinner" />,
          label: 'Processing...',
          color: 'var(--spotify-green)'
        };
    }
  };

  const { icon, label } = getStatusDetails();
  const progressPercent = job.progress || 0;

  return (
    <div className="progress-container" id="progress-container">
      <div className="progress-header">
        <div className="progress-status">
          {icon}
          <span>{label}</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span className="turbo-pill-active" style={{ fontSize: '10px', padding: '2px 8px' }}>
            <Zap size={10} />
            <span>16X TURBO</span>
          </span>
          <div className="progress-percent">
            {progressPercent}%
          </div>
        </div>
      </div>

      <div className="bar-track">
        <div
          className="bar-fill"
          style={{ width: `${progressPercent}%` }}
        />
      </div>

      {job.status === 'downloading' && (
        <div className="progress-stats-row">
          <span style={{ color: 'var(--spotify-green)', fontWeight: 600 }}>⚡ Speed: {job.speed || 'Calculating...'}</span>
          <span>Size: {job.totalSize || '--'}</span>
          <span>ETA: {job.eta || '--'}</span>
          {job.fragmentInfo && <span>Chunks: {job.fragmentInfo}</span>}
        </div>
      )}
    </div>
  );
}
