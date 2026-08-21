// @vitest-environment jsdom

/**
 * The stylesheet guard must stay silent where CSS cannot load.
 *
 * jsdom loads no CSS, so a jest consumer's document holds no `<style>` and no
 * `<link>` — but the gui runtime inserts a sheet of its own while it is being
 * imported, and that sheet has NO owner element. The guard used to count
 * `document.styleSheets`, so that one entry made an unstyled document look
 * styled: every jest consumer that rendered `<Hanzo>` threw, naming a bundler
 * defect, about a stylesheet jsdom was never going to load.
 *
 * Owning is the thing that distinguishes them. A bundler that processed the CSS
 * emits an element; a runtime insert does not.
 */
import { renderToString } from 'react-dom/server'
import { expect, it } from 'vitest'

import { Hanzo } from './root'

it('stays silent when a sheet exists that no element owns', () => {
  // Exactly what the gui runtime leaves behind, and nothing else.
  Object.defineProperty(document, 'styleSheets', {
    configurable: true,
    get: () => [{ ownerNode: null }],
  })

  // Rendered on the SERVER, where a throw arrives here instead of being handled.
  // The guard latches before it throws, so a client render recovers on React's
  // automatic retry and the markup comes out correct either way — mounting is
  // the one way to run this that cannot see the bug.
  expect(() => renderToString(<Hanzo>ok</Hanzo>)).not.toThrow()
})
