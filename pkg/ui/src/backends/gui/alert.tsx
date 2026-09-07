'use client'

/**
 * Alert — a callout for one piece of information the page wants read: an
 * optional leading icon, a title and a description in a bordered box, with a
 * `default` and a `destructive` variant.
 *
 * The icon is the first child when that child is neither `AlertTitle` nor
 * `AlertDescription`. It sits absolutely at the top-left corner and the text
 * column indents to clear it, so `<Alert><Icon /><AlertTitle /><AlertDescription /></Alert>`
 * needs no `icon` prop and a trailing action stays in the flow. Surface, icon,
 * title and description are four styled parts sharing one `variant` through a
 * styled context — the surface owns the border, the other three own color.
 */
import { Children, isValidElement, type ComponentProps } from 'react'
import { SizableText, YStack, createStyledContext, styled } from '@hanzo/gui'
import { ink } from './ink'
import { slot } from './slot'

export type AlertVariant = 'default' | 'destructive'

const ICON = 16
const ICON_GUTTER = 28

const AlertContext = /* @__PURE__ */ createStyledContext<{ variant: AlertVariant }>({ variant: 'default' })

const AlertFrame = styled(YStack, {
  name: 'Alert',
  context: AlertContext,
  position: 'relative',
  width: '100%',
  rounded: '$4',
  borderWidth: 1,
  borderColor: '$borderColor',
  bg: '$background',
  p: '$4',

  variants: {
    variant: {
      default: {},
      destructive: { borderColor: '$red9' },
    },
  } as const,

  defaultVariants: { variant: 'default' },
})

const AlertTitleText = styled(SizableText, {
  name: 'AlertTitle',
  context: AlertContext,
  render: 'h5',
  size: '$3',
  fontWeight: '500',
  lineHeight: 16,
  mb: '$1',
  color: '$ink',

  variants: {
    variant: {
      default: {},
      destructive: { color: '$red9' },
    },
  } as const,
})

// A div, so a paragraph or a list inside the description is valid markup.
const AlertDescriptionText = styled(SizableText, {
  name: 'AlertDescription',
  context: AlertContext,
  render: 'div',
  size: '$2',
  color: '$quiet',

  variants: {
    variant: {
      default: {},
      destructive: { color: '$red9' },
    },
  } as const,
})

// A Text host because a View takes no `color`, and an svg child paints in
// `currentColor`.
const IconSlot = styled(SizableText, {
  name: 'AlertIcon',
  context: AlertContext,
  display: 'flex',
  position: 'absolute',
  t: '$4',
  l: '$4',
  width: ICON,
  height: ICON,
  items: 'center',
  justify: 'center',
  color: '$ink',

  variants: {
    variant: {
      default: {},
      destructive: { color: '$red9' },
    },
  } as const,
})

export type AlertProps = Omit<ComponentProps<typeof AlertFrame>, 'variant'> & {
  variant?: AlertVariant | null
}
export type AlertTitleProps = ComponentProps<typeof AlertTitleText>
export type AlertDescriptionProps = ComponentProps<typeof AlertDescriptionText>

function Alert({ variant = 'default', children, ...props }: AlertProps) {
  const resolved = variant ?? 'default'
  const items = Children.toArray(children)
  const head = items[0]
  const icon =
    isValidElement(head) && head.type !== AlertTitle && head.type !== AlertDescription ? head : null
  const body = icon ? items.slice(1) : items

  return (
    <AlertFrame role="alert" variant={resolved} {...slot('alert')} data-variant={resolved} {...props}>
      {icon ? (
        <IconSlot variant={resolved} {...slot('alert-icon')}>
          {icon}
        </IconSlot>
      ) : null}
      <YStack pl={icon ? ICON_GUTTER : 0}>{ink(body)}</YStack>
    </AlertFrame>
  )
}

const AlertTitle = (props: AlertTitleProps) => <AlertTitleText {...slot('alert-title')} {...props} />

const AlertDescription = (props: AlertDescriptionProps) => (
  <AlertDescriptionText {...slot('alert-description')} {...props} />
)

export { Alert, AlertTitle, AlertDescription }
