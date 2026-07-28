/**
 * Brand identities for the animated logo — the white-label source of truth.
 *
 * ONE component (`AnimatedLogo`) renders any brand: pass a `BrandIdentity` and it
 * shows THAT brand's mark + name (never a hardcoded Hanzo asset). The mark
 * geometry is byte-identical to the console's host-driven brand registry
 * (`console/src/lib/branding/brands.ts`) so a lux/zoo/pars surface renders the
 * exact same glyph the chrome already uses — one mark, everywhere.
 *
 * `content` is inner SVG markup (a build-time-trusted constant, never user
 * input). Marks use `currentColor` so they inherit the surrounding text color and
 * adapt to the dark/light theme with no per-theme asset — except Zoo, whose mark
 * is intentionally full-color (`fullColor`).
 */

export interface BrandIdentity {
  /** Stable id — also the IAM org slug (hanzo/lux/zoo/pars). */
  id: string
  /** Brand word shown before the surface (e.g. "Hanzo" → "Hanzo Cloud"). */
  name: string
  /** viewBox for the inline mark SVG. */
  viewBox: string
  /** Inner SVG markup for the mark (multi-path, build-time-trusted constant). */
  content: string
  /** The mark carries its own fills (Zoo) — do NOT force `currentColor`. */
  fullColor?: boolean
  /** Brand home, used as the logo link's default href. */
  href?: string
}

/**
 * The canonical Hanzo block-"H" — 5 paths, no opacity facets, `currentColor`.
 * Byte-identical to the mark shipped in the chrome (HanzoMark + brand registry),
 * so the default render matches the existing product surfaces exactly.
 */
export const HANZO_MARK_CONTENT =
  '<path d="M22.21 67V44.6369H0V67H22.21Z"/>' +
  '<path d="M66.7038 22.3184H22.2534L0.0878906 44.6367H44.4634L66.7038 22.3184Z"/>' +
  '<path d="M22.21 0H0V22.3184H22.21V0Z"/>' +
  '<path d="M66.7198 0H44.5098V22.3184H66.7198V0Z"/>' +
  '<path d="M66.7198 67V44.6369H44.5098V67H66.7198Z"/>'

export const HANZO: BrandIdentity = {
  id: 'hanzo',
  name: 'Hanzo',
  viewBox: '0 0 67 67',
  content: HANZO_MARK_CONTENT,
  href: 'https://hanzo.ai',
}

/** Lux — downward triangle (the explorer/console registry mark, currentColor). */
export const LUX: BrandIdentity = {
  id: 'lux',
  name: 'Lux',
  viewBox: '0 0 100 100',
  content: '<path d="M50 85 L15 25 L85 25 Z"/>',
  href: 'https://lux.network',
}

/** Zoo — interlocking circles (intentional full-color fills, not currentColor). */
export const ZOO: BrandIdentity = {
  id: 'zoo',
  name: 'Zoo',
  viewBox: '0 0 1024 1024',
  fullColor: true,
  content:
    '<defs>' +
    '<clipPath id="zooClip"><circle cx="512" cy="511" r="270"/></clipPath>' +
    '<clipPath id="zooGClip"><circle cx="513" cy="369" r="234"/></clipPath>' +
    '<clipPath id="zooRClip"><circle cx="365" cy="595" r="234"/></clipPath>' +
    '</defs>' +
    '<g clip-path="url(#zooClip)">' +
    '<circle cx="513" cy="369" r="234" fill="#00A652"/>' +
    '<circle cx="365" cy="595" r="234" fill="#ED1C24"/>' +
    '<circle cx="643" cy="595" r="234" fill="#2E3192"/>' +
    '<g clip-path="url(#zooGClip)">' +
    '<circle cx="365" cy="595" r="234" fill="#FCF006"/>' +
    '<circle cx="643" cy="595" r="234" fill="#01ACF1"/>' +
    '</g>' +
    '<g clip-path="url(#zooRClip)">' +
    '<circle cx="643" cy="595" r="234" fill="#EA018E"/>' +
    '</g>' +
    '<g clip-path="url(#zooGClip)">' +
    '<g clip-path="url(#zooRClip)">' +
    '<circle cx="643" cy="595" r="234" fill="#FFFFFF"/>' +
    '</g></g></g>',
  href: 'https://zoo.ngo',
}

/** Pars — Persian 8-pointed star (the explorer/console registry mark). */
export const PARS: BrandIdentity = {
  id: 'pars',
  name: 'Pars',
  viewBox: '-120 -120 240 240',
  content:
    '<path d="M0,-100 L30,-60 L100,-40 L60,0 L100,40 L30,60 L0,100 L-30,60 L-100,40 L-60,0 L-100,-40 L-30,-60 Z"' +
    ' fill="none" stroke="currentColor" stroke-width="4" stroke-linejoin="round"/>' +
    '<path d="M0,-70 L22,-42 L70,-28 L42,0 L70,28 L22,42 L0,70 L-22,42 L-70,28 L-42,0 L-70,-28 L-22,-42 Z"' +
    ' fill="currentColor" fill-opacity="0.15" stroke="currentColor" stroke-width="3" stroke-linejoin="round"/>' +
    '<circle r="55" fill="none" stroke="currentColor" stroke-width="1.5" opacity="0.4"/>' +
    '<circle r="35" fill="none" stroke="currentColor" stroke-width="1.5" opacity="0.4"/>' +
    '<circle r="8" fill="currentColor"/>',
  href: 'https://pars.network',
}

/** All shipped brands, keyed by id — the white-label registry. */
export const BRANDS: Record<string, BrandIdentity> = { hanzo: HANZO, lux: LUX, zoo: ZOO, pars: PARS }

/** Resolve a brand by id, falling back to Hanzo (the canonical default). */
export function resolveBrand(id?: string): BrandIdentity {
  return (id && BRANDS[id]) || HANZO
}
