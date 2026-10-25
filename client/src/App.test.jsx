import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import App from './App';
import { vi } from 'vitest';

// Mock dependencies
vi.mock('canvas-confetti', () => ({
  default: vi.fn(),
}));

// Mock child components exactly as they appear in App.jsx imports
vi.mock('./components/UrlInput', () => ({
  default: ({ url, setUrl, onSubmit }) => (
    <div data-testid="url-input">
      <input
        data-testid="url-input-field"
        value={url}
        onChange={(e) => setUrl(e.target.value)}
      />
      <button onClick={onSubmit}>Submit URL</button>
    </div>
  ),
}));

vi.mock('./components/FormatSelector', () => ({
  default: () => <div data-testid="format-selector" />,
}));

vi.mock('./components/QualitySelector', () => ({
  default: () => <div data-testid="quality-selector" />,
}));

vi.mock('./components/DownloadButton', () => ({
  default: ({ onStart, isConverting }) => (
    <div data-testid="download-button">
      <button onClick={onStart}>{isConverting ? 'CONVERTING...' : 'CONVERT'}</button>
    </div>
  ),
}));

vi.mock('./components/Header', () => ({
  default: () => <div data-testid="header" />,
}));

vi.mock('./components/ProgressCard', () => ({
  default: () => <div data-testid="progress-card" />,
}));

// Mock components that actually exist in the current App.jsx according to the file content
vi.mock('./components/VideoPreview', () => ({
  default: () => <div data-testid="video-preview" />,
}));

vi.mock('./components/OptionsSelector', () => ({
  default: () => <div data-testid="options-selector" />,
}));

vi.mock('./components/ProgressBar', () => ({
  default: () => <div data-testid="progress-bar" />,
}));

vi.mock('./components/AudioPlayer', () => ({
  default: () => <div data-testid="audio-player" />,
}));

vi.mock('./components/HistorySection', () => ({
  default: () => <div data-testid="history-section" />,
}));

vi.mock('./components/Logo', () => ({
  default: () => <div data-testid="logo" />,
}));

vi.mock('./components/CommandPalette', () => ({
  default: () => <div data-testid="command-palette" />,
}));

vi.mock('./components/PricingModal', () => ({
  default: () => <div data-testid="pricing-modal" />,
}));

vi.mock('./components/LandingPage', () => ({
  default: () => <div data-testid="landing-page" />,
}));

// Mock fetch
global.fetch = vi.fn();

// Mock EventSource
class MockEventSource {
  constructor(url) {
    this.url = url;
    this.close = vi.fn();
    setTimeout(() => {
      if (this.onmessage) {
        // Emit progress event
        this.onmessage({ data: JSON.stringify({ id: 'job123', status: 'progress', progress: 50, format: 'mp3', quality: '320k' }) });
        // Emit complete event
        setTimeout(() => {
          this.onmessage({ data: JSON.stringify({ id: 'job123', status: 'completed', title: 'Test Audio', artist: 'Test Artist', format: 'mp3', quality: '320k' }) });
        }, 50);
      }
    }, 10);
  }
}
global.EventSource = MockEventSource;

