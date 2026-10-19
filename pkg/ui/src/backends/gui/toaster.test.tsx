// @vitest-environment jsdom

/**
 * The toast on a live DOM, with the clock in the test's hand: it says what it
 * was told with its status's icon, the countdown closes it after its duration
 * (6s unless told), a pointer over it holds the clock, a fourth closes the
 * oldest, an id updates the toast that holds it instead of adding one, Cancel
 * and the close button both close it and run their handlers, a progress toast
 * waits to be told, and axe finds nothing.
 */
import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { GuiProvider } from '@hanzo/gui'

import config from '../../gui-config'
import { audit } from '../../../test/axe'
import { Toaster, toast, TOAST_DURATION } from './toaster'

declare global {
  // eslint-disable-next-line no-var
  var IS_REACT_ACT_ENVIRONMENT: boolean
}

let host: HTMLDivElement
let root: Root

beforeEach(() => {
  vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout', 'setInterval', 'clearInterval', 'Date', 'requestAnimationFrame', 'cancelAnimationFrame'] })
  globalThis.IS_REACT_ACT_ENVIRONMENT = true
  host = document.createElement('div')
  document.body.appendChild(host)
  root = createRoot(host)
  act(() =>
    root.render(
      <GuiProvider config={config} defaultTheme="dark">
        <Toaster />
      </GuiProvider>,
    ),
  )
})

afterEach(() => {
  if (!vi.isFakeTimers()) vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout', 'requestAnimationFrame', 'cancelAnimationFrame'] })
  act(() => {
    toast.dismiss()
    vi.advanceTimersByTime(2000)
  })
  act(() => root.unmount())
  host.remove()
  vi.useRealTimers()
})

// gui stamps the removal on the item's position wrapper and keeps the node for
// its exit animation, which jsdom never finishes — so "on screen" is "not removed".
const toasts = () =>
  [...document.querySelectorAll<HTMLElement>('[data-slot="toast"]')].filter(
    (t) => t.closest('[data-removed]')?.getAttribute('data-removed') !== 'true',
  )
const messages = () => toasts().map((t) => t.querySelector('[data-slot="toast-message"]')?.textContent)
const run = (ms: number) => act(() => vi.advanceTimersByTime(ms))

describe('toast', () => {
  it('shows the message under its status, with a countdown in the status’s tint', () => {
    act(() => void toast.success('Record created'))
    run(50)
    expect(messages()).toEqual(['Record created'])
    const t = toasts()[0]
    expect(t.getAttribute('data-status')).toBe('success')
    expect(t.querySelector('[aria-label="success"]')).not.toBeNull()
    const fill = t.querySelector<HTMLElement>('[data-slot="toast-countdown"]')
    expect(fill?.getAttribute('data-motion')).toBe('drain')
    expect(fill?.style.getPropertyValue('--drain')).toBe(`${TOAST_DURATION}ms`)
  })

  it('closes itself after its duration, and tells onAutoClose', () => {
    const onAutoClose = vi.fn()
    act(() => void toast('Saved', { duration: 3000, onAutoClose }))
    run(2900)
    expect(messages()).toEqual(['Saved'])
    run(200)
    run(1000)
    expect(messages()).toEqual([])
    expect(onAutoClose).toHaveBeenCalledTimes(1)
  })

  // The pointer and focus take the same hold (onHoverIn / onFocus on the toast's
  // body). jsdom delivers no synthetic hover into gui's portal, so the hold is
  // driven here by focus, which it does deliver.
  it('holds its clock while focus is inside it', () => {
    act(() => void toast('Hold me', { duration: 1000 }))
    run(50)
    const t = toasts()[0].querySelector<HTMLElement>('[data-slot="toast-close"]')!
    act(() => t.focus())
    run(3000)
    expect(messages()).toEqual(['Hold me'])
    expect(toasts()[0].querySelector('[data-slot="toast-countdown"]')?.hasAttribute('data-paused')).toBe(true)
  })

  it('shows at most three: a fourth closes the oldest', () => {
    act(() => {
      toast('one')
      toast('two')
      toast('three')
    })
    run(50)
    act(() => void toast('four'))
    run(1000)
    expect(messages()).toEqual(['four', 'three', 'two'])
  })

  it('an id is the dedupe key: a second toast with it updates the first', () => {
    act(() => void toast('Importing…', { id: 'import' }))
    run(50)
    act(() => void toast.success('Imported 40 people', { id: 'import' }))
    run(50)
    expect(messages()).toEqual(['Imported 40 people'])
  })

  it('Cancel and the close button both close it, after their own handlers', () => {
    const onCancel = vi.fn()
    const onDismiss = vi.fn()
    act(() => void toast('Deleting', { cancel: { label: 'Cancel', onClick: onCancel }, onDismiss }))
    run(50)
    act(() => toasts()[0].querySelector<HTMLElement>('[data-slot="toast-cancel"]')!.click())
    run(1000)
    expect(onCancel).toHaveBeenCalledTimes(1)
    expect(onDismiss).toHaveBeenCalledTimes(1)
    expect(messages()).toEqual([])

    act(() => void toast('Closable'))
    run(50)
    act(() => toasts()[0].querySelector<HTMLElement>('[data-slot="toast-close"]')!.click())
    run(1000)
    expect(messages()).toEqual([])
  })

  it('a progress toast draws its progress and waits to be told', () => {
    act(() => void toast.info('Importing', { id: 'p', data: { progress: 30 } }))
    run(TOAST_DURATION * 2)
    const t = toasts()[0]
    expect(t.querySelector('[data-slot="toast-progress"]')).not.toBeNull()
    expect(t.querySelector('[data-slot="toast-countdown"]')).toBeNull()
  })

  it('a description sits under the message and an action in a footer', async () => {
    act(() => void toast.error('Delete failed', { description: '2 records are locked', action: { label: 'Retry', onClick: () => {} } }))
    run(50)
    const t = toasts()[0]
    expect(t.querySelector('[data-slot="toast-description"]')?.textContent).toBe('2 records are locked')
    expect(t.querySelector('[data-slot="toast-footer"]')?.textContent).toBe('Retry')
    vi.useRealTimers()
    expect(await audit(t)).toEqual([])
  })
})
