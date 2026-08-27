// @vitest-environment jsdom

/**
 * MediaStack's job is arithmetic and precedence: fit the media into the box it
 * was given, and pick the richest media the content has. Both are things that
 * look right on the day they are written and go wrong when a source resolution
 * changes, so both are measured here rather than eyeballed.
 */
import { describe, expect, it } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'
import { GuiProvider } from '@hanzo/gui'

import config from '../../gui-config'
import type { MediaStackDef } from '../../types'
import { MediaStack, fit } from './media-stack'

const html = (node: React.ReactNode) =>
  renderToStaticMarkup(
    <GuiProvider config={config as never} defaultTheme="dark">
      {node}
    </GuiProvider>,
  )

describe('fit — contain, not cover', () => {
  it('takes the limiting axis', () => {
    // Wide art in a square box is limited by WIDTH: 400/800 = 0.5.
    expect(fit({ w: 800, h: 400 }, { w: 400, h: 400 })).toEqual({ w: 400, h: 200 })
    // Tall art in the same box is limited by height.
    expect(fit({ w: 400, h: 800 }, { w: 400, h: 400 })).toEqual({ w: 200, h: 400 })
  })

  it('never crops — the fitted box is inside the constraint on both axes', () => {
    const to = { w: 250, h: 250 }
    for (const dim of [{ w: 1920, h: 1080 }, { w: 3, h: 97 }, { w: 640, h: 640 }]) {
      const d = fit(dim, to)
      expect(d.w).toBeLessThanOrEqual(to.w)
      expect(d.h).toBeLessThanOrEqual(to.h)
    }
  })

  it('keeps the aspect ratio it was given', () => {
    const d = fit({ w: 1920, h: 1080 }, { w: 700, h: 700 })
    expect(d.w / d.h).toBeCloseTo(1920 / 1080, 2)
  })

  it('scales against the CONSTRAINT, so a quarter-scale swatch is a quarter', () => {
    expect(fit({ w: 800, h: 800 }, { w: 400, h: 400 }, 0.25)).toEqual({ w: 100, h: 100 })
  })

  it('falls back to the constraint when the content states no dimensions', () => {
    // Content with no `dim` is a real state, and dividing by it would be NaN —
    // which reaches the DOM as `width="NaN"` and lays out at zero.
    expect(fit({ w: 0, h: 0 }, { w: 250, h: 250 })).toEqual({ w: 250, h: 250 })
    expect(fit(undefined as never, { w: 250, h: 250 })).toEqual({ w: 250, h: 250 })
  })
})

describe('MediaStack — the richest media the content has', () => {
  const img = { src: '/a.png', alt: 'A', dim: { w: 800, h: 400 } }
  const box = { w: 400, h: 400 }

  it('gives the element a real url', () => {
    // `src`, not `source` — gui forwards an unrecognised prop to the DOM, so
    // the react-native spelling reaches the browser as `source="[object
    // Object]"` and the image silently never loads.
    const m = html(<MediaStack media={{ img }} constrainTo={box} />)
    expect(m).toContain('src="/a.png"')
    expect(m).not.toContain('[object Object]')
  })

  it('renders the image at its FITTED size, not its natural one', () => {
    // 800x400 into a 400 box is 400x200. gui emits the size as a class rather
    // than an attribute, so the assertion is on the VALUE reaching the markup.
    const m = html(<MediaStack media={{ img }} constrainTo={box} />)
    expect(m).toContain('200px')
    expect(m).toContain('400px')
  })

  it('prefers a video when the content has one', () => {
    const media: MediaStackDef = {
      img,
      video: { sources: ['/a.webm'], poster: '/p.png', dim: { md: { w: 800, h: 800 } } },
    }
    const m = html(<MediaStack media={media} constrainTo={box} />)
    expect(m).toContain('<video')
    expect(m).toContain('/a.webm')
    expect(m).not.toContain('/a.png')
  })

  it('a video with no sources is not a video, and the image still shows', () => {
    // Content half-authored — the field exists, the files do not. Rendering an
    // empty <video> would leave a black rectangle where the art was.
    const media = { img, video: { sources: [], dim: { md: { w: 8, h: 8 } } } } as MediaStackDef
    const m = html(<MediaStack media={media} constrainTo={box} />)
    expect(m).not.toContain('<video')
    expect(m).toContain('/a.png')
  })

  it('reserves the constraint even with nothing to show', () => {
    // An item whose art has not landed must still occupy its cell, or the grid
    // around it reflows when the art arrives.
    const m = html(<MediaStack media={{}} constrainTo={box} />)
    expect(m).toMatch(/width:\s*400px/)
    expect(m).toMatch(/height:\s*400px/)
  })

  it('names the file when the content forgot the alt text', () => {
    const m = html(<MediaStack media={{ img: { src: '/x/hat.png', dim: { w: 10, h: 10 } } }} constrainTo={box} />)
    expect(m).toContain('alt="hat.png"')
  })

  it('honours an explicitly empty alt, which means decorative', () => {
    const m = html(<MediaStack media={{ img: { ...img, alt: '' } }} constrainTo={box} />)
    expect(m).toContain('alt=""')
  })
})