describe('App Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    window.location.hash = '';

    // Ensure all mocked endpoints resolve successfully to avoid unhandled rejections blocking tests
    global.fetch.mockImplementation((url) => {
      if (url.includes('/api/status')) {
        return Promise.resolve({
          ok: true,
          headers: new Headers({ 'content-type': 'application/json' }),
          json: () => Promise.resolve({ status: { ready: true } }),
        });
      }
      if (url.includes('/api/history')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ success: true, history: [] }),
        });
      }
      return Promise.resolve({
        ok: true,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: () => Promise.resolve({ success: true }),
      });
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('Test 1 (Routing): Should render LandingPage on #landing and main app on #app', async () => {
    window.location.hash = '#landing';
    const { unmount } = render(<App />);
    expect(screen.getByTestId('landing-page')).toBeInTheDocument();

    unmount();
    window.location.hash = '#app';
    render(<App />);

    await waitFor(() => {
      expect(screen.queryByTestId('landing-page')).not.toBeInTheDocument();
    });
    // Check for "Converter Studio" text in sidebar
    expect(screen.getByText('Converter Studio')).toBeInTheDocument();
  });

  it('Test 2 (System Status - Offline): Should show Backend Offline alert when /api/status fails', async () => {
    global.fetch.mockImplementation((url) => {
      if (url.includes('/api/status')) {
        return Promise.reject(new Error('Network error'));
      }
      return Promise.resolve({ ok: true, json: () => Promise.resolve({ success: true, history: [] }) });
    });

    window.location.hash = '#app';
    render(<App />);

    await waitFor(() => {
      expect(screen.getByText('Backend Offline:')).toBeInTheDocument();
    });
  });

  it('Test 3 (Fetch Video Info): Should fetch info and show preview/options', async () => {
    // Override fetch just for this test
    global.fetch.mockImplementation((url) => {
      if (url.includes('/api/status')) {
        return Promise.resolve({
          ok: true,
          headers: new Headers({ 'content-type': 'application/json' }),
          json: () => Promise.resolve({ status: { ready: true } }),
        });
      }
      if (url.includes('/api/history')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ success: true, history: [] }),
        });
      }
      if (url.includes('/api/info')) {
        return Promise.resolve({
          ok: true,
          headers: new Headers({ 'content-type': 'application/json' }),
          json: () => Promise.resolve({ success: true, data: { title: 'Test Video', url: 'http://test.url' } }),
        });
      }
      return Promise.resolve({ ok: true, headers: new Headers({ 'content-type': 'application/json' }), json: () => Promise.resolve({ success: true }) });
    });

    window.location.hash = '#app';
    render(<App />);

    // Wait for initial render
    await waitFor(() => {
        expect(screen.getByTestId('url-input-field')).toBeInTheDocument();
    });

    // We need a URL to trigger info fetching because App.jsx checks url.trim() before fetch
    const inputField = screen.getByTestId('url-input-field');
    fireEvent.change(inputField, { target: { value: 'https://youtube.com/watch?v=123' } });

    const submitBtn = screen.getByText('Submit URL');
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(screen.getByTestId('video-preview')).toBeInTheDocument();
      expect(screen.getByTestId('options-selector')).toBeInTheDocument();
    });
  });

  it('Test 4 (Start Conversion): Should start conversion and show progress', async () => {
    // Override fetch just for this test
    global.fetch.mockImplementation((url) => {
      if (url.includes('/api/status')) {
        return Promise.resolve({
          ok: true,
          headers: new Headers({ 'content-type': 'application/json' }),
          json: () => Promise.resolve({ status: { ready: true } }),
        });
      }
      if (url.includes('/api/history')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ success: true, history: [] }),
        });
      }
      if (url.includes('/api/info')) {
        return Promise.resolve({
          ok: true,
          headers: new Headers({ 'content-type': 'application/json' }),
          json: () => Promise.resolve({ success: true, data: { title: 'Test Video', url: 'http://test.url' } }),
        });
      }
      if (url.includes('/api/convert')) {
        return Promise.resolve({
          ok: true,
          headers: new Headers({ 'content-type': 'application/json' }),
          json: () => Promise.resolve({ success: true, jobId: 'job123' }),
        });
      }
      return Promise.resolve({ ok: true, headers: new Headers({ 'content-type': 'application/json' }), json: () => Promise.resolve({ success: true }) });
    });

    window.location.hash = '#app';
    render(<App />);

    await waitFor(() => {
      expect(screen.getByTestId('url-input-field')).toBeInTheDocument();
    });

    const inputField = screen.getByTestId('url-input-field');
    fireEvent.change(inputField, { target: { value: 'https://youtube.com/watch?v=123' } });

    // Submit URL to fetch info
    const submitBtn = screen.getByText('Submit URL');
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(screen.getByTestId('video-preview')).toBeInTheDocument();
    });

    // Click start convert button
    const convertBtn = screen.getByText('CONVERT TO MP3 (320k)');
    fireEvent.click(convertBtn);

    await waitFor(() => {
      expect(screen.getByText('CONVERTING...')).toBeInTheDocument();
      expect(screen.getByTestId('progress-bar')).toBeInTheDocument();
    });

    // Wait for the simulated SSE 'completed' event (which takes about 60ms)
    await waitFor(() => {
      // Once completed, it shouldn't say CONVERTING... anymore
      expect(screen.queryByText('CONVERTING...')).not.toBeInTheDocument();
    }, { timeout: 1000 });
  });
});
