import { track } from '@vercel/analytics';

/**
 * Dispatches an event to Vercel Web Analytics, custom DOM listeners,
 * and Google Analytics / gtag if configured.
 *
 * @param {string} eventName
 * @param {Record<string, any>} properties
 */
export function recordAnalyticsEvent(eventName, properties = {}) {
  try {
    if (typeof window !== 'undefined') {
      // 1. Vercel Web Analytics custom event
      track(eventName, properties);

      // 2. Google Analytics / gtag if present on window
      if (typeof window.gtag === 'function') {
        window.gtag('event', eventName, properties);
      }

      // 3. Backend telemetry ping (fire-and-forget, non-blocking)
      if (typeof navigator !== 'undefined' && typeof navigator.sendBeacon === 'function') {
        try {
          const payload = JSON.stringify({ eventName, properties, timestamp: new Date().toISOString() });
          const blob = new Blob([payload], { type: 'application/json' });
          navigator.sendBeacon('/api/metrics/event', blob);
        } catch {
          // Graceful ignore
        }
      }

      // 4. Custom DOM Event for test assertions & custom telemetry observers
      window.dispatchEvent(
        new CustomEvent('sonicwave:analytics', {
          detail: { eventName, properties, timestamp: new Date().toISOString() }
        })
      );
    }
  } catch (err) {
    if (typeof process !== 'undefined' && process.env?.NODE_ENV !== 'production') {
      console.debug('[analytics] Event dispatch notice:', err?.message || err);
    }
  }
}

/**
 * Primary Success Metric: Tracks whenever a user downloads the SonicWave application package.
 *
 * @param {Object} [options]
 * @param {string} [options.source='modal_primary'] - The entrypoint (e.g. 'hero_cta', 'modal_primary', 'docs_header', 'legal_header', 'install_guide_step1', 'footer_link')
 * @param {string} [options.fileName='SonicWave-v1.0.0-Windows.zip'] - Name of the application archive
 * @param {string} [options.platform='windows_64bit'] - Target operating system
 * @param {string} [options.version='1.0.0'] - Release version
 */
export function trackAppDownload({
  source = 'modal_primary',
  fileName = 'SonicWave-v1.0.0-Windows.zip',
  platform = 'windows_64bit',
  version = '1.0.0'
} = {}) {
  recordAnalyticsEvent('app_download', {
    product: 'SonicWave',
    version,
    platform,
    source,
    file: fileName,
    timestamp: new Date().toISOString()
  });
}

/**
 * Top-of-Funnel Metric: Tracks whenever a user expresses intent to download by clicking a CTA button
 * that triggers the download modal.
 *
 * @param {string} source - The button location ('nav_header', 'hero_cta', 'comparison_table', 'bottom_cta', 'mobile_nav', 'preview_cta')
 */
export function trackDownloadIntent(source = 'unknown_cta') {
  recordAnalyticsEvent('app_download_intent', {
    product: 'SonicWave',
    source,
    timestamp: new Date().toISOString()
  });
}
