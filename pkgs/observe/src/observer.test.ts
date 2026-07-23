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
