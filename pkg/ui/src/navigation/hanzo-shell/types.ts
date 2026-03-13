export type HanzoApp = {
  id: string
  label: string
  href: string
  icon?: React.ReactNode
  description?: string
}

export type HanzoOrg = {
  id: string
  name: string
  slug: string
  role?: string
}

export type HanzoUser = {
  id?: string
  name?: string
  email: string
  avatar?: string
}

export type HanzoMarkProps = {
  size?: number
  className?: string
  brandMenu?: boolean
  animate?: boolean
}

export type HanzoShellProps = {
  /** Current app name shown in breadcrumb */
  currentApp: string
  /** Current app id – used to suppress showing current app in switcher */
  currentAppId?: string
  /** User from IAM */
  user?: HanzoUser
  /** Orgs the user belongs to */
  organizations?: HanzoOrg[]
  /** Currently active org id */
  currentOrgId?: string
  /** Called when user selects a different org */
  onOrgSwitch?: (orgId: string) => void
  /** Called when user clicks sign out */
  onSignOut?: () => void
  /** Override the default Hanzo apps list */
  apps?: HanzoApp[]
  /** Extra content rendered in header right-side */
  headerRight?: React.ReactNode
  /** Settings URL (defaults to IAM /account) */
  settingsHref?: string
  /** Called when settings icon is clicked (overrides href navigation) */
  onSettingsClick?: () => void
  /** Hide the hard-refresh button */
  hideHardRefresh?: boolean
  /** Hide the settings button */
  hideSettings?: boolean
  /** Sidebar content */
  children?: React.ReactNode
}

export const DEFAULT_HANZO_APPS: HanzoApp[] = [
  // ── Core ──
  {
    id: 'account',
    label: 'Account',
    href: 'https://hanzo.id/account',
    description: 'Profile, orgs & referrals',
  },
  {
    id: 'billing',
    label: 'Billing',
    href: 'https://billing.hanzo.ai',
    description: 'Subscriptions & usage',
  },
  {
    id: 'console',
    label: 'Console',
    href: 'https://console.hanzo.ai',
    description: 'API keys & projects',
  },

  // ── AI ──
  {
    id: 'chat',
    label: 'Chat',
    href: 'https://hanzo.chat',
    description: 'AI chat & models',
  },
  {
    id: 'flow',
    label: 'Flow',
    href: 'https://flow.hanzo.ai',
    description: 'Visual workflow builder',
  },
  {
    id: 'bot',
    label: 'Bot',
    href: 'https://hanzo.bot',
    description: 'AI bot platform',
  },

  // ── Observability ──
  {
    id: 'o11y',
    label: 'O11y',
    href: 'https://o11y.hanzo.ai',
    description: 'Traces, logs & metrics',
  },
  {
    id: 'sentry',
    label: 'Sentry',
    href: 'https://sentry.hanzo.ai',
    description: 'Error & crash tracking',
  },
  {
    id: 'insights',
    label: 'Insights',
    href: 'https://insights.hanzo.ai',
    description: 'Product analytics & flags',
  },
  {
    id: 'analytics',
    label: 'Analytics',
    href: 'https://analytics.hanzo.ai',
    description: 'Web analytics',
  },

  // ── Infrastructure ──
  {
    id: 'platform',
    label: 'Platform',
    href: 'https://platform.hanzo.ai',
    description: 'Deploy & scale services',
  },
  {
    id: 'cloud',
    label: 'Cloud',
    href: 'https://cloud.hanzo.ai',
    description: 'Cloud infrastructure',
  },
  {
    id: 'storage',
    label: 'Storage',
    href: 'https://s3.hanzo.ai',
    description: 'S3 object storage',
  },
  {
    id: 'kms',
    label: 'KMS',
    href: 'https://kms.hanzo.ai',
    description: 'Secrets & key management',
  },
  {
    id: 'dns',
    label: 'DNS',
    href: 'https://dns.hanzo.ai',
    description: 'DNS management',
  },
  {
    id: 'registry',
    label: 'Registry',
    href: 'https://registry.hanzo.ai',
    description: 'Container registry',
  },

  // ── Apps ──
  {
    id: 'commerce',
    label: 'Commerce',
    href: 'https://commerce.hanzo.ai',
    description: 'Payments & storefront',
  },
  {
    id: 'base',
    label: 'Base',
    href: 'https://base.hanzo.ai',
    description: 'Backend-as-a-Service',
  },
  {
    id: 'search',
    label: 'Search',
    href: 'https://search.hanzo.ai',
    description: 'Full-text search',
  },
  {
    id: 'auto',
    label: 'Auto',
    href: 'https://auto.hanzo.ai',
    description: 'Workflow automation',
  },

  // ── Business ──
  {
    id: 'team',
    label: 'Team',
    href: 'https://hanzo.team',
    description: 'Team collaboration',
  },
  {
    id: 'sign',
    label: 'Sign',
    href: 'https://sign.hanzo.ai',
    description: 'Document signing',
  },
  {
    id: 'dataroom',
    label: 'Dataroom',
    href: 'https://dataroom.hanzo.ai',
    description: 'Secure deal rooms',
  },
  {
    id: 'captable',
    label: 'Cap Table',
    href: 'https://captable.hanzo.ai',
    description: 'Equity management',
  },

  // ── Content & Support ──
  {
    id: 'docs',
    label: 'Docs',
    href: 'https://docs.hanzo.ai',
    description: 'Documentation',
  },
  {
    id: 'status',
    label: 'Status',
    href: 'https://status.hanzo.ai',
    description: 'System status',
  },
]

