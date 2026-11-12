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
  Menu,
  FileCode,
  FolderArchive,
  ArrowRight,
  Sun,
  Moon,
  ChevronUp
} from 'lucide-react';
import FaqAccordion from './ui/FaqAccordion';
import HalftoneWordmarkFooter from './ui/halftone-wordmark-footer';
import DownloadSuccessModal, { triggerZipDownload } from './DownloadSuccessModal';
import HeroIntro from './HeroIntro';
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
      { label: 'Installation Guide', href: '/install' },
      { label: 'Supported Platforms', href: '/supported-platforms' },
      { label: 'Troubleshooting & FAQ', href: '/troubleshooting' },
      { label: 'Features', href: '#features' },
      { label: 'Speed 16x', href: '#comparison' },
      { label: 'Specifications', href: '#specs' },
    ],
  },
  {
    title: 'Engine & Specs',
    links: [
      { label: 'Codec Specifications', href: '/supported-platforms' },
      { label: 'yt-dlp 16-Stream', href: '#specs' },
      { label: 'FFmpeg Mux Engine', href: '#specs' },
      { label: 'Node.js Local', href: '#specs' },
      { label: 'ID3 High-Res Art', href: '#features' },
    ],
  },
  {
    title: 'Legal & Help',
    links: [
      { label: 'Privacy Policy', href: '/privacy' },
      { label: 'Terms of Use', href: '/terms' },
      { label: 'Copyright & Abuse', href: '/copyright-acceptable-use' },
      { label: 'Contact & Support', href: '/contact' },
    ],
  },
  {
    title: 'Download',
    links: [
      { label: 'Windows (.zip)', href: '/SonicWave-v1.0.0-Windows.zip' },
      { label: 'Installation Steps', href: '/install' },
      { label: 'Zero Telemetry', href: '#features' },
      { label: 'Personal Archiving', href: '/copyright-acceptable-use' },
    ],
  },
];

