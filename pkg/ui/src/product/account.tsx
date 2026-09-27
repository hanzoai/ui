'use client'

/**
 * The account menu's body — who is signed in, the host's groups of rows, the
 * theme, and signing out.
 *
 * `UserMenu` draws it under its avatar trigger; `SessionRail` draws it over its
 * account row. It is one body in one file so the two menus cannot drift apart —
 * the same header, the same rules between groups, the same named group for a
 * choice, the same sign-out at the foot.
 *
 * Off the product barrel on purpose: a host wants a whole menu, and gets one
 * from either of those two. This is the part they share.
 */
import type { KeyboardEvent, ReactNode } from 'react'
import { Separator, Text, XStack, YStack } from '@hanzo/gui'
import { LogOut } from '@hanzogui/lucide-icons-2'

import { useEmit } from './instrument'
import { menuKeyDown } from './menu/roving'
import { MenuLabel, MenuRow } from './MenuRow'
import { displayName } from './name'

/** One row. `id` names it in analytics; the label is what the person reads. */
export type UserMenuItem = {
  id: string
  label: string
  icon?: ReactNode
  onPress: () => void
  /** Draws the row in the destructive tone (sign out, delete account). */
  danger?: boolean
  /**
   * Whether this row is the chosen one — for a group that is a CHOICE rather
   * than a list of actions (which theme, which language). Its presence makes the
   * group a named `group` and the row a `menuitemradio`, so assistive tech is
   * told that exactly one of them holds, and the chosen row carries a check.
   */
  active?: boolean
}

/** A group of rows, optionally named. A bare array is the unnamed form. */
export type UserMenuGroup = UserMenuItem[] | { label?: string; items: UserMenuItem[] }

const itemsOf = (g: UserMenuGroup): UserMenuItem[] => (Array.isArray(g) ? g : g.items)
const nameOf = (g: UserMenuGroup): string | undefined => (Array.isArray(g) ? undefined : g.label)

export type AccountProps = {
  name?: string
  email?: string
  groups?: UserMenuGroup[]
  /**
   * The theme row's control. Absent, there is no theme row. `UserMenu` passes
   * its default `<ThemeToggle/>`; this body does not import it, because that
   * toggle reaches the optional `@hanzogui/next-theme` peer, and a rail that
   * only wanted an account menu must not put that peer in its host's bundle —
   * Vite 8 fails the build on the missing peer's export.
   */
  theme?: ReactNode
  onSignOut?: () => void
  signOutLabel?: string
  /** Called after any row runs — the host closes its popover. */
  onDone: () => void
  /** The menu that drew this body, as analytics names it — `UserMenu`, `SessionRail`. */
  component: string
}

function Row({ item, onDone, component }: { item: UserMenuItem; onDone: () => void; component: string }) {
  const track = useEmit()
  return (
    <MenuRow
      label={item.label}
      icon={item.icon}
      active={item.active}
      danger={item.danger}
      onPress={() => {
        track({ component, action: 'select', id: item.id })
        onDone()
        item.onPress()
      }}
    />
  )
}

/** A rule between groups — never above the first thing in the menu. */
const Rule = () => <Separator borderColor="$borderColor" my="$1" />

export function Account({ name, email, groups = [], theme, onSignOut, signOutLabel = 'Sign out', onDone, component }: AccountProps) {
  const shown = displayName(name, email)
  const filled = groups.filter((g) => itemsOf(g).length > 0)
  return (
    // The arrows, Home and End move between the rows (roving.ts). Escape is the
    // popover's own: it closes and hands focus back to the trigger.
    <YStack gap="$1" onKeyDown={(e: KeyboardEvent) => menuKeyDown(e)}>
      {shown || email ? (
        <YStack gap="$0.5" px="$2" py="$1.5">
          {shown ? (
            <Text fontSize="$2" fontWeight="700" color="$ink" numberOfLines={1}>
              {shown}
            </Text>
          ) : null}
          {/* The email is shown only when it is not already the name — a
              menu that prints one address twice reads as a rendering bug. */}
          {email && email !== shown ? (
            <Text fontSize="$1" color="$soft" numberOfLines={1}>
              {email}
            </Text>
          ) : null}
        </YStack>
      ) : null}

      {filled.map((group, i) => {
        const items = itemsOf(group)
        const label = nameOf(group)
        // A group whose every row carries a chosen-one is a CHOICE, so it is a
        // named `group` of `menuitemradio` rows (see MenuRow) — a heading alone
        // would leave the rows unrelated.
        const choice = items.every((it) => it.active !== undefined)
        const rows = items.map((item) => <Row key={item.id} item={item} onDone={onDone} component={component} />)
        return (
          <YStack key={i} gap="$1">
            {i > 0 || shown || email ? <Rule /> : null}
            {label ? <MenuLabel>{label}</MenuLabel> : null}
            {choice ? (
              <YStack role="group" aria-label={label} gap="$1">
                {rows}
              </YStack>
            ) : (
              rows
            )}
          </YStack>
        )
      })}

      {theme != null ? (
        <>
          <Rule />
          <XStack items="center" gap="$2.5" px="$2" py="$1" rounded="$3">
            <Text flex={1} fontSize="$2" color="$ink">
              Theme
            </Text>
            {theme}
          </XStack>
        </>
      ) : null}

      {onSignOut ? (
        <>
          <Rule />
          <Row
            item={{ id: 'sign-out', label: signOutLabel, icon: <LogOut size={16} />, onPress: onSignOut }}
            onDone={onDone}
            component={component}
          />
        </>
      ) : null}
    </YStack>
  )
}
