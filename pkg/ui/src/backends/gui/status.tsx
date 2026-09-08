'use client'

/**
 * Status — a small pill that names a state: `default`, `success`, `warning`,
 * `error`, `info` or `gray`, with a leading dot in the same hue.
 *
 * Surface and dot are two styled parts sharing one `variant` through a styled
 * context, so a variant reaches both without either reading it twice by hand.
 * The dot is on by default (it is the whole point of a status pill) and can be
 * turned off for a plain label.
 */
import { SizableText, XStack, createStyledContext, styled } from '@hanzo/gui'
import type { ComponentProps } from 'react'
import { ink } from './ink'
import { slot } from './slot'

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

export type StatusProps = Omit<ComponentProps<typeof StatusFrame>, 'variant'> & {
  variant?: StatusVariant | null
  /** Show the leading dot. Defaults to true — the dot is the point of a status pill. */
  dot?: boolean
}

export function Status({ variant = 'default', dot = true, children, ...props }: StatusProps) {
  const resolved = variant ?? 'default'

  return (
    <StatusFrame {...slot('status')} variant={resolved} data-variant={resolved} {...props}>
      {dot ? <StatusDot {...slot('status-dot')} /> : null}
      {ink(children, StatusText)}
    </StatusFrame>
  )
}
