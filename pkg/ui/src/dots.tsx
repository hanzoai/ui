'use client'

/**
 * Dots — anything, sampled onto a grid of dots.
 *
 * A halftone screen: divide a surface into cells, measure how bright the source
 * is at each cell, and draw a dot whose radius carries that measurement. It is
 * the oldest trick in reproduction and it still reads as considered, because the
 * grid is regular and only the ink varies.
 *
 * Three sources, one mechanism. Whatever it is gets rasterised once into an
 * offscreen canvas, then read back per cell — so an image, a word and a moving
 * field all take the same path and there is one place the sampling happens:
 *
 *   <Dots src="/hero.png" />              a picture
 *   <Dots text="Ship Apps." />            type
 *   <Dots field={(x, y, t) => …} />       a function of space and time
 *
 * With none of them it draws the default field, a slow diagonal swell, which is
 * the ambient case a page usually wants behind a headline.
 *
 * WEB ONLY, and off the barrel deliberately. `2d` canvas has no counterpart on
 * React Native, and this package's promise is that a root import runs on native
 * — so putting this in the barrel would make that false for every consumer. It
 * lives at `@hanzo/ui/dots`, the same quarantine `product/theme-toggle-next`
 * uses for its Next dependency: a caller reaches for it on purpose.
 *
 * It renders the canvas during SSR and paints in an effect, so a static export
 * ships a correctly-sized element and no layout moves when the paint lands.
 */
import { useEffect, useRef } from 'react'

/** Brightness at a point, 0 (dark, no dot) to 1 (full dot). `t` is seconds. */
export type Field = (x: number, y: number, t: number) => number

export interface DotsProps {
  /** An image to sample. Same-origin or CORS-enabled — a tainted canvas cannot be read back. */
  src?: string
  /** Type to sample. Uses the page's own sans stack, so it matches the brand. */
  text?: string
  /** A function of space and time. `x` and `y` are 0..1; `t` is seconds. */
  field?: Field
  /** Cell pitch in CSS pixels. Smaller is finer and costs more. */
  cell?: number
  /** The ink. Any CSS colour; defaults to the current text colour. */
  color?: string
  /** Animate. A `field` moves; an image or text holds still, so this is ignored for them. */
  animate?: boolean
  /**
   * Dissolve the field at its edges instead of ending it on a line.
   *
   * `true` fades all four sides. An object fades only the sides named, each
   * value being the fraction of that axis the fade occupies (`0.2` = the outer
   * fifth). A field that stops abruptly reads as a rectangle someone pasted on;
   * one that dissolves reads as part of the page.
   *
   * This is a mask, not a second overlaid element, so nothing has to be kept in
   * sync with the canvas and the page background shows through exactly.
   * Asymmetric values are the useful case: hold the field back where type sits
   * and let it run where the page is empty.
   */
  fade?: boolean | { top?: number; bottom?: number; left?: number; right?: number }
  className?: string
  style?: React.CSSProperties
}

/** The default: a diagonal swell, slow enough to read as atmosphere. */
const SWELL: Field = (x, y, t) => {
  const d = (x + y) * 2.2 - t * 0.18
  // Two waves at different rates so the pattern does not visibly repeat.
  const v = Math.sin(d * Math.PI) * 0.5 + Math.sin(d * Math.PI * 0.37 + 1.7) * 0.5
  return Math.max(0, v) ** 1.6
}

/** The two gradients a `fade` compiles to — one per axis, intersected. */
const dissolve = (fade: DotsProps['fade']): string | undefined => {
  if (!fade) return undefined
  const f = fade === true ? { top: 0.2, bottom: 0.2, left: 0.2, right: 0.2 } : fade
  const stop = (n?: number) => Math.max(0, Math.min(0.5, n ?? 0))
  const axis = (a: number, b: number, dir: string) =>
    a || b
      ? `linear-gradient(to ${dir}, ${a ? 'transparent' : '#fff'}, #fff ${(a * 100).toFixed(1)}%, ` +
        `#fff ${((1 - b) * 100).toFixed(1)}%, ${b ? 'transparent' : '#fff'})`
      : null
  return [axis(stop(f.top), stop(f.bottom), 'bottom'), axis(stop(f.left), stop(f.right), 'right')]
    .filter(Boolean)
    .join(', ')
}

