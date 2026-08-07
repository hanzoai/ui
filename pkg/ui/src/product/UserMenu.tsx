'use client'

/**
 * UserMenu — the account control: who I am, and the things I do to my account.
 *
 * It was written inside `AppHeader` and could not be reached from anywhere else,
 * so every surface that wanted an account menu without adopting the whole header
 * wrote one: hanzo.app twice, chat, console, billing. Five implementations of one
 * menu, disagreeing on the trigger, the row order and the sign-out copy. This is
 * that menu, extracted whole — `AppHeader` now renders it instead of owning it,
 * so the header and a standalone account control cannot drift apart.
 *
 * Host-agnostic: identity is a value, every row is an injected handler, and a row
 * renders only when its handler is provided — an honest menu, never a dead item.
 * The surface keeps its own `useUser`/router in a thin wrapper; that wrapper is
 * the seam the charter asks for, not a duplicate.
 *
 * The trigger is sized as the PEER of `OrgSwitcher` — same height, same mark,
 * same type — so "which workspace" and "who I am" read as two halves of one
 * identity rather than a caption over a control.
 */
import { useState, type ReactNode } from 'react'
import { Popover, Separator, Text, XStack, YStack } from '@hanzo/gui'
import { LogOut, UserRound } from '@hanzogui/lucide-icons-2'

import { useEmit } from './instrument'
import { displayName } from './name'
import { OrgMark } from './OrgMark'
import { ThemeToggle } from './ThemeToggle'

/** One row. `id` names it in analytics; the label is what the person reads. */
export type UserMenuItem = {
  id: string
  label: string
  icon?: ReactNode
  onPress: () => void
  /** Draws the row in the destructive tone (sign out, delete account). */
  danger?: boolean
}

export type UserMenuProps = {
  /** The signed-in person's display name. Falls back to the email's local part. */
  name?: string
  email?: string
  /** Avatar URL. Absent → the monogram of the name, like an org's mark. */
  avatar?: string
  /** Grouped rows — each group is separated by a rule, empty groups are dropped. */
  groups?: UserMenuItem[][]
  /** Theme row content — default `<ThemeToggle/>`; `null` hides the row (a
   *  single-theme surface has nothing to toggle and should not pretend to). */
  theme?: ReactNode
  /** Sign out. Omit on a surface that cannot sign out. */
  onSignOut?: () => void
  /** Sign-out copy — "Sign out" everywhere unless a surface has a reason. */
  signOutLabel?: string
  /** Replace the whole menu body, keeping the trigger. */
  children?: ReactNode
  /** Show the name beside the avatar in the trigger. Default true. */
  label?: boolean
  /** Trigger height. Default 44 — the peer of `OrgSwitcher`. */
  height?: number
}

function Row({ item, onDone }: { item: UserMenuItem; onDone: () => void }) {
  const track = useEmit()
  return (
    <XStack
      onPress={() => {
        track({ component: 'UserMenu', action: 'select', id: item.id })
        onDone()
        item.onPress()
      }}
      cursor="pointer"
      items="center"
      gap="$2.5"
      px="$2"
      py="$2"
      rounded="$3"
      hoverStyle={{ bg: '$color5' }}
    >
      {item.icon}
      <Text fontSize="$2" color={item.danger ? '$red10' : '$color12'}>
        {item.label}
      </Text>
    </XStack>
  )
}

// The name to show is a rule over two strings, so it lives in `./name` and is
// reachable without a gui runtime via `@hanzo/ui/product/pure`. Re-exported
// here because it was published from this module.
export { displayName }

export function UserMenu({
  name,
  email,
  avatar,
  groups = [],
  theme,
  onSignOut,
  signOutLabel = 'Sign out',
  children,
  label = true,
  height = 44,
}: UserMenuProps) {
  const [open, setOpen] = useState(false)
  const track = useEmit()
  const shown = displayName(name, email)
  const filled = groups.filter((g) => g.length > 0)
  const close = () => setOpen(false)

  return (
    <Popover
      open={open}
      onOpenChange={(next: boolean) => {
        track({ component: 'UserMenu', action: next ? 'open' : 'close' })
        setOpen(next)
      }}
      placement="bottom-end"
    >
      <Popover.Trigger asChild>
        <XStack
          cursor="pointer"
          items="center"
          gap="$2.5"
          height={height}
          px="$2"
          rounded="$3"
          minW={0}
          hoverStyle={{ bg: '$color4' }}
          role="button"
          tabIndex={0}
          aria-label={shown ? `${shown} · account` : 'Account'}
        >
          {/* The person wears the same mark treatment as a workspace — an image
              when there is one, a monogram when there is not. */}
          {avatar || shown ? (
            <OrgMark org={{ name: shown || 'Account', logo: avatar }} size={30} />
          ) : (
            <UserRound size={18} />
          )}
          {label && shown ? (
            <Text fontSize="$3" fontWeight="600" color="$color12" numberOfLines={1} maxW={160}>
              {shown}
            </Text>
          ) : null}
        </XStack>
      </Popover.Trigger>

      <Popover.Content bordered elevate p="$2" width={240} bg="$color2" borderColor="$borderColor">
        {children ?? (
          <YStack gap="$1">
            {shown || email ? (
              <YStack gap="$0.5" px="$2" py="$1.5">
                {shown ? (
                  <Text fontSize="$2" fontWeight="700" color="$color12" numberOfLines={1}>
                    {shown}
                  </Text>
                ) : null}
                {/* The email is shown only when it is not already the name — a
                    menu that prints one address twice reads as a rendering bug. */}
                {email && email !== shown ? (
                  <Text fontSize="$1" color="$color10" numberOfLines={1}>
                    {email}
                  </Text>
                ) : null}
              </YStack>
            ) : null}

            {filled.map((group, i) => (
              <YStack key={i} gap="$1">
                {(i > 0 || shown || email) ? <Separator borderColor="$borderColor" my="$1" /> : null}
                {group.map((item) => (
                  <Row key={item.id} item={item} onDone={close} />
                ))}
              </YStack>
            ))}

            {theme !== null ? (
              <>
                <Separator borderColor="$borderColor" my="$1" />
                <XStack items="center" gap="$2.5" px="$2" py="$1" rounded="$3">
                  <Text flex={1} fontSize="$2" color="$color12">
                    Theme
                  </Text>
                  {theme ?? <ThemeToggle />}
                </XStack>
              </>
            ) : null}

            {onSignOut ? (
              <>
                <Separator borderColor="$borderColor" my="$1" />
                <Row
                  item={{
                    id: 'sign-out',
                    label: signOutLabel,
                    icon: <LogOut size={16} />,
                    onPress: onSignOut,
                  }}
                  onDone={close}
                />
              </>
            ) : null}
          </YStack>
        )}
      </Popover.Content>
    </Popover>
  )
}
