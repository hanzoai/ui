/**
 * Raw SVG strings for brand marks.
 *
 * These are plain strings, not React components.
 * Consumers can use dangerouslySetInnerHTML, inline them in <img> via data URIs,
 * or pass them to any framework.
 */

// ---------------------------------------------------------------------------
// Hanzo H-mark  (viewBox 0 0 67 67)
// ---------------------------------------------------------------------------

/** Hanzo H-mark -- white fill on transparent, for dark backgrounds */
export const hanzoMarkDark = `<svg viewBox="0 0 67 67" xmlns="http://www.w3.org/2000/svg"><path d="M22.21 67V44.6369H0V67H22.21Z" fill="#ffffff"/><path d="M0 44.6369L22.21 46.8285V44.6369H0Z" fill="#DDDDDD"/><path d="M66.7038 22.3184H22.2534L0.0878906 44.6367H44.4634L66.7038 22.3184Z" fill="#ffffff"/><path d="M22.21 0H0V22.3184H22.21V0Z" fill="#ffffff"/><path d="M66.7198 0H44.5098V22.3184H66.7198V0Z" fill="#ffffff"/><path d="M66.6753 22.3185L44.5098 20.0822V22.3185H66.6753Z" fill="#DDDDDD"/><path d="M66.7198 67V44.6369H44.5098V67H66.7198Z" fill="#ffffff"/></svg>`

/** Hanzo H-mark -- dark fill on transparent, for light backgrounds */
export const hanzoMarkLight = `<svg viewBox="0 0 67 67" xmlns="http://www.w3.org/2000/svg"><path d="M22.21 67V44.6369H0V67H22.21Z" fill="#111113"/><path d="M0 44.6369L22.21 46.8285V44.6369H0Z" fill="#333333"/><path d="M66.7038 22.3184H22.2534L0.0878906 44.6367H44.4634L66.7038 22.3184Z" fill="#111113"/><path d="M22.21 0H0V22.3184H22.21V0Z" fill="#111113"/><path d="M66.7198 0H44.5098V22.3184H66.7198V0Z" fill="#111113"/><path d="M66.6753 22.3185L44.5098 20.0822V22.3185H66.6753Z" fill="#333333"/><path d="M66.7198 67V44.6369H44.5098V67H66.7198Z" fill="#111113"/></svg>`

/** Hanzo H-mark -- currentColor fill, inherits CSS color */
export const hanzoMark = `<svg viewBox="0 0 67 67" xmlns="http://www.w3.org/2000/svg"><path d="M22.21 67V44.6369H0V67H22.21Z" fill="currentColor"/><path d="M0 44.6369L22.21 46.8285V44.6369H0Z" fill="currentColor" opacity="0.85"/><path d="M66.7038 22.3184H22.2534L0.0878906 44.6367H44.4634L66.7038 22.3184Z" fill="currentColor"/><path d="M22.21 0H0V22.3184H22.21V0Z" fill="currentColor"/><path d="M66.7198 0H44.5098V22.3184H66.7198V0Z" fill="currentColor"/><path d="M66.6753 22.3185L44.5098 20.0822V22.3185H66.6753Z" fill="currentColor" opacity="0.85"/><path d="M66.7198 67V44.6369H44.5098V67H66.7198Z" fill="currentColor"/></svg>`

// ---------------------------------------------------------------------------
// Hanzo wordmark  (text-based SVG)
// ---------------------------------------------------------------------------

/** Hanzo wordmark -- white, for dark backgrounds */
export const hanzoWordmarkDark = `<svg viewBox="0 0 200 40" xmlns="http://www.w3.org/2000/svg"><text x="0" y="32" font-family="system-ui,-apple-system,sans-serif" font-size="36" font-weight="700" fill="#ffffff" letter-spacing="-0.02em">HANZO</text></svg>`

/** Hanzo wordmark -- dark, for light backgrounds */
export const hanzoWordmarkLight = `<svg viewBox="0 0 200 40" xmlns="http://www.w3.org/2000/svg"><text x="0" y="32" font-family="system-ui,-apple-system,sans-serif" font-size="36" font-weight="700" fill="#111113" letter-spacing="-0.02em">HANZO</text></svg>`

/** Hanzo wordmark -- currentColor */
export const hanzoWordmark = `<svg viewBox="0 0 200 40" xmlns="http://www.w3.org/2000/svg"><text x="0" y="32" font-family="system-ui,-apple-system,sans-serif" font-size="36" font-weight="700" fill="currentColor" letter-spacing="-0.02em">HANZO</text></svg>`

// ---------------------------------------------------------------------------
// Favicon  (viewBox 0 0 67 67, same as mark -- suitable for <link rel="icon">)
// ---------------------------------------------------------------------------

/** Favicon SVG -- white on dark background with rounded rect */
export const hanzoFavicon = `<svg viewBox="0 0 67 67" xmlns="http://www.w3.org/2000/svg"><rect width="67" height="67" rx="12" fill="#111113"/><path d="M22.21 67V44.6369H0V67H22.21Z" fill="#ffffff" transform="scale(0.7) translate(13,13)"/><path d="M0 44.6369L22.21 46.8285V44.6369H0Z" fill="#DDDDDD" transform="scale(0.7) translate(13,13)"/><path d="M66.7038 22.3184H22.2534L0.0878906 44.6367H44.4634L66.7038 22.3184Z" fill="#ffffff" transform="scale(0.7) translate(13,13)"/><path d="M22.21 0H0V22.3184H22.21V0Z" fill="#ffffff" transform="scale(0.7) translate(13,13)"/><path d="M66.7198 0H44.5098V22.3184H66.7198V0Z" fill="#ffffff" transform="scale(0.7) translate(13,13)"/><path d="M66.6753 22.3185L44.5098 20.0822V22.3185H66.6753Z" fill="#DDDDDD" transform="scale(0.7) translate(13,13)"/><path d="M66.7198 67V44.6369H44.5098V67H66.7198Z" fill="#ffffff" transform="scale(0.7) translate(13,13)"/></svg>`

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Convert an SVG string to a data URI for use in <img src> or CSS url() */
export function svgToDataUri(svg: string): string {
  return `data:image/svg+xml,${encodeURIComponent(svg)}`
}
