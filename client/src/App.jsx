import React, { useState, useEffect } from 'react';
import LandingPage from './components/LandingPage';
import PrivacyPolicy from './components/legal/PrivacyPolicy';
import TermsOfUse from './components/legal/TermsOfUse';
import CopyrightPolicy from './components/legal/CopyrightPolicy';
import ContactSupport from './components/legal/ContactSupport';
import InstallGuide from './components/docs/InstallGuide';
import SupportedPlatforms from './components/docs/SupportedPlatforms';
import TroubleshootingGuide from './components/docs/TroubleshootingGuide';
import ConverterGuide from './components/convert/ConverterGuide';
import NotFound from './components/NotFound';

function resolveRoute(pathname, hash) {
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

  // Technical Documentation Hubs
  if (currentView === 'install') {
    return <InstallGuide onNavigate={navigateTo} />;
  }
  if (currentView === 'platforms-guide') {
    return <SupportedPlatforms onNavigate={navigateTo} />;
  }
  if (currentView === 'troubleshooting') {
    return <TroubleshootingGuide onNavigate={navigateTo} />;
  }

  // Programmatic Conversion Guides
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

  // Legal & Compliance Pages
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

  // Custom 404 Error Page
  if (currentView === 'not-found') {
    return <NotFound onNavigate={navigateTo} />;
  }

  // Marketing Landing Page (Default)
  return (
    <div className="cursor-landing-wrapper">
      <LandingPage onNavigate={navigateTo} />
    </div>
  );
}
