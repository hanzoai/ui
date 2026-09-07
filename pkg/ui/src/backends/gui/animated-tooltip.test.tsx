// @vitest-environment jsdom

/**
 * AnimatedTooltip mounts its panel only while hovered or focused, and the panel
 * carries the entrance animation class plus the requested delay. Asserted on a
 * live DOM, not on text, for the same reason `accordion.test.tsx` gives: gui
 * drops props it does not recognise with no error, so "it rendered" proves
 * nothing about behaviour.
 */
import { afterEach, describe, expect, it } from 'vitest'
import { act, cleanup, fireEvent, render } from '@testing-library/react'
import { GuiProvider } from '@hanzo/gui'

import config from '../../gui-config'
import { AnimatedTooltip } from './animated-tooltip'

afterEach(cleanup)

const mount = (node: React.ReactNode) =>
  render(
    <GuiProvider config={config} defaultTheme="dark">
      {node}
    </GuiProvider>,
  )

const frame = () => document.querySelector('[data-slot="animated-tooltip"]')
const panel = () => document.querySelector('[data-slot="animated-tooltip-panel"]')

describe('AnimatedTooltip', () => {
  it('starts hidden and closed', () => {
    mount(
      <AnimatedTooltip content="hi">
        <button>trigger</button>
      </AnimatedTooltip>,
    )
    expect(frame()?.getAttribute('data-state')).toBe('hidden')
    expect(panel()).toBeNull()
  })

  it('opens the panel on hover and closes it when the pointer leaves', () => {
    mount(
      <AnimatedTooltip content="hi">
        <button>trigger</button>
      </AnimatedTooltip>,
    )
    const el = frame()!

    act(() => void fireEvent.mouseEnter(el))
    expect(el.getAttribute('data-state')).toBe('visible')
    expect(panel()).not.toBeNull()
    expect(panel()!.getAttribute('role')).toBe('tooltip')

    act(() => void fireEvent.mouseLeave(el))
    expect(el.getAttribute('data-state')).toBe('hidden')
    expect(panel()).toBeNull()
  })

  // Focus lands on the TRIGGER, never on the frame, so the handler only counts
  // if the child's focusin reaches it.
  it('opens when the trigger takes keyboard focus and closes when it loses it', () => {
    mount(
      <AnimatedTooltip content="hi">
        <button>trigger</button>
      </AnimatedTooltip>,
    )
    const trigger = frame()!.querySelector('button')!

    act(() => void fireEvent.focus(trigger))
    expect(frame()!.getAttribute('data-state')).toBe('visible')
    expect(panel()).not.toBeNull()

    act(() => void fireEvent.blur(trigger))
    expect(frame()!.getAttribute('data-state')).toBe('hidden')
    expect(panel()).toBeNull()
  })

  it('carries the shared entrance keyframe and the requested delay', () => {
    mount(
      <AnimatedTooltip content="hi" delay={250}>
        <button>trigger</button>
      </AnimatedTooltip>,
    )
    act(() => void fireEvent.mouseEnter(frame()!))

    const el = panel()! as HTMLElement
    expect(el.classList).toContain('hz-fade-up')
    expect(el.style.animationDelay).toBe('250ms')
  })

  // `hz-fade-up` animates `transform` with fill-mode both, and an animated
  // property outranks every normal declaration, inline style included — so a
  // panel centred by translateX(-50%) lands half a width to the right and stays
  // there. Centring is layout: an anchor spans the trigger and aligns the panel.
  it('centres the panel by layout, never by a transform the keyframe owns', () => {
    mount(
      <AnimatedTooltip content="hi">
        <button>trigger</button>
      </AnimatedTooltip>,
    )
    act(() => void fireEvent.mouseEnter(frame()!))

    const el = panel()! as HTMLElement
    const anchor = el.parentElement!
    expect(anchor.getAttribute('data-slot')).toBe('animated-tooltip-anchor')
    for (const c of ['_pos-absolute', '_l-0px', '_r-0px', '_items-center'])
      expect(anchor.classList, c).toContain(c)
    expect([...el.classList].some((c) => c.startsWith('_tr-'))).toBe(false)
    expect(el.style.transform).toBe('')
  })

  it('sets the label at tooltip size on one line, as compiled style', () => {
    mount(
      <AnimatedTooltip content="hi">
        <button>trigger</button>
      </AnimatedTooltip>,
    )
    act(() => void fireEvent.mouseEnter(frame()!))

    const label = panel()!.querySelector('[data-slot="sizable-text"]')!
    expect(label.classList).toContain('_fs-f-size-1')
    expect(label.classList).toContain('_ws-nowrap')
    // A style prop gui does not know leaks as an attribute, silently.
    expect(document.querySelector('[whiteSpace]')).toBeNull()
  })

  it('renders a bare string child through a text host', () => {
    mount(
      <AnimatedTooltip content="hello there">
        <button>trigger</button>
      </AnimatedTooltip>,
    )
    act(() => void fireEvent.mouseEnter(frame()!))

    expect(panel()!.textContent).toBe('hello there')
    expect(panel()!.querySelector('[data-slot="sizable-text"]')?.textContent).toBe('hello there')
  })

  it('renders both trigger children and the panel content together while open', () => {
    mount(
      <AnimatedTooltip content="tip">
        <span>hover me</span>
      </AnimatedTooltip>,
    )
    const el = frame()!
    expect(el.textContent).toBe('hover me')

    act(() => void fireEvent.mouseEnter(el))
    expect(el.textContent).toBe('hover metip')
  })
})
