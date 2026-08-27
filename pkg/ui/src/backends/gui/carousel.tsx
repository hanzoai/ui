'use client'

/**
 * Carousel — a scroller the BROWSER pages.
 *
 * The slides are a grid row that overflows, and `scroll-snap-type: x mandatory`
 * is what makes a drag land on a slide instead of between two. That is the whole
 * mechanism: the platform does the paging, the momentum, the rubber-banding and
 * the pointer/touch/trackpad handling, and this file adds an index, two buttons
 * and a change event on top.
 *
 * The 5.x line did this with embla — 30kB to reimplement scrolling in JS, plus a
 * transform-based track that a screen reader reads as one long row and a
 * keyboard cannot tab through. Scroll-snap is the browser feature that replaced
 * the need for it, so the dependency goes and the accessibility comes back for
 * free: each slide is a real box at a real scroll offset.
 *
 * `CarouselApi` is a stable object that reads the LIVE dom on every call rather
 * than closing over a snapshot, so a caller may hold it across renders and slide
 * changes — which is what `setApi` exists for.
 */
import * as React from 'react'
import { ChevronLeft, ChevronRight } from '@hanzogui/lucide-icons-2'

import { Box } from '../../box'
import { cn } from '../../core/cn'
import { sx } from '../../sx'
import { Button } from './button'

export type CarouselOptions = {
  /** Past the last slide, go to the first — and the reverse. */
  loop?: boolean
}

/** What a caller can ask of a mounted carousel. */
export type CarouselApi = {
  /** Centre slide `index`. Out of range clamps, or wraps when `loop`. */
  scrollTo: (index: number) => void
  scrollPrev: () => void
  scrollNext: () => void
  /** The slide nearest the centre, or -1 when there are none. */
  selectedScrollSnap: () => number
  canScrollPrev: () => boolean
  canScrollNext: () => boolean
  slideCount: () => number
}

const slides = (el: HTMLElement): HTMLElement[] => Array.from(el.children) as HTMLElement[]

/**
 * The slide whose centre is nearest the scroller's.
 *
 * Dividing scrollLeft by a slide width would be shorter and would be wrong the
 * moment two slides differ in width — which they do as soon as one holds a
 * longer title. Measuring centres is right for any widths, including the last
 * slide, which cannot reach the middle and must still be reachable.
 */
const nearest = (el: HTMLElement): number => {
  const kids = slides(el)
  if (!kids.length) return -1
  const mid = el.scrollLeft + el.clientWidth / 2
  let best = 0
  let bestD = Infinity
  for (let i = 0; i < kids.length; i++) {
    const d = Math.abs(kids[i].offsetLeft + kids[i].offsetWidth / 2 - mid)
    if (d < bestD) {
      bestD = d
      best = i
    }
  }
  return best
}

type Ctx = {
  scroller: React.RefObject<HTMLElement | null>
  api: React.RefObject<CarouselApi | null>
  /** `null` until the scroller exists — on the server, and before mount. */
  selected: number | null
  loop: boolean
}

const CarouselCtx = /* @__PURE__ */ React.createContext<Ctx | null>(null)

const useCarousel = (): Ctx => {
  const c = React.useContext(CarouselCtx)
  if (!c) {
    // A CarouselItem is not named here: it reads nothing from this, and
    // demanding a parent it does not use would reject markup that works.
    throw new Error('CarouselContent, CarouselPrevious and CarouselNext must be inside a <Carousel>')
  }
  return c
}

export type CarouselProps = Omit<React.ComponentProps<typeof Box>, 'onSelect'> & {
  options?: CarouselOptions
  /** Handed the api once, on mount. */
  setApi?: (api: CarouselApi) => void
  /** Fires when the settled slide CHANGES — not on mount. */
  onCarouselSelect?: (api: CarouselApi) => void
}

