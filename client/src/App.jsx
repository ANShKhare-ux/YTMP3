import React, { useState, useEffect, useRef } from 'react';
import LandingPage from './components/LandingPage';
import WebsiteIntro from './components/WebsiteIntro';
import DownloadPage from './components/DownloadPage';
import NotFound from './components/NotFound';
import AboutUs from './components/legal/AboutUs';
import PrivacyPolicy from './components/legal/PrivacyPolicy';
import TermsOfUse from './components/legal/TermsOfUse';
import CopyrightPolicy from './components/legal/CopyrightPolicy';
import ContactSupport from './components/legal/ContactSupport';
import InstallGuide from './components/docs/InstallGuide';
import SupportedPlatforms from './components/docs/SupportedPlatforms';
import TroubleshootingGuide from './components/docs/TroubleshootingGuide';
import ConverterGuide from './components/convert/ConverterGuide';

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
  const [transitionDir, setTransitionDir] = useState('none');
  const historyIdxRef = useRef(
    typeof window !== 'undefined' && typeof window.history.state?.__swIdx === 'number'
      ? window.history.state.__swIdx
      : 0
  );
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
    const dir = view === 'landing' && currentView !== 'landing' ? 'backward' : 'forward';
    setTransitionDir(dir);
    setCurrentView(view);
    if (path) {
      const nextIdx = historyIdxRef.current + 1;
      historyIdxRef.current = nextIdx;
      window.history.pushState({ __swIdx: nextIdx }, '', path);
      window.scrollTo(0, 0);
    }
  };

  // Seed initial history index & synchronize browser popstate/hash navigation with direction
  useEffect(() => {
    if (typeof window.history.state?.__swIdx !== 'number') {
      window.history.replaceState({ ...(window.history.state || {}), __swIdx: 0 }, '');
      historyIdxRef.current = 0;
    }

    const handlePopState = (e) => {
      const nextIdx = typeof e.state?.__swIdx === 'number' ? e.state.__swIdx : 0;
      setTransitionDir(nextIdx < historyIdxRef.current ? 'backward' : 'forward');
      historyIdxRef.current = nextIdx;
      const pathname = window.location.pathname.replace(/\/$/, '') || '/';
      setCurrentView(resolveRoute(pathname, window.location.hash));
    };

    const handleHashChange = () => {
      const pathname = window.location.pathname.replace(/\/$/, '') || '/';
      const nextView = resolveRoute(pathname, window.location.hash);
      setTransitionDir(nextView === 'landing' ? 'backward' : 'forward');
      setCurrentView(nextView);
    };

    window.addEventListener('popstate', handlePopState);
    window.addEventListener('hashchange', handleHashChange);
    return () => {
      window.removeEventListener('popstate', handlePopState);
      window.removeEventListener('hashchange', handleHashChange);
    };
  }, []);

  const renderCurrentView = () => {
    if (currentView === 'download') {
      return <DownloadPage onNavigate={navigateTo} />;
    }
    if (currentView === 'install') {
      return <InstallGuide onNavigate={navigateTo} />;
    }
    if (currentView === 'platforms-guide') {
      return <SupportedPlatforms onNavigate={navigateTo} />;
    }
    if (currentView === 'troubleshooting') {
      return <TroubleshootingGuide onNavigate={navigateTo} />;
    }
    if (currentView === 'convert-youtube-to-mp3') {
      return <ConverterGuide slug="youtube-to-mp3" onNavigate={navigateTo} />;
    }
    if (currentView === 'convert-youtube-to-wav') {
      return <ConverterGuide slug="youtube-to-wav" onNavigate={navigateTo} />;
    }
    if (currentView === 'convert-soundcloud-to-mp3') {
      return <ConverterGuide slug="soundcloud-to-mp3" onNavigate={navigateTo} />;
    }
    if (currentView === 'convert-instagram-reels-to-mp4') {
      return <ConverterGuide slug="instagram-reels-to-mp4" onNavigate={navigateTo} />;
    }
    if (currentView === 'about') {
      return <AboutUs onNavigate={navigateTo} />;
    }
    if (currentView === 'privacy') {
      return <PrivacyPolicy onNavigate={navigateTo} />;
    }
    if (currentView === 'terms') {
      return <TermsOfUse onNavigate={navigateTo} />;
    }
    if (currentView === 'copyright') {
      return <CopyrightPolicy onNavigate={navigateTo} />;
    }
    if (currentView === 'contact') {
      return <ContactSupport onNavigate={navigateTo} />;
    }
    if (currentView === 'not-found') {
      return <NotFound onNavigate={navigateTo} />;
    }
    return (
      <div className="cursor-landing-wrapper">
        {showIntro && <WebsiteIntro onFinish={() => setShowIntro(false)} />}
        <LandingPage onNavigate={navigateTo} />
      </div>
    );
  };

  const transitionClass =
    transitionDir === 'forward'
      ? 'sw-page-transition sw-slide-forward'
      : transitionDir === 'backward'
      ? 'sw-page-transition sw-slide-backward'
      : '';

  return (
    <div key={currentView} className={transitionClass}>
      {renderCurrentView()}
    </div>
  );
}
