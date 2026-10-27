import React, { useState, useEffect, useRef } from 'react';
import {
  Search,
  Music,
  Video,
  Zap,
  Sparkles,
  RotateCw,
  Trash2,
  Play,
  Crown,
  Command,
  ArrowRight,
  Sliders,
  Check
} from 'lucide-react';

export default function CommandPalette({
  isOpen,
  onClose,
  onSelectFormat,
  onFocusInput,
  onTogglePlay,
  isPlaying,
  onClearHistory,
  onUpdateEngine,
  onOpenPricing,
  onNavigateStudio,
  onNavigateLanding,
  onReplayIntro,
  currentView = 'app'
}) {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setSelectedIndex(0);
      setTimeout(() => {
        if (inputRef.current) inputRef.current.focus();
      }, 50);
    }
  }, [isOpen]);

  const allActions = [
    ...(onReplayIntro ? [{
      id: 'replay-intro',
      category: 'Experience',
      title: 'Play Cinematic Intro',
      subtitle: 'Watch the full SonicWave visual motion identity intro',
      icon: <Sparkles size={16} style={{ color: 'var(--spotify-green)' }} />,
      action: () => { onReplayIntro(); onClose(); }
    }] : []),
    ...(onNavigateLanding && onNavigateStudio ? [{
      id: 'nav-view-toggle',
      category: 'Navigation',
      title: currentView === 'landing' ? 'Open Local Converter' : 'Go to Windows Product Landing Page',
      subtitle: currentView === 'landing' ? 'Open the local converter' : 'Explore features, 16x speed comparison, and system specs',
      icon: <Sparkles size={16} style={{ color: 'var(--spotify-green)' }} />,
      action: () => {
        if (currentView === 'landing') {
          if (onNavigateStudio) onNavigateStudio();
        } else {
          if (onNavigateLanding) onNavigateLanding();
        }
        onClose();
      }
    }] : []),
    {
      id: 'focus-input',
      category: 'Navigation',
      title: 'Paste & Convert Link',
      subtitle: 'Focus search input to paste a new video or audio link',
      icon: <Search size={16} style={{ color: 'var(--spotify-green)' }} />,
      action: () => { onFocusInput(); onClose(); }
    },
    {
      id: 'play-toggle',
      category: 'Playback',
      title: isPlaying ? 'Pause Active Track' : 'Play Active Track',
      subtitle: 'Toggle bottom player playback (Space)',
      icon: <Play size={16} style={{ color: 'var(--spotify-green)' }} />,
      action: () => { onTogglePlay(); onClose(); }
    },
    {
      id: 'format-mp3-320',
      category: 'Format Presets',
      title: 'Preset: MP3 (320 kbps Studio HQ)',
      subtitle: 'Highest quality audio encoding with metadata',
      icon: <Music size={16} style={{ color: 'var(--spotify-green)' }} />,
      action: () => { onSelectFormat('mp3', '320k'); onClose(); }
    },
    {
      id: 'format-m4a-turbo',
      category: 'Format Presets',
      title: 'Preset: M4A (Zero-Reencode Turbo)',
      subtitle: 'Instant native stream copy without CPU transcoding',
      icon: <Zap size={16} style={{ color: 'var(--spotify-green)' }} />,
      action: () => { onSelectFormat('m4a', '320k'); onClose(); }
    },
    {
      id: 'format-mp4-1080',
      category: 'Format Presets',
      title: 'Preset: MP4 Video (1080p Full HD)',
      subtitle: 'High definition video with combined stereo audio',
      icon: <Video size={16} style={{ color: 'var(--text-announcement)' }} />,
      action: () => { onSelectFormat('mp4', '1080p'); onClose(); }
    },
    {
      id: 'format-flac',
      category: 'Format Presets',
      title: 'Preset: FLAC Lossless Audio',
      subtitle: 'Pure uncompressed studio master audio',
      icon: <Sliders size={16} style={{ color: 'var(--spotify-green)' }} />,
      action: () => { onSelectFormat('flac', '320k'); onClose(); }
    },
    {
      id: 'open-pricing',
      category: 'SaaS Capabilities',
      title: 'View Studio Pro Capabilities & Plans',
      subtitle: 'Compare local 16-stream features vs standard converters',
      icon: <Crown size={16} style={{ color: '#ffd700' }} />,
      action: () => { onOpenPricing(); onClose(); }
    },

    {
      id: 'update-engine',
      category: 'Engine Control',
      title: 'Update yt-dlp Core Engine',
      subtitle: 'Self-update the extraction binary to the latest YouTube cipher',
      icon: <RotateCw size={16} style={{ color: 'var(--text-warning)' }} />,
      action: () => { onUpdateEngine(); onClose(); }
    },
    {
      id: 'clear-history',
      category: 'Maintenance',
      title: 'Clear Conversion History',
      subtitle: 'Wipe all saved track entries from local storage',
      icon: <Trash2 size={16} style={{ color: 'var(--text-negative)' }} />,
      action: () => { onClearHistory(); onClose(); }
    }
  ];

  const filteredActions = allActions.filter(item => {
    const term = query.toLowerCase();
    return (
      item.title.toLowerCase().includes(term) ||
      item.subtitle.toLowerCase().includes(term) ||
      item.category.toLowerCase().includes(term)
    );
  });

  const handleKeyDown = (e) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev => (prev + 1) % (filteredActions.length || 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => (prev - 1 + filteredActions.length) % (filteredActions.length || 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (filteredActions[selectedIndex]) {
        filteredActions[selectedIndex].action();
      }
    } else if (e.key === 'Escape') {
      e.preventDefault();
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="cmd-palette-backdrop"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="SonicWave Command Palette"
    >
      <div
        className="cmd-palette-window"
        onClick={(e) => e.stopPropagation()}
        onKeyDown={handleKeyDown}
      >
        {/* Search Input Bar */}
        <div className="cmd-palette-input-row">
          <Search size={18} style={{ color: 'var(--text-subdued)', flexShrink: 0 }} />
          <input
            ref={inputRef}
            type="text"
            className="cmd-palette-input"
            placeholder="Type a command or format preset... (e.g. 1080p, MP3, update)"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
          />
          <div className="cmd-palette-shortcut-badge">
            <Command size={11} />
            <span>ESC</span>
          </div>
        </div>

        {/* Action Results List */}
        <div className="cmd-palette-list">
          {filteredActions.length === 0 ? (
            <div className="cmd-palette-empty">
              <span>No matching commands found.</span>
            </div>
          ) : (
            filteredActions.map((item, idx) => {
              const isSelected = idx === selectedIndex;
              return (
                <div
                  key={item.id}
                  className={`cmd-palette-item ${isSelected ? 'selected' : ''}`}
                  onMouseEnter={() => setSelectedIndex(idx)}
                  onClick={() => item.action()}
                >
                  <div className="cmd-palette-item-icon">
                    {item.icon}
                  </div>
                  <div className="cmd-palette-item-details">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span className="cmd-palette-item-title">{item.title}</span>
                      <span className="cmd-palette-item-cat">{item.category}</span>
                    </div>
                    <span className="cmd-palette-item-desc">{item.subtitle}</span>
                  </div>
                  <div className="cmd-palette-item-arrow">
                    <ArrowRight size={14} />
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer info bar */}
        <div className="cmd-palette-footer">
          <div className="cmd-palette-footer-keys">
            <span>Use <strong>&uarr;&darr;</strong> to navigate</span>
            <span>&bull;</span>
            <span><strong>Enter</strong> to select</span>
            <span>&bull;</span>
            <span><strong>ESC</strong> to dismiss</span>
          </div>
          <span style={{ color: 'var(--spotify-green)', fontWeight: 600 }}>SonicWave</span>
        </div>
      </div>
    </div>
  );
}
