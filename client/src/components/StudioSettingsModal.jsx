import React, { useEffect, useState } from 'react';
import {
  X,
  SlidersHorizontal,
  RotateCw,
  FolderOpen,
  Trash2,
  Cpu,
  Volume2,
  Activity,
  Play,
  Loader2,
  CheckCircle2,
  AlertTriangle,
  ShieldCheck,
  KeyRound,
  Upload,
  Archive
} from 'lucide-react';

const API_BASE = import.meta.env.VITE_API_URL || '';

export const DEFAULT_STUDIO_SETTINGS = {
  autoPlay: true,
  audioNormalization: false,
  showVisualizer: true,
  autoSaveDesktop: true,
  outputFolder: '',
  defaultFormat: 'mp3',
  defaultBitrate: '320k'
};

export default function StudioSettingsModal({
  isOpen,
  onClose,
  settings,
  onUpdateSettings,
  systemStatus,
  onCheckStatus,
  onUpdateEngine,
  isUpdatingEngine,
  engineUpdateStatus,
  onClearHistory,
  historyCount = 0
}) {
  const isDesktop = Boolean(typeof window !== 'undefined' && window.sonicWaveDesktop?.isDesktop);
  const [defaultDownloadsDir, setDefaultDownloadsDir] = useState('');
  const [desktopPort, setDesktopPort] = useState(null);
  const [minimizeToTray, setMinimizeToTray] = useState(false);
  const [gpuFallback, setGpuFallback] = useState(false);
  const [serverLibrary, setServerLibrary] = useState({ libraryMode: 'temporary', libraryDir: '' });
  const [cookiesStatus, setCookiesStatus] = useState(null);
  const [cookiesText, setCookiesText] = useState('');
  const [settingsMsg, setSettingsMsg] = useState(null);
  const [isSavingCookies, setIsSavingCookies] = useState(false);
  const [isInstallingAria2, setIsInstallingAria2] = useState(false);

  useEffect(() => {
    if (!isDesktop || !window.sonicWaveDesktop) return;
    window.sonicWaveDesktop.getDefaultDownloadsDir?.()
      .then((dir) => { if (dir) setDefaultDownloadsDir(dir); })
      .catch(() => {});
    window.sonicWaveDesktop.getServerPort?.()
      .then((p) => { if (p) setDesktopPort(p); })
      .catch(() => {});
    window.sonicWaveDesktop.getMinimizeToTray?.()
      .then((res) => { if (res) setMinimizeToTray(Boolean(res.enabled)); })
      .catch(() => {});
    window.sonicWaveDesktop.getGpuMode?.()
      .then((res) => { if (res) setGpuFallback(Boolean(res.softwareFallback)); })
      .catch(() => {});
  }, [isDesktop]);

  useEffect(() => {
    if (!isOpen) return;
    fetch(`${API_BASE}/api/settings/library`)
      .then((r) => r.json())
      .then((d) => { if (d?.success && d.settings) setServerLibrary(d.settings); })
      .catch(() => {});
    fetch(`${API_BASE}/api/settings/cookies`)
      .then((r) => r.json())
      .then((d) => { if (d?.success && d.cookies) setCookiesStatus(d.cookies); })
      .catch(() => {});
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleChooseFolder = async () => {
    if (typeof window === 'undefined' || !window.sonicWaveDesktop?.chooseDownloadFolder) return;
    try {
      const selected = await window.sonicWaveDesktop.chooseDownloadFolder();
      if (selected) {
        onUpdateSettings({ outputFolder: selected });
      }
    } catch {}
  };

  const toggleSetting = (key) => {
    onUpdateSettings({ [key]: !settings[key] });
  };

  const handleTogglePermanentLibrary = async () => {
    const nextMode = serverLibrary.libraryMode === 'permanent' ? 'temporary' : 'permanent';
    try {
      const res = await fetch(`${API_BASE}/api/settings/library`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ libraryMode: nextMode })
      });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.error || 'Failed to update library mode');
      setServerLibrary(json.settings);
      setSettingsMsg({
        type: 'success',
        message: nextMode === 'permanent'
          ? `Permanent Library ON: tracks saved to ${json.settings.libraryDir}`
          : 'Temporary Mode ON: server cache cleans after 2 hours.'
      });
    } catch (err) {
      setSettingsMsg({ type: 'error', message: err.message });
    }
  };

  const handleInstallAria2 = async () => {
    if (isInstallingAria2) return;
    setIsInstallingAria2(true);
    setSettingsMsg(null);
    try {
      const res = await fetch(`${API_BASE}/api/binaries/install-aria2`, { method: 'POST' });
      const json = await res.json();
      if (json.success) {
        setSettingsMsg({ type: 'success', message: `aria2c accelerator ready (${json.version || 'verified'}).` });
        onCheckStatus?.();
      } else {
        setSettingsMsg({ type: 'error', message: json.error || 'aria2c install skipped.' });
      }
    } catch (err) {
      setSettingsMsg({ type: 'error', message: err.message });
    } finally {
      setIsInstallingAria2(false);
    }
  };

  const handleSaveCookies = async () => {
    if (!cookiesText.trim() || isSavingCookies) return;
    setIsSavingCookies(true);
    setSettingsMsg(null);
    try {
      const res = await fetch(`${API_BASE}/api/settings/cookies`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: cookiesText })
      });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.error || 'Invalid cookies content.');
      setCookiesStatus(json.cookies);
      setCookiesText('');
      setSettingsMsg({
        type: 'success',
        message: `Saved ${json.cookies.entryCount} cookies across ${json.cookies.domainCount} domains.`
      });
    } catch (err) {
      setSettingsMsg({ type: 'error', message: err.message });
    } finally {
      setIsSavingCookies(false);
    }
  };

  const handleDeleteCookies = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/settings/cookies`, { method: 'DELETE' });
      const json = await res.json();
      if (json.success) {
        setCookiesStatus(json.cookies);
        setSettingsMsg({ type: 'success', message: 'Removed cookies.txt credentials.' });
      }
    } catch (err) {
      setSettingsMsg({ type: 'error', message: err.message });
    }
  };

  const handleCookieFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') setCookiesText(reader.result);
    };
    reader.readAsText(file);
  };

  return (
    <div
      className="cmd-palette-backdrop"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="SonicWave Studio Settings and Engine Controls"
    >
      <div
        className="pricing-modal-window"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="pricing-modal-header">
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
              <span className="hero-pill-badge" style={{ marginBottom: 0 }}>
                <SlidersHorizontal size={12} style={{ color: 'var(--spotify-green)' }} />
                <span>Studio Preferences &amp; Engine</span>
              </span>
              <span
                className="badge-tag-small"
                style={{
                  backgroundColor: systemStatus?.ready ? 'rgba(30, 215, 96, 0.16)' : 'rgba(255, 164, 43, 0.16)',
                  color: systemStatus?.ready ? 'var(--spotify-green)' : 'var(--text-warning)'
                }}
              >
                {systemStatus?.ready ? 'ENGINE ONLINE' : 'ENGINE PENDING'}
              </span>
            </div>
            <h2 className="pricing-title">SonicWave Studio Settings</h2>
            <p className="pricing-subtitle">
              Configure playback audio processing, desktop auto-save folder, defaults, and local extraction binaries.
            </p>
          </div>

          <button
            type="button"
            className="btn-icon"
            onClick={onClose}
            title="Close settings"
            aria-label="Close settings"
          >
            <X size={20} />
          </button>
        </div>

        <div className="settings-modal-grid">
          {/* Card 1: Playback & Audio Processing */}
          <div className="settings-card">
            <h3 className="settings-card-title">
              <Volume2 size={15} style={{ color: 'var(--spotify-green)' }} />
              <span>Player &amp; Audio Engine</span>
            </h3>

            <label className="settings-row">
              <div className="settings-row-copy">
                <span className="settings-row-label">
                  <Play size={13} /> Auto-Play Tracks &amp; Conversions
                </span>
                <span className="settings-row-desc">
                  Automatically start playback when selecting history items or finishing a conversion.
                </span>
              </div>
              <input
                type="checkbox"
                checked={Boolean(settings.autoPlay)}
                onChange={() => toggleSetting('autoPlay')}
                className="settings-checkbox"
              />
            </label>

            <label className="settings-row">
              <div className="settings-row-copy">
                <span className="settings-row-label">
                  <Activity size={13} /> Real-Time Web Audio Spectrum
                </span>
                <span className="settings-row-desc">
                  Connects playback to a live Web Audio AnalyserNode frequency visualizer.
                </span>
              </div>
              <input
                type="checkbox"
                checked={Boolean(settings.showVisualizer)}
                onChange={() => toggleSetting('showVisualizer')}
                className="settings-checkbox"
              />
            </label>

            <label className="settings-row">
              <div className="settings-row-copy">
                <span className="settings-row-label">
                  <SlidersHorizontal size={13} /> Dynamic Audio Normalization
                </span>
                <span className="settings-row-desc">
                  Applies a smooth Web Audio DynamicsCompressor during playback to level sudden volume spikes.
                </span>
              </div>
              <input
                type="checkbox"
                checked={Boolean(settings.audioNormalization)}
                onChange={() => toggleSetting('audioNormalization')}
                className="settings-checkbox"
              />
            </label>

            <div className="settings-row" style={{ flexDirection: 'column', alignItems: 'stretch', gap: '8px' }}>
              <span className="settings-row-label">Default Output Preset</span>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                <select
                  aria-label="Default Output Format"
                  value={settings.defaultFormat}
                  onChange={(e) => {
                    const nextFmt = e.target.value;
                    const nextQuality = nextFmt === 'mp4' ? '1080p' : (nextFmt === 'wav' || nextFmt === 'flac' ? 'best' : '320k');
                    onUpdateSettings({ defaultFormat: nextFmt, defaultBitrate: nextQuality });
                  }}
                  className="settings-select"
                >
                  <option value="mp3">MP3 Audio</option>
                  <option value="m4a">M4A (Fast Copy)</option>
                  <option value="mp4">MP4 Video</option>
                  <option value="flac">FLAC Lossless</option>
                  <option value="wav">WAV Uncompressed</option>
                </select>
                <select
                  aria-label="Default Output Quality"
                  value={settings.defaultBitrate}
                  onChange={(e) => onUpdateSettings({ defaultBitrate: e.target.value })}
                  className="settings-select"
                >
                  {settings.defaultFormat === 'mp4' ? (
                    <>
                      <option value="1080p">1080p Full HD</option>
                      <option value="720p">720p HD</option>
                      <option value="480p">480p SD</option>
                    </>
                  ) : (
                    <>
                      <option value="320k">320 kbps</option>
                      <option value="256k">256 kbps</option>
                      <option value="192k">192 kbps</option>
                      <option value="best">Best / Lossless</option>
                    </>
                  )}
                </select>
              </div>
            </div>
          </div>

          {/* Card 2: Output Folder & Engine Diagnostics */}
          <div className="settings-card">
            <h3 className="settings-card-title">
              <Cpu size={15} style={{ color: 'var(--spotify-green)' }} />
              <span>Desktop Storage &amp; Binaries</span>
            </h3>

            <label className="settings-row">
              <div className="settings-row-copy">
                <span className="settings-row-label">
                  <FolderOpen size={13} /> Auto-Save Completed Files (Desktop)
                </span>
                <span className="settings-row-desc">
                  {isDesktop
                    ? 'Automatically copies finished conversions into your selected folder without extra clicks.'
                    : 'Active when running the native Electron Desktop app (browsers use your browser download folder).'}
                </span>
              </div>
              <input
                type="checkbox"
                checked={Boolean(settings.autoSaveDesktop)}
                onChange={() => toggleSetting('autoSaveDesktop')}
                className="settings-checkbox"
              />
            </label>

            {isDesktop && (
              <label className="settings-row">
                <div className="settings-row-copy">
                  <span className="settings-row-label">Minimize to System Tray on Close</span>
                  <span className="settings-row-desc">
                    Keeps background conversions running in your tray icon instead of quitting when closing the window.
                  </span>
                </div>
                <input
                  type="checkbox"
                  checked={minimizeToTray}
                  onChange={() => {
                    const next = !minimizeToTray;
                    setMinimizeToTray(next);
                    window.sonicWaveDesktop?.setMinimizeToTray?.(next);
                  }}
                  className="settings-checkbox"
                />
              </label>
            )}

            <div className="settings-row" style={{ flexDirection: 'column', alignItems: 'stretch', gap: '8px' }}>
              <span className="settings-row-label">Desktop Output Folder</span>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <div className="settings-path-box" title={settings.outputFolder || defaultDownloadsDir || 'System Downloads Folder'}>
                  {settings.outputFolder || defaultDownloadsDir || (isDesktop ? 'Default System Downloads Folder' : 'Browser Default Downloads')}
                </div>
                {isDesktop && (
                  <button
                    type="button"
                    className="btn-dark-pill"
                    onClick={handleChooseFolder}
                    style={{ whiteSpace: 'nowrap', fontSize: '11px', padding: '7px 12px' }}
                  >
                    Choose Folder
                  </button>
                )}
              </div>
            </div>

            <div className="settings-diagnostics-box">
              <div className="settings-diag-row">
                <span>yt-dlp Core</span>
                <span className="settings-diag-val">
                  {systemStatus?.ytDlp ? `Ready (${systemStatus.ytDlpVersion || 'verified'})` : 'Pending'}
                </span>
              </div>
              <div className="settings-diag-row">
                <span>FFmpeg Multiplexer</span>
                <span className="settings-diag-val">
                  {systemStatus?.ffmpeg ? 'Ready (v6.1+)' : 'Pending'}
                </span>
              </div>
              <div className="settings-diag-row">
                <span>Downloader Acceleration</span>
                <span className="settings-diag-val">
                  {systemStatus?.aria2 ? 'aria2c (16x active)' : 'yt-dlp built-in (-N 16)'}
                </span>
              </div>
              <div className="settings-diag-row">
                <span>Worker Concurrency</span>
                <span className="settings-diag-val">3 parallel slots (FIFO queued)</span>
              </div>
              {isDesktop && (
                <div className="settings-diag-row">
                  <span>Desktop Runtime</span>
                  <span className="settings-diag-val">
                    Port {desktopPort || systemStatus?.port || 3001} &bull; {gpuFallback ? 'Software Fallback GPU' : 'Hardware GPU'}
                  </span>
                </div>
              )}
            </div>

            <label className="settings-row">
              <div className="settings-row-copy">
                <span className="settings-row-label">
                  <Archive size={13} /> Persistent Library Output Mode
                </span>
                <span className="settings-row-desc">
                  Store finished files permanently in {serverLibrary.libraryDir || 'Downloads/SonicWave'} without 2-hour cache deletion.
                </span>
              </div>
              <input
                type="checkbox"
                checked={serverLibrary.libraryMode === 'permanent'}
                onChange={handleTogglePermanentLibrary}
                className="settings-checkbox"
              />
            </label>

            {settingsMsg && (
              <div
                className="settings-status-banner"
                style={{
                  borderColor: settingsMsg.type === 'error' ? 'rgba(243, 114, 127, 0.4)' : 'rgba(30, 215, 96, 0.4)',
                  color: settingsMsg.type === 'error' ? 'var(--text-negative)' : 'var(--spotify-green)'
                }}
              >
                {settingsMsg.type === 'error' ? <AlertTriangle size={14} /> : <CheckCircle2 size={14} />}
                <span>{settingsMsg.message}</span>
              </div>
            )}

            {engineUpdateStatus && (
              <div
                className="settings-status-banner"
                style={{
                  borderColor: engineUpdateStatus.type === 'error' ? 'rgba(243, 114, 127, 0.4)' : 'rgba(30, 215, 96, 0.4)',
                  color: engineUpdateStatus.type === 'error' ? 'var(--text-negative)' : 'var(--spotify-green)'
                }}
              >
                {engineUpdateStatus.type === 'error' ? <AlertTriangle size={14} /> : <CheckCircle2 size={14} />}
                <span>{engineUpdateStatus.message}</span>
              </div>
            )}

            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '4px' }}>
              <button
                type="button"
                className="btn-spotify-green"
                onClick={onUpdateEngine}
                disabled={isUpdatingEngine}
                style={{ flex: 1, justifyContent: 'center', fontSize: '12px', padding: '8px 14px' }}
              >
                {isUpdatingEngine ? <Loader2 size={14} className="spinner" /> : <RotateCw size={14} />}
                <span>{isUpdatingEngine ? 'Updating yt-dlp...' : 'Update yt-dlp Core'}</span>
              </button>

              {!systemStatus?.aria2 && (
                <button
                  type="button"
                  className="btn-dark-pill"
                  onClick={handleInstallAria2}
                  disabled={isInstallingAria2}
                  style={{ fontSize: '12px', padding: '8px 12px' }}
                >
                  {isInstallingAria2 ? 'Installing aria2c...' : 'Install aria2c'}
                </button>
              )}

              <button
                type="button"
                className="btn-dark-pill"
                onClick={onCheckStatus}
                style={{ fontSize: '12px', padding: '8px 12px' }}
              >
                Re-check Status
              </button>

              <button
                type="button"
                className="btn-dark-pill"
                onClick={onClearHistory}
                disabled={historyCount === 0}
                style={{ fontSize: '12px', padding: '8px 12px', opacity: historyCount === 0 ? 0.45 : 1 }}
              >
                <Trash2 size={13} />
                <span>Clear Library ({historyCount})</span>
              </button>
            </div>
          </div>
        </div>

        {/* Bot-Bypass & Cookies Manager Panel */}
        <div className="settings-card" style={{ marginTop: '14px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
            <h3 className="settings-card-title">
              <KeyRound size={15} style={{ color: 'var(--spotify-green)' }} />
              <span>Cookies &amp; Bot-Bypass Manager (Netscape cookies.txt)</span>
            </h3>
            <span
              className="badge-tag-small"
              style={{
                backgroundColor: cookiesStatus?.configured ? 'rgba(30, 215, 96, 0.16)' : 'rgba(255, 255, 255, 0.08)',
                color: cookiesStatus?.configured ? 'var(--spotify-green)' : 'var(--text-subdued)'
              }}
            >
              {cookiesStatus?.configured
                ? `Active (${cookiesStatus.domainCount} domains, ${cookiesStatus.entryCount} entries)`
                : 'No cookies configured'}
            </span>
          </div>

          <p className="settings-row-desc" style={{ margin: 0 }}>
            Resolves &quot;Sign in to confirm you&apos;re not a bot&quot; errors cleanly. Stored locally on your backend server and never echoed back over the API.
            {cookiesStatus?.sampleDomains?.length > 0 && ` Domains: ${cookiesStatus.sampleDomains.join(', ')}.`}
          </p>

          <textarea
            rows={3}
            value={cookiesText}
            onChange={(e) => setCookiesText(e.target.value)}
            placeholder="# Netscape HTTP Cookie File — paste exported cookies.txt lines or choose file below..."
            aria-label="Paste Netscape cookies.txt content"
            style={{
              width: '100%',
              padding: '8px 10px',
              backgroundColor: 'var(--bg-base)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-xs)',
              color: 'var(--text-white)',
              fontFamily: 'var(--font-mono)',
              fontSize: '11px',
              resize: 'vertical'
            }}
          />

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
            <label className="btn-dark-pill" style={{ cursor: 'pointer', fontSize: '11.5px', padding: '6px 12px' }}>
              <Upload size={13} />
              <span>Load .txt File</span>
              <input type="file" accept=".txt,text/plain" onChange={handleCookieFileUpload} style={{ display: 'none' }} />
            </label>

            <div style={{ display: 'flex', gap: '8px' }}>
              {cookiesStatus?.configured && (
                <button
                  type="button"
                  className="btn-dark-pill"
                  onClick={handleDeleteCookies}
                  style={{ fontSize: '11.5px', padding: '6px 12px', color: 'var(--text-negative)' }}
                >
                  <Trash2 size={13} />
                  <span>Remove Cookies</span>
                </button>
              )}
              <button
                type="button"
                className="btn-spotify-green"
                onClick={handleSaveCookies}
                disabled={!cookiesText.trim() || isSavingCookies}
                style={{ fontSize: '11.5px', padding: '6px 14px', opacity: (!cookiesText.trim() || isSavingCookies) ? 0.55 : 1 }}
              >
                {isSavingCookies ? 'Saving...' : 'Save Cookies Locally'}
              </button>
            </div>
          </div>
        </div>

        <div className="pricing-modal-footer">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <ShieldCheck size={16} style={{ color: 'var(--spotify-green)' }} />
            <span>100% Local Execution &bull; Cookies managed via server/cookies.txt</span>
          </div>
          <span>Powered by yt-dlp &amp; FFmpeg</span>
        </div>
      </div>
    </div>
  );
}