export const Carousel = ({
  options,
  setApi,
  onCarouselSelect,
  className,
  children,
  ...props
}: CarouselProps) => {
  const scroller = React.useRef<HTMLElement | null>(null)
  const api = React.useRef<CarouselApi | null>(null)
  const [selected, setSelected] = React.useState<number | null>(null)
  const loop = !!options?.loop

  // Built once and never rebuilt: every method reads `scroller.current` at call
  // time, so the object stays correct as slides come and go.
  if (!api.current) {
    const el = () => scroller.current
    const count = () => {
      const e = el()
      return e ? slides(e).length : 0
    }
    const at = () => {
      const e = el()
      return e ? nearest(e) : -1
    }
    const go = (index: number) => {
      const e = el()
      if (!e) return
      const kids = slides(e)
      const n = kids.length
      if (!n) return
      const i = loop ? ((index % n) + n) % n : Math.max(0, Math.min(n - 1, index))
      const k = kids[i]
      // Centre it by setting scrollLeft rather than calling scrollIntoView,
      // which also scrolls every ancestor and would jump the PAGE to bring a
      // carousel deep in a document into view.
      e.scrollTo({ left: k.offsetLeft - (e.clientWidth - k.offsetWidth) / 2, behavior: 'smooth' })
    }
    api.current = {
      scrollTo: go,
      scrollPrev: () => go(at() - 1),
      scrollNext: () => go(at() + 1),
      selectedScrollSnap: at,
      canScrollPrev: () => loop || at() > 0,
      canScrollNext: () => loop || at() < count() - 1,
      slideCount: count,
    }
  }

  // Held in refs so an inline callback — which every call site writes — does not
  // re-run the effects on every render.
  const give = React.useRef(setApi)
  give.current = setApi
  const announce = React.useRef(onCarouselSelect)
  announce.current = onCarouselSelect

  React.useEffect(() => {
    if (api.current) give.current?.(api.current)
  }, [])

  React.useEffect(() => {
    const e = scroller.current
    if (!e) return
    // Where we already are. Published WITHOUT announcing: a carousel that fires
    // its select handler on mount tells a page the user chose the first slide
    // when all they did was load it — and in a shop that is a selected sku.
    //
    // Publishing it is also what wakes the arrows. Until this runs there is no
    // scroller to measure, so both are disabled; leaving `selected` at 0 from
    // the start would skip this render and they would STAY disabled — a
    // carousel whose only controls never enable, because the one thing that
    // enables them is the scrolling they exist to do.
    let last = nearest(e)
    setSelected(last)
    let frame = 0
    const read = () => {
      frame = 0
      const i = nearest(e)
      if (i === last) return
      last = i
      setSelected(i)
      if (api.current) announce.current?.(api.current)
    }
    // Scroll fires per frame during a drag; coalescing to one rAF keeps the
    // measuring off the critical path.
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(read)
    }
    e.addEventListener('scroll', onScroll, { passive: true })
    return () => {
      e.removeEventListener('scroll', onScroll)
      if (frame) cancelAnimationFrame(frame)
    }
  }, [])

  return (
    <CarouselCtx.Provider value={{ scroller, api, selected, loop }}>
      <Box
        className={cn('relative', className)}
        role="region"
        aria-roledescription="carousel"
        {...props}
      >
        {children}
      </Box>
    </CarouselCtx.Provider>
  )
}

/**
 * The scroller itself: one grid ROW, each slide a full-width column.
 *
 * `auto-cols-[100%]` is the page size. A slide narrower than the carousel wants
 * its own width instead, which is what `basis-*` on the item is for — the column
 * is the floor, not a cage.
 */
export const CarouselContent = ({ className, ...props }: React.ComponentProps<typeof Box>) => {
  const { scroller } = useCarousel()
  return (
    <Box
      ref={scroller as React.Ref<any>}
      className={cn(
        'hz-scroller grid grid-flow-col auto-cols-[100%] overflow-x-auto overflow-y-hidden snap-x',
        className,
      )}
      // Firefox spells scrollbar suppression as a property and WebKit as a
      // pseudo-element, so one lives here and the other in theme.css.
      style={{ scrollbarWidth: 'none' }}
      {...props}
    />
  )
}

export const CarouselItem = ({ className, ...props }: React.ComponentProps<typeof Box>) => (
  <Box
    role="group"
    aria-roledescription="slide"
    // `min-w-0` is what lets a long title wrap instead of widening the column.
    className={cn('snap-center min-w-0', className)}
    {...props}
  />
)

type ArrowProps = Omit<React.ComponentProps<typeof Button>, 'onPress' | 'onClick'>

/**
 * The two arrows.
 *
 * Disabled at the ends unless the carousel loops, because an arrow that does
 * nothing when pressed is worse than one that is visibly unavailable.
 */
const arrow = (
  name: string,
  side: string,
  Icon: typeof ChevronLeft,
  move: (a: CarouselApi) => void,
  can: (a: CarouselApi) => boolean,
) => {
  const Arrow = ({ className, ...props }: ArrowProps) => {
    // `selected` is not read for its value — it subscribes the arrow to slide
    // changes, which is what re-evaluates `can`. Without it an arrow disabled at
    // slide 0 stays disabled after the user drags away from it.
    const { api, selected } = useCarousel()
    // Before mount there is no scroller, so neither arrow can know whether it
    // has anywhere to go, and disabled is the honest answer.
    const live = selected === null ? null : api.current
    return (
      <Button
        variant="outline"
        size="icon"
        aria-label={name}
        disabled={live ? !can(live) : true}
        onClick={() => {
          if (api.current) move(api.current)
        }}
        // `sx`, not `className`. Box reads classes; a gui component does not —
        // it forwards `className` to the DOM untouched, where `absolute` is a
        // name no stylesheet serves. The arrows rendered, and sat in the flow
        // BELOW the carousel instead of over it.
        {...sx('absolute top-1/2 -translate-y-1/2 rounded-full', side, className)}
        {...props}
      >
        <Icon size={16} />
      </Button>
    )
  }
  Arrow.displayName = name
  return Arrow
}

export const CarouselPrevious = arrow(
  'Previous slide',
  'left-0',
  ChevronLeft,
  (a) => a.scrollPrev(),
  (a) => a.canScrollPrev(),
)

export const CarouselNext = arrow(
  'Next slide',
  'right-0',
  ChevronRight,
  (a) => a.scrollNext(),
  (a) => a.canScrollNext(),
)
