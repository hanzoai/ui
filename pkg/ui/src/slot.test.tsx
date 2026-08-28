// @vitest-environment jsdom
/**
 * `Slot` becomes its child. The merge order is the contract.
 */
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it, vi } from 'vitest'

import { Slot } from './slot'

describe('the child is the element', () => {
  it('renders the child tag, not a wrapper', () => {
    expect(renderToStaticMarkup(<Slot className="btn"><a href="/x">go</a></Slot>))
      .toBe('<a href="/x" class="btn">go</a>')
  })

  it('joins classes, slot first, so the child wins the cascade', () => {
    expect(renderToStaticMarkup(<Slot className="a"><span className="b">x</span></Slot>))
      .toBe('<span class="a b">x</span>')
  })

  it('merges style with the child last', () => {
    const html = renderToStaticMarkup(
      <Slot style={{ color: 'red', margin: 0 }}><i style={{ color: 'blue' }}>x</i></Slot>,
    )
    expect(html).toContain('color:blue')
    expect(html).toContain('margin:0')
  })

  it('lets the child win every other prop', () => {
    expect(renderToStaticMarkup(<Slot id="mine"><b id="theirs">x</b></Slot>))
      .toBe('<b id="theirs">x</b>')
  })

  it('survives having no child rather than taking the page down', () => {
    // `asChild` on a component whose child has not resolved yet.
    expect(renderToStaticMarkup(<Slot className="x">{null}</Slot>)).toBe('')
  })
})

describe('both handlers run', () => {
  it('calls the slot first, then the child', () => {
    const order: string[] = []
    const mine = vi.fn(() => order.push('slot'))
    const theirs = vi.fn(() => order.push('child'))
    // Rendered to string, so reach the merged prop through cloneElement directly.
    const el = Slot({ onClick: mine, children: <button onClick={theirs} /> }) as React.ReactElement
    ;(el.props as { onClick: () => void }).onClick()
    expect(order).toEqual(['slot', 'child'])
  })
})
