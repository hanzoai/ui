'use client'

/**
 * Card3D — a card that tilts toward the pointer.
 *
 * The frame turns about its centre by up to `maxTilt` degrees in proportion to
 * where the pointer sits, grows by `scale` while the pointer is on it, and eases
 * flat again over `speed` ms once it leaves. A radial glare follows the pointer
 * across the surface. Header, title, description, content and footer each stand
 * at their own `depth` along z, so the layers part as the card turns.
 *
 * The live transform is an inline style rather than a style prop: gui compiles
 * a style prop to one class per distinct value, and a tilt takes a new value on
 * every pixel of travel. A layer's depth is fixed and goes inline only to stay
 * in the same vocabulary.
 */
import { SizableText, XStack, YStack, styled } from '@hanzo/gui'
import { useState, type CSSProperties, type ComponentProps, type ElementType, type PointerEvent } from 'react'
import { ink } from './ink'
import { slot } from './slot'

const PAD = 24

/** Where each layer stands along z, in px. The glare rides above the deepest. */
const DEPTH = { header: 20, title: 30, description: 10, content: 25, footer: 15, glare: 40 }

const EASE = 'cubic-bezier(0.03, 0.98, 0.52, 0.99)'

const Frame = styled(YStack, {
  name: 'Card3D',
  position: 'relative',
  bg: '$background',
  borderWidth: 1,
  borderColor: '$borderColor',
  rounded: '$6',
  py: PAD,
  gap: PAD,
  shadowColor: '$shadowColor',
  shadowRadius: 24,
  shadowOffset: { width: 0, height: 8 },
  cursor: 'pointer',
})

const Glare = styled(YStack, {
  name: 'Card3DGlare',
  position: 'absolute',
  inset: 0,
  rounded: '$6',
  pointerEvents: 'none',
})

const HeaderFrame = styled(YStack, { name: 'Card3DHeader', px: PAD, gap: '$1.5' })
const TitleFrame = styled(SizableText, { name: 'Card3DTitle', size: '$7', fontWeight: '600' })
const DescriptionFrame = styled(SizableText, { name: 'Card3DDescription', size: '$2', color: '$quiet' })
const ContentFrame = styled(YStack, { name: 'Card3DContent', px: PAD })
const FooterFrame = styled(XStack, { name: 'Card3DFooter', px: PAD, items: 'center' })

export type Card3DProps = ComponentProps<typeof Frame> & {
  /** Largest turn about either axis, in degrees, reached at the card's edge. */
  maxTilt?: number
  /** Viewer distance in px; shorter is a more dramatic turn. */
  perspective?: number
  /** Growth while the pointer is on the card. */
  scale?: number
  /** How long the card takes to settle flat, in ms. */
  speed?: number
  /** Whether the radial highlight follows the pointer. */
  glare?: boolean
  /** Peak alpha of that highlight. */
  glareMaxOpacity?: number
}

type Layer = {
  /** Distance the layer stands off the surface, in px. */
  depth?: number
  /** Inline style, laid over the depth transform. */
  style?: CSSProperties
}
type Layered<T extends ElementType> = Omit<ComponentProps<T>, 'style'> & Layer
export type Card3DHeaderProps = Layered<typeof HeaderFrame>
export type Card3DTitleProps = Layered<typeof TitleFrame>
export type Card3DDescriptionProps = Layered<typeof DescriptionFrame>
export type Card3DContentProps = Layered<typeof ContentFrame>
export type Card3DFooterProps = Layered<typeof FooterFrame>

/** The pointer as fractions of the card, 0..1 from its top-left corner. */
const CENTRE = { x: 0.5, y: 0.5, live: false }

export function Card3D({
  maxTilt = 15,
  perspective = 1000,
  scale = 1.05,
  speed = 400,
  glare = true,
  glareMaxOpacity = 0.7,
  children,
  ...p
}: Card3DProps) {
  const [at, setAt] = useState(CENTRE)
  // Settles when the pointer leaves: by moving off or, for one that cannot
  // hover, by lifting — a touch's pointerup or cancel is followed by pointerleave.
  // The last position is kept so the glare fades where it was, not at the centre.
  const rest = () => setAt((a) => ({ ...a, live: false }))
  const move = (e: PointerEvent<HTMLDivElement>) => {
    const r = e.currentTarget.getBoundingClientRect()
    setAt({ x: (e.clientX - r.left) / r.width, y: (e.clientY - r.top) / r.height, live: true })
  }
  const rx = at.live ? (1 - 2 * at.y) * maxTilt : 0
  const ry = at.live ? (2 * at.x - 1) * maxTilt : 0
  return (
    <Frame
      {...slot('3d-card')}
      data-state={at.live ? 'hover' : 'idle'}
      style={{
        transform: `perspective(${perspective}px) rotateX(${rx}deg) rotateY(${ry}deg) scale(${at.live ? scale : 1})`,
        transition: at.live ? 'none' : `transform ${speed}ms ${EASE}`,
        transformStyle: 'preserve-3d',
        willChange: 'transform',
        touchAction: 'none',
      }}
      onPointerMove={move}
      onPointerLeave={rest}
      {...p}
    >
      {children}
      {glare && (
        <Glare
          {...slot('3d-card-glare')}
          style={{
            opacity: at.live ? 1 : 0,
            background: `radial-gradient(circle at ${at.x * 100}% ${at.y * 100}%, rgba(255,255,255,${glareMaxOpacity}) 0%, transparent 50%)`,
            transition: at.live ? 'none' : `opacity ${speed}ms ease-out`,
            // Above every layer, shrunk by what the perspective would grow it,
            // so it meets the card's edge instead of overhanging it.
            transform: `translateZ(${DEPTH.glare}px) scale(${(perspective - DEPTH.glare) / perspective})`,
          }}
        />
      )}
    </Frame>
  )
}

/**
 * A layer's own transform: its depth along z, under whatever inline style the
 * caller adds — so a colour on a title keeps the title standing off the card.
 */
const layer = (depth: number, style?: CSSProperties) => ({
  style: { transform: `translateZ(${depth}px)`, ...style },
})

export const Card3DHeader = ({ depth = DEPTH.header, style, ...p }: Card3DHeaderProps) => (
  <HeaderFrame {...slot('3d-card-header')} {...layer(depth, style)} {...p} />
)
export const Card3DTitle = ({ depth = DEPTH.title, style, ...p }: Card3DTitleProps) => (
  <TitleFrame {...slot('3d-card-title')} {...layer(depth, style)} {...p} />
)
export const Card3DDescription = ({ depth = DEPTH.description, style, ...p }: Card3DDescriptionProps) => (
  <DescriptionFrame {...slot('3d-card-description')} {...layer(depth, style)} {...p} />
)
export const Card3DContent = ({ depth = DEPTH.content, style, children, ...p }: Card3DContentProps) => (
  <ContentFrame {...slot('3d-card-content')} {...layer(depth, style)} {...p}>
    {ink(children)}
  </ContentFrame>
)
export const Card3DFooter = ({ depth = DEPTH.footer, style, children, ...p }: Card3DFooterProps) => (
  <FooterFrame {...slot('3d-card-footer')} {...layer(depth, style)} {...p}>
    {ink(children)}
  </FooterFrame>
)
