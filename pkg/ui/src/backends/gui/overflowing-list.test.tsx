// @vitest-environment jsdom

/**
 * OverflowingList's arithmetic is `fit`: what fits in the row with room left
 * for the count, at least one, at most the cap. The markup renders every item
 * once in an unseen measuring copy and the fitted ones in the row.
 */
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { GuiProvider } from '@hanzo/gui'

import config from '../../gui-config'
import { OverflowingList, fit } from './overflowing-list'

const html = (node: React.ReactNode) =>
  renderToStaticMarkup(<GuiProvider config={config} defaultTheme="dark">{node}</GuiProvider>)

describe('fit', () => {
  it('everything, when everything fits', () => {
    expect(fit([40, 40, 40], 200)).toBe(3)
  })

  it('stops where the next item would push the count out', () => {
    // 40 + 4 + 40 = 84; a third (84+4+40=128) plus the count (4+24) is 156 > 140.
    expect(fit([40, 40, 40, 40], 140)).toBe(2)
  })

  it('the last item needs no room for a count', () => {
    expect(fit([40, 40], 84)).toBe(2)
  })

  it('always one, which may shrink', () => {
    expect(fit([400, 40], 100)).toBe(1)
  })

  it('never more than the cap', () => {
    expect(fit([10, 10, 10, 10], 1000, 2)).toBe(2)
    expect(fit([], 100)).toBe(0)
  })
})

describe('OverflowingList', () => {
  it('measures every item once, unseen, and shows the cap before measuring', () => {
    const markup = html(
      <OverflowingList maxInlineCount={2} showOverflowCount="always">
        {['a', 'b', 'c'].map((t) => (
          <b key={t}>{t}</b>
        ))}
      </OverflowingList>,
    )
    expect(markup.split('<b>').length - 1).toBe(3 + 2)
    expect(markup).toContain('+1')
    expect(markup).toContain('aria-label="Show all items (3)"')
  })

  it('never: no count at all', () => {
    const markup = html(
      <OverflowingList maxInlineCount={1} showOverflowCount="never">
        {['a', 'b'].map((t) => (
          <b key={t}>{t}</b>
        ))}
      </OverflowingList>,
    )
    expect(markup).not.toContain('overflowing-list-count')
  })
})
