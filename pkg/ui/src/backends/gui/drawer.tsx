'use client'

/**
 * Drawer — a sheet that comes up from the bottom and rests at chosen heights.
 *
 * A snap point IS a height: `'72px'` for a peek, `'620px'` for the whole thing,
 * or a number for a fraction of the viewport. The sheet is always rendered at
 * its TALLEST point and slid down to the active one, so its content has a
 * stable box and does not reflow every time it moves — a cart that re-lays-out
 * mid-drag is the thing this shape is avoiding.
 *
 * Dragging moves that same offset, so the release is a straight question: which
 * point is the sheet nearest now. Dragged below the shortest point it closes,
 * because a sheet flicked away should go away.
 */
import * as React from 'react'

import { Box } from '../../box'
import { cn } from '../../core/cn'

/** A height: `'620px'`, or a fraction of the viewport. */
export type SnapPoint = number | string

export type DrawerProps = React.PropsWithChildren<{
  open?: boolean
  onOpenChange?: (open: boolean) => void
  /** Blocks the page behind it and dims it. */
  modal?: boolean
  snapPoints?: SnapPoint[]
  /** `null` is "not decided yet", which a store holding this can be. */
  activeSnapPoint?: SnapPoint | null
  setActiveSnapPoint?: (point: SnapPoint) => void
  /**
   * The sheet was dismissed by a GESTURE — dragged or flicked below its
   * shortest point — as opposed to closed by the app. Worth telling apart: one
   * is the person saying no, the other is the flow moving on.
   */
  handleCloseGesture?: () => void
  /** Only the handle starts a drag — so the content can scroll. */
  dragHandleOnly?: boolean
  /** A fast flick goes to the far end rather than the next point along. */
  fastDragSkipsToEnd?: boolean
  /** A click on the handle, as opposed to a drag. */
  handleHandleClicked?: () => void
  /** Widen the handle's grab area past its drawn size. */
  extendHandleDragRegion?: boolean
}>

type Ctx = Required<Pick<DrawerProps, 'modal' | 'dragHandleOnly' | 'fastDragSkipsToEnd' | 'extendHandleDragRegion'>> & {
  open: boolean
  heights: number[]
  active: number
  onOpenChange?: (open: boolean) => void
  snapTo: (px: number) => void
  handleHandleClicked?: () => void
  drag: (start: React.PointerEvent) => void
  offset: number
  dragging: boolean
}

const DrawerCtx = /* @__PURE__ */ React.createContext<Ctx | null>(null)

const useDrawer = (): Ctx => {
  const c = React.useContext(DrawerCtx)
  if (!c) throw new Error('DrawerContent and DrawerHandle must be inside a <Drawer>')
  return c
}

/** A snap point in pixels. A number is a fraction of the viewport. */
const px = (p: SnapPoint, viewport: number): number =>
  typeof p === 'number' ? p * viewport : parseFloat(p) || 0

/** A flick: fast enough that where it was pointing matters more than where it stopped. */
const FLICK = 0.5 // px per ms

export const Drawer = ({
  open = false,
  onOpenChange,
  modal = true,
  snapPoints,
  activeSnapPoint,
  setActiveSnapPoint,
  dragHandleOnly = false,
  fastDragSkipsToEnd = true,
  handleHandleClicked,
  handleCloseGesture,
  extendHandleDragRegion = false,
  children,
}: DrawerProps) => {
  // The viewport is only known in a browser, and a fractional snap point needs
  // it. Zero on the server means those resolve to zero and the sheet renders
  // closed, which is the right thing to send.
  const [viewport, setViewport] = React.useState(0)
  React.useEffect(() => {
    const read = () => setViewport(window.innerHeight)
    read()
    window.addEventListener('resize', read)
    return () => window.removeEventListener('resize', read)
  }, [])

  const points = snapPoints?.length ? snapPoints : [1]
  const heights = points.map((p) => px(p, viewport))
  const tallest = Math.max(...heights, 0)

  const activePx =
    activeSnapPoint !== undefined && activeSnapPoint !== null
      ? px(activeSnapPoint, viewport)
      : tallest

  const [offset, setOffset] = React.useState(0)
  const [dragging, setDragging] = React.useState(false)

  const snapTo = (target: number) => {
    let best = heights[0]
    for (const h of heights) if (Math.abs(h - target) < Math.abs(best - target)) best = h
    // Below the shortest point by more than half of it, this is a dismissal.
    if (target < Math.min(...heights) / 2) {
      handleCloseGesture?.()
      onOpenChange?.(false)
      return
    }
    const i = heights.indexOf(best)
    setActiveSnapPoint?.(points[i])
  }

  const drag = (start: React.PointerEvent) => {
    const from = start.clientY
    const began = start.timeStamp
    const el = start.currentTarget as HTMLElement
    el.setPointerCapture?.(start.pointerId)
    setDragging(true)

    const move = (e: PointerEvent) => {
      // Down is positive, and down SHRINKS the sheet.
      setOffset(Math.max(0, e.clientY - from))
    }
    const up = (e: PointerEvent) => {
      el.releasePointerCapture?.(start.pointerId)
      document.removeEventListener('pointermove', move)
      document.removeEventListener('pointerup', up)
      setDragging(false)
      setOffset(0)
      const travelled = e.clientY - from
      const speed = Math.abs(travelled) / Math.max(1, e.timeStamp - began)
      if (fastDragSkipsToEnd && speed > FLICK) {
        // A flick goes all the way in the direction it was thrown.
        snapTo(travelled > 0 ? 0 : tallest)
        return
      }
      snapTo(activePx - travelled)
    }
    document.addEventListener('pointermove', move)
    document.addEventListener('pointerup', up)
  }

  return (
    <DrawerCtx.Provider
      value={{
        open,
        modal,
        heights,
        active: activePx,
        onOpenChange,
        snapTo,
        handleHandleClicked,
        dragHandleOnly,
        fastDragSkipsToEnd,
        extendHandleDragRegion,
        drag,
        offset,
        dragging,
      }}
    >
      {children}
    </DrawerCtx.Provider>
  )
}

