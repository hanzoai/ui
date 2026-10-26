/**
 * hanzo.ai's nav tree: the company menu under the wordmark, the five menus in
 * the bar, Log in ▾, the one filled control, and the footer's six doors under
 * the same names. `Masthead` draws the bar and the phone sheet from it, and
 * `@hanzo/ui/marketing`'s `Footer` draws `FOOT` (see `footer()`), so a site that
 * wears hanzo.ai's chrome shows the same rows hanzo.ai does.
 *
 * hanzo.ai computes its own copy from its pages (its solutions, layers and
 * posts); this is that tree as published with this release. A path (`/about`)
 * is a page on hanzo.ai. A site on another host passes `origin="https://hanzo.ai"`
 * and every path is prefixed with it; an address that names a host is used as
 * written.
 *
 * Data only, so a server component can import it: `@hanzo/ui/masthead/nav`.
 */

import type { GlyphName } from '@hanzogui/shell'

// ── The hosts the tree links out to ─────────────────────────────────────────

/** hanzo.ai itself: the origin a site on another host passes. */
export const HANZO = 'https://hanzo.ai'
/** The one API console: keys, usage and billing. */
export const CONSOLE = 'https://platform.hanzo.ai'
/** Where a reader gets the one key everything is billed against. */
export const KEYS = `${CONSOLE}/api-keys`
/** Where a reader sets up Claude Code, Codex or Cursor to run through Hanzo. */
export const CODING = `${CONSOLE}/accelerate`
/** The page the Hanzo App is got from: the download, the CLI, the app in the browser. */
export const APP = 'https://hanzo.app'
/** The team workspace. */
export const WORKSPACE = 'https://hanzo.team'
export const STATUS = 'https://status.hanzo.ai'
export const GITHUB = 'https://github.com/hanzoai'
export const DOCS = 'https://docs.hanzo.ai'
export const BLOG = 'https://blog.hanzo.ai'
export const AGENCY = 'https://hanzo.agency'
export const UNIVERSITY = 'https://hanzo.university'
export const HIPS = 'https://hips.hanzo.ai'
export const MODELS = 'https://huggingface.co/zenlm'

/** hanzo.ai's own sign-in, and the onboarding Try Hanzo opens. The app signs in on hanzo.ai, never on another host. */
export const SIGNIN = '/login'
export const ONBOARDING = '/onboarding'
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

/**
 * Where a row goes from a page on `origin`: a path is prefixed with it, a host
 * is kept. A row that names `here` — the host the page itself is on — becomes
 * that site's own path, so a site's row in the tree is a page of it.
 */
export const at = (href: string, origin = '', here = ''): string => {
  if (here && (href === here || href.startsWith(`${here}/`))) return href.slice(here.length) || '/'
  return away(href) || href.startsWith('#') ? href : `${origin}${href}`
}

