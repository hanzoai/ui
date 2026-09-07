'use client'

/**
 * AppleCardsCarousel — a stack of full-bleed cards with one in front and the
 * next two peeking out behind it, each a step smaller and further to the side,
 * the way App Store "Today" cards fan out.
 *
 * A pointer drag on the front card carries it sideways and slides its
 * background image the other way for depth; releasing past `swipeThreshold`,
 * or with a quick flick, commits to the neighbour and the stack springs into
 * its new order. A press that begins on a control inside the card belongs to
 * the control, not to a drag. Arrow keys while the region has focus, the arrow
 * buttons, the dots and an optional auto-play (held while the pointer is over
 * the region, and never started under a reduced-motion preference) all move
 * the same index. Cards more than two steps from the front are not drawn.
 *
 * Motion is CSS transform + transition on the card, switched off for the
 * duration of a drag so the card tracks the pointer without lag, and off
 * altogether under a reduced-motion preference.
 */
import * as React from 'react'
import { Image, SizableText, XStack, YStack } from '@hanzo/gui'
import { ChevronLeft, ChevronRight } from '@hanzogui/lucide-icons-2'

import { glass } from '../../glass'
import { sx } from '../../sx'
import { drag, dragPos, touch, type DragEvent } from './gesture'

export type CarouselCard = {
  id: string
  title: string
  subtitle?: string
  description?: string
  image?: string
  gradient?: string
  content?: React.ReactNode
}

export type AppleCardsCarouselProps = {
  cards: CarouselCard[]
  autoPlay?: boolean
  autoPlayInterval?: number
  className?: string
  cardClassName?: string
  showArrows?: boolean
  showDots?: boolean
  parallaxOffset?: number
  stackOffset?: number
  stackScale?: number
  swipeThreshold?: number
}

const SPRING = 'transform .4s cubic-bezier(.2,.8,.2,1), opacity .4s ease'
/** px/ms — a flick commits regardless of distance. */
const FLICK = 0.5
/** Two pointer samples closer than half a frame say nothing about speed. */
const FRAME = 8
/** A pointer that has been still this long before release is not flicking. */
const STALE = 100
const ARROW = 36
/** What a press inside a card must not turn into a drag. */
const CONTROL = 'a,button,input,select,textarea'
const WHITE = (a: number) => `rgba(255,255,255,${a})` as const

type Track = { origin: number; x: number; v: number; sample: { x: number; t: number } }

/** Position, scale, opacity and stacking order for the card `offset` slots from the front. */
const layerAt = (offset: number, cardCount: number, stackOffset: number, stackScale: number) => {
  const abs = Math.abs(offset)
  if (abs > 2) return { visible: false, x: 0, scale: 1, opacity: 0, zIndex: 0 }
  return {
    visible: true,
    x: offset * stackOffset,
    scale: Math.pow(stackScale, abs),
    opacity: Math.max(0, 1 - abs * 0.3),
    zIndex: cardCount - abs,
  }
}

const still = () =>
  typeof window !== 'undefined' && !!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches

