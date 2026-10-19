// @vitest-environment jsdom

/**
 * The one Skeleton, on its compiled markup: hidden from assistive technology,
 * on the hover rung with 4px corners, sweeping on the shimmer handle (whose
 * duration styles/motion.css sets for a skeleton), the height presets, the
 * inline line box, still when asked, and class notation still read the way Box
 * reads it.
 */
import { describe, expect, it } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { GuiProvider } from '@hanzo/gui'

import config from '../../gui-config'
import { Skeleton, SKELETON_HEIGHT } from './skeleton'
import { Skeleton as ProductSkeleton } from '../../product/Skeleton'

const html = (node: React.ReactNode) =>
  renderToStaticMarkup(
    <GuiProvider config={config} defaultTheme="dark">
      {node}
    </GuiProvider>,
  )
const tag = (markup: string) => markup.match(/<[a-z0-9]+[^>]*data-slot="skeleton"[^>]*>/)?.[0] ?? ''

describe('Skeleton', () => {
  it('is scenery: aria-hidden, the hover rung, 4px corners, the sweep', () => {
    const el = tag(html(<Skeleton width={120} />))
    expect(el).toContain('aria-hidden')
    expect(el).toMatch(/_bg-hover/)
    expect(el).toMatch(/_btlr-c-radius-xs/)
    expect(el).toContain('data-motion="shimmer"')
  })

  it('takes the five height presets', () => {
    expect(SKELETON_HEIGHT).toEqual({ xs: 13, s: 16, m: 24, l: 32, xl: 40 })
    expect(tag(html(<Skeleton layout="block" size="m" />))).toMatch(/_height-24px/)
  })

  it('inline holds a zero-width line of text, so it is a line tall with no height', () => {
    const markup = html(<Skeleton />)
    expect(tag(markup)).toContain('data-layout="inline"')
    expect(markup).toContain('‌')
    // A stated height needs no line box.
    expect(html(<Skeleton height={8} />)).not.toContain('‌')
  })

  it('a still skeleton drops the sweep', () => {
    expect(tag(html(<Skeleton animated={false} />))).not.toContain('data-motion')
  })

  it('reads class notation, as the Box version did, and keeps a class it does not know', () => {
    const el = tag(html(<Skeleton className="h-4 w-32 my-thing" />))
    expect(el).toMatch(/_height-16px/)
    expect(el).toMatch(/_width-128px/)
    expect(el).toMatch(/my-thing/)
  })

  it('the product Skeleton is this one, a block by default, with its paragraph', () => {
    const one = tag(html(<ProductSkeleton width={120} />))
    expect(one).toContain('data-layout="block"')
    const text = html(<ProductSkeleton.Text lines={3} />)
    expect(text.match(/data-slot="skeleton"/g)).toHaveLength(3)
  })

  it('the loop duration reaches a skeleton’s sweep, and reduced motion stops it', () => {
    const css = readFileSync(join(__dirname, '../../styles/motion.css'), 'utf8')
    expect(css).toMatch(/\[data-slot='skeleton'\]\[data-motion='shimmer'\]\s*\{\s*animation-duration:\s*var\(--duration-loop/)
    const reduced = css.slice(css.lastIndexOf('@media (prefers-reduced-motion: reduce)'))
    expect(reduced).toContain("[data-slot='skeleton'][data-motion='shimmer']")
  })
})
