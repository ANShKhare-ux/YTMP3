import React, { useState, useEffect, Suspense, lazy } from 'react';
import LandingPage from './components/LandingPage';
import WebsiteIntro from './components/WebsiteIntro';
import DownloadPage from './components/DownloadPage';
import NotFound from './components/NotFound';

const AboutUs = lazy(() => import('./components/legal/AboutUs'));
const PrivacyPolicy = lazy(() => import('./components/legal/PrivacyPolicy'));
const TermsOfUse = lazy(() => import('./components/legal/TermsOfUse'));
const CopyrightPolicy = lazy(() => import('./components/legal/CopyrightPolicy'));
const ContactSupport = lazy(() => import('./components/legal/ContactSupport'));
const InstallGuide = lazy(() => import('./components/docs/InstallGuide'));
const SupportedPlatforms = lazy(() => import('./components/docs/SupportedPlatforms'));
const TroubleshootingGuide = lazy(() => import('./components/docs/TroubleshootingGuide'));
const ConverterGuide = lazy(() => import('./components/convert/ConverterGuide'));

const RouteSuspenseFallback = () => (
  <div
    style={{
      minHeight: '100vh',
      backgroundColor: '#000000',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      color: '#96a1ff',
      fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, sans-serif',
      fontSize: '14px'
    }}
  >
    Loading SonicWave...
  </div>
);

function resolveRoute(pathname, hash) {
  if (pathname === '/about' || pathname === '/about-us' || hash === '#about' || hash === '#/about' || hash === '#about-us' || hash === '#/about-us') return 'about';
  if (pathname === '/download' || pathname === '/downloads' || hash === '#download' || hash === '#/download' || hash === '#downloads' || hash === '#/downloads') return 'download';
  if (pathname === '/install' || hash === '#install' || hash === '#/install') return 'install';
  if (pathname === '/supported-platforms' || hash === '#supported-platforms' || hash === '#/supported-platforms') return 'platforms-guide';
  if (pathname === '/troubleshooting' || hash === '#troubleshooting' || hash === '#/troubleshooting') return 'troubleshooting';
  if (pathname === '/convert/youtube-to-mp3' || hash === '#convert/youtube-to-mp3' || hash === '#/convert/youtube-to-mp3') return 'convert-youtube-to-mp3';
  if (pathname === '/convert/youtube-to-wav' || hash === '#convert/youtube-to-wav' || hash === '#/convert/youtube-to-wav') return 'convert-youtube-to-wav';
  if (pathname === '/convert/soundcloud-to-mp3' || hash === '#convert/soundcloud-to-mp3' || hash === '#/convert/soundcloud-to-mp3') return 'convert-soundcloud-to-mp3';
  if (pathname === '/convert/instagram-reels-to-mp4' || hash === '#convert/instagram-reels-to-mp4' || hash === '#/convert/instagram-reels-to-mp4') return 'convert-instagram-reels-to-mp4';
  if (pathname === '/convert' || hash === '#convert' || hash === '#/convert') return 'convert-youtube-to-mp3';
  if (pathname === '/privacy' || hash === '#privacy' || hash === '#/privacy') return 'privacy';
  if (pathname === '/terms' || hash === '#terms' || hash === '#/terms') return 'terms';
  if (pathname === '/copyright-acceptable-use' || hash === '#copyright-acceptable-use' || hash === '#/copyright-acceptable-use') return 'copyright';
  if (pathname === '/contact' || hash === '#contact' || hash === '#/contact') return 'contact';
  if (pathname === '/landing' || hash === '#landing' || hash === '#/landing') return 'landing';
  if (pathname === '/app' || hash === '#app' || hash === '#/app' || (typeof window !== 'undefined' && window.sonicWaveDesktop?.isDesktop)) return 'app';
  if (pathname === '/404' || hash === '#404' || hash === '#/404') return 'not-found';
  if (pathname === '/' || pathname === '') return 'landing';
  return 'not-found';
}

function getInitialRoute() {
  const pathname = window.location.pathname.replace(/\/$/, '') || '/';
  const hash = window.location.hash;
  return resolveRoute(pathname, hash);
}

