/**
 * hanzo.ai's nav tree: the company menu under the wordmark, the five menus in
 * the bar, Log in ▾, and the one filled control. `Masthead` draws it on every
 * Hanzo site that wears hanzo.ai's header, so the menus are the same rows
 * everywhere.
 *
 * A path (`/about`) is a page on hanzo.ai. A site on another host passes
 * `origin="https://hanzo.ai"` to `Masthead`, which prefixes the path with it; an
 * address that names a host already is used as written.
 *
 * Data only, so a server component can import it: `@hanzo/ui/masthead/nav`.
 */

import type { GlyphName } from '@hanzogui/shell'

// ── The hosts the tree links out to ─────────────────────────────────────────

/** The one API console: keys, usage and billing. */
export const CONSOLE = 'https://platform.hanzo.ai'
/** Where a reader gets the one key everything is billed against. */
export const KEYS = `${CONSOLE}/api-keys`
/** The page the Hanzo App is got from: the download, the CLI, the app in the browser. */
export const APP = 'https://hanzo.app'
export const STATUS = 'https://status.hanzo.ai'
export const GITHUB = 'https://github.com/hanzoai'
export const DOCS = 'https://docs.hanzo.ai'
export const AGENCY = 'https://hanzo.agency'
export const HIPS = 'https://hips.hanzo.ai'
export const MODELS = 'https://huggingface.co/zenlm'
/** Where the community talks. */
export const DISCORD = 'https://discord.gg/CJCyAsm9Vr'

/** hanzo.ai's own sign-in and sign-up. The app signs in on hanzo.ai, never on another host. */
export const SIGNIN = '/login'
export const SIGNUP = '/signup'
/** The solutions index. */
export const SOLUTIONS = '/solutions'

// ── The tree ────────────────────────────────────────────────────────────────

/** A destination. `hint` is a short second line, used only where a row needs one. */
export interface Link {
  label: string
  href: string
  hint?: string
}

/** A titled column. A `lead` column sets its links in display type, first. */
export interface Group {
  title: string
  links: Link[]
  lead?: boolean
}

/** A top-level entry: its label and mark, the page it stands for, and the columns it opens. */
export interface Menu {
  id: string
  label: string
  href: string
  glyph: GlyphName
  groups: Group[]
}

/** A link leaves hanzo.ai when it names a host. It says so with ↗ and a new tab. */
export const away = (href: string): boolean => /^https?:\/\//.test(href)

/** Where a row goes from a page on `origin`: a path is prefixed with it, a host is kept. */
export const at = (href: string, origin = ''): string => (away(href) || href.startsWith('#') ? href : `${origin}${href}`)

/** The company, opened from the wordmark. */
export const COMPANY: Menu = {
  id: 'company',
  label: 'Company',
  href: '/about',
  glyph: 'user',
  groups: [
    {
      title: 'Explore Company',
      lead: true,
      links: [
        { label: 'About Us', href: '/about' },
        { label: 'Agency', href: AGENCY },
        { label: 'Careers', href: '/careers' },
        { label: 'News', href: '/press' },
        { label: 'Stories', href: '/customers' },
      ],
    },
    {
      title: 'Resources',
      links: [
        { label: 'Brand Guidelines', href: '/brand' },
        { label: 'Philosophy', href: '/philosophy' },
        { label: 'Investors', href: '/investors' },
        { label: 'Contact', href: '/contact' },
      ],
    },
  ],
}

