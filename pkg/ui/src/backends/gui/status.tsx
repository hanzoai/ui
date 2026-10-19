'use client'

/**
 * Status — a small pill that names a state: `default`, `success`, `warning`,
 * `error`, `info` or `gray`, with a leading dot in the same hue.
 *
 * Surface and dot are two styled parts sharing one `variant` through a styled
 * context, so a variant reaches both without either reading it twice by hand.
 * The dot is on by default (it is the whole point of a status pill) and can be
 * turned off for a plain label.
 *
 * `color` draws the record status instead (re-expressed from twenty-ui's
 * Status, MIT, see NOTICE): any of the thirty data hues, its step 3 under step
 * 11 ink, a 4px dot in the ink, 20px tall, 13px regular, and a `loading` state
 * that busies the pill. The semantic names stay as aliases onto hues — success
 * green, warning orange, error red, info blue, default and gray gray — so one
 * status map serves both looks.
 */
import { SizableText, Spinner, XStack, createStyledContext, styled } from '@hanzo/gui'
import type { ComponentProps } from 'react'
import { hueOr, useTone, type DataHue } from './hue'
import { ink } from './ink'
import { slot } from './slot'

/** The one status → hue map, for every component that names a state. */
export const STATUS_HUE: Record<StatusVariant, DataHue> = {
  default: 'gray',
  gray: 'gray',
  success: 'green',
  warning: 'orange',
  error: 'red',
  info: 'blue',
}

export type StatusVariant = 'default' | 'success' | 'warning' | 'error' | 'info' | 'gray'

const StatusContext = /* @__PURE__ */ createStyledContext<{ variant: StatusVariant }>({
  variant: 'default',
})

const StatusFrame = styled(XStack, {
  name: 'Status',
  context: StatusContext,
  display: 'inline-flex',
  self: 'flex-start',
  items: 'center',
  gap: '$2',
  rounded: '$10',
  px: '$2.5',
  py: '$1',

  variants: {
    variant: {
      default: { bg: '$hover' },
      success: { bg: '$green2' },
      warning: { bg: '$yellow2' },
      error: { bg: '$red2' },
      info: { bg: '$blue2' },
      gray: { bg: '$gray2' },
    },
  } as const,

  defaultVariants: { variant: 'default' },
})

const StatusText = styled(SizableText, {
  name: 'StatusText',
  context: StatusContext,
  size: '$1',
  fontWeight: '500',

  variants: {
    variant: {
      default: { color: '$ink' },
      success: { color: '$green12' },
      warning: { color: '$yellow12' },
      error: { color: '$red12' },
      info: { color: '$blue12' },
      gray: { color: '$gray12' },
    },
  } as const,
})

const StatusDot = styled(XStack, {
  name: 'StatusDot',
  context: StatusContext,
  width: 6,
  height: 6,
  rounded: '$10',

  variants: {
    variant: {
      default: { bg: '$ink' },
      success: { bg: '$green9' },
      warning: { bg: '$yellow9' },
      error: { bg: '$red9' },
      info: { bg: '$blue9' },
      gray: { bg: '$gray9' },
    },
  } as const,
})

export type StatusProps = Omit<ComponentProps<typeof StatusFrame>, 'variant' | 'color'> & {
  variant?: StatusVariant | null
  /** A data hue or a semantic name: the record status look. */
  color?: DataHue | StatusVariant | (string & {})
  /** Busy: a spinner after the label, `aria-busy` on the pill. */
  loading?: boolean
  weight?: 'regular' | 'medium'
  /** Show the leading dot. Defaults to true — the dot is the point of a status pill. */
  dot?: boolean
}

export function Status({ variant = 'default', color, loading = false, weight = 'regular', dot = true, children, ...props }: StatusProps) {
  if (color != null) return <Hued color={color} loading={loading} weight={weight} dot={dot} {...props}>{children}</Hued>
  const resolved = variant ?? 'default'

  return (
    <StatusFrame {...slot('status')} variant={resolved} data-variant={resolved} {...props}>
      {dot ? <StatusDot {...slot('status-dot')} /> : null}
      {ink(children, StatusText)}
    </StatusFrame>
  )
}

function Hued({
  color,
  loading,
  weight,
  dot,
  children,
  style,
  ...props
}: Omit<StatusProps, 'variant'> & { color: string }) {
  const hue = color in STATUS_HUE ? STATUS_HUE[color as StatusVariant] : hueOr(color)
  const { style: hueStyle, tone } = useTone(hue, [3, 11])
  return (
    <XStack
      {...slot('status')}
      data-color={hue}
      {...(loading ? { 'aria-busy': true } : null)}
      display="inline-flex"
      self="flex-start"
      items="center"
      gap="$1"
      height={20}
      pl="$2"
      pr={loading ? '$1' : '$2'}
      rounded="$10"
      bg={tone(3)}
      maxW="100%"
      overflow="hidden"
      style={{ ...hueStyle, ...(style as object) }}
      {...props}
    >
      {dot ? <XStack {...slot('status-dot')} width={4} height={4} rounded="$10" bg={tone(11)} shrink={0} /> : null}
      {ink(children, SizableText, {
        size: '$2',
        color: tone(11),
        numberOfLines: 1,
        ...(weight === 'medium' ? { fontWeight: '500' } : null),
      })}
      {loading ? <Spinner size="small" maxW={12} maxH={12} color={tone(11) as never} /> : null}
    </XStack>
  )
}
