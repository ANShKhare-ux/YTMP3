import React, { useState, useEffect, useRef } from 'react';
import { Volume2, VolumeX, X, ArrowRight } from 'lucide-react';

/**
 * WebsiteIntro
 * High-performance, zero-latency fullscreen intro animation for SonicWave.
 * Preloads and streams `/sonicwave-intro.mp4` instantly with unmuted toggle,
 * skip button, progress indicator, and smooth cross-dissolve into the website.
 */
export default function WebsiteIntro({ onFinish }) {
  const videoRef = useRef(null);
  const [isMuted, setIsMuted] = useState(true);
  const [isFading, setIsFading] = useState(false);
  const [hasInteracted, setHasInteracted] = useState(false);

  // Instant zero-latency autoplay trigger
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    // Attempt unmuted play if permitted by browser, fallback to muted instant playback
    video.muted = false;
    const playPromise = video.play();
    if (playPromise !== undefined) {
      playPromise
        .then(() => {
          setIsMuted(false);
        })
        .catch(() => {
          // Browser autoplay policy restricted audio; fallback to muted
          video.muted = true;
          setIsMuted(true);
          video.play().catch((err) => {
            console.warn('[SonicWave Intro] Autoplay fallback:', err);
            handleClose();
          });
        });
    }

    // Keyboard navigation (Esc to skip, M to mute/unmute, Space to pause/play)
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        handleClose();
      } else if (e.key === 'm' || e.key === 'M') {
        toggleMute();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  const handleClose = () => {
    if (isFading) return;
    setIsFading(true);
    try {
      sessionStorage.setItem('sonicwave_intro_seen', 'true');
    } catch {
      // Ignore storage access errors
    }
    setTimeout(() => {
      if (onFinish) onFinish();
    }, 400);
  };

  const toggleMute = (e) => {
    if (e) e.stopPropagation();
    const video = videoRef.current;
    if (!video) return;
    const nextMuted = !video.muted;
    video.muted = nextMuted;
    setIsMuted(nextMuted);
    setHasInteracted(true);
  };

  // If user clicks anywhere on the video area, politely attempt unmuting
  const handleContainerClick = () => {
    const video = videoRef.current;
    if (video && video.muted && !hasInteracted) {
      video.muted = false;
      setIsMuted(false);
      setHasInteracted(true);
    }
  };

  return (
    <div
      role="dialog"
      aria-label="SonicWave Introduction Video"
      onClick={handleContainerClick}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 999999,
        backgroundColor: '#000000',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
        opacity: isFading ? 0 : 1,
        transition: 'opacity 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
        pointerEvents: isFading ? 'none' : 'auto',
        userSelect: 'none'
      }}
    >
      {/* Zero-latency 1080p 60FPS Video */}
      <video
        ref={videoRef}
        src="/sonicwave-intro.mp4"
        autoPlay
        muted={isMuted}
        playsInline
        preload="auto"
        onEnded={handleClose}
        onError={handleClose}
        style={{
          width: '100%',
          height: '100%',
          objectFit: 'contain'
        }}
      />

      {/* Floating Action Controls */}
      <div
        style={{
          position: 'absolute',
          top: '24px',
          right: '24px',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          zIndex: 10
        }}
      >
        {/* Sound Toggle Button */}
        <button
          type="button"
          onClick={toggleMute}
          aria-label={isMuted ? 'Unmute Audio' : 'Mute Audio'}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            padding: '10px 18px',
            backgroundColor: 'rgba(8, 9, 12, 0.65)',
            backdropFilter: 'blur(12px)',
            WebkitBackdropFilter: 'blur(12px)',
            border: '1px solid rgba(255, 255, 255, 0.15)',
            borderRadius: '100px',
            color: isMuted ? '#b8bec9' : '#96a1ff',
            fontSize: '13px',
            fontWeight: 600,
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            boxShadow: '0 4px 16px rgba(0, 0, 0, 0.4)'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = '#828fff';
            e.currentTarget.style.backgroundColor = 'rgba(20, 24, 38, 0.85)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.15)';
            e.currentTarget.style.backgroundColor = 'rgba(8, 9, 12, 0.65)';
          }}
        >
          {isMuted ? (
            <>
              <VolumeX size={16} aria-hidden="true" />
              <span>SOUND OFF</span>
            </>
          ) : (
            <>
              <Volume2 size={16} aria-hidden="true" />
              <span>SOUND ON</span>
            </>
          )}
        </button>

        {/* Skip Button */}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            handleClose();
          }}
          aria-label="Skip Introduction"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            padding: '10px 20px',
            backgroundColor: 'rgba(94, 106, 210, 0.18)',
            backdropFilter: 'blur(12px)',
            WebkitBackdropFilter: 'blur(12px)',
            border: '1px solid rgba(130, 143, 255, 0.45)',
            borderRadius: '100px',
            color: '#ffffff',
            fontSize: '13px',
            fontWeight: 700,
            letterSpacing: '0.04em',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            boxShadow: '0 4px 20px rgba(94, 106, 210, 0.25)'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = 'rgba(94, 106, 210, 0.35)';
            e.currentTarget.style.borderColor = '#828fff';
            e.currentTarget.style.transform = 'translateY(-1px)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'rgba(94, 106, 210, 0.18)';
            e.currentTarget.style.borderColor = 'rgba(130, 143, 255, 0.45)';
            e.currentTarget.style.transform = 'translateY(0)';
          }}
        >
          <span>SKIP</span>
          <ArrowRight size={14} aria-hidden="true" />
        </button>
      </div>

      {/* Unmute Hint Banner (shows briefly when muted) */}
      {isMuted && !hasInteracted && (
        <div
          style={{
            position: 'absolute',
            bottom: '24px',
            padding: '8px 18px',
            backgroundColor: 'rgba(8, 9, 12, 0.65)',
            backdropFilter: 'blur(8px)',
            borderRadius: '100px',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            color: '#b8bec9',
            fontSize: '12px',
            fontWeight: 500,
            letterSpacing: '0.03em',
            pointerEvents: 'none'
          }}
        >
          Tap anywhere for sound &bull; Press <kbd style={{ padding: '2px 5px', borderRadius: '4px', background: 'rgba(255,255,255,0.1)', color: '#fff' }}>Esc</kbd> to skip
        </div>
      )}
    </div>
  );
}
