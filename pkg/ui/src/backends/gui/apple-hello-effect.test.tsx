// @vitest-environment jsdom

/**
 * AppleHelloEffect renders one slot per letter, staggers their entrance
 * delay, lets `duration` and `text` be overridden, carries its own keyframe,
 * and delivers a `ref` to the frame node. Imports `./apple-hello-effect`
 * directly rather than the backend barrel, matching the sibling tests here.
 */
import { render } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'
import { GuiProvider } from '@hanzo/gui'

import config from '../../gui-config'
import { Hanzo } from '../../root'
import { AppleHelloEffect } from './apple-hello-effect'

const html = (node: React.ReactNode) =>
  renderToStaticMarkup(
    <GuiProvider config={config} defaultTheme="dark">
      {node}
    </GuiProvider>,
  )

/** Every letter element, tag through closing tag, in document order. */
const letters = (markup: string) =>
  [
    ...markup.matchAll(
      /<([a-z0-9]+)[^>]*data-slot="apple-hello-effect-letter"[^>]*>[^<]*<\/\1>/g,
    ),
  ].map((m) => m[0])

describe('AppleHelloEffect', () => {
  it('splits the default text into one letter per slot', () => {
    const markup = html(<AppleHelloEffect />)
    const wrapper = markup.match(/<[a-z0-9]+[^>]*data-slot="apple-hello-effect"[^>]*>/)?.[0] ?? ''

    expect(wrapper).not.toBe('')
    expect(letters(markup)).toHaveLength('Hello'.length)
  })

  it('renders a custom string with one slot per character, a space kept as a width', () => {
    const markup = html(<AppleHelloEffect text="Hi there" />)
    const spans = letters(markup)

    expect(spans).toHaveLength('Hi there'.length)
    // A plain space alone in a box collapses to nothing and the words run
    // together; a non-breaking one keeps the gap.
    expect(spans[2]).toContain('>\u00A0<')
  })

  it('staggers each letter by a tenth of a second and applies the given duration', () => {
    const markup = html(<AppleHelloEffect text="abcd" duration={3} />)
    const spans = letters(markup)

    expect(spans).toHaveLength(4)
    expect(spans[0]).toContain('animation-delay:0s')
    expect(spans[1]).toContain('animation-delay:0.1s')
    // 3 * 0.1 is 0.30000000000000004 in floating point; the delay is a tenth
    // by division so the fourth letter says 0.3s.
    expect(spans[3]).toContain('animation-delay:0.3s')
    for (const span of spans) expect(span).toContain('animation-duration:3s')
  })

  it('emits its keyframe once for any number of instances, with a reduced-motion rule', () => {
    const markup = html(
      <>
        <AppleHelloEffect />
        <AppleHelloEffect text="again" />
      </>,
    )

    expect(markup.match(/@keyframes hello-rise\b/g)).toHaveLength(1)
    expect(markup).toContain('translateY(50px)')
    expect(markup).toMatch(/prefers-reduced-motion: reduce[^}]*\{[^}]*apple-hello-effect-letter[^}]*animation: none/)
  })

  it('compiles its type to classes and never leaks a style prop as an attribute', () => {
    const markup = html(<AppleHelloEffect />)
    const [first] = letters(markup)

    expect(first).toContain('_fs-60px')
    expect(first).toContain('_lh-60px')
    for (const leak of ['font-size=', 'fontsize=', 'lineheight=', 'fontweight='])
      expect(markup, leak).not.toContain(leak)
  })

  it('forwards extra props to the wrapping frame', () => {
    const markup = html(<AppleHelloEffect data-testid="hero" />)

    expect(markup).toContain('data-testid="hero"')
  })

  it('delivers a ref to the frame node, whose direct children are the letters in order', () => {
    const got: HTMLDivElement[] = []
    render(
      <Hanzo>
        <AppleHelloEffect text="ab" ref={(el) => void (el && got.push(el))} />
      </Hanzo>,
    )
    const [frame] = got

    expect(frame?.dataset.slot).toBe('apple-hello-effect')
    expect(
      [...frame.querySelectorAll(':scope > [data-slot="apple-hello-effect-letter"]')].map(
        (el) => el.textContent,
      ),
    ).toEqual(['a', 'b'])
  })
})