export default function LandingPage({
  onNavigate
}) {
  const [isDownloadModalOpen, setIsDownloadModalOpen] = useState(false);
  const [isDownloadSuccessOpen, setIsDownloadSuccessOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [theme, setTheme] = useState(() => {
    try {
      return localStorage.getItem('sonicwave_landing_theme') || 'dark';
    } catch {
      return 'dark';
    }
  });

  const toggleTheme = () => {
    setTheme((prev) => {
      const next = prev === 'dark' ? 'light' : 'dark';
      try {
        localStorage.setItem('sonicwave_landing_theme', next);
      } catch {}
      return next;
    });
  };

  const [openFaqIndex, setOpenFaqIndex] = useState(0);

  // GSAP Animation Scoping Ref
  const containerRef = useRef(null);

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

  const [showScrollTop, setShowScrollTop] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [activeSection, setActiveSection] = useState('');
  const [ctaElevated, setCtaElevated] = useState(false);

  // Dynamic navbar scroll state, reading progress, and IntersectionObserver scroll-spy
  useEffect(() => {
    const handleScroll = () => {
      const scrollY = window.scrollY;
      setIsScrolled(scrollY > 20);
      setCtaElevated(scrollY > 450);
      setShowScrollTop(scrollY > 400);

      const winHeight = window.innerHeight;
      const docHeight = document.documentElement.scrollHeight - winHeight;
      const progress = docHeight > 0 ? Math.min(100, Math.max(0, (scrollY / docHeight) * 100)) : 0;
      setScrollProgress(progress);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();

    const sectionIds = ['platforms', 'how-it-works', 'features', 'comparison', 'specs', 'faq'];
    const sections = sectionIds.map((id) => document.getElementById(id)).filter(Boolean);

    const observer = new IntersectionObserver(
      (entries) => {
        const visibleEntries = entries.filter((e) => e.isIntersecting);
        if (visibleEntries.length > 0) {
          visibleEntries.sort((a, b) => b.intersectionRatio - a.intersectionRatio);
          setActiveSection(visibleEntries[0].target.id);
        } else if (window.scrollY < 300) {
          setActiveSection('');
        }
      },
      {
        rootMargin: '-20% 0px -50% 0px',
        threshold: [0, 0.2, 0.5, 0.8]
      }
    );

    sections.forEach((sec) => observer.observe(sec));

    return () => {
      window.removeEventListener('scroll', handleScroll);
      observer.disconnect();
    };
  }, []);
  useGSAP(() => {
    // Accessibility: Honor reduced motion preference immediately
    const prefersReducedMotion = typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) {
      gsap.set(".cursor-top-nav", { clearProps: "all" });
      return;
    }

    // 1. Custom Physics Curves & Eases (curated via Easing Wizard MCP)
    CustomEase.create("appleSpring", "M0,0 C0.16,1 0.3,1 1,1");
    CustomEase.create("punchSpring", "M0,0 C0.18,0.85 0.32,1.15 1,1");
    CustomEase.create("smoothGlide", "M0,0 C0.25,0.1 0.25,1 1,1");
    CustomEase.create("backSnap", "M0,0 C0.34,1.56 0.64,1 1,1");
    CustomBounce.create("btnBounce", { strength: 0.5, squash: 2 });
    CustomWiggle.create("waveformWiggle", { wiggles: 8, type: "random" });

    // 2. DrawSVG on Brand Logo & vector outlines in Top Nav
    gsap.fromTo(".cursor-brand-logo svg rect", 
      { scaleY: 0, transformOrigin: "bottom" },
      { scaleY: 1, stagger: 0.06, duration: 0.6, ease: "punchSpring" }
    );

    // 3. Top Nav Entrance Timeline
    gsap.fromTo(".cursor-top-nav", 
      { y: -20, opacity: 0 }, 
      { y: 0, opacity: 1, duration: 0.45, ease: "appleSpring" }
    );

    // 4. Magnetic CTA buttons (quickTo)
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
  }, { scope: containerRef });

  const handleSmoothScroll = (e, targetHref) => {
    if (!targetHref || !targetHref.startsWith('#')) return;
    if (e && typeof e.preventDefault === 'function') e.preventDefault();
    if (targetHref === '#hero' || targetHref === '#top') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    const targetEl = document.querySelector(targetHref);
    if (targetEl) {
      targetEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const scrollToSection = (targetId) => {
    handleSmoothScroll(null, targetId);
  };

  const handleDownloadZip = (e) => {
    if (e && e.preventDefault) e.preventDefault();
    triggerZipDownload();
    setIsDownloadModalOpen(false);
    setIsDownloadSuccessOpen(true);
  };

  const handleDownloadClick = (e) => {
    handleDownloadZip(e);
  };

  return (
    <div className={`cursor-canvas-root ${theme === 'light' ? 'light-mode' : ''}`} data-theme={theme} ref={containerRef}>
      {/* Keyboard Accessibility: Skip to Main Content Link */}
      <a href="#main-content" className="cursor-skip-link" onClick={(e) => handleSmoothScroll(e, '#main-content')}>
        Skip to main content
      </a>

      {/* =========================================================================
          TOP NAV (Dynamic Frosted Glass, Reading Progress, Active Section Spy)
          ========================================================================= */}
      <header className={`cursor-top-nav ${isScrolled ? 'is-scrolled' : ''}`} role="banner">
        {/* Dynamic Reading / Scroll Progress Bar */}
        <div className="cursor-nav-progress-bar" style={{ width: `${scrollProgress}%` }} aria-hidden="true" />

        <div className="cursor-nav-container">
          <a
            href="#"
            className="cursor-nav-brand"
            onClick={(e) => {
              e.preventDefault();
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            title="SonicWave - Back to Top"
          >
            <CursorBrandLogo size={24} />
            <span className="cursor-brand-title">SonicWave</span>
            <span className="cursor-nav-version-badge">v1.0.0</span>
          </a>

          <nav className="cursor-nav-links" aria-label="Main Navigation">
            <a
              href="#features"
              className={`cursor-nav-link ${activeSection === 'features' ? 'is-active' : ''}`}
              onClick={(e) => {
                setActiveSection('features');
                handleSmoothScroll(e, '#features');
              }}
            >
              Features
            </a>
            <a
              href="#how-it-works"
              className={`cursor-nav-link ${activeSection === 'how-it-works' ? 'is-active' : ''}`}
              onClick={(e) => {
                setActiveSection('how-it-works');
                handleSmoothScroll(e, '#how-it-works');
              }}
            >
              How it works
            </a>
            <a
              href="#platforms"
              className={`cursor-nav-link ${activeSection === 'platforms' ? 'is-active' : ''}`}
              onClick={(e) => {
                setActiveSection('platforms');
                handleSmoothScroll(e, '#platforms');
              }}
            >
              Platforms
            </a>
            <a
              href="#comparison"
              className={`cursor-nav-link ${activeSection === 'comparison' ? 'is-active' : ''}`}
              onClick={(e) => {
                setActiveSection('comparison');
                handleSmoothScroll(e, '#comparison');
              }}
            >
              Comparison
            </a>
            <a
              href="#specs"
              className={`cursor-nav-link ${activeSection === 'specs' ? 'is-active' : ''}`}
              onClick={(e) => {
                setActiveSection('specs');
                handleSmoothScroll(e, '#specs');
              }}
            >
              Specs
            </a>
            <a
              href="#faq"
              className={`cursor-nav-link ${activeSection === 'faq' ? 'is-active' : ''}`}
              onClick={(e) => {
                setActiveSection('faq');
                handleSmoothScroll(e, '#faq');
              }}
            >
              FAQ
            </a>
            <a
              href="/install"
              className="cursor-nav-link"
              onClick={(e) => {
                if (onNavigate) {
                  e.preventDefault();
                  onNavigate('install', '/install');
                }
              }}
            >
              Docs
            </a>
          </nav>

          <div className="cursor-nav-actions">
            <button
              type="button"
              className="cursor-button-secondary cursor-nav-theme-btn"
              onClick={toggleTheme}
              title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
              aria-label={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            >
              {theme === 'dark' ? <Sun size={14} aria-hidden="true" /> : <Moon size={14} aria-hidden="true" />}
            </button>

            <button
              type="button"
              className={`cursor-button-primary cursor-nav-download-btn ${ctaElevated ? 'is-elevated' : ''}`}
              onClick={handleDownloadClick}
              id="nav-download-btn"
              aria-label="Download SonicWave for Windows"
            >
              <WindowsIcon size={14} />
              <span className="cursor-nav-download-text">Download for Windows</span>
            </button>

            <button
              type="button"
              className="cursor-nav-mobile-toggle"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              aria-expanded={isMobileMenuOpen}
              aria-label={isMobileMenuOpen ? "Close navigation menu" : "Open navigation menu"}
            >
              {isMobileMenuOpen ? <X size={18} /> : <Menu size={18} />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation Dropdown Drawer */}
        {isMobileMenuOpen && (
          <div className="cursor-mobile-menu-drawer" role="dialog" aria-label="Mobile Navigation">
            <nav className="cursor-mobile-nav-links" aria-label="Mobile Navigation Links">
              <a
                href="#features"
                className={`cursor-mobile-nav-link ${activeSection === 'features' ? 'is-active' : ''}`}
                onClick={(e) => {
                  setIsMobileMenuOpen(false);
                  setActiveSection('features');
                  handleSmoothScroll(e, '#features');
                }}
              >
                Features
              </a>
              <a
                href="#how-it-works"
                className={`cursor-mobile-nav-link ${activeSection === 'how-it-works' ? 'is-active' : ''}`}
                onClick={(e) => {
                  setIsMobileMenuOpen(false);
                  setActiveSection('how-it-works');
                  handleSmoothScroll(e, '#how-it-works');
                }}
              >
                How it works
              </a>
              <a
                href="#platforms"
                className={`cursor-mobile-nav-link ${activeSection === 'platforms' ? 'is-active' : ''}`}
                onClick={(e) => {
                  setIsMobileMenuOpen(false);
                  setActiveSection('platforms');
                  handleSmoothScroll(e, '#platforms');
                }}
              >
                Platforms
              </a>
              <a
                href="#comparison"
                className={`cursor-mobile-nav-link ${activeSection === 'comparison' ? 'is-active' : ''}`}
                onClick={(e) => {
                  setIsMobileMenuOpen(false);
                  setActiveSection('comparison');
                  handleSmoothScroll(e, '#comparison');
                }}
              >
                Comparison
              </a>
              <a
                href="#specs"
                className={`cursor-mobile-nav-link ${activeSection === 'specs' ? 'is-active' : ''}`}
                onClick={(e) => {
                  setIsMobileMenuOpen(false);
                  setActiveSection('specs');
                  handleSmoothScroll(e, '#specs');
                }}
              >
                Specs
              </a>
              <a
                href="#faq"
                className={`cursor-mobile-nav-link ${activeSection === 'faq' ? 'is-active' : ''}`}
                onClick={(e) => {
                  setIsMobileMenuOpen(false);
                  setActiveSection('faq');
                  handleSmoothScroll(e, '#faq');
                }}
              >
                FAQ
              </a>
              <a
                href="/install"
                className="cursor-mobile-nav-link"
                onClick={(e) => {
                  setIsMobileMenuOpen(false);
                  if (onNavigate) {
                    e.preventDefault();
                    onNavigate('install', '/install');
                  }
                }}
              >
                Docs &amp; Guide
              </a>
            </nav>
            <div className="cursor-mobile-menu-actions">
              <button
                type="button"
                className="cursor-button-primary cursor-mobile-download-btn"
                onClick={(e) => { setIsMobileMenuOpen(false); handleDownloadClick(e); }}
              >
                <WindowsIcon size={16} />
                <span>Download for Windows (.zip)</span>
              </button>
              <button
                type="button"
                className="cursor-button-secondary cursor-mobile-theme-btn"
                onClick={() => {
                  toggleTheme();
                  setIsMobileMenuOpen(false);
                }}
                aria-label={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
              >
                {theme === 'dark' ? <Sun size={14} /> : <Moon size={14} />}
                <span>{theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}</span>
              </button>
            </div>
          </div>
        )}
      </header>

      {/* Main Landmark for WCAG 2.2 AA Compliance */}
      <main id="main-content" tabIndex={-1} aria-label="SonicWave Product Overview">

      {/* =========================================================================
          HERO INTRO SECTION (3D Perspective, Redaction 50, Motion Physics, Intact Brand Logo)
          ========================================================================= */}
      <HeroIntro
        onDownload={() => handleDownloadClick('Windows (x64)')}
        onNavigate={onNavigate}
        onSmoothScroll={(targetId) => scrollToSection(targetId)}
        theme={theme}
      />

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
              Windows 11 &bull; Windows 10 &bull; 64-bit &bull; 100% Free &amp; Open Source &bull; Standalone 1.3 MB ZIP
            </span>
          </div>
        </div>
      </section>
      </main>

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
        grain={theme === 'light' ? 0.25 : 0.4}
        preset={theme === 'light' ? 'paper' : 'night'}
        onNavigate={(href) => {
          if (href === '/SonicWave-v1.0.0-Windows.zip') {
            handleDownloadZip();
          } else if (onNavigate) {
            if (href === '/install') onNavigate('install', '/install');
            else if (href === '/supported-platforms') onNavigate('platforms-guide', '/supported-platforms');
            else if (href === '/troubleshooting') onNavigate('troubleshooting', '/troubleshooting');
            else if (href === '/privacy') onNavigate('privacy', '/privacy');
            else if (href === '/terms') onNavigate('terms', '/terms');
            else if (href === '/copyright-acceptable-use') onNavigate('copyright', '/copyright-acceptable-use');
            else if (href === '/contact') onNavigate('contact', '/contact');
            else onNavigate('landing', href);
          } else {
            window.location.href = href;
          }
        }}
        palette={theme === 'light' ? {
          background: '#f7f8f9',
          ink: '#0d0f12',
          warm: '#5e6ad2',
        } : {
          background: '#010102',
          ink: '#f0f3f6',
          warm: '#5e69d1',
        }}
      />

      {/* Windows Download Modal Dialog */}
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
                onClick={handleDownloadZip}
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

      {/* SaaS Download Success Dialogbox */}
      <DownloadSuccessModal
        isOpen={isDownloadSuccessOpen}
        onClose={() => setIsDownloadSuccessOpen(false)}
        onNavigate={onNavigate}
      />

      {/* Floating Smooth Scroll to Top Button */}
      {showScrollTop && (
        <button
          type="button"
          className="cursor-floating-scroll-top"
          onClick={() => handleSmoothScroll(null, '#top')}
          title="Scroll smoothly to top"
          aria-label="Scroll smoothly to top"
        >
          <ChevronUp size={18} aria-hidden="true" />
        </button>
      )}
    </div>
  );
}
