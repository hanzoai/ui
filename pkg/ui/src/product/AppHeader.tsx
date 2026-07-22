'use client'

/**
 * AppHeader — the shared shell header every Hanzo surface renders: the brand
 * mark top-left (from @hanzo/logo, white-label via `wordmark`/`brand`), an
 * org/project slot (usually `<OrgSwitcher/>`), an app switcher listing the
 * Hanzo surfaces (modeled on the console's AppLauncher), and an identity menu
 * (Profile · Theme · Team settings · Billing · Sign out).
 *
 * Host-agnostic: every action is an injected handler; a row renders only when
 * its handler is provided (honest — no dead menu items). Mobile-first: fluid
 * flex + truncation, the wordmark collapse is the brand motion itself.
 */
import { useState, type ReactNode } from 'react'
import { Button, Popover, Separator, Text, XStack, YStack } from '@hanzo/gui'
import { AppWindow, Bot, CreditCard, Grip, LayoutGrid, LogOut, MessageCircle, Settings2, Sparkles, UserRound, Users } from '@hanzogui/lucide-icons-2'

import { BrandMark } from './BrandMark'
import { ThemeToggle } from './ThemeToggle'
import { otherSurfaces, type Surface, type SurfaceId } from './surfaces.data'

/** The per-surface glyph — keyed by `Surface.id`, so each surface reads distinctly. */
const SURFACE_ICON = {
  ai: Sparkles,
  console: LayoutGrid,
  app: AppWindow,
  chat: MessageCircle,
  bot: Bot,
  team: Users,
  billing: CreditCard,
} as const satisfies Record<SurfaceId, unknown>

const openHref = (href: string) => {
  if (typeof window !== 'undefined') window.open(href, '_blank', 'noopener')
}

function MenuRow({ icon, label, onPress }: { icon: ReactNode; label: string; onPress: () => void }) {
  return (
    <XStack onPress={onPress} cursor="pointer" items="center" gap="$2.5" px="$2" py="$2" rounded="$3" hoverStyle={{ bg: '$color5' }}>
      {icon}
      <Text fontSize="$2" color="$color12">
        {label}
      </Text>
    </XStack>
  )
}

export type AppHeaderProps = {
  /** Brand slot — defaults to the animated `<BrandMark/>`. */
  brand?: ReactNode
  /** White-label wordmark for the default brand mark. */
  wordmark?: string
  /** Brand press (usually "go home"). */
  onBrand?: () => void
  /** Org/project slot — usually `<OrgSwitcher/>` (+ a project switcher). */
  org?: ReactNode
  /** Free slot between the org slot and the right cluster. */
  children?: ReactNode
  /** The surface this header renders on — omitted from the switcher (no self-link). */
  current?: SurfaceId
  /** App-switcher surfaces; defaults to every surface but `current`. [] hides it. */
  surfaces?: Surface[]
  /** Open a surface — default `window.open` (new tab). */
  open?: (surface: Surface) => void
  /** Identity-menu trigger label (the signed-in user's name/email). */
  user?: string
  /** Replace the whole identity menu content. */
  menu?: ReactNode
  /** Theme row content — default `<ThemeToggle/>`; null hides the row. */
  theme?: ReactNode
  onProfile?: () => void
  onTeam?: () => void
  onBilling?: () => void
  onSignOut?: () => void
}

export function AppHeader({
  brand,
  wordmark = 'Hanzo',
  onBrand,
  org,
  children,
  current,
  surfaces,
  open,
  user,
  menu,
  theme,
  onProfile,
  onTeam,
  onBilling,
  onSignOut,
}: AppHeaderProps) {
  const [appsOpen, setAppsOpen] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const items = surfaces ?? otherSurfaces(current)
  const launch = (s: Surface) => {
    setAppsOpen(false)
    if (open) open(s)
    else openHref(s.href)
  }

  return (
    <XStack items="center" gap="$2" px="$3" height={52} borderBottomWidth={1} borderColor="$borderColor" bg="$background">
      <XStack items="center" cursor={onBrand ? 'pointer' : undefined} onPress={onBrand}>
        {brand ?? <BrandMark wordmark={wordmark} />}
      </XStack>

      {org ? (
        <XStack items="center" minW={0}>
          {org}
        </XStack>
      ) : null}

      <XStack flex={1} items="center" minW={0}>
        {children}
      </XStack>

      {items.length > 0 ? (
        <Popover open={appsOpen} onOpenChange={setAppsOpen} placement="bottom-end">
          <Popover.Trigger asChild>
            <Button size="$2" chromeless icon={<Grip size={16} />} aria-label="Apps" />
          </Popover.Trigger>
          <Popover.Content bordered elevate p="$2" width={230} bg="$color2" borderColor="$borderColor">
            <YStack gap="$1">
              {items.map((s) => {
                const Icon = SURFACE_ICON[s.id]
                return (
                  <XStack key={s.id} onPress={() => launch(s)} cursor="pointer" items="center" gap="$2.5" px="$2" py="$2" rounded="$3" hoverStyle={{ bg: '$color5' }}>
                    <Icon size={16} />
                    <Text flex={1} fontSize="$2" fontWeight="600" color="$color12">
                      {s.label}
                    </Text>
                    {s.hint ? (
                      <Text fontSize="$1" color="$color10">
                        {s.hint}
                      </Text>
                    ) : null}
                  </XStack>
                )
              })}
            </YStack>
          </Popover.Content>
        </Popover>
      ) : null}

      <Popover open={menuOpen} onOpenChange={setMenuOpen} placement="bottom-end">
        <Popover.Trigger asChild>
          <Button size="$2" chromeless icon={<UserRound size={16} />} aria-label="Account">
            {user ? (
              <Text fontSize="$2" color="$color12" numberOfLines={1} maxW={140}>
                {user}
              </Text>
            ) : null}
          </Button>
        </Popover.Trigger>
        <Popover.Content bordered elevate p="$2" width={220} bg="$color2" borderColor="$borderColor">
          {menu ?? (
            <YStack gap="$1">
              {onProfile ? <MenuRow icon={<UserRound size={15} />} label="Profile" onPress={() => (setMenuOpen(false), onProfile())} /> : null}
              {theme !== null ? (
                <XStack items="center" gap="$2.5" px="$2" py="$1" rounded="$3">
                  <Text flex={1} fontSize="$2" color="$color12">
                    Theme
                  </Text>
                  {theme ?? <ThemeToggle />}
                </XStack>
              ) : null}
              {onTeam ? <MenuRow icon={<Settings2 size={15} />} label="Team settings" onPress={() => (setMenuOpen(false), onTeam())} /> : null}
              {onBilling ? <MenuRow icon={<CreditCard size={15} />} label="Billing" onPress={() => (setMenuOpen(false), onBilling())} /> : null}
              {onSignOut ? (
                <>
                  <Separator borderColor="$borderColor" my="$1" />
                  <MenuRow icon={<LogOut size={15} />} label="Sign out" onPress={() => (setMenuOpen(false), onSignOut())} />
                </>
              ) : null}
            </YStack>
          )}
        </Popover.Content>
      </Popover>
    </XStack>
  )
}
