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
    href: 'https://chat.hanzo.ai',
    description: 'AI chat & models',
  },
  {
    id: 'platform',
    label: 'Platform',
    href: 'https://platform.hanzo.ai',
    description: 'Deploy & scale services',
  },
]