const Dots = ({
  src,
  text,
  field,
  cell = 6,
  color,
  animate = true,
  fade,
  className,
  style,
}: DotsProps) => {
  const ref = useRef<HTMLCanvasElement | null>(null)

  useEffect(() => {
    const canvas = ref.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // The ink follows the cascade unless told otherwise, so a Dots inside a
    // themed section is that theme's colour without anyone passing it down.
    const ink = color ?? getComputedStyle(canvas).color

    // Motion is a preference before it is a prop. A field that animates against
    // an explicit "reduce" setting is the kind of thing nobody notices shipping.
    const still =
      !animate ||
      (typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches)

    // The offscreen surface the source is rasterised into, at CELL resolution —
    // one pixel per cell. Sampling a full-resolution bitmap per cell would read
    // one arbitrary pixel out of many; letting the browser downscale into this
    // buffer averages the cell for free, which is what a halftone wants.
    const grid = document.createElement('canvas')
    const gctx = grid.getContext('2d', { willReadFrequently: true })
    if (!gctx) return

    let raf = 0
    let stop = false
    let image: HTMLImageElement | null = null
    const started = performance.now()

    /** Rasterise the source into `grid` at cols×rows, then draw dots from it. */
    const paint = (t: number) => {
      const dpr = Math.min(2, devicePixelRatio || 1)
      const w = canvas.clientWidth
      const h = canvas.clientHeight
      if (w < 1 || h < 1) return

      if (canvas.width !== Math.round(w * dpr)) {
        canvas.width = Math.round(w * dpr)
        canvas.height = Math.round(h * dpr)
      }
      const cols = Math.max(1, Math.floor(w / cell))
      const rows = Math.max(1, Math.floor(h / cell))
      grid.width = cols
      grid.height = rows

      if (image) {
        // `drawImage` into a cols×rows buffer IS the downscale — cover-fit so a
        // source of any ratio fills without distorting.
        const s = Math.max(cols / image.width, rows / image.height)
        const iw = image.width * s
        const ih = image.height * s
        gctx.clearRect(0, 0, cols, rows)
        gctx.drawImage(image, (cols - iw) / 2, (rows - ih) / 2, iw, ih)
      } else if (text) {
        gctx.clearRect(0, 0, cols, rows)
        gctx.fillStyle = '#fff'
        gctx.textAlign = 'center'
        gctx.textBaseline = 'middle'
        // Fit the word to the buffer: measure at a known size, then scale.
        const probe = 64
        gctx.font = `700 ${probe}px ${getComputedStyle(canvas).fontFamily}`
        const width = gctx.measureText(text).width || 1
        const size = Math.min((probe * cols * 0.92) / width, rows * 0.8)
        gctx.font = `700 ${size}px ${getComputedStyle(canvas).fontFamily}`
        gctx.fillText(text, cols / 2, rows / 2)
      }

      const sampled = image || text ? gctx.getImageData(0, 0, cols, rows).data : null
      const fn = field ?? (sampled ? null : SWELL)

      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      ctx.clearRect(0, 0, w, h)
      ctx.fillStyle = ink

      const max = cell * 0.5
      for (let row = 0; row < rows; row++) {
        for (let col = 0; col < cols; col++) {
          let v: number
          if (sampled) {
            const i = (row * cols + col) * 4
            // Luminance, weighted by alpha so transparent areas carry no ink.
            const a = sampled[i + 3] / 255
            v =
              ((sampled[i] * 0.2126 + sampled[i + 1] * 0.7152 + sampled[i + 2] * 0.0722) / 255) * a
          } else {
            v = fn!(col / cols, row / rows, t)
          }
          if (v <= 0.02) continue
          const r = Math.min(max, max * Math.min(1, v))
          ctx.beginPath()
          ctx.arc(col * cell + cell / 2, row * cell + cell / 2, r, 0, Math.PI * 2)
          ctx.fill()
        }
      }
    }

    const frame = () => {
      if (stop) return
      paint((performance.now() - started) / 1000)
      raf = requestAnimationFrame(frame)
    }

    const start = () => {
      // A still source is painted once. Only a field needs a loop, and only when
      // motion is allowed — an rAF that redraws an unchanging image is a battery
      // cost with nothing on screen to show for it.
      if (!still && !image && !text) frame()
      else paint(0)
    }

    if (src) {
      image = new Image()
      image.crossOrigin = 'anonymous'
      image.onload = start
      image.src = src
    } else {
      start()
    }

    // Re-rasterise on resize: the cell count changes with the box, so a fixed
    // buffer would stretch rather than re-sample.
    const ro = new ResizeObserver(() => {
      if (still || image || text) paint(0)
    })
    ro.observe(canvas)

    return () => {
      stop = true
      cancelAnimationFrame(raf)
      ro.disconnect()
      if (image) image.onload = null
    }
  }, [src, text, field, cell, color, animate])

  const mask = dissolve(fade)
  return (
    <canvas
      ref={ref}
      data-slot="dots"
      className={className}
      style={{
        display: 'block',
        width: '100%',
        height: '100%',
        // Both spellings: WebKit still wants the prefix for mask-composite, and
        // a single unprefixed declaration silently drops the second gradient on
        // Safari — which reads as "the fade only works on one axis".
        ...(mask
          ? {
              WebkitMaskImage: mask,
              maskImage: mask,
              WebkitMaskComposite: 'source-in',
              maskComposite: 'intersect',
            }
          : null),
        ...style,
      }}
    />
  )
}

export { Dots, SWELL }
