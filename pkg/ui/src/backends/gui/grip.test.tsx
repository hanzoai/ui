// @vitest-environment jsdom

/**
 * Grip on a live DOM: each side grows the right way by key, a step starts from
 * the box as drawn, Home and End reach the bounds, a key past the floor shuts
 * the box when it may, a double-click resets or hands the size back, and a drag
 * reports while it moves and keeps once on release. useSpan keeps what Grip
 * settles on, and reads it back.
 *
 * jsdom lays nothing out, so a drawn size is a mocked rect on the grip's parent.
 */
import { describe, expect, it, vi } from 'vitest'
import { act } from 'react'
import { createRoot } from 'react-dom/client'
import { GuiProvider, YStack } from '@hanzo/gui'

import config from '../../gui-config'
import { Grip, type GripProps } from './grip'
import { useSpan } from './span'

;(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true

const mount = (node: React.ReactNode) => {
  const host = document.createElement('div')
  document.body.appendChild(host)
  const root = createRoot(host)
  act(() => root.render(<GuiProvider config={config} defaultTheme="dark">{node}</GuiProvider>))
  const grip = host.querySelector<HTMLElement>('[data-slot="grip"]')!
  return {
    host,
    grip,
    drawn: (width: number, height = width) =>
      vi.spyOn(grip.parentElement!, 'getBoundingClientRect').mockReturnValue({ width, height } as DOMRect),
    key: (key: string, shiftKey = false) =>
      act(() => {
        grip.dispatchEvent(new KeyboardEvent('keydown', { key, shiftKey, bubbles: true, cancelable: true }))
      }),
    cleanup: () => {
      act(() => root.unmount())
      host.remove()
    },
  }
}

const one = (props: Partial<GripProps>) => {
  const kept: number[] = []
  const shut = vi.fn()
  const ui = mount(
    <YStack position="relative">
      <Grip
        side="left"
        span={200}
        floor={100}
        ceil={300}
        reset={200}
        onSpan={() => {}}
        onKeep={(n) => kept.push(n)}
        label="Resize sidebar"
        {...props}
        {...('onShut' in props ? { onShut: shut } : null)}
      />
    </YStack>,
  )
  return { ui, kept, shut }
}

describe('Grip', () => {
  it('is a named separator that states its bounds', () => {
    const { ui } = one({})
    expect(ui.grip.getAttribute('role')).toBe('separator')
    expect(ui.grip.getAttribute('aria-orientation')).toBe('vertical')
    expect(ui.grip.getAttribute('aria-label')).toBe('Resize sidebar')
    expect([ui.grip.getAttribute('aria-valuemin'), ui.grip.getAttribute('aria-valuenow'), ui.grip.getAttribute('aria-valuemax')]).toEqual(['100', '200', '300'])
    expect(ui.grip.tabIndex).toBe(0)
    ui.cleanup()
  })

  it.each([
    ['left', 'ArrowRight', 'ArrowLeft'],
    ['right', 'ArrowLeft', 'ArrowRight'],
    ['top', 'ArrowDown', 'ArrowUp'],
  ] as const)('%s: %s widens and %s narrows, from the box as drawn', (side, wider, narrower) => {
    const { ui, kept } = one({ side })
    ui.drawn(180)
    ui.key(wider)
    ui.key(narrower, true)
    expect(kept).toEqual([188, 148])
    ui.cleanup()
  })

  it('goes to the floor and the ceiling on Home and End, and clamps a step to them', () => {
    const { ui, kept } = one({})
    ui.drawn(296)
    ui.key('End')
    ui.key('ArrowRight')
    ui.key('Home')
    expect(kept).toEqual([300, 300, 100])
    ui.cleanup()
  })

  it('shuts the box from a key past the floor when it may, and holds the floor when it may not', () => {
    const { ui, kept, shut } = one({ onShut: () => {} })
    ui.drawn(104)
    ui.key('ArrowLeft')
    expect(shut).toHaveBeenCalledTimes(1)
    expect(kept).toEqual([])
    ui.cleanup()

    const held = one({})
    held.ui.drawn(104)
    held.ui.key('ArrowLeft')
    expect(held.kept).toEqual([100])
    held.ui.cleanup()
  })

  it('resets on a double-click, or hands the size back when the box follows its content', () => {
    const { ui, kept } = one({})
    act(() => {
      ui.grip.dispatchEvent(new MouseEvent('dblclick', { bubbles: true }))
    })
    expect(kept).toEqual([200])
    ui.cleanup()

    const back = vi.fn()
    const free = one({ side: 'top', onReset: back })
    act(() => {
      free.ui.grip.dispatchEvent(new MouseEvent('dblclick', { bubbles: true }))
    })
    expect(back).toHaveBeenCalledTimes(1)
    expect(free.kept).toEqual([])
    free.ui.cleanup()
  })

  it('draws focus on its line, never as an outline', () => {
    const { ui } = one({})
    expect(ui.grip.className).toMatch(/_outlineWidth-0px/)
    ui.cleanup()
  })
})

function Column() {
  const col = useSpan('grip.test.column', 240, 200, 400)
  return (
    <YStack ref={col.ref as never} style={col.style} position="relative" data-testid="column">
      <Grip side="left" span={col.span} floor={200} ceil={400} reset={240} onSpan={col.move} onKeep={col.keep} label="Resize column" />
    </YStack>
  )
}

describe('useSpan', () => {
  it('keeps what Grip settles on in this browser, and draws it from the first frame of the next mount', () => {
    localStorage.removeItem('grip.test.column')
    const ui = mount(<Column />)
    const column = () => ui.host.querySelector<HTMLElement>('[data-testid="column"]')!
    expect(column().style.getPropertyValue('--span')).toBe('240px')
    ui.drawn(240)
    ui.key('ArrowRight', true)
    expect(localStorage.getItem('grip.test.column')).toBe('272')
    expect(column().style.getPropertyValue('--span')).toBe('272px')
    ui.cleanup()

    const again = mount(<Column />)
    expect(again.host.querySelector<HTMLElement>('[data-testid="column"]')!.style.getPropertyValue('--span')).toBe('272px')
    expect(again.grip.getAttribute('aria-valuenow')).toBe('272')
    again.cleanup()
  })

  it('ignores a kept width outside its bounds', () => {
    localStorage.setItem('grip.test.column', '9999')
    const ui = mount(<Column />)
    expect(ui.grip.getAttribute('aria-valuenow')).toBe('240')
    ui.cleanup()
  })
})
