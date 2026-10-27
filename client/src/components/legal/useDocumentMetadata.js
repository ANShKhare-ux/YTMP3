import { useEffect } from 'react';

/**
 * Custom hook to update document title, meta description, and canonical URL
 * dynamically on route mount, restoring previous metadata on unmount.
 */
export function useDocumentMetadata({ title, description, canonical }) {
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

    // Scroll to top upon route mount
    window.scrollTo(0, 0);

    return () => {
      document.title = originalTitle;
      if (metaDesc && originalDesc) metaDesc.setAttribute('content', originalDesc);
      if (canonicalLink && originalCanonical) canonicalLink.setAttribute('href', originalCanonical);
    };
  }, [title, description, canonical]);
}