/**
 * The grab bar.
 *
 * 44px of grab area around a 4px bar when `extendHandleDragRegion` is on: the
 * drawn size is a visual, and a target the size of the visual is one a thumb
 * misses.
 */
export const DrawerHandle = ({ className, ...props }: React.ComponentProps<typeof Box>) => {
  const { drag, handleHandleClicked, extendHandleDragRegion } = useDrawer()
  return (
    <Box
      role="separator"
      aria-orientation="horizontal"
      aria-label="Resize"
      className={cn('grid place-items-center cursor-grab', className)}
      style={{
        paddingBlock: extendHandleDragRegion ? 20 : 8,
        touchAction: 'none',
      }}
      onPointerDown={drag}
      onClick={handleHandleClicked}
      {...props}
    >
      <Box className="rounded-full bg-muted" style={{ width: 48, height: 4 }} />
    </Box>
  )
}

export type DrawerContentProps = React.ComponentProps<typeof Box> & {
  /** The sheet draws its own handle unless the caller draws one. */
  defaultHandle?: boolean
  /**
   * Fires as the sheet takes focus. `preventDefault()` leaves focus where it
   * was — which is what a sheet that opens beside a form the person is still
   * typing in wants.
   */
  onOpenAutoFocus?: (e: Event) => void
}

export const DrawerContent = ({
  className,
  children,
  defaultHandle = true,
  onOpenAutoFocus,
  ...props
}: DrawerContentProps) => {
  const { open, modal, heights, active, offset, dragging, onOpenChange, dragHandleOnly, drag } =
    useDrawer()

  // A modal sheet that does not take focus leaves the keyboard behind it, on
  // a page the sheet is covering. Held in a ref so an inline handler does not
  // re-run this on every render.
  const panel = React.useRef<HTMLElement | null>(null)
  const announce = React.useRef(onOpenAutoFocus)
  announce.current = onOpenAutoFocus
  React.useEffect(() => {
    if (!open) return
    const e = new Event('openAutoFocus', { cancelable: true })
    announce.current?.(e)
    if (!e.defaultPrevented) panel.current?.focus()
  }, [open])

  if (!open) return null
  const tallest = Math.max(...heights, 0)
  // Rendered at its tallest and slid down to the active point, so the content
  // keeps one box whatever height the sheet is resting at.
  const down = Math.max(0, tallest - active) + offset

  return (
    <>
      {modal && (
        <Box
          // The scrim is not a control and must not be in the tab order, but it
          // does dismiss — which is why the sheet also closes on Escape below.
          aria-hidden="true"
          onClick={() => onOpenChange?.(false)}
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.5)', zIndex: 50 }}
        />
      )}
      <Box
        ref={panel as React.Ref<any>}
        role="dialog"
        aria-modal={modal}
        // Focusable but not tabbable: the sheet itself is the focus target when
        // it opens, and the tab order inside it belongs to its contents.
        tabIndex={-1}
        className={cn('bg-background', className)}
        style={{
          position: 'fixed',
          left: 0,
          right: 0,
          bottom: 0,
          height: tallest || undefined,
          transform: `translateY(${down}px)`,
          // No transition WHILE dragging, or the sheet lags the thumb.
          transition: dragging ? 'none' : 'transform .3s cubic-bezier(.32,.72,0,1)',
          touchAction: 'none',
          zIndex: 50,
        }}
        onPointerDown={dragHandleOnly ? undefined : drag}
        onKeyDown={(e: React.KeyboardEvent) => {
          if (e.key === 'Escape') onOpenChange?.(false)
        }}
        {...props}
      >
        {defaultHandle && <DrawerHandle />}
        {children}
      </Box>
    </>
  )
}
