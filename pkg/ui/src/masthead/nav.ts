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
 * The words are English, marked with `phrase` and drawn through the reader's
 * `t`; a name (Zen 6, Hanzo Dev, GitHub) is left as it is.
 */

import type { GlyphName } from '@hanzogui/shell'
import { phrase } from '@hanzo/i18n'

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
  label: phrase('Company'),
  href: '/about',
  glyph: 'user',
  groups: [
    {
      title: phrase('Explore Company'),
      lead: true,
      links: [
        { label: phrase('About Us'), href: '/about' },
        { label: phrase('Careers'), href: '/careers' },
        { label: phrase('News'), href: '/press' },
      ],
    },
    {
      title: phrase('Resources'),
      links: [
        { label: phrase('Brand Guidelines'), href: '/brand' },
        { label: phrase('Philosophy'), href: '/philosophy' },
        { label: phrase('Investors'), href: '/investors' },
        { label: phrase('Contact'), href: '/contact' },
      ],
    },
  ],
}

/** The bar, left to right after the wordmark. */
export const MENUS: Menu[] = [
  {
    id: 'research',
    label: phrase('Research'),
    href: '/research',
    glyph: 'pulse',
    groups: [
      {
        title: phrase('Releases'),
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
        title: phrase('Creative AI'),
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
        title: phrase('Explore Research'),
        links: [
          { label: phrase('Overview'), href: '/research' },
          { label: phrase('Benchmarks'), href: '/benchmarks' },
          { label: phrase('Compare'), href: '/compare' },
          { label: phrase('Open source'), href: '/open-source' },
          { label: phrase('Specifications'), href: HIPS },
        ],
      },
      {
        title: phrase('Safety'),
        links: [
          { label: phrase('Security'), href: '/security' },
          { label: phrase('Trust & transparency'), href: '/trust' },
        ],
      },
    ],
  },
  {
    id: 'products',
    label: phrase('Products'),
    href: '/products',
    glyph: 'blocks',
    groups: [
      {
        title: phrase('AI Models'),
        lead: true,
        links: [
          { label: phrase('All models'), href: '/models' },
          { label: 'LLMs', href: '/zen' },
          { label: phrase('Decisions'), href: '/kai' },
          { label: phrase('Routing'), href: '/enso' },
        ],
      },
      {
        title: phrase('Creative AI'),
        links: [
          { label: phrase('Video'), href: '/koma' },
          { label: phrase('Images'), href: '/iro' },
          { label: phrase('3D'), href: '/mori' },
          { label: phrase('Sound effects'), href: '/oto' },
          { label: phrase('Voice'), href: '/koe' },
          { label: phrase('Music'), href: '/uta' },
        ],
      },
      {
        title: 'API Platform',
        links: [
          { label: phrase('Overview'), href: '/platform' },
          { label: 'API', href: '/api' },
          { label: phrase('Playground'), href: '/playground' },
          { label: 'Gateway', href: '/gateway' },
          { label: phrase('Agents'), href: '/agents' },
          { label: 'Base', href: '/base' },
          { label: phrase('Machines'), href: '/machines' },
        ],
      },
      {
        title: phrase('Apps and tools'),
        links: [
          { label: 'Hanzo App', href: APP },
          { label: 'Hanzo Bot', href: '/bot' },
          { label: 'Hanzo CLI', href: '/cli' },
          { label: 'Hanzo Dev', href: '/dev' },
          { label: 'Hanzo Gen', href: '/gen' },
          { label: 'Hanzo Kata', href: '/kata' },
          { label: 'Hanzo Team', href: WORKSPACE },
          { label: 'MCP', href: '/mcp' },
          { label: phrase('Skills'), href: '/skills' },
        ],
      },
      {
        title: phrase('Install'),
        links: [
          { label: 'CLI', href: '/cli' },
          { label: phrase('Desktop app'), href: '/desktop' },
          { label: phrase('Browser extension'), href: '/extension' },
          { label: 'IDE', href: '/ide' },
          { label: phrase('All downloads'), href: '/download' },
          { label: phrase('Release notes'), href: `${GITHUB}/cli/releases` },
        ],
      },
      // Hanzo OS: the product index and its layers (HIP-0903), each at /products/<id>.
      {
        title: 'Hanzo OS',
        links: [
          { label: phrase('All products'), href: '/products' },
          { label: phrase('Company'), href: '/products/company' },
          { label: phrase('Agents'), href: '/products/agents' },
          { label: phrase('Models'), href: '/products/models' },
          { label: phrase('Memory'), href: '/products/memory' },
          { label: phrase('Identity'), href: '/products/identity' },
          { label: phrase('Machines'), href: '/products/machines' },
          { label: phrase('Record'), href: '/products/record' },
        ],
      },
      {
        title: phrase('More from Hanzo'),
        links: [
          { label: phrase('Start from a template'), href: '/templates' },
          { label: phrase('Agents at work'), href: '/agents/crew' },
          { label: phrase('Cloud on your laptop'), href: '/cloud/local' },
          { label: phrase('Start a company'), href: '/start' },
        ],
      },
    ],
  },
  {
    id: 'solutions',
    label: phrase('Solutions'),
    href: SOLUTIONS,
    glyph: 'puzzle',
    groups: [
      {
        title: phrase('Explore Solutions'),
        lead: true,
        links: [
          { label: phrase('All solutions'), href: SOLUTIONS },
          { label: phrase('Enterprise'), href: '/enterprise' },
          { label: phrase('Agency'), href: AGENCY },
          { label: phrase('Customer stories'), href: '/customers' },
          { label: phrase('Pricing'), href: '/pricing' },
          { label: phrase('Contact sales'), href: '/contact-sales' },
        ],
      },
      {
        title: phrase('Teams'),
        links: [
          { label: phrase('Finance'), href: `${SOLUTIONS}/finance` },
          { label: phrase('Data'), href: `${SOLUTIONS}/data` },
          { label: phrase('Sales'), href: `${SOLUTIONS}/sales` },
          { label: phrase('Marketing'), href: `${SOLUTIONS}/marketing` },
          { label: phrase('Operations'), href: `${SOLUTIONS}/operations` },
          { label: phrase('Engineering'), href: `${SOLUTIONS}/engineering` },
          { label: phrase('Design'), href: `${SOLUTIONS}/design` },
        ],
      },
      {
        title: phrase('Industries'),
        links: [
          { label: phrase('Cybersecurity'), href: `${SOLUTIONS}/cybersecurity` },
          { label: phrase('Financial services'), href: `${SOLUTIONS}/financial-services` },
          { label: phrase('Healthcare'), href: `${SOLUTIONS}/healthcare` },
          { label: phrase('Law'), href: `${SOLUTIONS}/law` },
          { label: phrase('Retail'), href: `${SOLUTIONS}/retail` },
          { label: phrase('Government'), href: `${SOLUTIONS}/government` },
          { label: phrase('Education'), href: `${SOLUTIONS}/education` },
        ],
      },
      {
        title: phrase('Use cases'),
        links: [
          { label: phrase('Content creation'), href: `${SOLUTIONS}/content-creation` },
          { label: phrase('Research'), href: `${SOLUTIONS}/research` },
          { label: phrase('Agents'), href: `${SOLUTIONS}/agents` },
        ],
      },
      {
        title: phrase('Programs'),
        links: [
          { label: phrase('Reserved tier'), href: `${SOLUTIONS}/reserved` },
          { label: phrase('Startups'), href: '/startups' },
          { label: phrase('Partner network'), href: '/affiliate' },
          { label: phrase('Cost calculator'), href: '/calculator' },
        ],
      },
    ],
  },
  {
    id: 'developers',
    label: phrase('Developers'),
    href: DOCS,
    glyph: 'code',
    groups: [
      {
        title: phrase('Explore Developers'),
        lead: true,
        links: [
          { label: phrase('Documentation'), href: DOCS },
          { label: phrase('API reference'), href: `${DOCS}/docs/openapi/` },
          { label: phrase('Quickstart'), href: `${DOCS}/docs/quickstart/` },
          { label: 'SDKs', href: '/sdks' },
          { label: phrase('Open models'), href: MODELS },
        ],
      },
      {
        title: phrase('Resources'),
        links: [
          { label: phrase('API keys'), href: KEYS },
          { label: 'Claude Code, Codex, Cursor', href: CODING, hint: phrase('Use Hanzo with your coding tools') },
          { label: phrase('Integrations'), href: '/integrations' },
          { label: phrase('Examples'), href: '/gallery' },
        ],
      },
      {
        title: phrase('Community'),
        links: [
          { label: 'GitHub', href: GITHUB },
          { label: phrase('Status'), href: STATUS },
        ],
      },
    ],
  },
  {
    id: 'learn',
    label: phrase('Learn'),
    href: '/learn',
    glyph: 'book',
    groups: [
      {
        title: phrase('Blog'),
        links: [
          { label: phrase('Your AI is Planning To Kill You'), href: 'https://hanzo.blog/blog/2026-10-16-your-ai-is-planning-to-kill-you/', hint: 'KAI' },
          { label: phrase('Kai 1: Decisions, Not Completions'), href: 'https://hanzo.blog/blog/2026-10-07-introducing-kai/', hint: 'KAI' },
          { label: phrase('What Is a Decision Model?'), href: 'https://hanzo.blog/blog/2026-09-30-what-is-a-decision-model/', hint: phrase('DECISION MODELS') },
          { label: phrase('All articles'), href: '/blog' },
        ],
      },
      {
        title: phrase('Research & Guides'),
        links: [
          { label: phrase('Overview'), href: '/learn' },
          { label: phrase('Technical Blog'), href: BLOG },
          { label: phrase('Kai & Decision Models'), href: '/blog/kai-decision-models' },
          { label: phrase('Coding agents'), href: `${DOCS}/docs/coding` },
          { label: phrase('Guides'), href: `${DOCS}/docs/guides/` },
          { label: phrase('Cookbook'), href: `${DOCS}/docs/guides/cookbook/` },
        ],
      },
      {
        title: phrase('Support'),
        links: [
          { label: phrase('Documentation'), href: DOCS },
          { label: phrase('Help center'), href: '/support' },
        ],
      },
      {
        title: 'Hanzo University',
        links: [
          { label: 'Hanzo University', href: UNIVERSITY, hint: phrase('Courses and certifications') },
          { label: phrase('Agentic coding'), href: '/university/agentic-coding' },
          { label: phrase('Reinforcement learning'), href: '/university/reinforcement-learning' },
          { label: phrase('Systems engineering'), href: '/university/systems-engineering' },
          { label: phrase('AI practitioner'), href: '/university/ai-practitioner' },
          { label: phrase('AI architect'), href: '/university/ai-architect' },
          { label: phrase('Agentic marketing'), href: '/university/agentic-marketing' },
        ],
      },
    ],
  },
]