/**
 * White-label org → domain mapping.
 * Each org can have its own branded domains for every surface.
 */
export type OrgDomains = {
  id: string
  // Core
  iam: string
  billing: string
  console: string
  cloud: string
  // AI
  chat: string
  flow: string
  bot: string
  // Observability
  o11y: string
  sentry: string
  insights: string
  analytics: string
  // Infrastructure
  platform: string
  storage: string
  s3: string
  kms: string
  dns: string
  registry: string
  // Apps
  commerce: string
  base: string
  search: string
  auto: string
  // Business
  team: string
  sign: string
  dataroom: string
  captable: string
  // Content
  docs: string
  status: string
}

export const ORG_DOMAINS: Record<string, OrgDomains> = {
  hanzo: {
    id: 'hanzo',
    iam: 'https://hanzo.id',
    billing: 'https://billing.hanzo.ai',
    console: 'https://console.hanzo.ai',
    cloud: 'https://cloud.hanzo.ai',
    chat: 'https://hanzo.chat',
    flow: 'https://flow.hanzo.ai',
    bot: 'https://hanzo.bot',
    o11y: 'https://o11y.hanzo.ai',
    sentry: 'https://sentry.hanzo.ai',
    insights: 'https://insights.hanzo.ai',
    analytics: 'https://analytics.hanzo.ai',
    platform: 'https://platform.hanzo.ai',
    storage: 'https://s3.hanzo.ai',
    s3: 'https://s3.hanzo.ai',
    kms: 'https://kms.hanzo.ai',
    dns: 'https://dns.hanzo.ai',
    registry: 'https://registry.hanzo.ai',
    commerce: 'https://commerce.hanzo.ai',
    base: 'https://base.hanzo.ai',
    search: 'https://search.hanzo.ai',
    auto: 'https://auto.hanzo.ai',
    team: 'https://hanzo.team',
    sign: 'https://sign.hanzo.ai',
    dataroom: 'https://dataroom.hanzo.ai',
    captable: 'https://captable.hanzo.ai',
    docs: 'https://docs.hanzo.ai',
    status: 'https://status.hanzo.ai',
  },
  lux: {
    id: 'lux',
    iam: 'https://lux.id',
    billing: 'https://billing.lux.network',
    console: 'https://console.lux.network',
    cloud: 'https://cloud.lux.network',
    chat: 'https://lux.chat',
    flow: 'https://flow.lux.network',
    bot: 'https://bot.lux.network',
    o11y: 'https://o11y.lux.network',
    sentry: 'https://sentry.lux.network',
    insights: 'https://insights.lux.network',
    analytics: 'https://analytics.lux.network',
    platform: 'https://platform.lux.network',
    storage: 'https://s3.lux.network',
    s3: 'https://s3.lux.network',
    kms: 'https://kms.lux.network',
    dns: 'https://dns.lux.network',
    registry: 'https://registry.lux.network',
    commerce: 'https://commerce.lux.network',
    base: 'https://base.lux.network',
    search: 'https://search.lux.network',
    auto: 'https://auto.lux.network',
    team: 'https://team.lux.network',
    sign: 'https://sign.lux.network',
    dataroom: 'https://dataroom.lux.network',
    captable: 'https://captable.lux.network',
    docs: 'https://docs.lux.network',
    status: 'https://status.lux.network',
  },
  zoo: {
    id: 'zoo',
    iam: 'https://zoo.id',
    billing: 'https://billing.zoo.ngo',
    console: 'https://console.zoo.ngo',
    cloud: 'https://cloud.zoo.network',
    chat: 'https://chat.zoo.ngo',
    flow: 'https://flow.zoo.ngo',
    bot: 'https://bot.zoo.ngo',
    o11y: 'https://o11y.zoo.network',
    sentry: 'https://sentry.zoo.network',
    insights: 'https://insights.zoo.ngo',
    analytics: 'https://analytics.zoo.ngo',
    platform: 'https://platform.zoo.ngo',
    storage: 'https://s3.zoo.ngo',
    s3: 'https://s3.zoo.ngo',
    kms: 'https://kms.zoo.network',
    dns: 'https://dns.zoo.ngo',
    registry: 'https://registry.zoo.ngo',
    commerce: 'https://commerce.zoo.ngo',
    base: 'https://base.zoo.ngo',
    search: 'https://search.zoo.ngo',
    auto: 'https://auto.zoo.ngo',
    team: 'https://team.zoo.ngo',
    sign: 'https://sign.zoo.ngo',
    dataroom: 'https://dataroom.zoo.ngo',
    captable: 'https://captable.zoo.ngo',
    docs: 'https://docs.zoo.ngo',
    status: 'https://status.zoo.network',
  },
  pars: {
    id: 'pars',
    iam: 'https://pars.id',
    billing: 'https://billing.pars.network',
    console: 'https://console.pars.network',
    cloud: 'https://cloud.pars.network',
    chat: 'https://chat.pars.network',
    flow: 'https://flow.pars.network',
    bot: 'https://bot.pars.network',
    o11y: 'https://o11y.pars.network',
    sentry: 'https://sentry.pars.network',
    insights: 'https://insights.pars.network',
    analytics: 'https://analytics.pars.network',
    platform: 'https://platform.pars.network',
    storage: 'https://s3.pars.network',
    s3: 'https://s3.pars.network',
    kms: 'https://kms.pars.network',
    dns: 'https://dns.pars.network',
    registry: 'https://registry.pars.network',
    commerce: 'https://commerce.pars.network',
    base: 'https://base.pars.network',
    search: 'https://search.pars.network',
    auto: 'https://auto.pars.network',
    team: 'https://team.pars.network',
    sign: 'https://sign.pars.network',
    dataroom: 'https://dataroom.pars.network',
    captable: 'https://captable.pars.network',
    docs: 'https://docs.pars.network',
    status: 'https://status.pars.network',
  },
}

