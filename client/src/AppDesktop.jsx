import React, { useState, useEffect, useRef, useCallback } from 'react';
import confetti from 'canvas-confetti';
import {
  Music2,
  Zap,
  AlertTriangle,
  Disc,
  CheckCircle2,
  Video,
  Home,
  Search,
  Library,
  ChevronLeft,
  ChevronRight,
  Headphones,
  Loader2,
  Image as ImageIcon
} from 'lucide-react';
import UrlInput from './components/UrlInput';
import VideoPreview from './components/VideoPreview';
import OptionsSelector from './components/OptionsSelector';
import ProgressBar from './components/ProgressBar';
import AudioPlayer from './components/AudioPlayer';
import HistorySection from './components/HistorySection';
import Logo from './components/Logo';
import CommandPalette from './components/CommandPalette';
import StudioSettingsModal, { DEFAULT_STUDIO_SETTINGS } from './components/StudioSettingsModal';
import { SlidersHorizontal, Command as CommandIcon, FolderOpen, X } from 'lucide-react';

const API_BASE = import.meta.env.VITE_API_URL || '';

export default function App({ onNavigate }) {
  const [studioSettings, setStudioSettings] = useState(() => {
    try {
      const saved = localStorage.getItem('sonicwave_studio_settings');
      return saved ? { ...DEFAULT_STUDIO_SETTINGS, ...JSON.parse(saved) } : DEFAULT_STUDIO_SETTINGS;
    } catch {
      return DEFAULT_STUDIO_SETTINGS;
    }
  });

  const [url, setUrl] = useState('');
  const [videoInfo, setVideoInfo] = useState(null);
  const [bitrate, setBitrate] = useState(() => studioSettings.defaultBitrate || '320k');
  const [format, setFormat] = useState(() => studioSettings.defaultFormat || 'mp3');
  const [activeSlideIndex, setActiveSlideIndex] = useState(0);
  const [trimStart, setTrimStart] = useState('');
  const [trimEnd, setTrimEnd] = useState('');
  const [normalizeAudio, setNormalizeAudio] = useState(false);
  const [sponsorBlock, setSponsorBlock] = useState(false);

  const [isLoadingInfo, setIsLoadingInfo] = useState(false);
  const [isConverting, setIsConverting] = useState(false);
  const [currentJob, setCurrentJob] = useState(null);
  const [selectedPlaylistIndices, setSelectedPlaylistIndices] = useState([]);
  const [batchJobs, setBatchJobs] = useState([]);
  const [activeTrack, setActiveTrack] = useState(null);
  const [error, setError] = useState(null);
  const [isCmdOpen, setIsCmdOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isUpdatingEngine, setIsUpdatingEngine] = useState(false);
  const [engineUpdateStatus, setEngineUpdateStatus] = useState(null);
  const [studioToast, setStudioToast] = useState(null);
  const [savedFilePaths, setSavedFilePaths] = useState({});
  const eventSourceRef = useRef(null);
  const recordedBatchIdsRef = useRef(new Set());
  const toastTimerRef = useRef(null);
  const isDesktop = Boolean(typeof window !== 'undefined' && window.sonicWaveDesktop?.isDesktop);

  const showToast = useCallback((toastPayload, durationMs = 5000) => {
    setStudioToast(toastPayload);
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    if (durationMs > 0) {
      toastTimerRef.current = setTimeout(() => {
        setStudioToast(null);
      }, durationMs);
    }
  }, []);

  useEffect(() => () => {
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
  }, []);

  const updateStudioSettings = useCallback((patch) => {
    setStudioSettings((prev) => {
      const next = { ...prev, ...patch };
      try {
        localStorage.setItem('sonicwave_studio_settings', JSON.stringify(next));
      } catch {}
      return next;
    });
  }, []);

  // Global Command Palette shortcut (⌘K / Ctrl+K)
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsCmdOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const [systemStatus, setSystemStatus] = useState({ ready: false, checking: true });
  const [history, setHistory] = useState(() => {
    try {
      const saved = localStorage.getItem('sonicwave_history');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Reusable backend health and binary check
  const checkStatus = useCallback(() => {
    return fetch(`${API_BASE}/api/status`)
      .then((res) => {
        const ct = res.headers.get('content-type') || '';
        if (!res.ok || ct.includes('text/html')) {
          throw new Error('Backend offline');
        }
        return res.json();
      })
      .then((data) => {
        if (data && data.status) {
          setSystemStatus(data.status);
          return data.status;
        }
        return null;
      })
      .catch((err) => {
        console.warn('Backend status check warning:', err);
        setSystemStatus({ ready: false, disconnected: true });
        return { ready: false, disconnected: true };
      });
  }, []);

  // Poll status on mount and auto-reconnect when server comes online
  useEffect(() => {
    let intervalId = null;

    const runPoll = async () => {
      const status = await checkStatus();
      if (status && status.ready) {
        // Once ready, reduce polling frequency to 30s keepalive
        if (intervalId) clearInterval(intervalId);
        intervalId = setInterval(checkStatus, 30000);
      }
    };

    runPoll();
    intervalId = setInterval(runPoll, 3000);

    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [checkStatus]);

  // Hydrate persistent history from backend whenever ready
  useEffect(() => {
    fetch(`${API_BASE}/api/history`)
      .then((res) => res.json())
      .then((data) => {
        if (data && data.success && Array.isArray(data.history) && data.history.length > 0) {
          setHistory((prev) => {
            const map = new Map();
            data.history.forEach((item) => map.set(item.id, item));
            prev.forEach((item) => {
              if (!map.has(item.id)) map.set(item.id, item);
            });
            return Array.from(map.values()).slice(0, 50);
          });
        }
      })
      .catch(() => {});
  }, [systemStatus?.ready]);

  // Save history to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('sonicwave_history', JSON.stringify(history));
    } catch (e) {
      console.warn('Could not save history to localStorage:', e);
    }
  }, [history]);

  const saveJobToDesktopFolder = useCallback(async (jobLike, trackMeta) => {
    if (typeof window === 'undefined' || !window.sonicWaveDesktop?.saveJobFile) {
      return null;
    }
    const targetId = jobLike?.id || jobLike?.jobId || trackMeta?.jobId;
    if (!targetId) return null;

    const rawTitle = (trackMeta?.title || jobLike?.title || 'SonicWave-media').slice(0, 80);
    const ext = (trackMeta?.format || jobLike?.format || 'mp3').toLowerCase();
    const result = await window.sonicWaveDesktop.saveJobFile({
      jobId: targetId,
      filename: `${rawTitle}.${ext}`,
      targetDir: studioSettings.outputFolder || ''
    });

    if (result?.success && result.savedPath) {
      setSavedFilePaths((prev) => ({ ...prev, [targetId]: result.savedPath }));
      return result.savedPath;
    }
    return null;
  }, [studioSettings.outputFolder]);

  const handleRevealInFolder = useCallback(async (itemOrJob) => {
    if (typeof window === 'undefined' || !window.sonicWaveDesktop?.showItemInFolder) return;
    const targetId = itemOrJob?.jobId || itemOrJob?.id;
    let filePath = (targetId && savedFilePaths[targetId]) || itemOrJob?.savedPath || '';

    if (!filePath && targetId) {
      filePath = await saveJobToDesktopFolder({ id: targetId }, itemOrJob);
      if (filePath) {
        showToast({
          type: 'success',
          message: `Saved to folder: ${filePath}`
        }, 4500);
      }
    }

    await window.sonicWaveDesktop.showItemInFolder({
      filePath,
      folderPath: studioSettings.outputFolder || ''
    });
  }, [savedFilePaths, saveJobToDesktopFolder, showToast, studioSettings.outputFolder]);

  // Append a completed job into active player state and 50-item client history
  const recordCompletedJob = useCallback((job) => {
    try {
      confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.7 }
      });
    } catch {}

    const completedTrack = {
      jobId: job.id,
      title: job.title || videoInfo?.title || 'Converted Audio',
      artist: job.artist || videoInfo?.uploader || 'YouTube Artist',
      thumbnail: job.thumbnail || videoInfo?.thumbnail || '',
      format: job.format,
      quality: job.quality,
      url: job.url || videoInfo?.url || url.trim(),
      isPhoto: Boolean(job.isPhoto || videoInfo?.isPhoto),
      isCarousel: Boolean(videoInfo?.isCarousel)
    };

    setActiveTrack(completedTrack);

    setHistory((prev) => {
      const filtered = prev.filter((item) => item.id !== job.id);
      return [
        {
          id: job.id,
          url: completedTrack.url,
          title: completedTrack.title,
          artist: completedTrack.artist,
          thumbnail: completedTrack.thumbnail,
          format: completedTrack.format,
          quality: completedTrack.quality,
          isPhoto: completedTrack.isPhoto,
          isCarousel: completedTrack.isCarousel,
          isAvailable: true,
          timestamp: job.createdAt || Date.now()
        },
        ...filtered
      ].slice(0, 50);
    });

    if (studioSettings.autoSaveDesktop && isDesktop) {
      saveJobToDesktopFolder(job, completedTrack).then((savedPath) => {
        if (savedPath) {
          setActiveTrack((prev) => (prev && prev.jobId === job.id ? { ...prev, savedPath } : prev));
          showToast({
            type: 'success',
            message: `Auto-saved to folder`,
            actionLabel: 'Open Folder',
            onAction: () => {
              window.sonicWaveDesktop?.showItemInFolder?.({ filePath: savedPath });
            }
          }, 6000);
        }
      });
    }
  }, [videoInfo, url, studioSettings.autoSaveDesktop, isDesktop, saveJobToDesktopFolder, showToast]);

  // Synchronize activeTrack whenever a job completes
  useEffect(() => {
    if (currentJob && currentJob.status === 'completed' && (!activeTrack || activeTrack.jobId !== currentJob.id)) {
      const track = {
        jobId: currentJob.id,
        title: currentJob.title || videoInfo?.title || 'Converted Audio',
        artist: currentJob.artist || videoInfo?.uploader || 'YouTube Artist',
        thumbnail: currentJob.thumbnail || videoInfo?.thumbnail || '',
        format: currentJob.format,
        quality: currentJob.quality
      };
      setActiveTrack(track);
    }
  }, [currentJob, activeTrack, videoInfo]);

  // Fetch media metadata (supports single tracks and full playlists)
  const handleFetchInfo = async (fetchOpts = {}) => {
    const targetUrl = (fetchOpts.overrideUrl || url).trim();
    if (!targetUrl) return;

    setError(null);
    setIsLoadingInfo(true);
    setVideoInfo(null);
    setCurrentJob(null);
    setSelectedPlaylistIndices([]);
    setActiveSlideIndex(0);

    try {
      const res = await fetch(`${API_BASE}/api/info`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: targetUrl, playlist: Boolean(fetchOpts.playlist) })
      });

      const contentType = res.headers.get('content-type') || '';
      if (contentType.includes('text/html')) {
        throw new Error('Backend server is unreachable. Please verify that the local server is running on http://localhost:3001.');
      }

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || 'Failed to fetch video details.');
      }

      setVideoInfo(json.data);
      if (json.data?.isPlaylist && Array.isArray(json.data.playlistEntries)) {
        setSelectedPlaylistIndices(json.data.playlistEntries.map((_, idx) => idx));
      }
      if (json.data && Array.isArray(json.data.presets) && json.data.presets.length > 0) {
        const recommended = json.data.presets.find((p) => p.recommended) || json.data.presets[0];
        if (recommended) {
          setFormat(recommended.format);
          if (recommended.quality) setBitrate(recommended.quality);
        }
      }
    } catch (err) {
      setError(err.message || 'Unable to load media URL. Please check the URL.');
    } finally {
      setIsLoadingInfo(false);
    }
  };

  // Poll active batch playlist jobs until all settle
  useEffect(() => {
    const pendingJobs = batchJobs.filter((j) =>
      ['queued', 'starting', 'downloading', 'converting', 'tagging'].includes(j.status)
    );
    if (pendingJobs.length === 0) return;

    const timer = setInterval(async () => {
      try {
        const updates = await Promise.all(
          pendingJobs.map((item) =>
            fetch(`${API_BASE}/api/job/${item.jobId || item.id}`)
              .then((r) => (r.ok ? r.json() : null))
              .catch(() => null)
          )
        );
        const byId = new Map();
        updates.forEach((res) => {
          if (res?.job?.id) {
            byId.set(res.job.id, res.job);
            if (res.job.status === 'completed' && !recordedBatchIdsRef.current.has(res.job.id)) {
              recordedBatchIdsRef.current.add(res.job.id);
              recordCompletedJob(res.job);
            }
          }
        });
        if (byId.size > 0) {
          setBatchJobs((prev) =>
            prev.map((existing) => {
              const id = existing.jobId || existing.id;
              const updated = byId.get(id);
              return updated ? { ...existing, ...updated, jobId: id } : existing;
            })
          );
        }
      } catch {}
    }, 1200);

    return () => clearInterval(timer);
  }, [batchJobs, recordCompletedJob]);

  const handleTogglePlaylistItem = (idx) => {
    setSelectedPlaylistIndices((prev) =>
      prev.includes(idx) ? prev.filter((i) => i !== idx) : [...prev, idx].sort((a, b) => a - b)
    );
  };

  const handleToggleAllPlaylistItems = () => {
    const entries = videoInfo?.playlistEntries || [];
    if (selectedPlaylistIndices.length === entries.length) {
      setSelectedPlaylistIndices([]);
    } else {
      setSelectedPlaylistIndices(entries.map((_, i) => i));
    }
  };

  const handleStartBatchConversion = async () => {
    const entries = videoInfo?.playlistEntries || [];
    const selectedItems = selectedPlaylistIndices.map((idx) => entries[idx]).filter(Boolean);
    if (selectedItems.length === 0) {
      setError('Please select at least one track from the playlist to convert.');
      return;
    }

    setError(null);
    setIsConverting(true);
    try {
      const res = await fetch(`${API_BASE}/api/convert-batch`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: selectedItems,
          format,
          quality: bitrate,
          turbo: true,
          trimStart: trimStart.trim(),
          trimEnd: trimEnd.trim(),
          normalizeAudio: Boolean(normalizeAudio),
          sponsorBlock: Boolean(sponsorBlock)
        })
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || 'Batch queue submission failed.');
      }
      setBatchJobs(json.jobs || []);
      showToast({
        type: 'success',
        message: `Queued ${json.count || selectedItems.length} playlist tracks (3 parallel workers + FIFO queue).`
      }, 5000);
    } catch (err) {
      setError(err.message || 'Batch conversion failed.');
    } finally {
      setIsConverting(false);
    }
  };

  // 1-Click Direct Individual Slide Download (Non-blocking browser stream)
  const handleDownloadSpecificSlide = (slideIdx) => {
    if (!videoInfo || !videoInfo.photos || !videoInfo.photos[slideIdx]) return;
    setActiveSlideIndex(slideIdx);
    const photo = videoInfo.photos[slideIdx];
    const safeTitle = (videoInfo.title || 'photo').replace(/[/\\?%*:|"<>/\0\r\n]/g, '_').slice(0, 50).trim();
    const filename = `${safeTitle}_slide_${String(slideIdx + 1).padStart(2, '0')}.jpg`;
    const directUrl = `${API_BASE}/api/photo-download?url=${encodeURIComponent(photo.url)}&filename=${encodeURIComponent(filename)}`;
    const a = document.createElement('a');
    a.href = directUrl;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  // Trigger conversion
  const handleStartConversion = async (overrideFormat) => {
    if (!videoInfo && !url) return;

    const targetFormat = overrideFormat || format;

    if (targetFormat === 'cover') {
      const coverUrl = videoInfo?.thumbnail;
      if (coverUrl) {
        const a = document.createElement('a');
        a.href = coverUrl;
        a.download = `${(videoInfo?.title || 'media').replace(/[^a-zA-Z0-9_-]/g, '_')}_cover.jpg`;
        a.target = '_blank';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        return;
      }
    }

    const isSelectiveSlide = videoInfo?.isPhoto && targetFormat !== 'zip';
    const targetPhotos = isSelectiveSlide && Array.isArray(videoInfo.photos) && videoInfo.photos.length > 0
      ? [videoInfo.photos[activeSlideIndex] || videoInfo.photos[0]]
      : (Array.isArray(videoInfo?.photos) ? videoInfo.photos : []);

    setError(null);
    setIsConverting(true);
    setCurrentJob({
      status: 'starting',
      progress: 0,
      format: targetFormat,
      quality: bitrate
    });

    try {
      const res = await fetch(`${API_BASE}/api/convert`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url: videoInfo ? (videoInfo.url || url) : url,
          format: targetFormat,
          quality: bitrate,
          turbo: true,
          title: videoInfo
            ? (isSelectiveSlide && videoInfo.isCarousel
                ? `${videoInfo.title} - Slide ${activeSlideIndex + 1}`
                : videoInfo.title)
            : '',
          artist: videoInfo ? (videoInfo.uploader || videoInfo.author || '') : '',
          thumbnail: isSelectiveSlide && videoInfo.photos?.[activeSlideIndex]?.url
            ? videoInfo.photos[activeSlideIndex].url
            : (videoInfo ? videoInfo.thumbnail : ''),
          isPhoto: Boolean(videoInfo?.isPhoto),
          photos: targetPhotos,
          slideIndex: isSelectiveSlide ? activeSlideIndex + 1 : undefined,
          trimStart: trimStart.trim(),
          trimEnd: trimEnd.trim(),
          normalizeAudio: Boolean(normalizeAudio),
          sponsorBlock: Boolean(sponsorBlock)
        })
      });

      const contentType = res.headers.get('content-type') || '';
      if (contentType.includes('text/html')) {
        throw new Error('Backend server is unreachable. Please verify that the local server is running on http://localhost:3001.');
      }

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || 'Failed to start conversion.');
      }

      const jobId = json.jobId;
      listenToProgress(jobId);
    } catch (err) {
      setError(err.message || 'Conversion initiation failed.');
      setIsConverting(false);
      setCurrentJob(null);
    }
  };

  // Listen to real-time progress via Server-Sent Events (SSE)
  const listenToProgress = (jobId) => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
    }
    const eventSource = new EventSource(`${API_BASE}/api/progress/${jobId}`);
    eventSourceRef.current = eventSource;

    eventSource.onmessage = (event) => {
      try {
        const job = JSON.parse(event.data);
        setCurrentJob(job);

        if (job.status === 'completed') {
          eventSource.close();
          eventSourceRef.current = null;
          setIsConverting(false);
          recordCompletedJob(job);
        } else if (job.status === 'failed' || job.status === 'cancelled') {
          eventSource.close();
          eventSourceRef.current = null;
          setIsConverting(false);
          if (job.status === 'failed') {
            setError(job.error || 'Conversion failed. Please try again.');
          }
        }
      } catch (err) {
        console.error('SSE parse error:', err);
      }
    };

    eventSource.onerror = () => {
      console.warn('SSE connection lost, polling fallback...');
      eventSource.close();
      // Polling fallback
      pollProgress(jobId);
    };
  };

  // Fallback Polling in case SSE is blocked
  const pollProgress = async (jobId) => {
    const interval = setInterval(async () => {
      try {
        const res = await fetch(`${API_BASE}/api/job/${jobId}`);
        const data = await res.json();
        if (data && data.job) {
          setCurrentJob(data.job);
          if (data.job.status === 'completed' || data.job.status === 'failed') {
            clearInterval(interval);
            setIsConverting(false);

            if (data.job.status === 'completed') {
              recordCompletedJob(data.job);
            } else if (data.job.status === 'failed') {
              setError(data.job.error || 'Conversion failed. Please try again.');
            }
          }
        }
      } catch (e) {
        clearInterval(interval);
        setIsConverting(false);
      }
    }, 1000);
  };

  // Cancel an in-progress conversion
  const handleCancelConversion = async () => {
    if (!currentJob?.id) return;
    try {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
        eventSourceRef.current = null;
      }
      await fetch(`${API_BASE}/api/cancel/${currentJob.id}`, { method: 'POST' });
    } catch (e) {
      console.warn('Cancel request error:', e);
    } finally {
      setIsConverting(false);
      setCurrentJob(null);
    }
  };

  // Queue navigation index
  const currentTrackIndex = activeTrack
    ? history.findIndex((item) => item.id === activeTrack.jobId)
    : -1;

  const handleNextTrack = () => {
    if (currentTrackIndex !== -1 && currentTrackIndex < history.length - 1) {
      const nextItem = history[currentTrackIndex + 1];
      handleSelectHistoryTrack(nextItem);
    }
  };

  const handlePrevTrack = () => {
    if (currentTrackIndex > 0) {
      const prevItem = history[currentTrackIndex - 1];
      handleSelectHistoryTrack(prevItem);
    }
  };

  // Re-convert a historical track
  const handleReconvert = (mediaUrl) => {
    if (!mediaUrl) return;
    setUrl(mediaUrl);
    setError(null);
    setIsLoadingInfo(true);
    setVideoInfo(null);
    setCurrentJob(null);

    setActiveSlideIndex(0);
    fetch(`${API_BASE}/api/info`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url: mediaUrl.trim() })
    })
      .then((res) => res.json())
      .then((json) => {
        if (json.success && json.data) {
          setVideoInfo(json.data);
      if (json.data && Array.isArray(json.data.presets) && json.data.presets.length > 0) {
        const recommended = json.data.presets.find((p) => p.recommended) || json.data.presets[0];
        if (recommended) {
          setFormat(recommended.format);
          if (recommended.quality) setBitrate(recommended.quality);
        }
      }
        } else {
          throw new Error(json.error || 'Failed to fetch video details.');
        }
      })
      .catch((err) => {
        setError(err.message || 'Unable to load media details.');
      })
      .finally(() => {
        setIsLoadingInfo(false);
      });
  };

  const handleClear = () => {
    if (isConverting) {
      handleCancelConversion();
    }
    setUrl('');
    setVideoInfo(null);
    setCurrentJob(null);
    setError(null);
    setActiveSlideIndex(0);
    setTrimStart('');
    setTrimEnd('');
  };

  const handleSelectHistoryTrack = (item) => {
    setActiveTrack({
      jobId: item.id,
      title: item.title,
      artist: item.artist,
      thumbnail: item.thumbnail,
      format: item.format,
      quality: item.quality
    });
  };

  const handleClearHistory = () => {
    setHistory([]);
    try {
      localStorage.removeItem('sonicwave_history');
    } catch {}
  };

  const handleDeleteHistoryItem = (itemId) => {
    setHistory((prev) => prev.filter((item) => item.id !== itemId));
  };

  const handleUpdateEngine = useCallback(async () => {
    if (isUpdatingEngine) return;
    setIsUpdatingEngine(true);
    const loadingMsg = 'Checking & updating yt-dlp core engine...';
    setEngineUpdateStatus({ type: 'info', message: loadingMsg });
    showToast({ type: 'info', message: loadingMsg }, 0);

    try {
      const res = await fetch(`${API_BASE}/api/binaries/update`, { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        const msg = `yt-dlp binary updated to ${data.version || 'latest'}.`;
        setEngineUpdateStatus({ type: 'success', message: msg });
        showToast({ type: 'success', message: msg }, 5500);
        checkStatus();
      } else {
        const msg = data.output || data.message || data.error || 'Engine update did not complete.';
        setEngineUpdateStatus({ type: 'error', message: msg });
        showToast({ type: 'error', message: `Engine update: ${msg}` }, 6500);
      }
    } catch (err) {
      const msg = `Update request error: ${err.message}`;
      setEngineUpdateStatus({ type: 'error', message: msg });
      showToast({ type: 'error', message: msg }, 6500);
    } finally {
      setIsUpdatingEngine(false);
    }
  }, [isUpdatingEngine, checkStatus, showToast]);

  return (
    <div className={`spotify-app-layout ${activeTrack ? 'has-bottom-player' : ''}`}>
      {/* Left Sidebar */}
      <aside className="spotify-sidebar" aria-label="Spotify Navigation Sidebar">
        {/* Navigation Card */}
        <div className="sidebar-nav-card">
          <a href="#home" className="spotify-brand-link" aria-label="SonicWave Home">
            <Logo size="md" variant="full" showTag={true} />
          </a>

          <ul className="sidebar-nav-list">
            <li>
              <a href="#home" className="sidebar-nav-item active">
                <Home size={22} />
                <span>Home</span>
              </a>
            </li>
            <li>
              <a
                href="#yt-url-input"
                className="sidebar-nav-item"
                onClick={() => {
                  const input = document.getElementById('yt-url-input');
                  if (input) input.focus();
                }}
              >
                <Search size={22} />
                <span>Search & Convert</span>
              </a>
            </li>
          </ul>
        </div>

        {/* Your Library Card */}
        <div className="sidebar-library-card">
          <div className="sidebar-library-header">
            <div className="sidebar-library-title">
              <Library size={22} />
              <span>Your Library</span>
            </div>
            {history.length > 0 && (
              <span style={{ fontSize: '11px', color: 'var(--text-subdued)' }}>
                {history.length} {history.length === 1 ? 'track' : 'tracks'}
              </span>
            )}
          </div>

          <div className="sidebar-history-list">
            {history.length === 0 ? (
              <div style={{ padding: '16px 8px', color: 'var(--text-muted)', fontSize: '12px', lineHeight: 1.4 }}>
                No recent conversions yet. Paste a link from YouTube, Instagram, TikTok, Twitter/X, SoundCloud, or Reddit above!
              </div>
            ) : (
              history.map((item) => (
                <div
                  key={item.id}
                  className="sidebar-history-item"
                  onClick={() => handleSelectHistoryTrack(item)}
                  title={item.title}
                >
                  {item.thumbnail ? (
                    <img src={item.thumbnail} alt={item.title} className="sidebar-history-thumb" loading="lazy" decoding="async" />
                  ) : (
                    <div
                      className="sidebar-history-thumb"
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        backgroundColor: 'var(--bg-pill)'
                      }}
                    >
                      <Music2 size={16} style={{ color: 'var(--spotify-green)' }} />
                    </div>
                  )}

                  <div className="sidebar-history-info">
                    <span className="sidebar-history-name">{item.title || 'Audio File'}</span>
                    <span className="sidebar-history-artist">
                      {item.artist || 'Media'} &bull; {item.format?.toUpperCase()}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Sidebar Turbo Engine Badge */}
          <div className="sidebar-turbo-badge">
            <div className="sidebar-turbo-top">
              <Zap size={12} fill="var(--spotify-green)" />
              <span>16x Parallel Engine</span>
            </div>
            <p className="sidebar-turbo-desc">
              16-stream parallel acceleration. Works on YouTube, Instagram, TikTok, X, SoundCloud &amp; 1000+ sites.
            </p>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="spotify-main-content">
        {/* Sticky Top Bar */}
        <header className="spotify-top-bar">
          <div className="top-bar-left">
            <a href="#home" className="top-bar-brand-link" aria-label="SonicWave Home">
              <Logo size="sm" variant="full" showTag={false} className="top-bar-logo" />
            </a>
            <div className="top-bar-nav-arrows">
              <button
                type="button"
                className="nav-arrow-btn"
                onClick={handlePrevTrack}
                disabled={currentTrackIndex <= 0}
                title="Previous Track in Library"
              >
                <ChevronLeft size={20} />
              </button>
              <button
                type="button"
                className="nav-arrow-btn"
                onClick={handleNextTrack}
                disabled={currentTrackIndex === -1 || currentTrackIndex >= history.length - 1}
                title="Next Track in Library"
              >
                <ChevronRight size={20} />
              </button>
            </div>
          </div>

          <div className="top-bar-actions">
            <button
              type="button"
              className="top-bar-action-pill"
              onClick={() => setIsCmdOpen(true)}
              title="Open Command Palette (⌘K / Ctrl+K)"
              style={{ background: 'rgba(255, 255, 255, 0.06)', borderColor: 'rgba(255, 255, 255, 0.15)', color: '#ffffff' }}
            >
              <CommandIcon size={12} />
              <span>⌘K Quick Menu</span>
            </button>

            <button
              type="button"
              className="top-bar-action-pill"
              onClick={() => setIsSettingsOpen(true)}
              title="Open Studio Preferences & Engine Controls"
              style={{ background: 'rgba(30, 215, 96, 0.1)', borderColor: 'rgba(30, 215, 96, 0.35)', color: 'var(--spotify-green)' }}
            >
              <SlidersHorizontal size={12} />
              <span>Studio Settings</span>
            </button>

            {onNavigate && (
              <button
                type="button"
                className="top-bar-action-pill"
                onClick={() => onNavigate('landing', '/landing')}
                title="Go to SonicWave Overview"
                style={{ background: 'rgba(255, 255, 255, 0.04)', borderColor: 'rgba(255, 255, 255, 0.12)', color: 'var(--text-subdued)' }}
              >
                <span>Overview &amp; Docs</span>
              </button>
            )}

            {systemStatus?.disconnected ? (
              <div
                className="status-indicator-pill"
                style={{
                  backgroundColor: 'rgba(243, 114, 127, 0.12)',
                  borderColor: 'rgba(243, 114, 127, 0.35)',
                  color: 'var(--text-negative)'
                }}
                title="Local backend server is unreachable"
              >
                <AlertTriangle size={12} />
                <span>Engine Disconnected</span>
              </div>
            ) : !systemStatus?.ready ? (
              <div
                className="status-indicator-pill"
                style={{
                  backgroundColor: 'rgba(255, 164, 43, 0.12)',
                  borderColor: 'rgba(255, 164, 43, 0.35)',
                  color: 'var(--text-warning)'
                }}
                title="Initializing yt-dlp & FFmpeg binaries"
              >
                <Loader2 size={12} className="spinner" />
                <span>Engine Initializing...</span>
              </div>
            ) : (
              <div className="status-indicator-pill" title="16-Stream Turbo Acceleration Active">
                <Zap size={12} fill="var(--spotify-green)" />
                <span>Universal 16x Multi-Stream Active</span>
              </div>
            )}
          </div>
        </header>

        {/* Spotify Hero Banner */}
        <div className="spotify-hero-banner" id="home">
          <div className="hero-pill-badge">
            <Music2 size={12} />
            <span>Universal Social Media & Video Downloader</span>
          </div>

          <h1 className="hero-title">
            Download from <span>All Social Apps</span> into Studio MP3 & MP4
          </h1>

          <p className="hero-subtitle">
            Download and convert videos, reels, clips, and songs from YouTube, Instagram, TikTok, Twitter/X, Facebook, SoundCloud, Reddit, Twitch, and 1,000+ platforms with 16-stream parallel turbo acceleration.
          </p>
        </div>

        {/* Converter Workspace */}
        <div className="spotify-workspace">
          <section className="spotify-card" aria-label="Audio Converter Card">
            {systemStatus?.disconnected ? (
              <div className="alert-box alert-warning" style={{ marginBottom: '16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
                  <AlertTriangle size={16} />
                  <span>
                    <strong>Backend Offline:</strong> Cannot connect to local server on port 3001. Please run <code>start.bat</code> to launch the backend.
                  </span>
                </div>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <button
                    type="button"
                    className="btn-dark-pill"
                    onClick={checkStatus}
                    style={{ fontSize: '11px', padding: '4px 10px', borderColor: 'var(--text-warning)', color: 'var(--text-warning)' }}
                  >
                    Retry Connection
                  </button>
                  {onNavigate && (
                    <button
                      type="button"
                      className="btn-dark-pill"
                      onClick={() => onNavigate('landing', '/landing')}
                      style={{ fontSize: '11px', padding: '4px 10px' }}
                    >
                      Download App
                    </button>
                  )}
                </div>
              </div>
            ) : !systemStatus?.ready ? (
              <div className="alert-box alert-warning" style={{ marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Loader2 size={16} className="spinner" style={{ color: 'var(--text-warning)' }} />
                <span>
                  <strong>Bootstrapping Engine:</strong> Verifying local yt-dlp &amp; FFmpeg binaries. This takes just a moment on first launch...
                </span>
              </div>
            ) : null}

            <UrlInput
              url={url}
              setUrl={setUrl}
              onSubmit={handleFetchInfo}
              isLoading={isLoadingInfo}
              onClear={handleClear}
              onOpenCommandPalette={() => setIsCmdOpen(true)}
            />

            {error && (
              <div className="alert-box alert-error">
                <AlertTriangle size={16} />
                <span>{error}</span>
              </div>
            )}

            {/* Video Preview & Options */}
            {videoInfo && (
              <div style={{ marginTop: '20px' }}>
                <VideoPreview
                  video={videoInfo}
                  activeSlideIndex={activeSlideIndex}
                  setActiveSlideIndex={setActiveSlideIndex}
                  onDownloadSlide={handleDownloadSpecificSlide}
                  onDownloadAll={() => {
                    setFormat('zip');
                    handleStartConversion('zip');
                  }}
                  isConverting={isConverting}
                  selectedPlaylistIndices={selectedPlaylistIndices}
                  onTogglePlaylistItem={handleTogglePlaylistItem}
                  onToggleAllPlaylistItems={handleToggleAllPlaylistItems}
                  onLoadPlaylist={() => handleFetchInfo({ playlist: true })}
                />

                <OptionsSelector
                  bitrate={bitrate}
                  setBitrate={setBitrate}
                  format={format}
                  setFormat={setFormat}
                  isConverting={isConverting}
                  videoInfo={videoInfo}
                  activeSlideIndex={activeSlideIndex}
                  setActiveSlideIndex={setActiveSlideIndex}
                  trimStart={trimStart}
                  setTrimStart={setTrimStart}
                  trimEnd={trimEnd}
                  setTrimEnd={setTrimEnd}
                  normalizeAudio={normalizeAudio}
                  setNormalizeAudio={setNormalizeAudio}
                  sponsorBlock={sponsorBlock}
                  setSponsorBlock={setSponsorBlock}
                />

                <div style={{ marginTop: '24px', display: 'flex', justifyContent: 'flex-end' }}>
                  <button
                    id="start-convert-btn"
                    type="button"
                    className="btn-spotify-green"
                    onClick={() => (videoInfo?.isPlaylist ? handleStartBatchConversion() : handleStartConversion())}
                    disabled={
                      isConverting ||
                      systemStatus?.disconnected ||
                      !systemStatus?.ready ||
                      (videoInfo?.isPlaylist && selectedPlaylistIndices.length === 0)
                    }
                    style={{
                      opacity: (systemStatus?.disconnected || !systemStatus?.ready || (videoInfo?.isPlaylist && selectedPlaylistIndices.length === 0)) ? 0.6 : 1,
                      cursor: (systemStatus?.disconnected || !systemStatus?.ready || (videoInfo?.isPlaylist && selectedPlaylistIndices.length === 0)) ? 'not-allowed' : 'pointer'
                    }}
                  >
                    {videoInfo?.isPhoto ? <ImageIcon size={16} /> : (format === 'mp4' ? <Video size={16} /> : <Music2 size={16} />)}
                    <span>
                      {isConverting
                        ? (videoInfo?.isPhoto ? 'DOWNLOADING PHOTOS...' : 'CONVERTING...')
                        : systemStatus?.disconnected
                          ? 'BACKEND OFFLINE'
                          : !systemStatus?.ready
                            ? 'BOOTSTRAPPING ENGINE...'
                            : videoInfo?.isPlaylist
                              ? `QUEUE ${selectedPlaylistIndices.length} TRACK${selectedPlaylistIndices.length === 1 ? '' : 'S'} (${format.toUpperCase()} • ${bitrate})`
                              : videoInfo?.isPhoto
                                ? (format === 'zip'
                                    ? `DOWNLOAD ALL ${videoInfo.photos?.length || videoInfo.itemCount || ''} PHOTOS (.ZIP)`
                                    : (videoInfo.isCarousel
                                        ? `DOWNLOAD SLIDE #${activeSlideIndex + 1} (${format.toUpperCase()})`
                                        : `DOWNLOAD ORIGINAL PHOTO (${format.toUpperCase()})`))
                                : format === 'mp4'
                                  ? `DOWNLOAD MP4 VIDEO (${bitrate})`
                                  : `CONVERT TO ${format.toUpperCase()} (${bitrate})`}
                    </span>
                  </button>
                </div>
              </div>
            )}

            {/* Conversion Progress Bar */}
            {currentJob && (
              <ProgressBar
                job={currentJob}
                onCancel={handleCancelConversion}
                isDesktop={isDesktop}
                savedFilePath={savedFilePaths[currentJob.id] || ''}
                onOpenFolder={() => handleRevealInFolder(currentJob)}
              />
            )}

            {/* Batch Playlist Conversion Queue Tracker */}
            {batchJobs.length > 0 && (
              <div className="batch-jobs-panel">
                <div className="batch-jobs-header">
                  <span>Playlist Batch Queue ({batchJobs.filter((j) => j.status === 'completed').length}/{batchJobs.length} completed)</span>
                  <button
                    type="button"
                    className="btn-dark-pill"
                    onClick={() => setBatchJobs([])}
                    style={{ fontSize: '11px', padding: '4px 10px' }}
                  >
                    Clear Queue View
                  </button>
                </div>
                <div className="batch-jobs-list">
                  {batchJobs.map((bj) => {
                    const id = bj.jobId || bj.id;
                    return (
                      <div key={id} className="batch-job-row">
                        <div className="batch-job-meta">
                          <span className="batch-job-title">{bj.title || 'Queued Track'}</span>
                          <span className="batch-job-status">
                            {bj.status === 'queued'
                              ? `Queued (#${bj.queuePosition || '?'})`
                              : bj.status === 'completed'
                                ? 'Completed • Ready'
                                : bj.status === 'failed'
                                  ? (bj.error || 'Failed')
                                  : `${bj.status} (${bj.progress || 0}%)`}
                          </span>
                        </div>
                        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                          {bj.status === 'completed' && (
                            <>
                              <button
                                type="button"
                                className="btn-dark-pill"
                                onClick={() => handleSelectHistoryTrack({ ...bj, id })}
                                style={{ fontSize: '11px', padding: '4px 10px' }}
                              >
                                Play
                              </button>
                              <a
                                href={`${API_BASE}/api/download/${id}`}
                                download
                                className="btn-spotify-green"
                                style={{ fontSize: '11px', padding: '4px 12px', textDecoration: 'none' }}
                              >
                                Save
                              </a>
                            </>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </section>

          {/* Recent Conversions Tracklist Table */}
          {history.length > 0 && (
            <section className="spotify-card" aria-label="Recent Conversions">
              <HistorySection
                history={history}
                onSelectTrack={handleSelectHistoryTrack}
                onClearHistory={handleClearHistory}
                onDeleteItem={handleDeleteHistoryItem}
                onReconvert={handleReconvert}
              />
            </section>
          )}

          {/* Footer */}
          <footer className="spotify-footer">
            <p>
              SonicWave &bull; Spotify-Vibe Studio Converter &bull; Powered by yt-dlp &amp; FFmpeg
            </p>
            <div className="spotify-footer-links" style={{ display: 'flex', gap: '16px', justifyContent: 'center', marginTop: '10px', flexWrap: 'wrap' }}>
              <a href="https://ytmp-3-five.vercel.app/" target="_blank" rel="noopener noreferrer" onClick={(e) => { if (onNavigate) { e.preventDefault(); onNavigate('landing', '/landing'); } }}>Overview</a>
              <a href="https://ytmp-3-five.vercel.app/install" target="_blank" rel="noopener noreferrer" onClick={(e) => { if (onNavigate) { e.preventDefault(); onNavigate('install', '/install'); } }}>Setup Guide</a>
              <a href="https://ytmp-3-five.vercel.app/supported-platforms" target="_blank" rel="noopener noreferrer" onClick={(e) => { if (onNavigate) { e.preventDefault(); onNavigate('platforms-guide', '/supported-platforms'); } }}>Platforms</a>
              <a href="https://ytmp-3-five.vercel.app/troubleshooting" target="_blank" rel="noopener noreferrer" onClick={(e) => { if (onNavigate) { e.preventDefault(); onNavigate('troubleshooting', '/troubleshooting'); } }}>Troubleshooting</a>
              <a href="https://ytmp-3-five.vercel.app/about" target="_blank" rel="noopener noreferrer" onClick={(e) => { if (onNavigate) { e.preventDefault(); onNavigate('about', '/about'); } }}>About</a>
              <a href="https://ytmp-3-five.vercel.app/privacy" target="_blank" rel="noopener noreferrer" onClick={(e) => { if (onNavigate) { e.preventDefault(); onNavigate('privacy', '/privacy'); } }}>Privacy</a>
              <a href="https://ytmp-3-five.vercel.app/terms" target="_blank" rel="noopener noreferrer" onClick={(e) => { if (onNavigate) { e.preventDefault(); onNavigate('terms', '/terms'); } }}>Terms</a>
              <a href="https://ytmp-3-five.vercel.app/contact" target="_blank" rel="noopener noreferrer" onClick={(e) => { if (onNavigate) { e.preventDefault(); onNavigate('contact', '/contact'); } }}>Contact</a>
            </div>
          </footer>
        </div>
      </main>

      {/* Docked Spotify Bottom Audio/Video Player */}
      {activeTrack && (
        <AudioPlayer
          track={activeTrack}
          onNextTrack={handleNextTrack}
          onPrevTrack={handlePrevTrack}
          hasNext={currentTrackIndex !== -1 && currentTrackIndex < history.length - 1}
          hasPrev={currentTrackIndex > 0}
          autoPlay={studioSettings.autoPlay}
          onToggleAutoPlay={() => updateStudioSettings({ autoPlay: !studioSettings.autoPlay })}
          audioNormalization={studioSettings.audioNormalization}
          showVisualizer={studioSettings.showVisualizer}
          isDesktop={isDesktop}
          savedFilePath={savedFilePaths[activeTrack.jobId] || activeTrack.savedPath || ''}
          onOpenFolder={() => handleRevealInFolder(activeTrack)}
        />
      )}

      {/* SaaS Command Palette (Linear / Raycast Style) */}
      <CommandPalette
        isOpen={isCmdOpen}
        onClose={() => setIsCmdOpen(false)}
        onSelectFormat={(newFormat, newBitrate) => {
          setFormat(newFormat);
          setBitrate(newBitrate);
        }}
        onFocusInput={() => {
          const input = document.getElementById('yt-url-input');
          if (input) input.focus();
        }}
        onTogglePlay={() => {
          const playBtn = document.getElementById('play-pause-btn');
          if (playBtn) playBtn.click();
        }}
        isPlaying={!!activeTrack}
        onClearHistory={handleClearHistory}
        onUpdateEngine={handleUpdateEngine}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onOpenPricing={() => setIsSettingsOpen(true)}
        onNavigateStudio={() => { if (onNavigate) onNavigate('app', '/#app'); }}
        onNavigateLanding={() => { if (onNavigate) onNavigate('landing', '/'); }}
        currentView="app"
      />

      {/* Non-blocking In-App Status Toast */}
      {studioToast && (
        <div
          role="status"
          aria-live="polite"
          className={`studio-toast studio-toast-${studioToast.type || 'info'}`}
        >
          <span className="studio-toast-msg">{studioToast.message}</span>
          {studioToast.actionLabel && studioToast.onAction && (
            <button
              type="button"
              className="btn-dark-pill"
              onClick={studioToast.onAction}
              style={{ padding: '4px 10px', fontSize: '11px' }}
            >
              <FolderOpen size={12} />
              <span>{studioToast.actionLabel}</span>
            </button>
          )}
          <button
            type="button"
            className="btn-icon"
            onClick={() => setStudioToast(null)}
            aria-label="Dismiss notification"
            style={{ padding: 2 }}
          >
            <X size={14} />
          </button>
        </div>
      )}

      {/* Engine & Preferences Studio Settings Modal */}
      <StudioSettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        settings={studioSettings}
        onUpdateSettings={updateStudioSettings}
        systemStatus={systemStatus}
        onCheckStatus={checkStatus}
        onUpdateEngine={handleUpdateEngine}
        isUpdatingEngine={isUpdatingEngine}
        engineUpdateStatus={engineUpdateStatus}
        onClearHistory={handleClearHistory}
        historyCount={history.length}
      />
    </div>
  );
}