/** Log in ▾: the two products a person signs in to. The app signs in on hanzo.ai. */
export const LOGIN: Link[] = [
  { label: 'Hanzo App', href: SIGNIN, hint: phrase('Build, chat and ship') },
  { label: 'API Platform', href: KEYS, hint: phrase('Keys, usage and billing') },
]

/** The one filled control in the bar: onboarding, which drops into the personal or business plans first. */
export const TRY: Link = { label: phrase('Try Hanzo'), href: ONBOARDING }

/** What the same control says to a reader who is signed in: the app, at `/`. */
export const OPEN: Link = { label: phrase('Open Hanzo'), href: '/' }

/** The signed-in reader's own page. */
export const ACCOUNT: Link = { label: phrase('Settings'), href: '/settings' }

/**
 * The footer: the header's menus in the header's order and under the same
 * names, then Company — a few of each menu's rows under its title, the title
 * opening the page where the rest of that subject lives.
 */
export const FOOT: Menu[] = [
  {
    id: 'research-foot',
    label: phrase('Research'),
    href: '/research',
    glyph: 'pulse',
    groups: [
      {
        title: phrase('Research'),
        lead: true,
        links: [
          { label: 'Enso 1', href: '/enso' },
          { label: 'Kai 1', href: '/kai' },
          { label: 'Zen 6', href: '/zen' },
          { label: phrase('Creative AI'), href: '/models#creative' },
          { label: phrase('Benchmarks'), href: '/benchmarks' },
          { label: phrase('Compare'), href: '/compare' },
          { label: phrase('Open source'), href: '/open-source' },
          { label: phrase('Security'), href: '/security' },
        ],
      },
    ],
  },
  {
    id: 'products-foot',
    label: phrase('Products'),
    href: '/products',
    glyph: 'blocks',
    groups: [
      {
        title: phrase('Products'),
        lead: true,
        links: [
          { label: phrase('All models'), href: '/models' },
          { label: 'LLMs', href: '/zen' },
          { label: phrase('Decisions'), href: '/kai' },
          { label: phrase('Routing'), href: '/enso' },
          { label: phrase('Video'), href: '/koma' },
          { label: phrase('Images'), href: '/iro' },
          { label: 'API Platform', href: '/platform' },
          { label: 'Hanzo App', href: APP },
          { label: 'Hanzo Dev', href: '/dev' },
          { label: phrase('Download'), href: '/download' },
        ],
      },
    ],
  },
  {
    id: 'solutions-foot',
    label: phrase('Solutions'),
    href: SOLUTIONS,
    glyph: 'puzzle',
    groups: [
      {
        title: phrase('Solutions'),
        lead: true,
        links: [
          { label: phrase('All solutions'), href: SOLUTIONS },
          { label: phrase('Enterprise'), href: '/enterprise' },
          { label: phrase('Agency'), href: AGENCY },
          { label: phrase('Customer stories'), href: '/customers' },
          { label: phrase('Pricing'), href: '/pricing' },
          { label: phrase('Startups'), href: '/startups' },
          { label: phrase('Contact sales'), href: '/contact-sales' },
        ],
      },
    ],
  },
  {
    id: 'developers-foot',
    label: phrase('Developers'),
    href: DOCS,
    glyph: 'code',
    groups: [
      {
        title: phrase('Developers'),
        lead: true,
        links: [
          { label: phrase('Documentation'), href: DOCS },
          { label: phrase('API reference'), href: `${DOCS}/docs/openapi/` },
          { label: phrase('Quickstart'), href: `${DOCS}/docs/quickstart/` },
          { label: 'SDKs', href: '/sdks' },
          { label: phrase('API keys'), href: KEYS },
          { label: 'GitHub', href: GITHUB },
          { label: phrase('Status'), href: STATUS },
        ],
      },
    ],
  },
  {
    id: 'learn-foot',
    label: phrase('Learn'),
    href: '/learn',
    glyph: 'book',
    groups: [
      {
        title: phrase('Learn'),
        lead: true,
        links: [
          { label: phrase('Blog'), href: '/blog' },
          { label: phrase('Guides'), href: `${DOCS}/docs/guides/` },
          { label: phrase('Cookbook'), href: `${DOCS}/docs/guides/cookbook/` },
          { label: phrase('Help center'), href: '/support' },
          { label: 'Hanzo University', href: UNIVERSITY },
        ],
      },
    ],
  },
  {
    id: 'company-foot',
    label: phrase('Company'),
    href: '/about',
    glyph: 'user',
    groups: [
      {
        title: phrase('Company'),
        lead: true,
        links: [
          { label: phrase('About'), href: '/about' },
          { label: phrase('Careers'), href: '/careers' },
          { label: phrase('News'), href: '/press' },
          { label: phrase('Investors'), href: '/investors' },
          { label: phrase('Brand'), href: '/brand' },
          { label: phrase('Contact'), href: '/contact' },
        ],
      },
    ],
  },
]

/** The line under the columns. hanzo.ai/legal holds the policies not named here. */
export const FOOT_LINE: Link[] = [
  { label: phrase('Terms'), href: '/terms' },
  { label: phrase('Privacy'), href: '/privacy' },
  { label: phrase('Usage policy'), href: '/aup' },
  { label: phrase('Your Privacy Choices'), href: '#choices' },
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