/** The bar, left to right after the wordmark. */
export const MENUS: Menu[] = [
  {
    id: 'research',
    label: 'Research',
    href: '/research',
    glyph: 'pulse',
    groups: [
      {
        title: 'Agentic harness',
        lead: true,
        links: [
          { label: 'Performance', href: '/benchmarks' },
          { label: 'Enso 1', href: '/enso' },
          { label: 'Kai 1', href: '/kai' },
          { label: 'Zen 6', href: '/models/zen' },
        ],
      },
      {
        title: 'Explore Research',
        links: [
          { label: 'Overview', href: '/research' },
          { label: 'Benchmarks', href: '/benchmarks' },
          { label: 'Open source', href: '/open-source' },
          { label: 'Specifications', href: HIPS },
        ],
      },
      {
        title: 'Safety',
        links: [
          { label: 'Security', href: '/security' },
          { label: 'Trust & transparency', href: '/trust' },
        ],
      },
    ],
  },
  {
    id: 'products',
    label: 'Products',
    href: '/products',
    glyph: 'blocks',
    groups: [
      {
        title: 'AI Models',
        lead: true,
        links: [
          { label: 'Models', href: '/models' },
          { label: 'Enso', href: '/enso' },
          { label: 'Zen', href: '/models/zen' },
          { label: 'Kai', href: '/kai' },
        ],
      },
      {
        title: 'API Platform',
        links: [
          { label: 'Overview', href: '/platform' },
          { label: 'API', href: '/api' },
          { label: 'Gateway', href: '/gateway' },
          { label: 'Agents', href: '/agents' },
          { label: 'Base', href: '/base' },
          { label: 'Machines', href: '/machines' },
          { label: 'API log in', href: CONSOLE },
        ],
      },
      {
        title: 'DX Tools',
        links: [
          { label: 'Hanzo App', href: APP },
          { label: 'Hanzo Team', href: '/team' },
          { label: 'Hanzo Bot', href: '/bot' },
          { label: 'MCP', href: '/mcp' },
          { label: 'SDKs', href: '/sdks' },
          { label: 'Skills', href: '/skills' },
        ],
      },
      {
        title: 'Install',
        links: [
          { label: 'CLI', href: '/cli' },
          { label: 'Desktop app', href: '/desktop' },
          { label: 'Browser extension', href: '/extension' },
          { label: 'IDE', href: '/ide' },
          { label: 'All downloads', href: '/download' },
          { label: 'Release notes', href: `${GITHUB}/cli/releases` },
        ],
      },
      // Hanzo OS: the product index and its layers (HIP-0903), each at /products/<id>.
      {
        title: 'Hanzo OS',
        links: [
          { label: 'All products', href: '/products' },
          { label: 'Company', href: '/products/company' },
          { label: 'Agents', href: '/products/agents' },
          { label: 'Models', href: '/products/models' },
          { label: 'Memory', href: '/products/memory' },
          { label: 'Identity', href: '/products/identity' },
          { label: 'Machines', href: '/products/machines' },
          { label: 'Record', href: '/products/record' },
        ],
      },
    ],
  },
  {
    id: 'solutions',
    label: 'Solutions',
    href: SOLUTIONS,
    glyph: 'puzzle',
    groups: [
      {
        title: 'Explore Solutions',
        lead: true,
        links: [
          { label: 'All solutions', href: SOLUTIONS },
          { label: 'Enterprise', href: '/enterprise' },
          { label: 'Customer stories', href: '/customers' },
          { label: 'Pricing', href: '/pricing' },
          { label: 'Contact sales', href: '/contact-sales' },
        ],
      },
      {
        title: 'Teams',
        links: [
          { label: 'Finance', href: `${SOLUTIONS}/finance` },
          { label: 'Data', href: `${SOLUTIONS}/data` },
          { label: 'Sales', href: `${SOLUTIONS}/sales` },
          { label: 'Marketing', href: `${SOLUTIONS}/marketing` },
          { label: 'Operations', href: `${SOLUTIONS}/operations` },
          { label: 'Engineering', href: `${SOLUTIONS}/engineering` },
          { label: 'Design', href: `${SOLUTIONS}/design` },
        ],
      },
      {
        title: 'Industries',
        links: [
          { label: 'Cybersecurity', href: `${SOLUTIONS}/cybersecurity` },
          { label: 'Financial services', href: `${SOLUTIONS}/financial-services` },
          { label: 'Healthcare', href: `${SOLUTIONS}/healthcare` },
          { label: 'Law', href: `${SOLUTIONS}/law` },
          { label: 'Retail', href: `${SOLUTIONS}/retail` },
          { label: 'Government', href: `${SOLUTIONS}/government` },
          { label: 'Education', href: `${SOLUTIONS}/education` },
        ],
      },
      {
        title: 'Use cases',
        links: [
          { label: 'Content creation', href: `${SOLUTIONS}/content-creation` },
          { label: 'Research', href: `${SOLUTIONS}/research` },
          { label: 'Agents', href: `${SOLUTIONS}/agents` },
        ],
      },
      {
        title: 'Programs',
        links: [
          { label: 'Reserved tier', href: `${SOLUTIONS}/reserved` },
          { label: 'Startups', href: '/startups' },
          { label: 'Partner network', href: '/affiliate' },
          { label: 'Cost calculator', href: '/calculator' },
        ],
      },
    ],
  },
  {
    id: 'developers',
    label: 'Developers',
    href: DOCS,
    glyph: 'code',
    groups: [
      {
        title: 'Explore Developers',
        lead: true,
        links: [
          { label: 'Documentation', href: DOCS },
          { label: 'API reference', href: `${DOCS}/docs/openapi/` },
          { label: 'Quickstart', href: `${DOCS}/docs/quickstart/` },
          { label: 'SDKs', href: '/sdks' },
          { label: 'Open models', href: MODELS },
        ],
      },
      {
        title: 'Resources',
        links: [
          { label: 'API keys', href: KEYS },
          { label: 'AI Studio', href: '/ai-studio' },
          { label: 'Integrations', href: '/integrations' },
          { label: 'Examples', href: '/gallery' },
        ],
      },
      {
        title: 'Community',
        links: [
          { label: 'GitHub', href: GITHUB },
          { label: 'Discord', href: DISCORD },
          { label: 'Status', href: STATUS },
        ],
      },
    ],
  },
  {
    id: 'learn',
    label: 'Learn',
    href: '/learn',
    glyph: 'book',
    groups: [
      {
        title: 'Explore Learn',
        lead: true,
        links: [
          { label: 'Overview', href: '/learn' },
          { label: 'Guides', href: `${DOCS}/docs/guides/` },
          { label: 'Cookbook', href: `${DOCS}/docs/guides/cookbook/` },
          { label: 'Blog', href: '/blog' },
        ],
      },
      {
        title: 'Support',
        links: [
          { label: 'Where to start', href: '/playground' },
          { label: 'Help center', href: '/support' },
        ],
      },
    ],
  },
]

/** Log in ▾: the two products a person signs in to. The app signs in on hanzo.ai. */
export const LOGIN: Link[] = [
  { label: 'Hanzo App', href: SIGNIN, hint: 'Build, chat and ship' },
  { label: 'API Platform', href: CONSOLE, hint: 'Keys, usage and billing' },
]

/** The one filled control in the bar: hanzo.ai's sign-up. */
export const TRY: Link = { label: 'Try Hanzo', href: SIGNUP }

/** What the same control says to a reader who is signed in: the app, at `/`. */
export const OPEN: Link = { label: 'Open Hanzo', href: '/' }

/** The signed-in reader's own page. */
export const ACCOUNT: Link = { label: 'Account', href: '/account' }
