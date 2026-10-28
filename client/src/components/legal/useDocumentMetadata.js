import { useEffect } from 'react';

/**
 * Custom hook to update document title, meta description, and canonical URL
 * dynamically on route mount, restoring previous metadata on unmount.
 */
export function useDocumentMetadata({ title, description, canonical, noindex = false }) {
  useEffect(() => {
    const originalTitle = document.title;
    if (title) {
      document.title = title;
    }

    let metaDesc = document.querySelector('meta[name="description"]');
    const originalDesc = metaDesc ? metaDesc.getAttribute('content') : '';
    if (description) {
      if (!metaDesc) {
        metaDesc = document.createElement('meta');
        metaDesc.setAttribute('name', 'description');
        document.head.appendChild(metaDesc);
      }
      metaDesc.setAttribute('content', description);
    }

    let canonicalLink = document.querySelector('link[rel="canonical"]');
    const originalCanonical = canonicalLink ? canonicalLink.getAttribute('href') : '';
    if (canonical) {
      if (!canonicalLink) {
        canonicalLink = document.createElement('link');
        canonicalLink.setAttribute('rel', 'canonical');
        document.head.appendChild(canonicalLink);
      }
      canonicalLink.setAttribute('href', canonical);
    }

    let robotsMeta = document.querySelector('meta[name="robots"]');
    const originalRobots = robotsMeta ? robotsMeta.getAttribute('content') : null;
    if (noindex) {
      if (!robotsMeta) {
        robotsMeta = document.createElement('meta');
        robotsMeta.setAttribute('name', 'robots');
        document.head.appendChild(robotsMeta);
      }
      robotsMeta.setAttribute('content', 'noindex, follow');
    }

    // Scroll to top upon route mount
    window.scrollTo(0, 0);

    return () => {
      document.title = originalTitle;
      if (metaDesc && originalDesc) metaDesc.setAttribute('content', originalDesc);
      if (canonicalLink && originalCanonical) canonicalLink.setAttribute('href', originalCanonical);
      if (robotsMeta) {
        if (originalRobots) {
          robotsMeta.setAttribute('content', originalRobots);
        } else {
          robotsMeta.remove();
        }
      }
    };
  }, [title, description, canonical, noindex]);
}
