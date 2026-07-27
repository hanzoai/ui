'use client'

/**
 * Rich empty state — the ONE way the console turns a real, honest "nothing here
 * yet" into a helpful onboarding moment (DigitalOcean / Vercel class) instead of
 * a dead screen.
 *
 * It is NOT a fabricated-data fallback: callers render it only when a load
 * genuinely succeeded with zero rows (or a resource has no surface yet). It shows
 * the product icon, a one-line "what this is", a couple of guidance bullets, a
 * single primary call-to-action (Deploy / Create / Connect …) and an optional
 * secondary link (Docs / CLI). Orthogonal to `BackendStateCard` (failures) and
 * `DataTable`'s thin inline empty (in-table) — this is the full-bleed first-run
 * surface a module shows in place of its table.
 */
import type { ReactElement, ReactNode } from 'react'
import { Button, Card, Text, XStack, YStack } from '@hanzo/gui'
import { ArrowRight, Check, ExternalLink } from '@hanzogui/lucide-icons-2'

import type { IconLike } from './color'
import { PrimaryButton } from './PrimaryButton'

/** A single call-to-action — primary (filled) or a secondary/external link. */
export type EmptyAction = {
  label: string
  /** In-app navigation / handler. */
  onPress?: () => void
  /** External URL — opens in a new tab with an external-link affordance. */
  href?: string
  icon?: ReactElement
}

/** Open an external URL in a new tab (no-opener), guarded for SSR. */
function openHref(href: string): void {
  if (typeof window !== 'undefined') window.open(href, '_blank', 'noopener')
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  bullets,
  primary,
  secondary,
}: {
  /** Product/section icon — any lucide/Gui icon component (size + optional color). */
  icon: IconLike
  title: string
  description: string
  /** Optional "here's how to get started" guidance bullets. */
  bullets?: string[]
  /** The single high-emphasis action (Deploy / Create / Connect). */
  primary?: EmptyAction
  /** An optional lower-emphasis action (Docs / CLI / Learn more). */
  secondary?: EmptyAction
}) {
  return (
    <Card
      borderWidth={1}
      borderColor="$borderColor"
      borderStyle="dashed"
      p="$6"
      gap="$4"
      items="center"
      maxWidth={640}
      self="center"
      width="100%"
    >
      <YStack
        width={48}
        height={48}
        items="center"
        justify="center"
        rounded="$4"
        bg="$color3"
      >
        <Icon size={24} />
      </YStack>

      <YStack gap="$2" items="center" maxW={480}>
        <Text fontSize="$6" fontWeight="500" text="center" letterSpacing={-0.3}>
          {title}
        </Text>
        <Text fontSize="$3" color="$color11" text="center">
          {description}
        </Text>
      </YStack>

      {bullets && bullets.length ? (
        <YStack gap="$2" self="stretch" maxW={420} mx="auto">
          {bullets.map((b) => (
            <XStack key={b} gap="$2" items="flex-start">
              <YStack pt="$1">
                <Check size={14} color="$color10" />
              </YStack>
              <Text fontSize="$3" color="$color11" flex={1}>
                {b}
              </Text>
            </XStack>
          ))}
        </YStack>
      ) : null}

      {primary || secondary ? (
        <XStack gap="$2" items="center" flexWrap="wrap" justify="center">
          {primary ? (
            <PrimaryButton
              icon={primary.icon}
              iconAfter={primary.href ? <ExternalLink size={15} /> : <ArrowRight size={15} />}
              onPress={() => (primary.href ? openHref(primary.href) : primary.onPress?.())}
            >
              {primary.label}
            </PrimaryButton>
          ) : null}
          {secondary ? (
            <Button
              chromeless
              icon={secondary.icon}
              iconAfter={secondary.href ? <ExternalLink size={14} /> : undefined}
              onPress={() => (secondary.href ? openHref(secondary.href) : secondary.onPress?.())}
            >
              {secondary.label}
            </Button>
          ) : null}
        </XStack>
      ) : null}
    </Card>
  )
}