export function AppleCardsCarousel({
  cards,
  autoPlay = false,
  autoPlayInterval = 5000,
  className,
  cardClassName,
  showArrows = true,
  showDots = true,
  parallaxOffset = 50,
  stackOffset = 10,
  stackScale = 0.95,
  swipeThreshold = 50,
}: AppleCardsCarouselProps) {
  const [index, setIndex] = React.useState(0)
  const [hovering, setHovering] = React.useState(false)
  const [dragX, setDragX] = React.useState(0)
  const [dragging, setDragging] = React.useState(false)
  /**
   * The drag in flight — pointer origin, offset so far, and the sample its
   * velocity is measured from — or null between drags. `pointermove` fires for
   * a pointer that is merely passing over the card, so null is what keeps a
   * hover from moving it.
   */
  const track = React.useRef<Track | null>(null)
  /** The reduced-motion preference, read once mounted so the server and the client agree. */
  const [calm, setCalm] = React.useState(false)
  React.useEffect(() => setCalm(still()), [])

  const count = cards.length

  const step = React.useCallback(
    (by: number) => setIndex((i) => (count ? (i + by + count) % count : 0)),
    [count],
  )
  const goNext = React.useCallback(() => step(1), [step])
  const goPrevious = React.useCallback(() => step(-1), [step])

  React.useEffect(() => {
    if (!autoPlay || hovering || count < 2 || calm) return
    const t = setInterval(goNext, autoPlayInterval)
    return () => clearInterval(t)
  }, [autoPlay, hovering, autoPlayInterval, goNext, count, calm])

  const onKeyDown = React.useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'ArrowLeft') goPrevious()
      else if (e.key === 'ArrowRight') goNext()
    },
    [goNext, goPrevious],
  )

  const begin = React.useCallback((e: DragEvent & { target?: unknown }) => {
    // The pointer capture `drag()` took would retarget the control's click to
    // the card, so the capture goes back and the drag never arms.
    const on = e.target as { closest?: (selector: string) => unknown } | null
    if (on?.closest?.(CONTROL)) {
      const card = e.currentTarget as { releasePointerCapture?: (id: number) => void } | undefined
      if (e.pointerId != null) card?.releasePointerCapture?.(e.pointerId)
      return
    }
    track.current = { origin: dragPos(e, true), x: 0, v: 0, sample: { x: 0, t: Date.now() } }
    setDragging(true)
  }, [])

  const move = React.useCallback((e: DragEvent) => {
    const k = track.current
    if (!k) return
    k.x = dragPos(e, true) - k.origin
    const t = Date.now()
    const dt = t - k.sample.t
    if (dt >= FRAME) {
      k.v = (k.x - k.sample.x) / dt
      k.sample = { x: k.x, t }
    }
    setDragX(k.x)
  }, [])

  const end = React.useCallback(() => {
    const k = track.current
    if (!k) return
    track.current = null
    const { x, v, sample } = k
    const flick = Date.now() - sample.t <= STALE && Math.abs(v) > FLICK
    if (Math.abs(x) > swipeThreshold || flick) step(x > 0 ? -1 : 1)
    setDragging(false)
    setDragX(0)
  }, [step, swipeThreshold])

  const gesture = drag({ begin, move, end, enabled: count > 1 })
  const settle = dragging || calm ? 'none' : SPRING

  return (
    <YStack
      data-slot="apple-carousel"
      role="region"
      aria-roledescription="carousel"
      aria-label="Cards"
      position="relative"
      width="100%"
      maxW={1152}
      mx="auto"
      px="$4"
      py="$6"
      tabIndex={0}
      onKeyDown={onKeyDown}
      onMouseEnter={() => setHovering(true)}
      onMouseLeave={() => setHovering(false)}
      {...sx(className)}
    >
      <XStack
        position="relative"
        width="100%"
        height={400}
        $md={{ height: 500 }}
        $lg={{ height: 600 }}
        items="center"
        justify="center"
      >
        {cards.map((card, i) => {
          const layer = layerAt(i - index, count, stackOffset, stackScale)
          const active = i === index
          const x = layer.x + (active ? dragX : 0)
          const parallax = active
            ? Math.max(-parallaxOffset, Math.min(parallaxOffset, (-dragX / 200) * parallaxOffset))
            : 0

          return (
            <YStack
              key={card.id}
              data-slot="apple-carousel-card"
              data-active={active || undefined}
              role="group"
              aria-roledescription="slide"
              aria-label={`${i + 1} of ${count}`}
              aria-hidden={!active || undefined}
              position="absolute"
              inset={0}
              pointerEvents={active ? 'auto' : 'none'}
              display={layer.visible ? 'flex' : 'none'}
              cursor={active ? (dragging ? 'grabbing' : 'grab') : undefined}
              style={{
                transform: `translateX(${x}px) scale(${layer.scale})`,
                opacity: layer.opacity,
                zIndex: layer.zIndex,
                transition: settle,
                // A sideways swipe is the card's; the page keeps vertical
                // scroll. Without this a touch browser takes the pan as a
                // scroll and cancels the pointer before the threshold.
                touchAction: 'pan-y',
                userSelect: 'none',
              }}
              {...(active ? gesture : null)}
            >
              <YStack
                position="relative"
                width="100%"
                height="100%"
                overflow="hidden"
                rounded="$6"
                borderWidth={1}
                borderColor="$borderColor"
                bg="$panel"
                shadowColor="rgba(0,0,0,0.25)"
                shadowOffset={{ width: 0, height: 25 }}
                shadowRadius={50}
                style={{ background: card.gradient }}
                {...sx(cardClassName)}
              >
                {card.image ? (
                  <YStack
                    position="absolute"
                    inset={0}
                    style={{
                      transform: `translateX(${parallax}px)`,
                      transition: dragging || calm ? 'none' : 'transform .2s ease',
                    }}
                  >
                    <Image src={card.image} alt={card.title} width="100%" height="100%" objectFit="cover" />
                    <YStack
                      position="absolute"
                      inset={0}
                      style={{ background: 'linear-gradient(to top, rgba(0,0,0,.6), rgba(0,0,0,.2), transparent)' }}
                    />
                  </YStack>
                ) : null}

                <YStack position="relative" justify="flex-end" height="100%" p="$6" $md={{ p: '$8' }} gap="$2">
                  {card.content ?? (
                    <>
                      <SizableText size="$9" fontWeight="700" color="white">
                        {card.title}
                      </SizableText>
                      {card.subtitle ? (
                        <SizableText size="$6" color={WHITE(0.8)}>
                          {card.subtitle}
                        </SizableText>
                      ) : null}
                      {card.description ? (
                        <SizableText size="$4" color={WHITE(0.7)} maxW={640}>
                          {card.description}
                        </SizableText>
                      ) : null}
                    </>
                  )}
                </YStack>
              </YStack>
            </YStack>
          )
        })}
      </XStack>

      {showArrows
        ? (
            [
              ['previous', 'Previous card', goPrevious, ChevronLeft, { left: 16 }],
              ['next', 'Next card', goNext, ChevronRight, { right: 16 }],
            ] as const
          ).map(([name, label, go, Chevron, side]) => (
            <XStack
              key={name}
              data-slot={`apple-carousel-${name}`}
              render={<button type="button" />}
              aria-label={label}
              position="absolute"
              display="none"
              $md={{ display: 'flex' }}
              style={{ top: '50%', transform: 'translateY(-50%)', zIndex: 20, ...side }}
              items="center"
              justify="center"
              width={ARROW}
              height={ARROW}
              rounded={999}
              {...glass(2)}
              bg={WHITE(0.1)}
              hoverStyle={{ bg: WHITE(0.2) }}
              borderWidth={1}
              borderColor={WHITE(0.2)}
              cursor="pointer"
              {...touch(ARROW, 44)}
              onClick={go}
            >
              <Chevron size={20} color="white" />
            </XStack>
          ))
        : null}

      {showDots ? (
        <XStack
          position="absolute"
          style={{ bottom: 16, left: '50%', transform: 'translateX(-50%)', zIndex: 20 }}
          gap="$2"
        >
          {cards.map((card, i) => (
            <XStack
              key={card.id}
              data-slot="apple-carousel-dot"
              render={<button type="button" />}
              aria-label={`Go to card ${i + 1}`}
              aria-current={i === index || undefined}
              data-active={i === index || undefined}
              height={8}
              width={i === index ? 32 : 8}
              rounded={999}
              bg={i === index ? 'white' : WHITE(0.4)}
              hoverStyle={{ bg: i === index ? 'white' : WHITE(0.6) }}
              cursor="pointer"
              style={{ transition: 'width .3s ease, background-color .3s ease' }}
              // Vertical slop only: the dots sit 8px apart, and a sideways
              // overlay would lie over the neighbour and take its press.
              {...touch(8, 44, 'y')}
              onClick={() => setIndex(i)}
            />
          ))}
        </XStack>
      ) : null}
    </YStack>
  )
}

/** Pre-built CSS gradients for cards that skip `image`. */
export const gradientPresets: Record<
  'sunset' | 'ocean' | 'fire' | 'forest' | 'galaxy' | 'aurora' | 'peach' | 'lavender',
  string
> = {
  sunset: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
  ocean: 'linear-gradient(135deg, #667eea 0%, #4ca1af 100%)',
  fire: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
  forest: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
  galaxy: 'linear-gradient(135deg, #7303c0 0%, #ec38bc 50%, #fdeff9 100%)',
  aurora: 'linear-gradient(135deg, #89f7fe 0%, #66a6ff 100%)',
  peach: 'linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%)',
  lavender: 'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)',
}
