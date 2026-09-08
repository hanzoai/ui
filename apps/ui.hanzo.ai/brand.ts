/**
 * The brand this build wears, read once from BRAND at build time.
 *
 * Every name, mark and link on the site comes from here, so a build for another
 * brand carries none of the house's. The package under documentation keeps its
 * npm name — a code sample's job — and that name is this module's too.
 */
import { createElement, type ReactElement } from 'react'

type Glyph = { viewBox: string; paths: { d: string; opacity?: number }[] }

export type Brand = {
  id: 'hanzo' | 'lux'
  /** The npm name of the package this site documents. */
  name: string
  org: string
  /** The mark, inline, in the current colour. */
  mark: (props: { size?: number }) => ReactElement
  /** The mark as a favicon: one data: URI, so no file has to match the brand. */
  icon: string
  github: string
  npm: string
  site: string
  twitter: string
  /** The framework the library is built on, when it has a public home of its own. */
  framework?: { name: string; url: string }
}

/** The origami H, 67 by 67; the two folds sit a shade behind the faces. */
const H: Glyph = {
  viewBox: '0 0 67 67',
  paths: [
    { d: 'M22.21 67V44.6369H0V67H22.21Z' },
    { d: 'M0 44.6369L22.21 46.8285V44.6369H0Z', opacity: 0.85 },
    { d: 'M66.7038 22.3184H22.2534L0.0878906 44.6367H44.4634L66.7038 22.3184Z' },
    { d: 'M22.21 0H0V22.3184H22.21V0Z' },
    { d: 'M66.7198 0H44.5098V22.3184H66.7198V0Z' },
    { d: 'M66.6753 22.3185L44.5098 20.0822V22.3185H66.6753Z', opacity: 0.85 },
    { d: 'M66.7198 67V44.6369H44.5098V67H66.7198Z' },
  ],
}

const L: Glyph = { viewBox: '0 0 100 100', paths: [{ d: 'M50 85 L15 25 L85 25 Z' }] }

const mark =
  (label: string, g: Glyph) =>
  ({ size = 22 }: { size?: number }) =>
    createElement(
      'svg',
      {
        width: size,
        height: size,
        viewBox: g.viewBox,
        fill: 'currentColor',
        role: 'img',
        'aria-label': label,
        style: { display: 'block', flexShrink: 0 },
      },
      ...g.paths.map((p, i) => createElement('path', { key: i, d: p.d, opacity: p.opacity })),
    )

/** The glyph on a dark rounded square, the way the tab shows it. */
const icon = (g: Glyph) => {
  const paths = g.paths.map((p) => `<path d="${p.d}"${p.opacity ? ` opacity="${p.opacity}"` : ''}/>`).join('')
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect width="64" height="64" rx="8" fill="#0a0a0a"/><svg x="10" y="10" width="44" height="44" viewBox="${g.viewBox}" fill="#fafafa">${paths}</svg></svg>`
  return `data:image/svg+xml,${encodeURIComponent(svg)}`
}

const BRANDS: Record<Brand['id'], Brand> = {
  hanzo: {
    id: 'hanzo',
    name: '@hanzo/ui',
    org: 'Hanzo',
    mark: mark('Hanzo', H),
    icon: icon(H),
    github: 'https://github.com/hanzoai/ui',
    npm: 'https://www.npmjs.com/package/@hanzo/ui',
    site: 'https://ui.hanzo.ai',
    twitter: '@hanzoai',
    framework: { name: '@hanzo/gui', url: 'https://gui.hanzo.ai' },
  },
  lux: {
    id: 'lux',
    name: '@luxfi/ui',
    org: 'Lux',
    mark: mark('Lux', L),
    icon: icon(L),
    github: 'https://github.com/luxfi/ui',
    npm: 'https://www.npmjs.com/package/@luxfi/ui',
    site: 'https://ui.lux.finance',
    twitter: '@luxfi',
  },
}

/** The brand the package is published under; its name is the one code samples rewrite. */
export const house = BRANDS.hanzo

export const brand: Brand = BRANDS[process.env.BRAND === 'lux' ? 'lux' : 'hanzo']
