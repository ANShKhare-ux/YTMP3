import React, { useState, useEffect, useRef } from 'react';
import {
  Download,
  Zap,
  ShieldCheck,
  Music2,
  Video,
  Play,
  Pause,
  Volume2,
  VolumeX,
  CheckCircle2,
  XCircle,
  HelpCircle,
  ChevronDown,
  Terminal,
  Cpu,
  Layers,
  Sparkles,
  HardDrive,
  ExternalLink,
  Command as CommandIcon,
  Crown,
  X,
  FileCode,
  FolderArchive,
  ArrowRight
} from 'lucide-react';
import FlipText from './ui/FlipText';
import FaqAccordion from './ui/FaqAccordion';
import HalftoneWordmarkFooter from './ui/halftone-wordmark-footer';
import { gsap } from 'gsap';
import { useGSAP } from '@gsap/react';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { ScrollToPlugin } from 'gsap/ScrollToPlugin';
import { TextPlugin } from 'gsap/TextPlugin';
import { CustomEase } from 'gsap/CustomEase';
import { Observer } from 'gsap/Observer';
import { Draggable } from 'gsap/Draggable';
import { InertiaPlugin } from 'gsap/InertiaPlugin';
import { Flip } from 'gsap/Flip';
import { SplitText } from 'gsap/SplitText';
import { ScrambleTextPlugin } from 'gsap/ScrambleTextPlugin';
import { DrawSVGPlugin } from 'gsap/DrawSVGPlugin';
import { CustomBounce } from 'gsap/CustomBounce';
import { CustomWiggle } from 'gsap/CustomWiggle';
import { MotionPathPlugin } from 'gsap/MotionPathPlugin';
import { EasePack } from 'gsap/EasePack';

if (typeof window !== 'undefined') {
  gsap.registerPlugin(
    useGSAP,
    ScrollTrigger,
    ScrollToPlugin,
    TextPlugin,
    CustomEase,
    Observer,
    Draggable,
    InertiaPlugin,
    Flip,
    SplitText,
    ScrambleTextPlugin,
    DrawSVGPlugin,
    CustomBounce,
    CustomWiggle,
    MotionPathPlugin,
    EasePack
  );
}

// Windows 4-Square SVG Icon
function WindowsIcon({ size = 16, className = '' }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className}
      aria-hidden="true"
    >
      <path d="M0 3.449L9.75 2.1v9.451H0m10.949-9.602L24 0v11.4H10.949M0 12.6h9.75v9.451L0 20.699M10.949 12.6H24V24l-12.951-1.801" />
    </svg>
  );
}

// Linear / Cursor styled Brand Emblem (Lavender soundwave crest)
function CursorBrandLogo({ size = 28 }) {
  return (
    <div className="cursor-brand-logo" style={{ width: size, height: size }}>
      <svg viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" width={size} height={size}>
        <rect width="32" height="32" rx="8" fill="#0f1011" stroke="#23252a" strokeWidth="1" />
        <rect x="7" y="13" width="2" height="6" rx="1" fill="#5e6ad2" opacity="0.6" />
        <rect x="11" y="9" width="2" height="14" rx="1" fill="#5e6ad2" opacity="0.8" />
        <rect x="15" y="6" width="2" height="20" rx="1" fill="#828fff" />
        <rect x="19" y="10" width="2" height="12" rx="1" fill="#5e6ad2" opacity="0.8" />
        <rect x="23" y="14" width="2" height="4" rx="1" fill="#5e6ad2" opacity="0.6" />
      </svg>
    </div>
  );
}

// Demo tracks for interactive preview
const DEMO_TRACKS = [
  {
    id: 1,
    title: 'Neon Horizon',
    artist: 'Synthwave Odyssey',
    format: 'MP3',
    quality: '320 kbps',
    duration: 184,
    waveform: [40, 65, 85, 55, 95, 75, 100, 80, 60, 90, 70, 85, 50, 95, 80, 60, 75, 90, 65, 80, 55, 70, 85, 60]
  },
  {
    id: 2,
    title: 'Midnight Rain Lofi',
    artist: 'ChillHop Sessions',
    format: 'FLAC',
    quality: 'Lossless 24-bit',
    duration: 142,
    waveform: [30, 45, 60, 40, 70, 55, 65, 80, 50, 75, 60, 70, 45, 60, 55, 40, 65, 50, 45, 55, 40, 50, 60, 35]
  },
  {
    id: 3,
    title: 'Acoustic Sunset',
    artist: 'Live Studio Session',
    format: 'MP4',
    quality: '1080p HD',
    duration: 215,
    waveform: [50, 70, 90, 60, 85, 95, 80, 100, 75, 90, 85, 95, 70, 85, 90, 65, 80, 95, 70, 85, 60, 75, 90, 55]
  }
];

// Supported Platforms
const PLATFORMS = [
  { name: 'YouTube', type: 'Video & Audio', badge: '1080p / 320k' },
  { name: 'Instagram', type: 'Reels, Posts & Stories', badge: 'High-Speed MP4' },
  { name: 'TikTok', type: 'Videos & Audio Stems', badge: 'Original Audio' },
  { name: 'Twitter / X', type: 'Clips & Audio Spaces', badge: 'Direct Stream' },
  { name: 'SoundCloud', type: 'Original Tracks & Sets', badge: 'Lossless / MP3' },
  { name: 'Reddit', type: 'Video with Audio Multiplex', badge: 'Merged Audio' },
  { name: 'Facebook', type: 'Reels & Public Videos', badge: 'HD Video' },
  { name: 'Twitch', type: 'Clips & Highlights', badge: '1080p 60fps' },
  { name: 'Vimeo', type: 'High-Definition Showcase', badge: 'Original Bitrate' },
  { name: 'Bandcamp', type: 'Independent Audio', badge: 'Audiophile FLAC' },
  { name: 'Bilibili', type: 'Media & Playlists', badge: 'Full HD' },
  { name: 'Mixcloud', type: 'DJ Sets & Podcasts', badge: '320 kbps Stream' }
];

// FAQs
const FAQS = [
  {
    q: 'Why choose local software over web-based online converters?',
    a: 'Cloud converter websites throttle download speeds to a single thread, introduce security risks via ad redirects, and frequently compress audio down to 128 kbps. SonicWave executes locally on your Windows PC with a 16-stream parallel turbo engine, local FFmpeg & yt-dlp extraction, zero advertisements, and authentic 320 kbps MP3 and 1080p MP4 output.'
  },
  {
    q: 'Do I need to install Python, FFmpeg, or modify system environment variables?',
    a: 'No. SonicWave is self-bootstrapping. When you launch start.bat on Windows, the software automatically downloads and verifies the official yt-dlp and FFmpeg binaries into its local server directory. No manual configuration is required.'
  },
  {
    q: 'Which audio and video formats are supported?',
    a: 'SonicWave supports MP3 (at 320k, 256k, 192k, and 128k CBR/VBR), AAC (M4A), uncompressed WAV, and FLAC for audio. For video, it supports MP4 in 1080p Full HD, 720p HD, and 480p SD with automatically multiplexed stereo audio.'
  },
  {
    q: 'Is SonicWave open-source and free of telemetry?',
    a: 'Yes. SonicWave is completely free and open-source. There are no subscriptions, no locked tiers, and zero user telemetry or URL tracking. All conversions happen entirely on your machine.'
  },
  {
    q: 'Does SonicWave inject album artwork and ID3 metadata tags?',
    a: 'Yes. Converted audio tracks automatically have ID3 tags embedded with the video title, uploader name, and high-resolution thumbnail artwork so your files display cleanly in Windows Media Player, iTunes, Groove, Spotify, and mobile players.'
  },
  {
    q: 'How are extraction rules updated when upstream video platforms change?',
    a: 'SonicWave includes a 1-click binary updater. Press Ctrl+K in the app and select "Update Engine (yt-dlp)" to pull the latest extraction definitions directly from the official upstream repository in seconds.'
  }
];

