// @vitest-environment jsdom

/**
 * The Button is a REAL <button>, and it carries the `type` it is given.
 *
 * A form is submitted by an element the browser recognises as a submitter. A
 * <div role="button"> is not one: the click handler still runs, so the control
 * looks alive — hover, focus ring, the label, an onClick — while
 * `<form action=…>` never fires and nothing is sent. The failure is silent on
 * both sides, which is why it reached a checkout: the address step collected
 * every field correctly and then dropped the submit on the floor.
 *
 * `type` is the second half and it cannot be assumed from the first. The gui
 * frame declares `render: <button type="button" />`, so a plain <button> is not
 * enough on its own — the default is the one value that does NOT submit, and a
 * caller asking for `submit` has to win over it.
 *
 * Asserted on the SERVER-rendered markup, because that is the thing a browser
 * receives; a jsdom click would test our own handler rather than the element
 * the platform acts on.
 */
import { describe, expect, it } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'
import { GuiProvider } from '@hanzo/gui'

import config from '../../gui-config'
import { Button } from './button'

const html = (node: React.ReactNode) =>
  renderToStaticMarkup(
    <GuiProvider config={config} defaultTheme="light">
      {node}
    </GuiProvider>,
  )

/**
 * The tag of the control itself, found by its `data-slot`.
 *
 * Not the first element in the markup: a gui render begins with the injected
 * <style> block and the provider's display:contents wrappers, so reading the
 * root reports `style` and the assertion fails for a reason that has nothing to
 * do with the button.
 */
const controlOf = (markup: string): string =>
  (markup.match(/<([a-z0-9-]+)[^>]*data-slot="button"/i)?.[1] ?? '').toLowerCase()

/** The control's own opening tag, so `type` is read off the button and not a child. */
const openTag = (markup: string): string =>
  markup.match(/<[a-z0-9-]+[^>]*data-slot="button"[^>]*>/i)?.[0] ?? ''

describe('Button renders an element the browser can submit with', () => {
  it('is a <button>, not a styled div', () => {
    expect(controlOf(html(<Button>Continue to delivery</Button>))).toBe('button')
  })

  it('carries type="submit" when asked, rather than the frame default', () => {
    const markup = html(<Button type="submit">Continue to delivery</Button>)
    // The element FIRST: `type` on a <div> renders happily and submits nothing,
    // so asserting the attribute alone is a test that cannot fail.
    expect(controlOf(markup)).toBe('button')
    const tag = openTag(markup)
    expect(tag).toContain('type="submit"')
    expect(tag).not.toContain('type="button"')
  })

  it('still defaults to type="button", so a button in a form does not submit by accident', () => {
    expect(openTag(html(<Button>Add to cart</Button>))).toContain('type="button"')
  })
})
