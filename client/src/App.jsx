import React from 'react';
import AppCore from './AppCore';
import LandingPage from './components/LandingPage';

export default function App() {
  return <AppCore isDesktop={false} LandingPageComponent={LandingPage} />;
}