/** Whether a row leaves the page it is on: it names a host, and not `here`. */
export const leaves = (href: string, here = ''): boolean => away(href) && !(here && (href === here || href.startsWith(`${here}/`)))

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
        { label: 'Careers', href: '/careers' },
        { label: 'News', href: '/press' },
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
        title: 'Releases',
        lead: true,
        links: [
          { label: 'Enso 1', href: '/enso' },
          { label: 'Kai 1', href: '/kai' },
          { label: 'Zen 6', href: '/zen' },
          { label: 'Kata 1', href: '/kata' },
          { label: 'Gen 1', href: '/gen' },
        ],
      },
      {
        title: 'Creative AI',
        links: [
          { label: 'Koma', href: '/koma' },
          { label: 'Iro', href: '/iro' },
          { label: 'Mori', href: '/mori' },
          { label: 'Oto', href: '/oto' },
          { label: 'Koe', href: '/koe' },
          { label: 'Uta', href: '/uta' },
        ],
      },
      {
        title: 'Explore Research',
        links: [
          { label: 'Overview', href: '/research' },
          { label: 'Benchmarks', href: '/benchmarks' },
          { label: 'Compare', href: '/compare' },
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
          { label: 'All models', href: '/models' },
          { label: 'LLMs', href: '/zen' },
          { label: 'Decisions', href: '/kai' },
          { label: 'Routing', href: '/enso' },
        ],
      },
      {
        title: 'Creative AI',
        links: [
          { label: 'Video', href: '/koma' },
          { label: 'Images', href: '/iro' },
          { label: '3D', href: '/mori' },
          { label: 'Sound effects', href: '/oto' },
          { label: 'Voice', href: '/koe' },
          { label: 'Music', href: '/uta' },
        ],
      },
      {
        title: 'API Platform',
        links: [
          { label: 'Overview', href: '/platform' },
          { label: 'API', href: '/api' },
          { label: 'Playground', href: '/playground' },
          { label: 'Gateway', href: '/gateway' },
          { label: 'Agents', href: '/agents' },
          { label: 'Base', href: '/base' },
          { label: 'Machines', href: '/machines' },
        ],
      },
      {
        title: 'Apps and tools',
        links: [
          { label: 'Hanzo App', href: APP },
          { label: 'Hanzo Bot', href: '/bot' },
          { label: 'Hanzo CLI', href: '/cli' },
          { label: 'Hanzo Dev', href: '/dev' },
          { label: 'Hanzo Gen', href: '/gen' },
          { label: 'Hanzo Kata', href: '/kata' },
          { label: 'Hanzo Team', href: WORKSPACE },
          { label: 'MCP', href: '/mcp' },
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
      {
        title: 'More from Hanzo',
        links: [
          { label: 'Start from a template', href: '/templates' },
          { label: 'Agents at work', href: '/agents/crew' },
          { label: 'Cloud on your laptop', href: '/cloud/local' },
          { label: 'Start a company', href: '/start' },
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
          { label: 'Agency', href: AGENCY },
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
          { label: 'Claude Code, Codex, Cursor', href: CODING, hint: 'Use Hanzo with your coding tools' },
          { label: 'Integrations', href: '/integrations' },
          { label: 'Examples', href: '/gallery' },
        ],
      },
      {
        title: 'Community',
        links: [
          { label: 'GitHub', href: GITHUB },
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
        title: 'Blog',
        links: [
          { label: 'Your AI is Planning To Kill You', href: 'https://hanzo.blog/blog/2026-10-16-your-ai-is-planning-to-kill-you/', hint: 'KAI' },
          { label: 'Kai 1: Decisions, Not Completions', href: 'https://hanzo.blog/blog/2026-10-07-introducing-kai/', hint: 'KAI' },
          { label: 'What Is a Decision Model?', href: 'https://hanzo.blog/blog/2026-09-30-what-is-a-decision-model/', hint: 'DECISION MODELS' },
          { label: 'All articles', href: '/blog' },
        ],
      },
      {
        title: 'Research & Guides',
        links: [
          { label: 'Overview', href: '/learn' },
          { label: 'Technical Blog', href: BLOG },
          { label: 'Kai & Decision Models', href: '/blog/kai-decision-models' },
          { label: 'Coding agents', href: `${DOCS}/docs/coding` },
          { label: 'Guides', href: `${DOCS}/docs/guides/` },
          { label: 'Cookbook', href: `${DOCS}/docs/guides/cookbook/` },
        ],
      },
      {
        title: 'Support',
        links: [
          { label: 'Documentation', href: DOCS },
          { label: 'Help center', href: '/support' },
        ],
      },
      {
        title: 'Hanzo University',
        links: [
          { label: 'Hanzo University', href: UNIVERSITY, hint: 'Courses and certifications' },
          { label: 'Agentic coding', href: '/university/agentic-coding' },
          { label: 'Reinforcement learning', href: '/university/reinforcement-learning' },
          { label: 'Systems engineering', href: '/university/systems-engineering' },
          { label: 'AI practitioner', href: '/university/ai-practitioner' },
          { label: 'AI architect', href: '/university/ai-architect' },
          { label: 'Agentic marketing', href: '/university/agentic-marketing' },
        ],
      },
    ],
  },
]

/** Log in ▾: the two products a person signs in to. The app signs in on hanzo.ai. */
export const LOGIN: Link[] = [
  { label: 'Hanzo App', href: SIGNIN, hint: 'Build, chat and ship' },
  { label: 'API Platform', href: KEYS, hint: 'Keys, usage and billing' },
]

/** The one filled control in the bar: onboarding, which drops into the personal or business plans first. */
export const TRY: Link = { label: 'Try Hanzo', href: ONBOARDING }

/** What the same control says to a reader who is signed in: the app, at `/`. */
export const OPEN: Link = { label: 'Open Hanzo', href: '/' }

/** The signed-in reader's own page. */
export const ACCOUNT: Link = { label: 'Settings', href: '/settings' }

/**
 * The footer: the header's menus in the header's order and under the same
 * names, then Company — a few of each menu's rows under its title, the title
 * opening the page where the rest of that subject lives.
 */
