// @vitest-environment jsdom

/**
 * The mark follows the brand — the white-label invariant, asserted.
 *
 * This component used to render Hanzo's lockup with the wordmark baked in, so
 * every brand-facing surface wrote its own rather than mount a mark that would
 * put the house H on a customer's console. Nothing caught it: a hardcoded brand
 * type-checks, renders, and looks right on exactly one host — the one a
 * developer is usually on.
 *
 * So these assert on the RENDERED markup per brand, which is the only place the
 * difference shows. The registry is the expected value rather than a
 * transcription of it: a test carrying its own copy of the geometry passes
 * while the canon moves underneath it, which is the failure this change removes.
 */
import type { ReactNode } from 'react'
import { describe, expect, it } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'
import { BRANDS, BRAND_MARKS } from '@hanzo/brand/registry'

import { BrandMark } from './BrandMark'
import { HanzoMark } from './HanzoMark'

const html = (node: ReactNode) => renderToStaticMarkup(node)

describe('BrandMark', () => {
  it('renders each brand its OWN mark, never the house one', () => {
    for (const id of ['lux', 'zoo', 'pars'] as const) {
      const markup = html(<BrandMark brand={id} animated={false} />)
      expect(markup).toContain(BRAND_MARKS[id].viewBox)
      expect(markup).toContain(`aria-label="${BRANDS[id].name}"`)
      // The house geometry must not appear on another brand's surface. Hanzo's
      // first path is distinctive enough to be a fingerprint.
      expect(markup).not.toContain('M22.21 67V44.6369H0V67H22.21Z')
      expect(markup).not.toContain('aria-label="Hanzo"')
    }
  })

  it('leaves a COLOUR mark its own fills', () => {
    // Zoo's mark is six clipped circles carrying intrinsic colour. Recoloring it
    // through `currentColor` publishes a logo Zoo does not publish, so the
    // component must not set fill at all when the registry flags it.
    const zoo = BRAND_MARKS.zoo
    expect(zoo.colored).toBe(true)
    const markup = html(<BrandMark brand="zoo" animated={false} color="#ff0000" />)
    expect(markup).not.toContain('fill="#ff0000"')
    expect(markup).not.toContain('fill="currentColor"')
  })

  it('lets a monochrome mark inherit, so it themes for free', () => {
    expect(BRAND_MARKS.lux.colored).toBeFalsy()
    expect(html(<BrandMark brand="lux" animated={false} />)).toContain('fill="currentColor"')
  })

  it('renders an app-supplied animated mark for a brand this package cannot carry', () => {
    // A brand's motion ships in that brand's own package; passing the getter is
    // what keeps every brand's bytes out of every brand's page.
    const markup = html(
      <BrandMark brand="lux" size={40} animated={() => '<svg viewBox="0 0 10 10"><circle/></svg>'} />,
    )
    expect(markup).toContain('<circle')
    expect(markup).toContain('width="100%"')
    expect(markup).toContain('aria-label="Lux"')
  })

  it('falls back to the static mark when a brand has no motion here', () => {
    // `animated` is the default, and only Hanzo's motion is a dependency of this
    // package — a lux surface must get its real mark, not an empty box.
    const markup = html(<BrandMark brand="lux" />)
    expect(markup).toContain(BRAND_MARKS.lux.viewBox)
  })

  it('HanzoMark is the registry geometry, not a transcription of it', () => {
    const markup = html(<HanzoMark />)
    expect(markup).toContain(BRAND_MARKS.hanzo.content.slice(0, 60))
    expect(markup).toContain('aria-label="Hanzo"')
  })
})
