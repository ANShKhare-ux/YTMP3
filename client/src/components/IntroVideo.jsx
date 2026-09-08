import React, { useState, useRef, useEffect } from 'react';

export default function IntroVideo({ isOpen, onClose }) {
  const [isClosing, setIsClosing] = useState(false);
  const videoRef = useRef(null);

  useEffect(() => {
    if (!isOpen) return;

    setIsClosing(false);

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        handleDismiss();
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    // Attempt autoplay
    const video = videoRef.current;
    if (video) {
      video.currentTime = 0;
      video.muted = true;
      const playPromise = video.play();
      if (playPromise !== undefined) {
        playPromise.catch((err) => {
          console.warn('Autoplay error:', err);
        });
      }
    }

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  const handleDismiss = () => {
    setIsClosing(true);
    setTimeout(() => {
      if (videoRef.current) {
        videoRef.current.pause();
      }
      onClose();
    }, 300);
  };

  if (!isOpen) return null;

  return (
    <div
      className={`sonicwave-intro-overlay ${isClosing ? 'closing' : ''}`}
      role="dialog"
      aria-modal="true"
      aria-label="SonicWave Brand Intro Animation"
      onClick={handleDismiss}
    >
      <video
        ref={videoRef}
        src="/SonicWaveIntro.mp4"
        className="intro-video-element"
        playsInline
        autoPlay
        muted
        onEnded={handleDismiss}
      />
    </div>
  );
}
