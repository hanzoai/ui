import { afterEach, beforeEach, describe as group, expect, it, vi } from 'vitest'
import { Observer } from './observer'
import type { Interaction } from './types'

let sink: Interaction[]
let engine: Observer | undefined

beforeEach(() => {
  document.body.innerHTML = ''
  sink = []
})

afterEach(() => {
  engine?.stop()
  engine = undefined
})

function start(config: Partial<ConstructorParameters<typeof Observer>[0]> = {}): Observer {
  engine = new Observer({ sink: (i) => sink.push(i), nav: false, viewSelector: '', ...config })
  engine.start()
  return engine
}

group('Observer', () => {
  it('captures a click, annotated with the semantic hierarchy of the target', () => {
    document.body.innerHTML = '<section data-hz-name="Card"><button data-testid="save"><span>Save</span></button></section>'
    start()
    document.querySelector('span')!.dispatchEvent(new Event('click', { bubbles: true }))

    expect(sink).toHaveLength(1)
    const i = sink[0]
    expect(i.kind).toBe('click')
    expect(i.name).toBe('$click')
    expect(i.semantic.target.tag).toBe('span')
    expect(i.semantic.label).toBe('Card/button[save]')
  })

  it('mirrors every interaction into the playback stream', () => {
    document.body.innerHTML = '<button>x</button>'
    start()
    document.querySelector('button')!.dispatchEvent(new Event('click', { bubbles: true }))
    expect(engine!.stream.buffer()).toHaveLength(1)
    expect(engine!.stream.buffer()[0].kind).toBe('click')
  })

  it('redacts input values on change; withholds the raw text', () => {
    document.body.innerHTML = '<input name="password" type="password" value="hunter2">'
    start()
    document.querySelector('input')!.dispatchEvent(new Event('change', { bubbles: true }))
    expect(sink).toHaveLength(1)
    expect(sink[0].kind).toBe('change')
    expect(sink[0].value).toEqual({ redacted: true, kind: 'password' })
    expect(JSON.stringify(sink[0])).not.toContain('hunter2')
  })

  it('coalesces a burst of keystrokes into one debounced $input', () => {
    vi.useFakeTimers()
    document.body.innerHTML = '<input name="q" value="">'
    start({ inputDebounceMs: 300 })
    const input = document.querySelector('input')!
    input.dispatchEvent(new Event('input', { bubbles: true }))
    input.dispatchEvent(new Event('input', { bubbles: true }))
    input.dispatchEvent(new Event('input', { bubbles: true }))
    expect(sink).toHaveLength(0) // still within the debounce window
    vi.advanceTimersByTime(300)
    expect(sink).toHaveLength(1)
    expect(sink[0].kind).toBe('input')
    vi.useRealTimers()
  })

  it('never captures inside a private subtree', () => {
    document.body.innerHTML = '<div data-hz-private><button id="b">x</button></div>'
    start()
    document.getElementById('b')!.dispatchEvent(new Event('click', { bubbles: true }))
    expect(sink).toHaveLength(0)
  })

  it('captures SPA navigation as $pageview when nav is on', () => {
    start({ nav: true })
    history.pushState({}, '', '/dashboard')
    expect(sink).toHaveLength(1)
    expect(sink[0].kind).toBe('nav')
    expect(sink[0].name).toBe('$pageview')
    expect(typeof sink[0].props?.path).toBe('string')
  })

  it('stop() unbinds — no capture after stop', () => {
    document.body.innerHTML = '<button>x</button>'
    const e = start()
    e.stop()
    document.querySelector('button')!.dispatchEvent(new Event('click', { bubbles: true }))
    expect(sink).toHaveLength(0)
  })

  it('is fail-soft: a throwing sink never surfaces to the dispatcher', () => {
    document.body.innerHTML = '<button>x</button>'
    engine = new Observer({
      sink: () => {
        throw new Error('sink boom')
      },
      nav: false,
      viewSelector: '',
    })
    engine.start()
    expect(() =>
      document.querySelector('button')!.dispatchEvent(new Event('click', { bubbles: true })),
    ).not.toThrow()
  })
})

// A click's WHERE. Element identity says which thing was clicked; only a position
// can be drawn as a heat map, and the MouseEvent carrying it used to be discarded.
group('pointer position', () => {
  function click(el: Element, init: MouseEventInit): void {
    el.dispatchEvent(new MouseEvent('click', { bubbles: true, ...init }))
  }

  it('carries the pointer position and the viewport it was measured in', () => {
    document.body.innerHTML = '<button>x</button>'
    start()
    click(document.querySelector('button')!, { clientX: 120, clientY: 340 })

    expect(sink).toHaveLength(1)
    expect(sink[0].props).toMatchObject({
      $x: 120,
      $y: 340,
      $target_fixed: false,
      $viewport_width: window.innerWidth,
      $viewport_height: window.innerHeight,
    })
  })

  it('keeps the element identity it always had', () => {
    document.body.innerHTML = '<section data-hz-name="Card"><button data-testid="save">Save</button></section>'
    start()
    click(document.querySelector('button')!, { clientX: 1, clientY: 2 })
    expect(sink[0].semantic.label).toBe('Card/button[save]')
    expect(sink[0].props).toMatchObject({ $x: 1, $y: 2 })
  })

  it('measures a scrolled page in page coordinates', () => {
    document.body.innerHTML = '<button>x</button>'
    vi.spyOn(window, 'scrollX', 'get').mockReturnValue(15)
    vi.spyOn(window, 'scrollY', 'get').mockReturnValue(600)
    start()
    click(document.querySelector('button')!, { clientX: 10, clientY: 40 })
    expect(sink[0].props).toMatchObject({ $x: 25, $y: 640, $target_fixed: false })
    vi.restoreAllMocks()
  })

  it('measures a fixed target against the viewport it stays pinned to', () => {
    document.body.innerHTML = '<nav style="position:fixed"><button>x</button></nav>'
    vi.spyOn(window, 'scrollY', 'get').mockReturnValue(600)
    start()
    click(document.querySelector('button')!, { clientX: 10, clientY: 40 })
    expect(sink[0].props).toMatchObject({ $x: 10, $y: 40, $target_fixed: true })
    vi.restoreAllMocks()
  })

  it('contributes no position for an event that has no pointer', () => {
    document.body.innerHTML = '<button>x</button>'
    start()
    document.querySelector('button')!.dispatchEvent(new Event('click', { bubbles: true }))
    expect(sink).toHaveLength(1)
    expect(sink[0].props?.$x).toBeUndefined()
  })

  it('positions only a click — an input carries no coordinates', () => {
    document.body.innerHTML = '<input name="q" value="">'
    start()
    document.querySelector('input')!.dispatchEvent(new Event('change', { bubbles: true }))
    expect(sink[0].kind).toBe('change')
    expect(sink[0].props?.$x).toBeUndefined()
  })
})
