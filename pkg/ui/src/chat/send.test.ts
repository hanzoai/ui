import { describe, expect, it } from 'vitest'

import { ready, sends } from './send'
import { pinned, SLACK } from './stick'

describe('sends', () => {
  it('sends on a bare Enter', () => {
    expect(sends('Enter')).toBe(true)
  })

  it('writes a newline on Shift+Enter', () => {
    expect(sends('Enter', { shiftKey: true })).toBe(false)
  })

  it('leaves Enter to the IME while a candidate is open', () => {
    expect(sends('Enter', { isComposing: true })).toBe(false)
  })

  // Safari does not set isComposing on the keydown that accepts a candidate; it
  // reports keyCode 229, or the key as `Process`. A composer that reads only
  // isComposing submits the half-typed word — the bug this module exists to end.
  it('leaves Enter to the IME when only Safari signals are present', () => {
    expect(sends('Enter', { keyCode: 229 })).toBe(false)
    expect(sends('Process', { keyCode: 229 })).toBe(false)
    expect(sends('Process')).toBe(false)
  })

  it('never sends mid-candidate, whatever the modifier', () => {
    for (const m of ['shiftKey', 'altKey', 'metaKey', 'ctrlKey'] as const) {
      expect(sends('Enter', { [m]: true, isComposing: true })).toBe(false)
      expect(sends('Enter', { [m]: true, keyCode: 229 })).toBe(false)
    }
  })

  it('ignores every other key', () => {
    for (const k of ['a', 'Tab', 'Escape', 'ArrowUp', '']) expect(sends(k)).toBe(false)
  })

  // Force-send, as every surface already taught it — and as the source of truth
  // does: `isCtrlEnter` never consults shiftKey.
  it('sends on Cmd/Ctrl+Enter, even with Shift held', () => {
    expect(sends('Enter', { metaKey: true })).toBe(true)
    expect(sends('Enter', { ctrlKey: true })).toBe(true)
    expect(sends('Enter', { metaKey: true, shiftKey: true })).toBe(true)
    expect(sends('Enter', { ctrlKey: true, shiftKey: true })).toBe(true)
  })

  it('writes a newline on Alt+Enter', () => {
    expect(sends('Enter', { altKey: true })).toBe(false)
  })
})

describe('ready', () => {
  it('needs something other than whitespace', () => {
    expect(ready('hi')).toBe(true)
    expect(ready('')).toBe(false)
    expect(ready('   \n\t ')).toBe(false)
  })

  it('refuses while a turn is in flight, or when disabled', () => {
    expect(ready('hi', true)).toBe(false)
    expect(ready('hi', false, true)).toBe(false)
  })
})

describe('pinned', () => {
  const at = (offset: number) => ({ offset, viewport: 400, content: 1000 })

  it('follows while the reader is at the end', () => {
    expect(pinned(at(600))).toBe(true)
  })

  it('follows within the slack band', () => {
    expect(pinned(at(600 - SLACK))).toBe(true)
  })

  it('stops following once the reader scrolls up past it', () => {
    expect(pinned(at(600 - SLACK - 1))).toBe(false)
    expect(pinned(at(0))).toBe(false)
  })

  it('is pinned when there is nothing to scroll', () => {
    expect(pinned({ offset: 0, viewport: 400, content: 200 })).toBe(true)
  })
})
