'use client'

/**
 * Button — the gui-backend original.
 *
 * `variant`, `size`, `asChild`, `isLoading`, `buttonVariants`, and the
 * `data-slot`/`data-variant`/`data-size` markers. The substrate is @hanzo/gui:
 * `styled()` variants on the gui `Button` frame.
 *
 * Every size meets the 44px touch floor through `hitSlop`, never through
 * padding — the visual density stays at 36/32/40px.
 */
import { Button as GuiButton, Spinner, styled } from '@hanzo/gui'
import type { ComponentProps, ReactNode } from 'react'

export type ButtonVariant =
  | 'default'
  | 'destructive'
  | 'outline'
  | 'secondary'
  | 'ghost'
  | 'link'
  | 'primary'
  | 'linkFG'
  | 'linkMuted'

export type ButtonSize = 'default' | 'sm' | 'lg' | 'icon' | 'icon-sm' | 'icon-lg'

const HEIGHT: Record<ButtonSize, number> = {
  default: 36,
  sm: 32,
  lg: 40,
  icon: 36,
  'icon-sm': 32,
  'icon-lg': 40,
}

const MIN_TOUCH = 44
const slop = (size: ButtonSize) => Math.max(0, (MIN_TOUCH - HEIGHT[size]) / 2)

const Frame = styled(GuiButton, {
  name: 'Button',
  items: 'center',
  justify: 'center',
  gap: '$2',
  shrink: 0,
  rounded: '$3',
  borderWidth: 1,
  borderColor: 'transparent',
  cursor: 'pointer',

  variants: {
    variant: {
      default: { bg: '$color12', color: '$color1', hoverStyle: { opacity: 0.9 } },
      primary: { bg: '$color12', color: '$color1', hoverStyle: { opacity: 0.9 } },
      destructive: { bg: '$red9', color: '$white1', hoverStyle: { opacity: 0.9 } },
      outline: {
        bg: '$background',
        color: '$color12',
        borderColor: '$borderColor',
        hoverStyle: { bg: '$color3' },
      },
      secondary: { bg: '$color4', color: '$color12', hoverStyle: { opacity: 0.8 } },
      ghost: { bg: 'transparent', color: '$color12', hoverStyle: { bg: '$color3' } },
      link: { bg: 'transparent', color: '$color12', hoverStyle: { textDecorationLine: 'underline' } },
      linkFG: { bg: 'transparent', color: '$color12', hoverStyle: { textDecorationLine: 'underline' } },
      linkMuted: {
        bg: 'transparent',
        color: '$color11',
        hoverStyle: { color: '$color12', textDecorationLine: 'underline' },
      },
    },
    size: {
      default: { height: HEIGHT.default, px: '$4', fontSize: '$3' },
      sm: { height: HEIGHT.sm, px: '$3', gap: '$1.5', fontSize: '$2' },
      lg: { height: HEIGHT.lg, px: '$6', fontSize: '$3' },
      icon: { height: HEIGHT.icon, width: HEIGHT.icon, px: 0 },
      'icon-sm': { height: HEIGHT['icon-sm'], width: HEIGHT['icon-sm'], px: 0 },
      'icon-lg': { height: HEIGHT['icon-lg'], width: HEIGHT['icon-lg'], px: 0 },
    },
    disabled: {
      true: { opacity: 0.5, pointerEvents: 'none', cursor: 'default' },
    },
  } as const,

  defaultVariants: { variant: 'default', size: 'default' },
})

/**
 * A stable class handle for hosts that hook buttons from CSS. Styling lives in
 * the tokens; this only names the variant and size.
 */
export const buttonVariants = ({
  variant,
  size,
  className,
}: { variant?: ButtonVariant | null; size?: ButtonSize | null; className?: string } = {}) =>
  [`hanzo-button`, `hanzo-button--${variant ?? 'default'}`, `hanzo-button--${size ?? 'default'}`, className]
    .filter(Boolean)
    .join(' ')

export type ButtonProps = Omit<ComponentProps<typeof Frame>, 'variant' | 'size' | 'children'> & {
  variant?: ButtonVariant | null
  size?: ButtonSize | null
  asChild?: boolean
  isLoading?: boolean
  children?: ReactNode
}

function Button({
  className,
  variant = 'default',
  size = 'default',
  asChild = false,
  isLoading = false,
  disabled,
  children,
  ...props
}: ButtonProps) {
  const resolved = size ?? 'default'
  return (
    <Frame
      data-slot="button"
      data-variant={variant ?? 'default'}
      data-size={resolved}
      variant={variant ?? 'default'}
      size={resolved}
      asChild={asChild}
      disabled={disabled || isLoading}
      hitSlop={slop(resolved)}
      className={buttonVariants({ variant, size, className })}
      icon={isLoading && !asChild ? <Spinner size="small" /> : undefined}
      {...props}
    >
      {children}
    </Frame>
  )
}

export { Button }
