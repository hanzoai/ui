'use client'

/**
 * IPhone15Pro — a device frame shaped like an iPhone 15 Pro, for showing a UI
 * inside a phone bezel. Three sizes (`default`, `pro-max`, `mini`) and four
 * bezel colors (`black`, `white`, `blue`, `natural`); whatever is passed as
 * children fills the screen, clipped to its rounded corners.
 *
 * The frame is one `YStack` carrying the bezel color and the outer radius;
 * the dynamic island and the four side buttons are absolutely positioned
 * children of it, so they sit on the bezel rather than inside the screen.
 */
import { YStack, styled } from '@hanzo/gui'
import type { ComponentProps, ReactNode } from 'react'
import { sx } from '../../sx'
import { slot } from './slot'

export type IPhone15ProVariant = 'default' | 'pro-max' | 'mini'
export type IPhone15ProColor = 'black' | 'white' | 'blue' | 'natural'

/** Outer frame size per variant, px. */
const SIZE: Record<IPhone15ProVariant, { width: number; height: number }> = {
  default: { width: 393, height: 852 },
  'pro-max': { width: 430, height: 932 },
  mini: { width: 360, height: 780 },
}

/** Bezel + border color per finish. */
const FINISH = {
  black: { bg: '#18181b', border: '#27272a' },
  white: { bg: '#f4f4f5', border: '#d4d4d8' },
  blue: { bg: '#172554', border: '#1e3a8a' },
  natural: { bg: '#292524', border: '#44403c' },
} as const satisfies Record<IPhone15ProColor, { bg: `#${string}`; border: `#${string}` }>

const BEZEL = 14
const OUTER_RADIUS = 48
const INNER_RADIUS = OUTER_RADIUS - BEZEL

const Frame = styled(YStack, {
  name: 'IPhone15Pro',
  position: 'relative',
  rounded: OUTER_RADIUS,
  borderWidth: BEZEL,
  shadowColor: '$dim',
  shadowRadius: 32,
  shadowOpacity: 0.4,
})

const Screen = styled(YStack, {
  name: 'IPhone15ProScreen',
  position: 'relative',
  width: '100%',
  height: '100%',
  rounded: INNER_RADIUS,
  overflow: 'hidden',
  bg: '#ffffff',
})

const Island = styled(YStack, {
  name: 'IPhone15ProIsland',
  position: 'absolute',
  t: 0,
  l: '50%',
  ml: -64,
  height: 32,
  width: 128,
  rounded: 24,
  bg: '#000000',
  z: 10,
})

const SideButton = styled(YStack, {
  name: 'IPhone15ProButton',
  position: 'absolute',
  width: 4,
  bg: '$borderColor',

  variants: {
    edge: {
      left: { l: -18, rounded: 4 },
      right: { r: -18, rounded: 4 },
    },
  } as const,
})

export type IPhone15ProProps = Omit<ComponentProps<typeof Frame>, 'variant' | 'children'> & {
  children?: ReactNode
  variant?: IPhone15ProVariant | null
  color?: IPhone15ProColor | null
  className?: string
}

export function IPhone15Pro({
  children,
  variant = 'default',
  color = 'black',
  className,
  ...props
}: IPhone15ProProps) {
  const resolvedVariant = variant ?? 'default'
  const resolvedColor = color ?? 'black'
  const { width, height } = SIZE[resolvedVariant]
  const finish = FINISH[resolvedColor]

  return (
    <Frame
      {...slot('iphone-15-pro')}
      data-variant={resolvedVariant}
      data-color={resolvedColor}
      width={width}
      height={height}
      bg={finish.bg}
      borderColor={finish.border}
      {...sx(className)}
      {...props}
    >
      <Island {...slot('iphone-15-pro-island')} />
      <Screen {...slot('iphone-15-pro-screen')}>{children}</Screen>
      <SideButton {...slot('iphone-15-pro-mute')} edge="left" t={128} height={48} />
      <SideButton {...slot('iphone-15-pro-volume-up')} edge="left" t={208} height={64} />
      <SideButton {...slot('iphone-15-pro-volume-down')} edge="left" t={288} height={64} />
      <SideButton {...slot('iphone-15-pro-power')} edge="right" t={176} height={80} />
    </Frame>
  )
}