/** Get apps list with org-aware URLs */
export function getAppsForOrg(orgSlug: string): HanzoApp[] {
  const d = ORG_DOMAINS[orgSlug] || ORG_DOMAINS.hanzo
  return [
    // Core
    { id: 'account', label: 'Account', href: `${d.iam}/account`, description: 'Profile, orgs & referrals' },
    { id: 'billing', label: 'Billing', href: d.billing, description: 'Subscriptions & usage' },
    { id: 'console', label: 'Console', href: d.console, description: 'API keys & projects' },
    // AI
    { id: 'chat', label: 'Chat', href: d.chat, description: 'AI chat & models' },
    { id: 'flow', label: 'Flow', href: d.flow, description: 'Visual workflow builder' },
    { id: 'bot', label: 'Bot', href: d.bot, description: 'AI bot platform' },
    // Observability
    { id: 'o11y', label: 'O11y', href: d.o11y, description: 'Traces, logs & metrics' },
    { id: 'sentry', label: 'Sentry', href: d.sentry, description: 'Error & crash tracking' },
    { id: 'insights', label: 'Insights', href: d.insights, description: 'Product analytics & flags' },
    { id: 'analytics', label: 'Analytics', href: d.analytics, description: 'Web analytics' },
    // Infrastructure
    { id: 'platform', label: 'Platform', href: d.platform, description: 'Deploy & scale services' },
    { id: 'cloud', label: 'Cloud', href: d.cloud, description: 'Cloud infrastructure' },
    { id: 'storage', label: 'Storage', href: d.storage, description: 'S3 object storage' },
    { id: 'kms', label: 'KMS', href: d.kms, description: 'Secrets & key management' },
    { id: 'dns', label: 'DNS', href: d.dns, description: 'DNS management' },
    { id: 'registry', label: 'Registry', href: d.registry, description: 'Container registry' },
    // Apps
    { id: 'commerce', label: 'Commerce', href: d.commerce, description: 'Payments & storefront' },
    { id: 'base', label: 'Base', href: d.base, description: 'Backend-as-a-Service' },
    { id: 'search', label: 'Search', href: d.search, description: 'Full-text search' },
    { id: 'auto', label: 'Auto', href: d.auto, description: 'Workflow automation' },
    // Business
    { id: 'team', label: 'Team', href: d.team, description: 'Team collaboration' },
    { id: 'sign', label: 'Sign', href: d.sign, description: 'Document signing' },
    { id: 'dataroom', label: 'Dataroom', href: d.dataroom, description: 'Secure deal rooms' },
    { id: 'captable', label: 'Cap Table', href: d.captable, description: 'Equity management' },
    // Content
    { id: 'docs', label: 'Docs', href: d.docs, description: 'Documentation' },
    { id: 'status', label: 'Status', href: d.status, description: 'System status' },
  ]
}
