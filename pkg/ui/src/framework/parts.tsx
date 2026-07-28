'use client'

/**
 * The small shared pieces every DocType view draws with — one definition each, so
 * an action button, an error bar and an inline loader look and behave the same in
 * the browser, the records list, the detail and the builder.
 *
 * MOBILE FIRST is a property of these parts, not of each view: `Action` is the
 * only button the layer uses, and it grows to the 44px tap floor and takes a full
 * row on a phone, so no view has to remember. Colour, type and spacing are token
 * references (`$color10`, `$red7`, `$3`) resolved by the shared @hanzo/ui scale —
 * there is no hex in this layer.
 */
import type { ReactElement, ReactNode } from 'react'
import { Button, Card, Spinner, Text, XStack, YStack } from '@hanzo/gui'
import { TriangleAlert } from '@hanzogui/lucide-icons-2'

import { PrimaryButton } from '../product/PrimaryButton'
import { TAP } from './responsive'

export interface ActionProps {
  children?: ReactNode
  icon?: ReactElement
  onPress?: () => void
  disabled?: boolean
  /** Filled, high-emphasis (Save / Create / Publish). */
  primary?: boolean
  /** Destructive tint (Delete). */
  danger?: boolean
  /** The container is phone-width: meet the tap floor and fill the row. */
  phone?: boolean
  /** Keep the label off-screen readers only — for icon-only controls. */
  label?: string
}

/**
 * THE button of this layer. On a phone it is at least `TAP` (44px) tall and
 * stretches to the row, so a thumb hits it and two actions never end up 6px apart;
 * on a wider box it collapses back to the compact `$2` admin control.
 */
export function Action({ children, icon, onPress, disabled, primary, danger, phone, label }: ActionProps) {
  const Cmp = primary ? PrimaryButton : Button
  return (
    <Cmp
      size={phone ? '$4' : '$2'}
      minH={phone ? TAP : undefined}
      grow={phone ? 1 : 0}
      flexBasis={phone ? 0 : 'auto'}
      minW={phone ? 140 : undefined}
      icon={icon}
      disabled={disabled}
      onPress={onPress}
      aria-label={label}
      {...(danger ? { theme: 'red' as const } : {})}
    >
      {children}
    </Cmp>
  )
}

/** A row of `Action`s that wraps rather than clipping its last control. */
export function Actions({ children, phone }: { children: ReactNode; phone?: boolean }) {
  return (
    <XStack gap="$2" items="center" flexWrap="wrap" width={phone ? '100%' : undefined}>
      {children}
    </XStack>
  )
}

/** An honest inline failure — never a fabricated success, never a silent no-op. */
export function ErrorBar({ message }: { message: string }) {
  return (
    <Card borderWidth={1} borderColor="$red7" bg="$red2" p="$3" maxW={620}>
      <XStack gap="$2" items="flex-start">
        <TriangleAlert size={15} />
        <Text fontSize="$3" color="$red11" flex={1}>
          {message}
        </Text>
      </XStack>
    </Card>
  )
}

/** In-flow loader — the DocType views live inside a host shell, so this never
 *  takes the viewport (that is the host's own full-screen brand loader). */
export function Loading({ label, size = 'small' }: { label?: string; size?: 'small' | 'large' }) {
  return (
    <XStack items="center" justify="center" gap="$3" py="$8">
      <Spinner size={size} />
      {label ? (
        <Text fontSize="$3" color="$color11">
          {label}
        </Text>
      ) : null}
    </XStack>
  )
}

/** The name 8.0.24 shipped for the same in-flow loader. One component, two spellings. */
export function Loader({ label, size }: { label?: string; size?: number }) {
  return <Loading label={label} size={size && size >= 32 ? 'large' : 'small'} />
}

/** A dimmed metadata line (record count, field count, type). */
export function Meta({ children }: { children: ReactNode }) {
  return (
    <Text fontSize="$2" color="$color10" numberOfLines={1}>
      {children}
    </Text>
  )
}

/**
 * Long values must WRAP, not push the page sideways. A field can hold a URL, a
 * hash, a Lexical blob or a 400-character token with no spaces, and the default
 * `overflow-wrap: normal` refuses to break inside a word — so one such value paints
 * past the right edge of a phone. `html { overflow-x: clip }` then HIDES it rather
 * than scrolling to it, which makes the value unreadable AND invisible to
 * `scrollWidth`. Both properties are inherited, so declaring them on the container
 * covers every value inside it.
 */
export const WRAP_ANYWHERE = { overflowWrap: 'anywhere', wordBreak: 'break-word' } as const

/** A titled section wrapper used by the detail + builder panels. */
export function Panel({ children, phone }: { children: ReactNode; phone?: boolean }) {
  return (
    <Card
      borderWidth={1}
      borderColor="$borderColor"
      p={phone ? '$3' : '$4'}
      maxW={760}
      width="100%"
      style={WRAP_ANYWHERE}
    >
      <YStack gap="$3">{children}</YStack>
    </Card>
  )
}
