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
  {
    id: 'chat',
    label: 'Chat',
    href: 'https://hanzo.chat',
    description: 'AI chat & models',
  },
  {
    id: 'platform',
    label: 'Platform',
    href: 'https://platform.hanzo.ai',
    description: 'Deploy & scale services',
  },
  {
    id: 'storage',
    label: 'Storage',
    href: 'https://hanzo.space',
    description: 'S3 object storage',
  },
]

/**
 * White-label org → domain mapping.
 * Each org can have its own branded domains for every surface.
 */
export type OrgDomains = {
  id: string
  iam: string
  billing: string
  console: string
  chat: string
  platform: string
  storage: string
  s3: string
}

export const ORG_DOMAINS: Record<string, OrgDomains> = {
  hanzo: {
    id: 'hanzo',
    iam: 'https://hanzo.id',
    billing: 'https://billing.hanzo.ai',
    console: 'https://console.hanzo.ai',
    chat: 'https://hanzo.chat',
    platform: 'https://platform.hanzo.ai',
    storage: 'https://hanzo.space',
    s3: 'https://s3.hanzo.ai',
  },
  lux: {
    id: 'lux',
    iam: 'https://lux.id',
    billing: 'https://billing.lux.network',
    console: 'https://console.lux.network',
    chat: 'https://chat.lux.network',
    platform: 'https://platform.lux.network',
    storage: 'https://storage.lux.network',
    s3: 'https://s3.lux.network',
  },
  zoo: {
    id: 'zoo',
    iam: 'https://zoo.id',
    billing: 'https://billing.zoo.ngo',
    console: 'https://console.zoo.ngo',
    chat: 'https://chat.zoo.ngo',
    platform: 'https://platform.zoo.ngo',
    storage: 'https://storage.zoo.ngo',
    s3: 'https://s3.zoo.ngo',
  },
  pars: {
    id: 'pars',
    iam: 'https://pars.id',
    billing: 'https://billing.pars.ai',
    console: 'https://console.pars.ai',
    chat: 'https://chat.pars.ai',
    platform: 'https://platform.pars.ai',
    storage: 'https://storage.pars.ai',
    s3: 'https://s3.pars.ai',
  },
}

/** Get apps list with org-aware URLs */
export function getAppsForOrg(orgSlug: string): HanzoApp[] {
  const domains = ORG_DOMAINS[orgSlug] || ORG_DOMAINS.hanzo
  return [
    { id: 'account', label: 'Account', href: `${domains.iam}/account`, description: 'Profile, orgs & referrals' },
    { id: 'billing', label: 'Billing', href: domains.billing, description: 'Subscriptions & usage' },
    { id: 'console', label: 'Console', href: domains.console, description: 'API keys & projects' },
    { id: 'chat', label: 'Chat', href: domains.chat, description: 'AI chat & models' },
    { id: 'platform', label: 'Platform', href: domains.platform, description: 'Deploy & scale services' },
    { id: 'storage', label: 'Storage', href: domains.storage, description: 'S3 object storage' },
  ]
}
