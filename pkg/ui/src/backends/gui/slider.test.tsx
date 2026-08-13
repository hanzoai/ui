// @vitest-environment jsdom

/**
 * The Slider's ACCESSIBLE NAME, asserted on the compiled markup.
 *
 * gui renders `role="slider"` on the Thumb, not on the root the caller's props
 * were spread onto — so this component shipped every `aria-label` to a plain
 * container and the control announced as unnamed. A render test that only
 * checks the label is PRESENT passes on the broken version, because the label
 * really is in the document; it is on the wrong node. So every assertion here
 * names the element the attribute landed on.
 *
 * Imports `./slider` directly rather than the backend barrel: a test for one
 * component should not fail because a different one's dependency moved.
 */
import { describe, expect, it } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'
import { GuiProvider } from '@hanzo/gui'

import config from '../../gui-config'
import { Slider, named } from './slider'

const html = (node: React.ReactNode) =>
  renderToStaticMarkup(
    <GuiProvider config={config} defaultTheme="dark">
      {node}
    </GuiProvider>,
  )

/** The one open tag carrying `role="slider"` — the element a reader announces. */
const thumb = (markup: string) => markup.match(/<[a-z]+[^>]*role="slider"[^>]*>/)?.[0] ?? ''

/** Every open tag, so a claim can be made about where an attribute is NOT. */
const carriers = (markup: string, attr: string) =>
  [...markup.matchAll(/<[a-z]+[^>]*>/g)].map((m) => m[0]).filter((t) => t.includes(attr))

describe('named', () => {
  it('routes the four ARIA naming properties and keeps everything else', () => {
    const { name, rest } = named({
      'aria-label': 'Volume',
      'aria-labelledby': 'x',
      'aria-describedby': 'y',
      'aria-valuetext': '30 percent',
      max: 100,
      disabled: true,
      onValueChange: 'fn',
    })
    expect(Object.keys(name).sort()).toEqual([
      'aria-describedby',
      'aria-label',
      'aria-labelledby',
      'aria-valuetext',
    ])
    expect(Object.keys(rest).sort()).toEqual(['disabled', 'max', 'onValueChange'])
  })

  it('is a total split — no prop is dropped and none is duplicated', () => {
    const props = { 'aria-label': 'a', max: 1, step: 2, orientation: 'vertical' }
    const { name, rest } = named(props)
    expect([...Object.keys(name), ...Object.keys(rest)].sort()).toEqual(Object.keys(props).sort())
  })
})

describe('Slider', () => {
  it('puts the accessible name on the element that carries role=slider', () => {
    const markup = html(<Slider aria-label="Volume" defaultValue={[30]} max={100} />)
    expect(thumb(markup)).toContain('aria-label="Volume"')
  })

  it('does not leave the name on the root, where nothing announces it', () => {
    const markup = html(<Slider aria-label="Volume" defaultValue={[30]} max={100} />)
    // Exactly one element may claim the name, and it is the thumb.
    const labelled = carriers(markup, 'aria-label="Volume"')
    expect(labelled).toHaveLength(1)
    expect(labelled[0]).toContain('role="slider"')
  })

  it('leaves value and range on the root, where gui reads them', () => {
    const markup = html(<Slider aria-label="Volume" defaultValue={[30]} max={100} />)
    expect(thumb(markup)).toContain('aria-valuenow="30"')
    expect(thumb(markup)).toContain('aria-valuemax="100"')
  })

  it('still renders track, range and thumb slots', () => {
    const markup = html(<Slider defaultValue={[50]} max={100} />)
    for (const s of ['slider', 'slider-track', 'slider-range', 'slider-thumb']) {
      expect(markup).toContain(`data-slot="${s}"`)
    }
  })
})