export default function App() {
  const [currentView, setCurrentView] = useState(getInitialRoute);
  const [showIntro, setShowIntro] = useState(() => {
    if (typeof window === 'undefined') return false;
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('intro') === '1') return true;
    if (urlParams.get('intro') === '0') return false;
    try {
      if (sessionStorage.getItem('sonicwave_intro_seen')) return false;
    } catch {
      // ignore storage restriction
    }
    const pathname = window.location.pathname.replace(/\/$/, '') || '/';
    return pathname === '/' || pathname === '/landing';
  });

  const navigateTo = (view, path) => {
    setCurrentView(view);
    if (path) {
      window.history.pushState({}, '', path);
      window.scrollTo(0, 0);
    }
  };

  // Synchronize browser path and popstate/hash navigation
  useEffect(() => {
    const handleRouteSync = () => {
      const pathname = window.location.pathname.replace(/\/$/, '') || '/';
      const hash = window.location.hash;
      setCurrentView(resolveRoute(pathname, hash));
    };

    window.addEventListener('popstate', handleRouteSync);
    window.addEventListener('hashchange', handleRouteSync);
    return () => {
      window.removeEventListener('popstate', handleRouteSync);
      window.removeEventListener('hashchange', handleRouteSync);
    };
  }, []);

  // Dedicated Download Center (All available methods & guides)
  if (currentView === 'download') {
    return <DownloadPage onNavigate={navigateTo} />;
  }

  // Technical Documentation Hubs
  if (currentView === 'install') {
    return (
      <Suspense fallback={<RouteSuspenseFallback />}>
        <InstallGuide onNavigate={navigateTo} />
      </Suspense>
    );
  }
  if (currentView === 'platforms-guide') {
    return (
      <Suspense fallback={<RouteSuspenseFallback />}>
        <SupportedPlatforms onNavigate={navigateTo} />
      </Suspense>
    );
  }
  if (currentView === 'troubleshooting') {
    return (
      <Suspense fallback={<RouteSuspenseFallback />}>
        <TroubleshootingGuide onNavigate={navigateTo} />
      </Suspense>
    );
  }

  // Programmatic Conversion Guides
  if (currentView === 'convert-youtube-to-mp3') {
    return (
      <Suspense fallback={<RouteSuspenseFallback />}>
        <ConverterGuide slug="youtube-to-mp3" onNavigate={navigateTo} />
      </Suspense>
    );
  }
  if (currentView === 'convert-youtube-to-wav') {
    return (
      <Suspense fallback={<RouteSuspenseFallback />}>
        <ConverterGuide slug="youtube-to-wav" onNavigate={navigateTo} />
      </Suspense>
    );
  }
  if (currentView === 'convert-soundcloud-to-mp3') {
    return (
      <Suspense fallback={<RouteSuspenseFallback />}>
        <ConverterGuide slug="soundcloud-to-mp3" onNavigate={navigateTo} />
      </Suspense>
    );
  }
  if (currentView === 'convert-instagram-reels-to-mp4') {
    return (
      <Suspense fallback={<RouteSuspenseFallback />}>
        <ConverterGuide slug="instagram-reels-to-mp4" onNavigate={navigateTo} />
      </Suspense>
    );
  }

  // Legal, About & Compliance Pages
  if (currentView === 'about') {
    return (
      <Suspense fallback={<RouteSuspenseFallback />}>
        <AboutUs onNavigate={navigateTo} />
      </Suspense>
    );
  }
  if (currentView === 'privacy') {
    return (
      <Suspense fallback={<RouteSuspenseFallback />}>
        <PrivacyPolicy onNavigate={navigateTo} />
      </Suspense>
    );
  }
  if (currentView === 'terms') {
    return (
      <Suspense fallback={<RouteSuspenseFallback />}>
        <TermsOfUse onNavigate={navigateTo} />
      </Suspense>
    );
  }
  if (currentView === 'copyright') {
    return (
      <Suspense fallback={<RouteSuspenseFallback />}>
        <CopyrightPolicy onNavigate={navigateTo} />
      </Suspense>
    );
  }
  if (currentView === 'contact') {
    return (
      <Suspense fallback={<RouteSuspenseFallback />}>
        <ContactSupport onNavigate={navigateTo} />
      </Suspense>
    );
  }

  // Custom 404 Error Page
  if (currentView === 'not-found') {
    return <NotFound onNavigate={navigateTo} />;
  }

  // Marketing Landing Page (Default)
  return (
    <div className="cursor-landing-wrapper">
      {showIntro && <WebsiteIntro onFinish={() => setShowIntro(false)} />}
      <LandingPage onNavigate={navigateTo} />
    </div>
  );
}