const FOOTER_COLUMNS = [
  {
    title: 'Product',
    links: [
      { label: 'Features', href: '#features' },
      { label: 'Installation', href: '#how-it-works' },
      { label: 'Platforms', href: '#platforms' },
      { label: 'Speed 16x', href: '#comparison' },
      { label: 'Specs', href: '#specs' },
      { label: 'FAQ', href: '#faq' },
    ],
  },
  {
    title: 'Engine',
    links: [
      { label: 'yt-dlp 16-Stream' },
      { label: 'FFmpeg 7.0 Mux' },
      { label: 'Node.js Local' },
      { label: 'React 19 & Vite' },
      { label: 'ID3 High-Res Art' },
    ],
  },
  {
    title: 'Download',
    links: [
      { label: 'Windows (.zip)', href: '/SonicWave-v1.0.0-Windows.zip' },
      { label: 'Zero Telemetry' },
      { label: 'Personal Archiving' },
    ],
  },
];

export default function LandingPage({
  onOpenCmd,
  onOpenPricing
}) {
  const [isDownloadModalOpen, setIsDownloadModalOpen] = useState(false);
  const [selectedDemoTrack, setSelectedDemoTrack] = useState(DEMO_TRACKS[0]);
  const [isPlayingDemo, setIsPlayingDemo] = useState(false);
  const [demoProgress, setDemoProgress] = useState(32);
  const [isMuted, setIsMuted] = useState(false);
  const [openFaqIndex, setOpenFaqIndex] = useState(0);
  const progressTimerRef = useRef(null);

  // GSAP Animation Scoping & Interactive Element Refs
  const containerRef = useRef(null);
  const cardRef = useRef(null);
  const wrapRef = useRef(null);
  const knobRef = useRef(null);
  const trackRef = useRef(null);

  // Close modal on Escape key press
  useEffect(() => {
    if (!isDownloadModalOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setIsDownloadModalOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isDownloadModalOpen]);

  // Simulated playback timer for the demo preview widget
  useEffect(() => {
    if (isPlayingDemo) {
      progressTimerRef.current = setInterval(() => {
        setDemoProgress((prev) => {
          if (prev >= 100) return 0;
          return prev + 1;
        });
      }, 500);
    } else {
      if (progressTimerRef.current) clearInterval(progressTimerRef.current);
    }
    return () => {
      if (progressTimerRef.current) clearInterval(progressTimerRef.current);
    };
  }, [isPlayingDemo]);

  // Register Custom Eases & Orchestrate Animations with useGSAP
  useGSAP(() => {
    // 1. Custom Physics Curves & Eases (from uploaded GSAP suite)
    CustomEase.create("appleSpring", "M0,0 C0.16,1 0.3,1 1,1");
    CustomEase.create("punchSpring", "M0,0 C0.18,0.85 0.32,1.15 1,1");
    CustomEase.create("smoothGlide", "M0,0 C0.25,0.1 0.25,1 1,1");
    CustomBounce.create("btnBounce", { strength: 0.5, squash: 2 });
    CustomWiggle.create("waveformWiggle", { wiggles: 8, type: "random" });

    // 2. SplitText on hero title
    const splitTarget = document.querySelector(".cursor-hero-split");
    if (splitTarget) {
      const split = new SplitText(splitTarget, { type: "words,chars" });
      gsap.from(split.chars, {
        opacity: 0,
        y: 16,
        rotateX: -25,
        stagger: 0.015,
        duration: 0.55,
        ease: "appleSpring",
        onComplete: () => split.revert()
      });
    }

    // 3. DrawSVG on Brand Logo & vector outlines
    gsap.fromTo(".cursor-brand-logo svg rect", 
      { scaleY: 0, transformOrigin: "bottom" },
      { scaleY: 1, stagger: 0.06, duration: 0.6, ease: "punchSpring" }
    );

    // 4. Master Hero Entrance Timeline (crisp, snappy 1.1s total with automatic clearProps)
    const heroTl = gsap.timeline({
      defaults: { ease: "appleSpring" },
      onComplete: () => {
        gsap.set([
          ".cursor-top-nav",
          ".cursor-eyebrow-pill",
          ".cursor-display-xl",
          ".cursor-body-lg",
          ".cursor-hero-cta-row > *",
          ".cursor-hero-microproof",
          ".cursor-trust-cell",
          wrapRef.current
        ], { clearProps: "opacity,transform" });
      }
    });

    heroTl
      .fromTo(".cursor-top-nav", 
        { y: -20, opacity: 0 }, 
        { y: 0, opacity: 1, duration: 0.45 }
      )
      .fromTo(".cursor-eyebrow-pill", 
        { y: 15, opacity: 0, scale: 0.95 }, 
        { y: 0, opacity: 1, scale: 1, duration: 0.45, ease: "punchSpring" }, 
        "-=0.3"
      )
      .fromTo(".cursor-display-xl", 
        { y: 25, opacity: 0 }, 
        { y: 0, opacity: 1, duration: 0.55, ease: "power3.out" }, 
        "-=0.3"
      )
      .fromTo(".cursor-body-lg", 
        { y: 15, opacity: 0 }, 
        { y: 0, opacity: 1, duration: 0.45 }, 
        "-=0.35"
      )
      .fromTo(".cursor-hero-cta-row > *", 
        { y: 15, opacity: 0, scale: 0.95 }, 
        { y: 0, opacity: 1, scale: 1, stagger: 0.06, duration: 0.45, ease: "punchSpring" }, 
        "-=0.3"
      )
      .fromTo(".cursor-hero-microproof", 
        { opacity: 0, y: 8 }, 
        { opacity: 1, y: 0, duration: 0.35 }, 
        "-=0.25"
      )
      .fromTo(".cursor-trust-cell", 
        { y: 12, opacity: 0 }, 
        { y: 0, opacity: 1, stagger: 0.05, duration: 0.35 }, 
        "-=0.25"
      );

    if (wrapRef.current) {
      heroTl.fromTo(wrapRef.current, 
        { y: 40, opacity: 0, rotateX: 5, transformPerspective: 1200 }, 
        { y: 0, opacity: 1, rotateX: 0, duration: 0.65, ease: "power3.out" }, 
        "-=0.35"
      );
    }

    // 5. ScrambleText Terminal Status Loop
    const statusPhrases = [
      "PORT 3001 • READY",
      "16-STREAM ENGINE ACTIVE",
      "FFMPEG 7.0 HARDWARE ACCEL",
      "LOSSLESS 320 KBPS PIPELINE",
      "ZERO ADS • ZERO TELEMETRY"
    ];
    let phraseIdx = 0;
    const statusEl = document.querySelector(".cursor-mono-status");
    let statusTimer = null;
    if (statusEl) {
      statusTimer = setInterval(() => {
        phraseIdx = (phraseIdx + 1) % statusPhrases.length;
        gsap.to(statusEl, {
          duration: 0.85,
          scrambleText: {
            text: statusPhrases[phraseIdx],
            chars: "01X#_/*-+$%",
            speed: 0.45
          },
          ease: "power2.out"
        });
      }, 3000);
    }

    // 6. 3D Gyro / Cursor Parallax Tilt on the Hero Card (Observer & quickTo)
    if (cardRef.current && wrapRef.current) {
      const setRotateX = gsap.quickTo(cardRef.current, "rotateX", { duration: 0.45, ease: "power2.out" });
      const setRotateY = gsap.quickTo(cardRef.current, "rotateY", { duration: 0.45, ease: "power2.out" });

      const onPointerMove = (e) => {
        const rect = wrapRef.current.getBoundingClientRect();
        const x = e.clientX - rect.left - rect.width / 2;
        const y = e.clientY - rect.top - rect.height / 2;
        setRotateY((x / (rect.width / 2)) * 4.5);
        setRotateX(-(y / (rect.height / 2)) * 4.5);
      };

      const onPointerLeave = () => {
        gsap.to(cardRef.current, { rotateX: 0, rotateY: 0, duration: 0.8, ease: "power3.out" });
      };

      const wrapEl = wrapRef.current;
      wrapEl.addEventListener("pointermove", onPointerMove);
      wrapEl.addEventListener("pointerleave", onPointerLeave);
    }

    // 7. Draggable Seeker Knob with Inertia (GSAP Draggable + Inertia)
    if (knobRef.current && trackRef.current) {
      Draggable.create(knobRef.current, {
        type: "x",
        bounds: trackRef.current,
        inertia: true,
        edgeResistance: 0.75,
        onDrag: function () {
          const width = trackRef.current.offsetWidth;
          const pct = Math.max(0, Math.min(100, (this.x / width) * 100));
          setDemoProgress(pct);
        },
        onThrowUpdate: function () {
          const width = trackRef.current.offsetWidth;
          const pct = Math.max(0, Math.min(100, (this.x / width) * 100));
          setDemoProgress(pct);
        }
      });
    }

    // 8. Magnetic CTA buttons (quickTo)
    const magneticBtns = gsap.utils.toArray(".cursor-button-primary");
    magneticBtns.forEach((btn) => {
      const xTo = gsap.quickTo(btn, "x", { duration: 0.35, ease: "power2.out" });
      const yTo = gsap.quickTo(btn, "y", { duration: 0.35, ease: "power2.out" });

      const onMouseMove = (e) => {
        const rect = btn.getBoundingClientRect();
        const x = e.clientX - rect.left - rect.width / 2;
        const y = e.clientY - rect.top - rect.height / 2;
        xTo(x * 0.22);
        yTo(y * 0.22);
      };

      const onMouseLeave = () => {
        xTo(0);
        yTo(0);
      };

      btn.addEventListener("mousemove", onMouseMove);
      btn.addEventListener("mouseleave", onMouseLeave);
    });

    // 6. Section 1: Platforms Ecosystem Grid ScrollTrigger
    gsap.fromTo(".cursor-platform-tile",
      { y: 35, opacity: 0, scale: 0.95 },
      {
        y: 0,
        opacity: 1,
        scale: 1,
        stagger: 0.04,
        duration: 0.65,
        ease: "appleSpring",
        scrollTrigger: {
          trigger: ".cursor-platforms-grid",
          start: "top 85%",
          toggleActions: "play none none none"
        }
      }
    );

    gsap.fromTo(".cursor-callout-panel",
      { y: 25, opacity: 0 },
      {
        y: 0,
        opacity: 1,
        duration: 0.7,
        ease: "power3.out",
        scrollTrigger: {
          trigger: ".cursor-callout-panel",
          start: "top 90%",
          toggleActions: "play none none none"
        }
      }
    );

    // 7. Section 2: 3-Step Setup Sequence ScrollTrigger & Micro-Animations
    // Header Reveal & 30-Second Counter
    const counterObj = { val: 0 };
    gsap.to(counterObj, {
      val: 30,
      duration: 1.4,
      ease: "power2.out",
      scrollTrigger: {
        trigger: "#how-it-works",
        start: "top 80%",
        toggleActions: "play none none none"
      },
      onUpdate: () => {
        const counterEl = document.querySelector(".cursor-accent-counter");
        if (counterEl) counterEl.textContent = Math.round(counterObj.val);
      }
    });

    gsap.fromTo(".cursor-install-header > *",
      { y: 25, opacity: 0 },
      {
        y: 0,
        opacity: 1,
        stagger: 0.08,
        duration: 0.65,
        ease: "appleSpring",
        scrollTrigger: {
          trigger: ".cursor-install-header",
          start: "top 85%",
          toggleActions: "play none none none"
        }
      }
    );

    // Connecting Rail Tracer Beam (DrawSVGPlugin)
    gsap.fromTo(".cursor-rail-draw-path",
      { drawSVG: "0%" },
      {
        drawSVG: "100%",
        duration: 1.4,
        ease: "power2.inOut",
        scrollTrigger: {
          trigger: ".cursor-steps-wrapper",
          start: "top 82%",
          toggleActions: "play none none none"
        }
      }
    );

    // Step Cards 3D Entrance Cascade
    gsap.fromTo(".cursor-step-card",
      { y: 50, opacity: 0, scale: 0.94, rotateX: 6, transformPerspective: 1000 },
      {
        y: 0,
        opacity: 1,
        scale: 1,
        rotateX: 0,
        stagger: 0.14,
        duration: 0.85,
        ease: "appleSpring",
        scrollTrigger: {
          trigger: ".cursor-steps-grid",
          start: "top 85%",
          toggleActions: "play none none none"
        }
      }
    );

    // Index Badges Pop-in (punchSpring)
    gsap.fromTo(".cursor-step-index",
      { scale: 0.3, opacity: 0 },
      {
        scale: 1,
        opacity: 1,
        stagger: 0.14,
        duration: 0.6,
        ease: "punchSpring",
        scrollTrigger: {
          trigger: ".cursor-steps-grid",
          start: "top 85%",
          toggleActions: "play none none none"
        }
      }
    );

    // Continuous Icon Micro-Floating Tweens
    gsap.to(".step-icon-download", {
      y: 3,
      duration: 0.9,
      repeat: -1,
      yoyo: true,
      ease: "power1.inOut"
    });

    gsap.to(".step-icon-terminal", {
      rotate: 6,
      duration: 1.2,
      repeat: -1,
      yoyo: true,
      ease: "power1.inOut"
    });

    gsap.to(".step-icon-music", {
      scale: 1.1,
      duration: 0.8,
      repeat: -1,
      yoyo: true,
      ease: "power2.inOut"
    });

    // 3D Gyro Tilt & Mouse Cursor Spotlight on each Step Card (Observer & quickTo)
    const stepCards = gsap.utils.toArray(".cursor-step-card");
    stepCards.forEach((card) => {
      const setRotX = gsap.quickTo(card, "rotateX", { duration: 0.35, ease: "power2.out" });
      const setRotY = gsap.quickTo(card, "rotateY", { duration: 0.35, ease: "power2.out" });

      const onCardMouseMove = (e) => {
        const rect = card.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        card.style.setProperty("--mouse-x", `${x}px`);
        card.style.setProperty("--mouse-y", `${y}px`);

        const centerX = rect.width / 2;
        const centerY = rect.height / 2;
        setRotY(((x - centerX) / centerX) * 4.5);
        setRotX(-((y - centerY) / centerY) * 4.5);
      };

      const onCardMouseLeave = () => {
        setRotX(0);
        setRotY(0);
      };

      card.addEventListener("mousemove", onCardMouseMove);
      card.addEventListener("mouseleave", onCardMouseLeave);
    });

    // ScrambleText on Card 2 hover
    const startBatSnippet = document.querySelector(".cursor-step-card[data-step='2'] .cursor-mono-snippet");
    const startBatCode = document.querySelector(".cursor-step-card[data-step='2'] code");
    if (startBatSnippet && startBatCode) {
      startBatSnippet.addEventListener("mouseenter", () => {
        gsap.to(startBatCode, {
          duration: 0.6,
          scrambleText: {
            text: ".\\start.bat — auto-bootstraps",
            chars: "01X#_-/*",
            speed: 0.45
          }
        });
      });
    }

    // 8. Section 3: Feature Architecture Cards ScrollTrigger
    gsap.fromTo(".cursor-feature-card",
      { y: 40, opacity: 0, scale: 0.96 },
      {
        y: 0,
        opacity: 1,
        scale: 1,
        stagger: 0.08,
        duration: 0.75,
        ease: "appleSpring",
        scrollTrigger: {
          trigger: ".cursor-features-grid",
          start: "top 85%",
          toggleActions: "play none none none"
        }
      }
    );

    // 9. Section 4: Benchmark Comparison Table Row Cascade
    gsap.fromTo(".cursor-comparison-table tbody tr",
      { x: -25, opacity: 0 },
      {
        x: 0,
        opacity: 1,
        stagger: 0.08,
        duration: 0.65,
        ease: "power3.out",
        scrollTrigger: {
          trigger: ".cursor-comparison-table",
          start: "top 85%",
          toggleActions: "play none none none"
        }
      }
    );

    // 10. Section 5: Hardware Specifications Grid ScrollTrigger
    gsap.fromTo(".cursor-spec-card",
      { y: 30, opacity: 0, scale: 0.95 },
      {
        y: 0,
        opacity: 1,
        scale: 1,
        stagger: 0.07,
        duration: 0.65,
        ease: "appleSpring",
        scrollTrigger: {
          trigger: ".cursor-specs-grid",
          start: "top 85%",
          toggleActions: "play none none none"
        }
      }
    );

    // 11. Section 6: FAQ Accordion items
    gsap.fromTo(".v-faq-item",
      { y: 25, opacity: 0 },
      {
        y: 0,
        opacity: 1,
        stagger: 0.07,
        duration: 0.6,
        ease: "power3.out",
        scrollTrigger: {
          trigger: ".v-faq-list",
          start: "top 85%",
          toggleActions: "play none none none"
        }
      }
    );

    // 12. Section 7: Bottom CTA Banner Entrance
    gsap.fromTo(".cursor-cta-panel",
      { y: 50, opacity: 0, scale: 0.94 },
      {
        y: 0,
        opacity: 1,
        scale: 1,
        duration: 0.9,
        ease: "appleSpring",
        scrollTrigger: {
          trigger: ".cursor-cta-panel",
          start: "top 85%",
          toggleActions: "play none none none"
        }
      }
    );

    // Clean up timers on unmount
    return () => {
      if (statusTimer) clearInterval(statusTimer);
    };
  }, { scope: containerRef });

  // Dynamic equalizer physics with CustomWiggle when playing
  useEffect(() => {
    if (isPlayingDemo) {
      gsap.to(".cursor-waveform-col", {
        scaleY: "random(0.35, 1.35)",
        duration: 0.4,
        ease: "waveformWiggle",
        repeat: -1,
        yoyo: true,
        stagger: {
          each: 0.025,
          from: "center"
        }
      });
    } else {
      gsap.killTweensOf(".cursor-waveform-col");
      gsap.to(".cursor-waveform-col", { scaleY: 1, duration: 0.25, ease: "power2.out" });
    }
  }, [isPlayingDemo]);

  const handleSmoothScroll = (e, targetHref) => {
    if (!targetHref || !targetHref.startsWith('#')) return;
    e.preventDefault();
    const targetEl = document.querySelector(targetHref);
    if (targetEl) {
      gsap.to(window, {
        duration: 1.1,
        scrollTo: { y: targetEl, offsetY: 70 },
        ease: "power3.inOut",
      });
    }
  };

  const handleTogglePlayDemo = () => {
    setIsPlayingDemo((prev) => !prev);
  };

  const handleSelectTrack = (track) => {
    const trackContainer = document.querySelector('.cursor-demo-tracks');
    const state = trackContainer ? Flip.getState('.cursor-track-row') : null;
    setSelectedDemoTrack(track);
    setDemoProgress(0);
    setIsPlayingDemo(true);
    if (state) {
      requestAnimationFrame(() => {
        Flip.from(state, {
          duration: 0.35,
          ease: "power2.out",
          fade: true
        });
      });
    }
    // Smooth GSAP punch on track switch
    gsap.fromTo('.cursor-vis-head', 
      { opacity: 0, y: 8 }, 
      { opacity: 1, y: 0, duration: 0.35, ease: 'power2.out' }
    );
  };

  const formatSeconds = (sec) => {
    const mins = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${mins}:${s < 10 ? '0' : ''}${s}`;
  };

  const handleDownloadClick = (e) => {
    if (e) e.preventDefault();
    setIsDownloadModalOpen(true);
  };

  return (
    <div className="cursor-canvas-root" ref={containerRef}>
      {/* Keyboard Accessibility: Skip to Main Content Link */}
      <a href="#hero" className="cursor-skip-link">
        Skip to main content
      </a>

      {/* =========================================================================
          TOP NAV (DESIGN-cursor.md: height 56px, background #010102, hairline border)
          ========================================================================= */}
      <header className="cursor-top-nav" role="banner">
        <div className="cursor-nav-container">
          <div className="cursor-nav-brand">
            <CursorBrandLogo size={24} />
            <span className="cursor-brand-title">SonicWave</span>
            <span className="cursor-nav-version-badge">v1.0.0</span>
          </div>

          <nav className="cursor-nav-links" aria-label="Main Navigation">
            <a href="#features" className="cursor-nav-link" onClick={(e) => handleSmoothScroll(e, '#features')}>Features</a>
            <a href="#how-it-works" className="cursor-nav-link" onClick={(e) => handleSmoothScroll(e, '#how-it-works')}>How it works</a>
            <a href="#platforms" className="cursor-nav-link" onClick={(e) => handleSmoothScroll(e, '#platforms')}>Platforms</a>
            <a href="#comparison" className="cursor-nav-link" onClick={(e) => handleSmoothScroll(e, '#comparison')}>Comparison</a>
            <a href="#specs" className="cursor-nav-link" onClick={(e) => handleSmoothScroll(e, '#specs')}>Specs</a>
            <a href="#faq" className="cursor-nav-link" onClick={(e) => handleSmoothScroll(e, '#faq')}>FAQ</a>
          </nav>

          <div className="cursor-nav-actions">
            <button
              type="button"
              className="cursor-button-secondary"
              onClick={onOpenCmd}
              title="Open Command Menu (⌘K / Ctrl+K)"
              aria-label="Open Command Menu"
            >
              <CommandIcon size={13} aria-hidden="true" />
              <span>⌘K</span>
            </button>

            <button
              type="button"
              className="cursor-button-primary"
              onClick={handleDownloadClick}
              id="nav-download-btn"
              aria-label="Download SonicWave for Windows"
            >
              <WindowsIcon size={14} />
              <span>Download for Windows</span>
            </button>
          </div>
        </div>
      </header>

      {/* =========================================================================
          HERO SECTION (Near-black canvas, display-xl with negative tracking, lavender CTA)
          ========================================================================= */}
      <section className="cursor-hero-section" id="hero">
        <div className="cursor-hero-container">
          {/* Eyebrow badge (13px, weight 500, letter-spacing +0.4px) */}
          <div className="cursor-eyebrow-pill">
            <span className="cursor-status-dot" aria-hidden="true" />
            <span className="cursor-eyebrow-text">WINDOWS 11 &amp; 10 &bull; 64-BIT NATIVE &bull; AD-FREE &bull; OPEN SOURCE</span>
          </div>

          <h1 className="cursor-display-xl">
            <span className="cursor-hero-split">High-speed media downloader</span> &amp;<br />
            <FlipText className="cursor-gradient-accent" duration={2.4}>
              offline media player for Windows
            </FlipText>
          </h1>

          <p className="cursor-body-lg">
            Extract audio and video from YouTube, Instagram, TikTok, Twitter/X, SoundCloud,
            and 1,000+ sources directly to your PC. Accelerated by a 16-stream parallel turbo
            engine with embedded FFmpeg.
          </p>

          <div className="cursor-hero-cta-row">
            <button
              type="button"
              className="cursor-button-primary cursor-btn-lg"
              onClick={handleDownloadClick}
              id="hero-download-btn"
              aria-label="Download SonicWave for Windows 64-bit"
            >
              <WindowsIcon size={16} />
              <span>Download for Windows (64-bit)</span>
              <Download size={15} className="cursor-cta-icon" aria-hidden="true" />
            </button>

            <a
              href="#how-it-works"
              className="cursor-button-secondary cursor-btn-lg"
              onClick={(e) => handleSmoothScroll(e, '#how-it-works')}
              aria-label="View 3-step installation guide"
            >
              <Terminal size={14} aria-hidden="true" />
              <span>Installation guide</span>
            </a>
          </div>

          {/* CRO Friction Reduction: Micro-proof directly below primary CTA */}
          <div className="cursor-hero-microproof">
            <span>Windows 11 &amp; 10 (64-bit) &bull; Standalone 148 KB ZIP &bull; No admin rights required</span>
          </div>

          {/* Clean hairline trust strip */}
          <div className="cursor-trust-strip">
            <div className="cursor-trust-cell">
              <ShieldCheck size={14} className="cursor-trust-icon" aria-hidden="true" />
              <span>Zero ads or telemetry</span>
            </div>
            <span className="cursor-trust-sep">&bull;</span>
            <div className="cursor-trust-cell">
              <Zap size={14} className="cursor-trust-icon" aria-hidden="true" />
              <span>16-stream multi-thread</span>
            </div>
            <span className="cursor-trust-sep">&bull;</span>
            <div className="cursor-trust-cell">
              <HardDrive size={14} className="cursor-trust-icon" aria-hidden="true" />
              <span>Executes 100% on PC</span>
            </div>
            <span className="cursor-trust-sep">&bull;</span>
            <div className="cursor-trust-cell">
              <Music2 size={14} className="cursor-trust-icon" aria-hidden="true" />
              <span>320 kbps &amp; 1080p HD</span>
            </div>
          </div>
        </div>

        {/* =========================================================================
            PRODUCT UI SCREENSHOT / INTERACTIVE APP WINDOW
            (DESIGN-cursor.md: surface-1 #0f1011, rounded.xl 16px, hairline #23252a)
            ========================================================================= */}
        <div className="cursor-product-panel-wrap" ref={wrapRef}>
          <div className="cursor-product-screenshot-card" ref={cardRef} aria-label="SonicWave Desktop Software Preview">
            {/* Window title bar */}
            <div className="cursor-window-bar">
              <div className="cursor-window-left">
                <div className="cursor-window-dots" aria-hidden="true">
                  <span className="cursor-window-dot dot-red" />
                  <span className="cursor-window-dot dot-yellow" />
                  <span className="cursor-window-dot dot-green" />
                </div>
                <span className="cursor-window-title">SonicWave Studio &mdash; Windows x64 [16x Multi-Stream Engine]</span>
              </div>
              <div className="cursor-window-right">
                <span className="cursor-mono-status">PORT 3001 &bull; READY</span>
              </div>
            </div>

            {/* In-app workspace preview */}
            <div className="cursor-window-content">
              {/* Internal header bar */}
              <div className="cursor-preview-top-strip">
                <div className="cursor-preview-status">
                  <span className="cursor-accent-indicator" />
                  <span>Real-time audio extraction &amp; frequency analyzer</span>
                </div>
                <div className="cursor-preview-tags">
                  <span className="cursor-spec-tag active">320 KBPS MP3</span>
                  <span className="cursor-spec-tag">FLAC 24-BIT</span>
                  <span className="cursor-spec-tag">1080P MP4</span>
                </div>
              </div>

              {/* Player Grid */}
              <div className="cursor-demo-grid">
                {/* Track Selector Column */}
                <div className="cursor-demo-tracks">
                  <span className="cursor-micro-label">SAMPLE MEDIA PRESETS</span>
                  {DEMO_TRACKS.map((t) => (
                    <button
                      key={t.id}
                      type="button"
                      className={`cursor-track-row ${selectedDemoTrack.id === t.id ? 'active' : ''}`}
                      onClick={() => handleSelectTrack(t)}
                      aria-pressed={selectedDemoTrack.id === t.id}
                      aria-label={`Audition sample preset: ${t.title} by ${t.artist} (${t.quality})`}
                    >
                      <div className="cursor-track-icon">
                        {t.format === 'MP4' ? <Video size={13} aria-hidden="true" /> : <Music2 size={13} aria-hidden="true" />}
                      </div>
                      <div className="cursor-track-details">
                        <span className="cursor-track-title">{t.title}</span>
                        <span className="cursor-track-artist">{t.artist} &bull; {t.quality}</span>
                      </div>
                      {selectedDemoTrack.id === t.id && isPlayingDemo && (
                        <div className="cursor-mini-eq" aria-hidden="true">
                          <span className="eq-bar b1" />
                          <span className="eq-bar b2" />
                          <span className="eq-bar b3" />
                        </div>
                      )}
                    </button>
                  ))}
                </div>

                {/* Main Visualizer Panel */}
                <div className="cursor-visualizer-surface">
                  <div className="cursor-vis-head">
                    <div>
                      <h4 className="cursor-vis-title">{selectedDemoTrack.title}</h4>
                      <p className="cursor-vis-sub">{selectedDemoTrack.artist} &bull; Embedded ID3 Tags</p>
                    </div>
                    <span className="cursor-vis-badge">{selectedDemoTrack.format} &bull; {selectedDemoTrack.quality}</span>
                  </div>

                  {/* Frequency Spectrum (Lavender #5e6ad2) */}
                  <div className="cursor-waveform-spectrum" aria-label="Frequency Equalizer Spectrum">
                    {selectedDemoTrack.waveform.map((val, idx) => {
                      const isActive = (idx / selectedDemoTrack.waveform.length) * 100 <= demoProgress;
                      const animatedHeight = isPlayingDemo
                        ? Math.min(100, Math.max(15, val + Math.sin(idx + Date.now() / 200) * 18))
                        : val * 0.5;
                      return (
                        <div
                          key={idx}
                          className={`cursor-waveform-col ${isActive ? 'active' : ''}`}
                          style={{
                            height: `${animatedHeight}%`,
                            transition: 'height 0.15s ease'
                          }}
                          aria-hidden="true"
                        />
                      );
                    })}
                  </div>

                  {/* Keyboard-Accessible Scrubber Slider (WCAG 2.1 AA) */}
                  <div className="cursor-scrubber-row">
                    <span className="cursor-mono-time">
                      {formatSeconds(Math.floor((demoProgress / 100) * selectedDemoTrack.duration))}
                    </span>
                    <div
                      className="cursor-track-bar"
                      ref={trackRef}
                      role="slider"
                      tabIndex={0}
                      aria-label="Demo audio scrubber"
                      aria-valuemin={0}
                      aria-valuemax={100}
                      aria-valuenow={Math.round(demoProgress)}
                      aria-valuetext={`${formatSeconds(Math.floor((demoProgress / 100) * selectedDemoTrack.duration))} of ${formatSeconds(selectedDemoTrack.duration)}`}
                      onKeyDown={(e) => {
                        if (e.key === 'ArrowRight' || e.key === 'ArrowUp') {
                          e.preventDefault();
                          setDemoProgress((p) => Math.min(100, p + 5));
                        } else if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') {
                          e.preventDefault();
                          setDemoProgress((p) => Math.max(0, p - 5));
                        } else if (e.key === 'Home') {
                          e.preventDefault();
                          setDemoProgress(0);
                        } else if (e.key === 'End') {
                          e.preventDefault();
                          setDemoProgress(100);
                        }
                      }}
                      onClick={(e) => {
                        const rect = e.currentTarget.getBoundingClientRect();
                        const clickX = e.clientX - rect.left;
                        const pct = Math.max(0, Math.min(100, (clickX / rect.width) * 100));
                        setDemoProgress(pct);
                      }}
                    >
                      <div className="cursor-track-bar-fill" style={{ width: `${demoProgress}%` }} />
                      <div className="cursor-track-knob" ref={knobRef} style={{ left: `${demoProgress}%` }} />
                    </div>
                    <span className="cursor-mono-time">{formatSeconds(selectedDemoTrack.duration)}</span>
                  </div>

                  {/* Controls & CRO Bridge CTA */}
                  <div className="cursor-controls-row">
                    <button
                      type="button"
                      className="cursor-play-btn"
                      onClick={handleTogglePlayDemo}
                      aria-label={isPlayingDemo ? 'Pause Demo Audio' : 'Play Demo Audio'}
                    >
                      {isPlayingDemo ? <Pause size={16} fill="#ffffff" /> : <Play size={16} fill="#ffffff" style={{ marginLeft: '1px' }} />}
                    </button>

                    <button
                      type="button"
                      className="cursor-button-secondary cursor-btn-sm cursor-vis-cta-bridge"
                      onClick={handleDownloadClick}
                      aria-label="Download SonicWave to convert your own media files"
                    >
                      <span>Convert your own media &rarr;</span>
                    </button>

                    <button
                      type="button"
                      className="cursor-icon-btn"
                      onClick={() => setIsMuted(!isMuted)}
                      title={isMuted ? 'Unmute' : 'Mute'}
                      aria-label={isMuted ? 'Unmute demo audio' : 'Mute demo audio'}
                    >
                      {isMuted ? <VolumeX size={16} /> : <Volume2 size={16} />}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          SUPPORTED PLATFORMS (DESIGN-cursor.md: surface-1 cards, hairline borders)
          ========================================================================= */}
      <section className="cursor-section" id="platforms">
        <div className="cursor-container">
          <div className="cursor-section-header">
            <span className="cursor-eyebrow">SUPPORTED ECOSYSTEM</span>
            <h2 className="cursor-display-lg">One binary. Every media platform.</h2>
            <p className="cursor-subhead">
              Powered by continuous upstream extractor updates supporting over 1,000+ media sites
              with automatic audio extraction and video demuxing.
            </p>
          </div>

          <div className="cursor-platforms-grid">
            {PLATFORMS.map((p, idx) => (
              <div key={idx} className="cursor-platform-tile">
                <div className="cursor-platform-top">
                  <span className="cursor-platform-name">{p.name}</span>
                  <span className="cursor-platform-tag">{p.badge}</span>
                </div>
                <span className="cursor-platform-desc">{p.type}</span>
              </div>
            ))}
          </div>

          <div className="cursor-callout-panel">
            <Zap size={15} className="cursor-accent-icon" />
            <span>
              Supports YouTube Shorts, 4K, Playlists, Instagram Reels, TikTok Sounds, Twitter/X Clips, Facebook, SoundCloud Sets, Vimeo, and Reddit video track fusion with zero cloud proxies.
            </span>
          </div>
        </div>
      </section>

      {/* =========================================================================
          3-STEP WINDOWS SETUP (DESIGN-cursor.md: surface-1, 14px rounded, hairline)
          ========================================================================= */}
      <section className="cursor-section cursor-section-alt" id="how-it-works">
        <div className="cursor-container">
          <div className="cursor-section-header cursor-install-header">
            <span className="cursor-eyebrow">INSTALLATION</span>
            <h2 className="cursor-display-lg">
              Up and running in <span className="cursor-accent-counter">30</span> <span className="cursor-gradient-accent">seconds.</span>
            </h2>
            <p className="cursor-subhead">
              No manual Python installations. No environment variable configuration.
              Download, extract, and convert.
            </p>
          </div>

          <div className="cursor-steps-wrapper">
            {/* Timeline Tracer Rail (DrawSVGPlugin) */}
            <div className="cursor-steps-timeline-rail" aria-hidden="true">
              <svg className="cursor-steps-rail-svg" viewBox="0 0 1000 4" fill="none" preserveAspectRatio="none">
                <line x1="0" y1="2" x2="1000" y2="2" stroke="rgba(255,255,255,0.06)" strokeWidth="2" strokeDasharray="6 6" />
                <line className="cursor-rail-draw-path" x1="0" y1="2" x2="1000" y2="2" stroke="url(#stepGradient)" strokeWidth="3" strokeLinecap="round" />
                <defs>
                  <linearGradient id="stepGradient" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor="#5e6ad2" />
                    <stop offset="50%" stopColor="#828fff" />
                    <stop offset="100%" stopColor="#a5b4fc" />
                  </linearGradient>
                </defs>
              </svg>
            </div>

            <div className="cursor-steps-grid">
              {/* Step 1 */}
              <div className="cursor-step-card" data-step="1">
                <div className="cursor-step-header">
                  <div className="cursor-step-index">01</div>
                  <div className="cursor-step-icon-badge">
                    <Download size={15} className="step-icon-download" aria-hidden="true" />
                  </div>
                </div>
                <h3 className="cursor-card-title">Download &amp; extract</h3>
                <p className="cursor-card-body">
                  Download the lightweight SonicWave Windows ZIP package and extract it to any directory on your computer.
                </p>
                <div className="cursor-mono-snippet" title="Windows portable zip archive">
                  <div className="cursor-snippet-left">
                    <FolderArchive size={13} className="cursor-snippet-icon" aria-hidden="true" />
                    <code>SonicWave-v1.0.0-Windows.zip</code>
                  </div>
                  <span className="cursor-snippet-tag">148 KB</span>
                </div>
              </div>

              {/* Step 2 */}
              <div className="cursor-step-card" data-step="2">
                <div className="cursor-step-header">
                  <div className="cursor-step-index">02</div>
                  <div className="cursor-step-icon-badge">
                    <Terminal size={15} className="step-icon-terminal" aria-hidden="true" />
                  </div>
                </div>
                <h3 className="cursor-card-title">Launch start.bat</h3>
                <p className="cursor-card-body">
                  Double-click <strong>start.bat</strong>. The launcher boots the local server, provisions yt-dlp &amp; FFmpeg executables, and launches the desktop interface.
                </p>
                <div className="cursor-mono-snippet" title="Self-bootstrapping script">
                  <div className="cursor-snippet-left">
                    <Terminal size={13} className="cursor-snippet-icon" aria-hidden="true" />
                    <code>.\start.bat &mdash; auto-bootstraps</code>
                    <span className="cursor-cursor-blink">_</span>
                  </div>
                  <span className="cursor-snippet-tag status-live">READY</span>
                </div>
              </div>

              {/* Step 3 */}
              <div className="cursor-step-card" data-step="3">
                <div className="cursor-step-header">
                  <div className="cursor-step-index">03</div>
                  <div className="cursor-step-icon-badge">
                    <Music2 size={15} className="step-icon-music" aria-hidden="true" />
                  </div>
                </div>
                <h3 className="cursor-card-title">Convert and stream</h3>
                <p className="cursor-card-body">
                  Paste any social media URL. Convert to 320 kbps MP3 or 1080p MP4 with 16-stream parallel acceleration, stream in-browser, and save directly to disk.
                </p>
                <div className="cursor-mono-snippet" title="Supported audio and video codecs">
                  <div className="cursor-snippet-formats">
                    <span className="format-chip active">MP3</span>
                    <span className="format-chip">MP4</span>
                    <span className="format-chip">WAV</span>
                    <span className="format-chip">FLAC</span>
                    <span className="format-chip">M4A</span>
                  </div>
                  <div className="cursor-snippet-eq" aria-hidden="true">
                    <span className="seq-bar b1" />
                    <span className="seq-bar b2" />
                    <span className="seq-bar b3" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          FEATURE CARDS (DESIGN-cursor.md: surface-1, 12px radius, 24px padding)
          ========================================================================= */}
      <section className="cursor-section" id="features">
        <div className="cursor-container">
          <div className="cursor-section-header">
            <span className="cursor-eyebrow">ENGINE ARCHITECTURE</span>
            <h2 className="cursor-display-lg">Engineered for fidelity and speed.</h2>
            <p className="cursor-subhead">
              Designed as high-performance local software rather than an ad-funded web converter.
            </p>
          </div>

          <div className="cursor-features-grid">
            <div className="cursor-feature-card">
              <div className="cursor-card-icon-box">
                <Zap size={18} />
              </div>
              <h3 className="cursor-card-title">16-Stream parallel turbo</h3>
              <p className="cursor-card-body">
                Bypasses server bandwidth throttling by chunking the download across 16 parallel TCP threads. Experience up to 10x faster downloads on long videos and audio tracks.
              </p>
              <span className="cursor-tag">Multi-Thread Speed</span>
            </div>

            <div className="cursor-feature-card">
              <div className="cursor-card-icon-box">
                <Music2 size={18} />
              </div>
              <h3 className="cursor-card-title">True 320 kbps &amp; lossless audio</h3>
              <p className="cursor-card-body">
                No fake upscaling. Extract genuine 320 kbps CBR/VBR audio, or export pristine uncompressed WAV and lossless FLAC for maximum acoustic dynamic range.
              </p>
              <span className="cursor-tag">Audiophile Master</span>
            </div>

            <div className="cursor-feature-card">
              <div className="cursor-card-icon-box">
                <Video size={18} />
              </div>
              <h3 className="cursor-card-title">1080p Full HD video merge</h3>
              <p className="cursor-card-body">
                YouTube separates video and audio streams for 1080p+. SonicWave automatically downloads the highest video bitrate and merges it with pristine stereo audio via local FFmpeg.
              </p>
              <span className="cursor-tag">High Definition</span>
            </div>

            <div className="cursor-feature-card">
              <div className="cursor-card-icon-box">
                <ShieldCheck size={18} />
              </div>
              <h3 className="cursor-card-title">100% Local &amp; zero telemetry</h3>
              <p className="cursor-card-body">
                Zero third-party servers between you and the content. All extraction, conversions, and metadata writing happen entirely on your Windows computer. No URLs are logged.
              </p>
              <span className="cursor-tag">Zero Cloud Logging</span>
            </div>

            <div className="cursor-feature-card">
              <div className="cursor-card-icon-box">
                <Sparkles size={18} />
              </div>
              <h3 className="cursor-card-title">Automatic ID3 tags &amp; cover art</h3>
              <p className="cursor-card-body">
                Every converted track arrives ready for your music player with embedded track title, uploader name, and high-resolution thumbnail artwork baked straight into the audio file.
              </p>
              <span className="cursor-tag">Embedded Metadata</span>
            </div>

            <div className="cursor-feature-card">
              <div className="cursor-card-icon-box">
                <Play size={18} />
              </div>
              <h3 className="cursor-card-title">Studio player &amp; local library</h3>
              <p className="cursor-card-body">
                Audition converted tracks in the docked bottom player with real-time waveform visualization, persistent conversion history, and 1-click re-downloading.
              </p>
              <span className="cursor-tag">In-Browser Player</span>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          COMPARISON TABLE (DESIGN-cursor.md: surface-1, hairline borders, no shadows)
          ========================================================================= */}
      <section className="cursor-section cursor-section-alt" id="comparison">
        <div className="cursor-container">
          <div className="cursor-section-header">
            <span className="cursor-eyebrow">BENCHMARK COMPARISON</span>
            <h2 className="cursor-display-lg">SonicWave vs. typical web converters.</h2>
            <p className="cursor-subhead">
              Why running native desktop software on Windows is faster, cleaner, and safer than browser-based converter sites.
            </p>
          </div>

          <div className="cursor-table-wrap">
            <table className="cursor-comparison-table" aria-label="Feature Comparison Matrix">
              <thead>
                <tr>
                  <th className="th-spec">Metric</th>
                  <th className="th-sonic">SonicWave for Windows</th>
                  <th className="th-others">Typical Online Web Converters</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="td-spec">
                    <strong>Download speed</strong>
                    <span>Parallel TCP chunking</span>
                  </td>
                  <td className="td-sonic">
                    <div className="status-cell good">
                      <CheckCircle2 size={16} />
                      <span>16-Stream parallel turbo (Instant)</span>
                    </div>
                  </td>
                  <td className="td-others">
                    <div className="status-cell bad">
                      <XCircle size={16} />
                      <span>Throttled single-thread (1&ndash;3 MB/s capped)</span>
                    </div>
                  </td>
                </tr>

                <tr>
                  <td className="td-spec">
                    <strong>Advertisements &amp; redirects</strong>
                    <span>Malware, banners &amp; popups</span>
                  </td>
                  <td className="td-sonic">
                    <div className="status-cell good">
                      <CheckCircle2 size={16} />
                      <span>100% Ad-Free (Zero popups or redirects)</span>
                    </div>
                  </td>
                  <td className="td-others">
                    <div className="status-cell bad">
                      <XCircle size={16} />
                      <span>Deceptive popups, fake download buttons</span>
                    </div>
                  </td>
                </tr>

                <tr>
                  <td className="td-spec">
                    <strong>Audio authenticity</strong>
                    <span>Bitrate encoding &amp; fidelity</span>
                  </td>
                  <td className="td-sonic">
                    <div className="status-cell good">
                      <CheckCircle2 size={16} />
                      <span>True 320 kbps MP3, FLAC &amp; WAV</span>
                    </div>
                  </td>
                  <td className="td-others">
                    <div className="status-cell bad">
                      <XCircle size={16} />
                      <span>Fake 128k transcode labeled as 320k</span>
                    </div>
                  </td>
                </tr>

                <tr>
                  <td className="td-spec">
                    <strong>Media length limits</strong>
                    <span>Maximum supported duration</span>
                  </td>
                  <td className="td-sonic">
                    <div className="status-cell good">
                      <CheckCircle2 size={16} />
                      <span>Unlimited (Download 5-hour sets &amp; mixes)</span>
                    </div>
                  </td>
                  <td className="td-others">
                    <div className="status-cell bad">
                      <XCircle size={16} />
                      <span>Hard-capped at 10 to 20 minutes max</span>
                    </div>
                  </td>
                </tr>

                <tr>
                  <td className="td-spec">
                    <strong>Privacy &amp; data security</strong>
                    <span>Telemetry and logging</span>
                  </td>
                  <td className="td-sonic">
                    <div className="status-cell good">
                      <CheckCircle2 size={16} />
                      <span>Runs 100% locally on your machine</span>
                    </div>
                  </td>
                  <td className="td-others">
                    <div className="status-cell bad">
                      <XCircle size={16} />
                      <span>URLs and IP addresses logged on remote cloud</span>
                    </div>
                  </td>
                </tr>

                <tr>
                  <td className="td-spec">
                    <strong>Integrated media player</strong>
                    <span>In-app listening &amp; preview</span>
                  </td>
                  <td className="td-sonic">
                    <div className="status-cell good">
                      <CheckCircle2 size={16} />
                      <span>Desktop player with waveform visualizer</span>
                    </div>
                  </td>
                  <td className="td-others">
                    <div className="status-cell bad">
                      <XCircle size={16} />
                      <span>None (Raw download link only)</span>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* =========================================================================
          SYSTEM SPECIFICATIONS
          ========================================================================= */}
      <section className="cursor-section" id="specs">
        <div className="cursor-container">
          <div className="cursor-section-header">
            <span className="cursor-eyebrow">HARDWARE REQUIREMENTS</span>
            <h2 className="cursor-display-lg">System specifications.</h2>
            <p className="cursor-subhead">
              Engineered to be lightweight, responsive, and completely self-contained.
            </p>
          </div>

          <div className="cursor-specs-grid">
            <div className="cursor-spec-card">
              <span className="cursor-spec-label">OPERATING SYSTEM</span>
              <span className="cursor-spec-value">Windows 11 &amp; 10</span>
              <span className="cursor-spec-detail">64-bit Architecture (x86_64)</span>
            </div>

            <div className="cursor-spec-card">
              <span className="cursor-spec-label">PROCESSOR</span>
              <span className="cursor-spec-value">Intel Core or AMD Ryzen</span>
              <span className="cursor-spec-detail">Dual-Core 1.5 GHz or higher</span>
            </div>

            <div className="cursor-spec-card">
              <span className="cursor-spec-label">MEMORY</span>
              <span className="cursor-spec-value">2 GB RAM</span>
              <span className="cursor-spec-detail">4 GB Recommended</span>
            </div>

            <div className="cursor-spec-card">
              <span className="cursor-spec-label">DISK FOOTPRINT</span>
              <span className="cursor-spec-value">~120 MB Free Space</span>
              <span className="cursor-spec-detail">Auto-provisions local binaries</span>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          FAQ ACCORDION (VengeanceUI Style with Cursor & Spotify Theme)
          ========================================================================= */}
      <section className="cursor-section cursor-section-alt" id="faq">
        <div className="cursor-container-narrow">
          <div className="cursor-section-header">
            <span className="cursor-eyebrow">QUESTIONS &amp; ANSWERS</span>
            <h2 className="cursor-display-lg">Frequently asked questions.</h2>
            <p className="cursor-subhead">
              Everything you need to know about SonicWave for Windows.
            </p>
          </div>

          <FaqAccordion
            items={FAQS.map((faq) => ({
              question: faq.q,
              answer: faq.a,
            }))}
          />
        </div>
      </section>

      {/* =========================================================================
          CTA BANNER (DESIGN-cursor.md: cta-banner, surface-1, rounded.lg, padding 48px)
          ========================================================================= */}
      <section className="cursor-section">
        <div className="cursor-container">
          <div className="cursor-cta-panel">
            <span className="cursor-eyebrow">GET STARTED TODAY</span>
            <h2 className="cursor-display-md">
              Experience studio-grade conversion on Windows.
            </h2>
            <p className="cursor-subhead">
              Download SonicWave for Windows to extract audio and video at 16x parallel turbo speed with zero ads or limits.
            </p>
            <div className="cursor-cta-actions">
              <button
                type="button"
                className="cursor-button-primary cursor-btn-lg"
                onClick={handleDownloadClick}
                id="bottom-download-btn"
                aria-label="Download SonicWave for Windows 64-bit"
              >
                <WindowsIcon size={16} />
                <span>Download for Windows (64-bit)</span>
                <Download size={15} className="cursor-cta-icon" aria-hidden="true" />
              </button>
            </div>
            <span className="cursor-micro-note">
              Windows 11 &bull; Windows 10 &bull; 64-bit &bull; 100% Free &amp; Open Source &bull; Standalone 148 KB ZIP
            </span>
          </div>
        </div>
      </section>

      {/* =========================================================================
          HALFTONE WORDMARK FOOTER (Interactive Spring Dots & Shock Ring)
          ========================================================================= */}
      <HalftoneWordmarkFooter
        wordmark="sonicwave"
        label="SonicWave Media"
        meta="©2026 · Windows 64-bit · 16x Turbo"
        columns={FOOTER_COLUMNS}
        backToTop={true}
        height="560px"
        crop={0.2}
        dotGap={6}
        radius={85}
        grain={0.4}
        palette={{
          background: '#010102',
          ink: '#f0f3f6',
          warm: '#5e69d1',
        }}
      />

      {/* =========================================================================
          WINDOWS DOWNLOAD MODAL
          ========================================================================= */}
      {isDownloadModalOpen && (
        <div
          className="cursor-modal-backdrop"
          onClick={() => setIsDownloadModalOpen(false)}
          role="dialog"
          aria-modal="true"
          aria-label="Download SonicWave for Windows"
        >
          <div
            className="cursor-modal-window"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="cursor-modal-header">
              <div className="cursor-modal-title-box">
                <WindowsIcon size={18} className="cursor-accent-win-icon" />
                <div>
                  <h3 className="cursor-modal-h3">Download SonicWave for Windows</h3>
                  <p className="cursor-modal-meta">Version 1.0.0 &bull; Windows 10 &amp; 11 (64-bit) &bull; Free &amp; Open Source</p>
                </div>
              </div>
              <button
                type="button"
                className="cursor-close-btn"
                onClick={() => setIsDownloadModalOpen(false)}
                title="Close dialog"
                aria-label="Close download dialog"
              >
                <X size={16} />
              </button>
            </div>

            <div className="cursor-modal-body">
              <a
                href="/SonicWave-v1.0.0-Windows.zip"
                download="SonicWave-v1.0.0-Windows.zip"
                className="cursor-button-primary cursor-modal-download-btn"
              >
                <Download size={18} />
                <div className="cursor-modal-btn-label">
                  <span className="btn-label-bold">Download SonicWave Archive (.zip)</span>
                  <span className="btn-label-sub">Includes 1-click start.bat &bull; Zero manual Python setup</span>
                </div>
              </a>

              <div className="cursor-setup-guide-box">
                <div className="cursor-setup-header">
                  <Terminal size={14} className="cursor-accent-icon" />
                  <span>Installation Instructions:</span>
                </div>
                <ol className="cursor-setup-ol">
                  <li>
                    <strong>Extract the ZIP archive</strong> to any folder (e.g. <code>C:\SonicWave</code> or your Desktop).
                  </li>
                  <li>
                    <strong>Double-click <code>start.bat</code></strong> &mdash; the launcher initializes the background server, auto-provisions <code>yt-dlp.exe</code> &amp; <code>ffmpeg.exe</code>, and launches the converter app.
                  </li>
                  <li>
                    <strong>Paste any media URL</strong> to convert to 320 kbps MP3 or 1080p MP4.
                  </li>
                </ol>
              </div>
            </div>

            <div className="cursor-modal-footer">
              <div className="cursor-modal-hash">
                <ShieldCheck size={13} className="cursor-accent-icon" />
                <span>SHA-256 Verified &bull; No Adware or Telemetry</span>
              </div>
              <button
                type="button"
                className="cursor-button-secondary cursor-btn-sm"
                onClick={() => setIsDownloadModalOpen(false)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
