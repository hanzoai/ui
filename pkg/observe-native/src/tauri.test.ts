import { afterEach, describe as group, expect, it, vi } from 'vitest'
import type { Analytics } from '@hanzo/event'
import { bindTauri, type TauriBridge } from './tauri'

function fakeClient() {
  return { capture: vi.fn(), pageview: vi.fn() }
}

let bridge: TauriBridge | undefined

afterEach(() => {
  bridge?.stop()
  bridge = undefined
  document.body.innerHTML = ''
})

group('bindTauri', () => {
  it('captures the in-webview DOM (a Tauri window is a webview)', () => {
    document.body.innerHTML = '<button data-testid="save">Save</button>'
    const client = fakeClient()
    bridge = bindTauri(client as unknown as Analytics, { dom: true })
    expect(bridge.observer).not.toBeNull()
    document.querySelector('button')!.dispatchEvent(new Event('click', { bubbles: true }))
    expect(client.capture).toHaveBeenCalledTimes(1)
    expect(client.capture.mock.calls[0][0]).toBe('$click')
    expect(client.capture.mock.calls[0][1].$testid).toBe('save')
  })

  it('can skip DOM capture', () => {
    const client = fakeClient()
    bridge = bindTauri(client as unknown as Analytics, { dom: false })
    expect(bridge.observer).toBeNull()
  })

  it('no-ops the native bridge outside a Tauri runtime (never throws)', async () => {
    const client = fakeClient()
    expect(() => {
      bridge = bindTauri(client as unknown as Analytics, { dom: false })
    }).not.toThrow()
    // the guarded dynamic import rejects when @tauri-apps/api is absent; give the
    // microtask queue a tick to settle and confirm nothing blew up.
    await Promise.resolve()
    expect(client.capture).not.toHaveBeenCalled()
  })

  it('stop() halts DOM capture', () => {
    document.body.innerHTML = '<button>x</button>'
    const client = fakeClient()
    bridge = bindTauri(client as unknown as Analytics, { dom: true })
    bridge.stop()
    document.querySelector('button')!.dispatchEvent(new Event('click', { bubbles: true }))
    expect(client.capture).not.toHaveBeenCalled()
  })
})
