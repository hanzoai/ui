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
 *
 * ── The callout (the record kit's Callout, MIT — NOTICE) ────────────────────
 * Naming a `status`, a `color`, a `title`, an `action` or an `onDismiss` draws
 * the record kit's callout: a titled card up to 512 wide (`fullWidth` lifts the
 * cap), padding 12 12 8, 8px corners, its colour's faint ground and edge (data
 * steps 1 and 6) and its icon in step 9 — the help circle unless one is given —
 * a 13px medium one-line title beside a 24px dismiss, a 12px soft description
 * indented to clear the icon, and actions at the end of a footer. The status
 * reaches the colour through the one status map (feedback.ts), so an `error`
 * callout and an `error` banner are the same red. Without those props an Alert
 * renders exactly as it always has.
 */
import { Children, isValidElement, type ComponentProps, type ReactNode } from 'react'
import { SizableText, XStack, YStack, createStyledContext, styled } from '@hanzo/gui'
import { CircleHelp, X } from '@hanzogui/lucide-icons-2'
import { ink } from './ink'
import { slot } from './slot'
import { Button, type ButtonProps } from './button'
import { colorOf, STATUS_PAINT, type FeedbackColor, type FeedbackStatus } from './feedback'

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

export type AlertProps = Omit<ComponentProps<typeof AlertFrame>, 'variant' | 'color' | 'title'> & {
  variant?: AlertVariant | null
  /** What the callout reports; picks its colour through the status map. */
  status?: FeedbackStatus
  /** The colour, when it is not the status's. */
  color?: FeedbackColor
  /** The callout's title (one line). */
  title?: ReactNode
  /** The line under the title. */
  description?: ReactNode
  /** The leading icon; the help circle by default. `null` draws none. */
  icon?: ReactNode | null
  /** The footer's controls — usually `<CalloutAction>`s. */
  action?: ReactNode
  /** Offer a dismiss button. */
  onDismiss?: () => void
  /** The dismiss button's name. */
  closeLabel?: string
  /** Lift the 512px cap. */
  fullWidth?: boolean
}

/** A callout's own action: a small ghost button at regular weight. */
export function CalloutAction(props: Omit<ButtonProps, 'variant' | 'size'>) {
  return <Button {...slot('alert-action')} variant="ghost" size="xs" fontWeight="400" {...props} />
}

/** The callout icon: data step 9 of its hue (its ground and edge, steps 1 and 6, are the status map's). */
const step9 = (hue: FeedbackColor) => `var(--data-${hue}-9)`

function Callout({
  status,
  color,
  title,
  description,
  icon,
  action,
  onDismiss,
  closeLabel = 'Dismiss',
  fullWidth = false,
  children,
  ...props
}: Omit<AlertProps, 'variant'>) {
  const hue = colorOf(status ?? 'info', color)
  const lead = icon === undefined ? <CircleHelp size={16} color={step9(hue) as never} /> : icon
  return (
    <YStack
      // A callout that is not an alarm is a note: read where it sits, not
      // announced. gui's role union is React Native's and lacks `note`.
      {...({ role: status === 'error' || status === 'warning' ? 'alert' : 'note' } as object)}
      {...slot('alert')}
      data-variant="callout"
      data-color={hue}
      width="100%"
      maxW={fullWidth ? undefined : 512}
      gap="$2"
      pt="$3"
      px="$3"
      pb="$2"
      rounded="$3"
      borderWidth={1}
      borderColor={STATUS_PAINT[hue].edge as never}
      bg={STATUS_PAINT[hue].ground as never}
      {...props}
    >
      <XStack {...slot('alert-header')} items="center" gap="$2" minH={24}>
        {lead ? (
          <XStack {...slot('alert-icon')} shrink={0} width={16} height={16} items="center" justify="center">
            {lead}
          </XStack>
        ) : null}
        <SizableText {...slot('alert-title')} flex={1} minW={0} size="$2" lineHeight={18} fontWeight="500" color="$ink" numberOfLines={1}>
          {title}
        </SizableText>
        {onDismiss ? (
          <Button {...slot('alert-dismiss')} variant="ghost" size="icon-xs" emphasis="subtle" aria-label={closeLabel} onPress={onDismiss}>
            <X />
          </Button>
        ) : null}
      </XStack>
      {description || children ? (
        <SizableText
          {...slot('alert-description')}
          render="div"
          size="$1"
          lineHeight={17}
          color="$hint"
          pl={lead ? 24 : 0}
          pb={action ? 0 : '$2'}
        >
          {description}
          {children}
        </SizableText>
      ) : null}
      {action ? (
        <XStack {...slot('alert-footer')} justify="flex-end" gap="$2">
          {action}
        </XStack>
      ) : null}
    </YStack>
  )
}
export type AlertTitleProps = ComponentProps<typeof AlertTitleText>
export type AlertDescriptionProps = ComponentProps<typeof AlertDescriptionText>

function Alert({
  variant = 'default',
  status,
  color,
  title,
  description,
  icon: lead,
  action,
  onDismiss,
  closeLabel,
  fullWidth,
  children,
  ...props
}: AlertProps) {
  if ([status, color, title, description, lead, action, onDismiss].some((v) => v !== undefined))
    return (
      <Callout
        status={status}
        color={color}
        title={title}
        description={description}
        icon={lead}
        action={action}
        onDismiss={onDismiss}
        closeLabel={closeLabel}
        fullWidth={fullWidth}
        {...props}
      >
        {children}
      </Callout>
    )
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
