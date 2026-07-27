/**
 * The marketing menus, as data.
 *
 * Five properties — hanzo.id, hanzo.network, hanzo.one, sensei.group and
 * hanzo.app — each carried their own 160-line `DesktopNav.tsx`. They were not
 * variations on a theme: hanzo.one and sensei.group were BYTE-IDENTICAL, and
 * hanzo.network vs hanzo.app differed by exactly two lines — `text-neutral-400`
 * against `text-purple-400`, a brand accent. Five copies of one menu, kept in sync
 * by hand and drifting a colour at a time.
 *
 * Content is therefore declared once, here, and the accent becomes a prop. A
 * property that needs a genuinely different menu passes its own `menus`; it does
 * not fork the component.
 *
 * Deliberately NOT sourced from `@hanzo/products`. That package models the product
 * FAMILY (the six-product launcher, installs, per-property `HEADERS`), which is a
 * different menu with an overlapping name — hanzo.ai's own nav proves the point,
 * carrying Philosophy, Papers, Startups and Security that no product catalogue
 * knows about. Folding this into it would either lose that content or bloat the
 * catalogue with marketing copy. One value model per concern.
 */

/** A destination. `external` opens off-site; the host decides how to render both. */
export interface NavLink {
  label: string
  href: string
  external?: boolean
  /** Optional one-liner under the label, for the featured rows. */
  note?: string
  /** Optional glyph, rendered verbatim (these menus use emoji, not an icon set). */
  glyph?: string
}

/** A titled column inside a dropdown. */
export interface NavColumn {
  title?: string
  links: NavLink[]
}

/** A dropdown: the bar label plus its columns. */
export interface NavMenuSpec {
  label: string
  columns: NavColumn[]
}

/** The whole bar — dropdowns and plain links, in order. Order is meaning. */
export type MarketingMenus = ReadonlyArray<NavMenuSpec | NavLink>

/** A bar item is a dropdown when it has columns; otherwise it is a plain link. */
export const isMenu = (item: NavMenuSpec | NavLink): item is NavMenuSpec =>
  (item as NavMenuSpec).columns !== undefined

/** The shared marketing bar, verbatim from what the five properties rendered. */
export const HANZO_MARKETING_MENUS: MarketingMenus = [
  {
    label: 'Meet Hanzo',
    columns: [
      {
        title: 'Company',
        links: [
          { label: 'Meet the team', href: '/team' },
          { label: 'Philosophy', href: '/philosophy' },
          { label: 'Leadership', href: '/leadership' },
          { label: 'Brand', href: '/brand' },
          { label: 'Press', href: '/press' },
        ],
      },
      {
        title: 'Research',
        links: [
          { label: 'Zen LM', href: '/zen', note: '30+ open foundation models', glyph: '🧠' },
          { label: 'All Models', href: '/zen/models' },
          { label: 'Papers', href: 'https://zenlm.org/research', external: true },
          { label: 'HuggingFace', href: 'https://huggingface.co/zenlm', external: true },
          { label: 'Open Source', href: '/open-source' },
        ],
      },
      {
        title: 'Products',
        links: [
          { label: 'Hanzo Dev', href: '/dev', note: 'AI coding assistant', glyph: '⚡' },
          { label: 'AI Platform', href: '/ai' },
          { label: 'Cloud', href: '/cloud' },
          { label: 'Infrastructure', href: '/platform' },
          { label: 'All Products →', href: '/products' },
        ],
      },
      {
        title: 'Connect',
        links: [
          { label: 'Contact Us', href: '/contact' },
          { label: 'Enterprise', href: '/enterprise' },
          { label: 'Referral Program', href: '/referrals' },
        ],
      },
      {
        title: 'Trust',
        links: [
          { label: 'Security', href: '/security' },
          { label: 'System Status', href: '/status' },
        ],
      },
    ],
  },
  { label: 'Pricing', href: '/pricing' },
  {
    label: 'Learn',
    columns: [
      {
        title: 'Documentation',
        links: [
          { label: 'Docs', href: 'https://docs.hanzo.ai', external: true },
          { label: 'Tutorials', href: 'https://docs.hanzo.ai/tutorials', external: true },
          { label: 'API Reference', href: 'https://docs.hanzo.ai/api', external: true },
        ],
      },
      {
        title: 'Community',
        links: [
          { label: 'GitHub', href: 'https://github.com/hanzoai', external: true },
          { label: 'Discord', href: 'https://discord.gg/hanzo', external: true },
          { label: 'Blog', href: '/blog' },
        ],
      },
      {
        title: 'Support',
        links: [
          { label: 'Support Center', href: '/contact' },
          { label: 'Status', href: '/status' },
        ],
      },
    ],
  },
]