export const FOOT: Menu[] = [
  {
    id: 'research-foot',
    label: 'Research',
    href: '/research',
    glyph: 'pulse',
    groups: [
      {
        title: 'Research',
        lead: true,
        links: [
          { label: 'Enso 1', href: '/enso' },
          { label: 'Kai 1', href: '/kai' },
          { label: 'Zen 6', href: '/zen' },
          { label: 'Creative AI', href: '/models#creative' },
          { label: 'Benchmarks', href: '/benchmarks' },
          { label: 'Compare', href: '/compare' },
          { label: 'Open source', href: '/open-source' },
          { label: 'Security', href: '/security' },
        ],
      },
    ],
  },
  {
    id: 'products-foot',
    label: 'Products',
    href: '/products',
    glyph: 'blocks',
    groups: [
      {
        title: 'Products',
        lead: true,
        links: [
          { label: 'All models', href: '/models' },
          { label: 'LLMs', href: '/zen' },
          { label: 'Decisions', href: '/kai' },
          { label: 'Routing', href: '/enso' },
          { label: 'Video', href: '/koma' },
          { label: 'Images', href: '/iro' },
          { label: 'API Platform', href: '/platform' },
          { label: 'Hanzo App', href: APP },
          { label: 'Hanzo Dev', href: '/dev' },
          { label: 'Download', href: '/download' },
        ],
      },
    ],
  },
  {
    id: 'solutions-foot',
    label: 'Solutions',
    href: SOLUTIONS,
    glyph: 'puzzle',
    groups: [
      {
        title: 'Solutions',
        lead: true,
        links: [
          { label: 'All solutions', href: SOLUTIONS },
          { label: 'Enterprise', href: '/enterprise' },
          { label: 'Agency', href: AGENCY },
          { label: 'Customer stories', href: '/customers' },
          { label: 'Pricing', href: '/pricing' },
          { label: 'Startups', href: '/startups' },
          { label: 'Contact sales', href: '/contact-sales' },
        ],
      },
    ],
  },
  {
    id: 'developers-foot',
    label: 'Developers',
    href: DOCS,
    glyph: 'code',
    groups: [
      {
        title: 'Developers',
        lead: true,
        links: [
          { label: 'Documentation', href: DOCS },
          { label: 'API reference', href: `${DOCS}/docs/openapi/` },
          { label: 'Quickstart', href: `${DOCS}/docs/quickstart/` },
          { label: 'SDKs', href: '/sdks' },
          { label: 'API keys', href: KEYS },
          { label: 'GitHub', href: GITHUB },
          { label: 'Status', href: STATUS },
        ],
      },
    ],
  },
  {
    id: 'learn-foot',
    label: 'Learn',
    href: '/learn',
    glyph: 'book',
    groups: [
      {
        title: 'Learn',
        lead: true,
        links: [
          { label: 'Blog', href: '/blog' },
          { label: 'Guides', href: `${DOCS}/docs/guides/` },
          { label: 'Cookbook', href: `${DOCS}/docs/guides/cookbook/` },
          { label: 'Help center', href: '/support' },
          { label: 'Hanzo University', href: UNIVERSITY },
        ],
      },
    ],
  },
  {
    id: 'company-foot',
    label: 'Company',
    href: '/about',
    glyph: 'user',
    groups: [
      {
        title: 'Company',
        lead: true,
        links: [
          { label: 'About', href: '/about' },
          { label: 'Careers', href: '/careers' },
          { label: 'News', href: '/press' },
          { label: 'Investors', href: '/investors' },
          { label: 'Brand', href: '/brand' },
          { label: 'Contact', href: '/contact' },
        ],
      },
    ],
  },
]

/** The line under the columns. hanzo.ai/legal holds the policies not named here. */
export const FOOT_LINE: Link[] = [
  { label: 'Terms', href: '/terms' },
  { label: 'Privacy', href: '/privacy' },
  { label: 'Usage policy', href: '/aup' },
  { label: 'Your Privacy Choices', href: '#choices' },
]

/** A footer door, as `@hanzo/ui/marketing`'s `Footer` takes it. */
export interface Door {
  label: string
  href: string
  out?: boolean
}

/** A footer column, as `Footer` takes it. */
export interface Column {
  id: string
  title: string
  href?: string
  out?: boolean
  links: Door[]
}

/**
 * `FOOT` and `FOOT_LINE` as `Footer` draws them, from a page on `origin` (and
 * `here`, as `at` reads it): each column a title that opens its subject, then
 * its rows. Whether a row is marked ↗ is read from the tree, as the bar reads it.
 */
export function footer(origin = '', here = '', foot: readonly Menu[] = FOOT, line: readonly Link[] = FOOT_LINE): { columns: Column[]; legal: Door[] } {
  const door = (l: Link): Door => ({ label: l.label, href: at(l.href, origin, here), out: leaves(l.href, here) })
  return {
    columns: foot.map((m) => ({
      id: m.id,
      title: m.label,
      href: at(m.href, origin, here),
      out: leaves(m.href, here),
      links: m.groups.flatMap((g) => g.links).map(door),
    })),
    legal: line.map(door),
  }
}
