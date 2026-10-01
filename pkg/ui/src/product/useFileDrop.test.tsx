// @vitest-environment jsdom

/**
 * useFileDrop, against a live window.
 *
 * The pure rule is "a file drag attaches, a text drag does not, and the overlay
 * survives crossing child elements." All three are wiring, not logic — a hook
 * that reads the wrong `dataTransfer` field or forgets the enter/leave depth
 * counter passes a typecheck and fails the user. So these dispatch real window
 * events and assert what the hook does with them.
 */
import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'

import { useFileDrop } from './useFileDrop'

declare global {
  // eslint-disable-next-line no-var
  var IS_REACT_ACT_ENVIRONMENT: boolean
}

let host: HTMLDivElement
let root: Root
let lastActive = false
let captured: File[][] = []

function Probe({ enabled = true }: { enabled?: boolean }) {
  const { active } = useFileDrop(
    (files) => {
      captured.push(files)
    },
    enabled,
  )
  lastActive = active
  return <div data-active={String(active)} />
}

/** Dispatch a window drag event carrying a synthetic dataTransfer. */
const drag = (type: string, types: string[], files: File[] = []) => {
  const ev = new Event(type, { bubbles: true, cancelable: true })
  Object.defineProperty(ev, 'dataTransfer', { value: { types, files } })
  act(() => {
    window.dispatchEvent(ev)
  })
  return ev
}

beforeEach(() => {
  globalThis.IS_REACT_ACT_ENVIRONMENT = true
  lastActive = false
  captured = []
  host = document.createElement('div')
  document.body.appendChild(host)
  root = createRoot(host)
  act(() => {
    root.render(<Probe />)
  })
})

afterEach(() => {
  act(() => root.unmount())
  host.remove()
})

describe('useFileDrop', () => {
  it('lights active on a file dragenter and routes the files on drop', () => {
    const f = new File(['hi'], 'a.txt', { type: 'text/plain' })
    drag('dragenter', ['Files'])
    expect(lastActive).toBe(true)
    drag('drop', ['Files'], [f])
    expect(lastActive).toBe(false)
    expect(captured).toHaveLength(1)
    expect(captured[0][0].name).toBe('a.txt')
  })

  it('ignores a non-file drag (a text selection)', () => {
    drag('dragenter', ['text/plain'])
    expect(lastActive).toBe(false)
    drag('drop', ['text/plain'])
    expect(captured).toHaveLength(0)
  })

  it('stays active across a child dragleave until the window is actually left', () => {
    drag('dragenter', ['Files']) // depth 1
    drag('dragenter', ['Files']) // depth 2
    drag('dragleave', ['Files']) // crossed a child: depth 1, still over the window
    expect(lastActive).toBe(true)
    drag('dragleave', ['Files']) // depth 0: left the window
    expect(lastActive).toBe(false)
  })

  it('does nothing when disabled — the window is left untouched', () => {
    act(() => root.render(<Probe enabled={false} />))
    drag('dragenter', ['Files'])
    expect(lastActive).toBe(false)
    drag('drop', ['Files'], [new File(['x'], 'x.txt', { type: 'text/plain' })])
    expect(captured).toHaveLength(0)
  })
})
