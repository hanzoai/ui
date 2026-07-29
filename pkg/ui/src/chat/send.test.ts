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

  it('ignores every other key', () => {
    for (const k of ['a', 'Tab', 'Escape', 'ArrowUp', '']) expect(sends(k)).toBe(false)
  })

  it('treats any modifier as a newline, not a send', () => {
    for (const m of ['altKey', 'metaKey', 'ctrlKey'] as const)
      expect(sends('Enter', { [m]: true })).toBe(false)
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
