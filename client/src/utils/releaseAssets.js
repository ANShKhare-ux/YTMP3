/**
 * Resolves binary release download URLs with optional CDN override (`VITE_RELEASE_CDN_URL`).
 * When unset (default standalone / local Vercel static hosting), falls back to the
 * local `/filename` path served out of `client/public/`.
 */
export function resolveReleaseAssetUrl(filename) {
  const cleanName = String(filename || '').replace(/^\/+/, '');
  const rawBase =
    typeof import.meta !== 'undefined' && import.meta.env
      ? import.meta.env.VITE_RELEASE_CDN_URL
      : '';
  const base = typeof rawBase === 'string' ? rawBase.trim().replace(/\/+$/, '') : '';
  return base ? `${base}/${cleanName}` : `/${cleanName}`;
}
