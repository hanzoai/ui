import { act } from 'react'
import { createRoot } from 'react-dom/client'
import { renderToStaticMarkup } from 'react-dom/server'
import { afterEach, describe as group, expect, it, vi } from 'vitest'
import type { Analytics } from '@hanzo/event'
import { ObserveProvider, ObserveScope } from './context'
import { useObserve } from './hooks'

// React needs this flag to accept act() outside a full test runner integration.
;(globalThis as unknown as { IS_REACT_ACT_ENVIRONMENT: boolean }).IS_REACT_ACT_ENVIRONMENT = true

function fakeClient() {
  return { capture: vi.fn(), pageview: vi.fn() }
}

let cleanup: (() => Promise<void>) | undefined
afterEach(async () => {
  await cleanup?.()
  cleanup = undefined
  document.body.innerHTML = ''
})

async function mount(ui: React.ReactNode): Promise<HTMLElement> {
  const container = document.createElement('div')
  document.body.appendChild(container)
  const root = createRoot(container)
  await act(async () => {
    root.render(ui)
  })
  cleanup = async () => {
    await act(async () => {
      root.unmount()
    })
  }
  return container
}

group('React native binding', () => {
  it('renders provider + scope + a consumer without throwing (SSR smoke)', () => {
    const client = fakeClient()
    let api: ReturnType<typeof useObserve> | undefined
    function Probe() {
      api = useObserve()
      return <button>Save</button>
    }
    const html = renderToStaticMarkup(
      <ObserveProvider client={client as unknown as Analytics}>
        <ObserveScope name="Dashboard">
          <Probe />
        </ObserveScope>
      </ObserveProvider>,
    )
    expect(html).toContain('Save')
    expect(api).toBeDefined()
  })

  it('press() emits through provider/scope context with the composed label', async () => {
    const client = fakeClient()
    const inner = vi.fn()
    let press: ((e?: unknown) => void) | undefined
    function Probe() {
      press = useObserve().press('SaveButton', inner)
      return <button>Save</button>
    }
    await mount(
      <ObserveProvider client={client as unknown as Analytics}>
        <ObserveScope name="Dashboard">
          <ObserveScope name="UserCard">
            <Probe />
          </ObserveScope>
        </ObserveScope>
      </ObserveProvider>,
    )
    act(() => press!())
    expect(inner).toHaveBeenCalledTimes(1)
    expect(client.capture).toHaveBeenCalledTimes(1)
    expect(client.capture.mock.calls[0][0]).toBe('$click')
    expect(client.capture.mock.calls[0][1].$el).toBe('Dashboard/UserCard/SaveButton')
  })

  it('changeText() emits a redacted change — never the typed text', async () => {
    const client = fakeClient()
    let onChangeText: ((t: string) => void) | undefined
    function Probe() {
      onChangeText = useObserve().changeText({ name: 'email', kind: 'email' })
      return <button>x</button>
    }
    await mount(
      <ObserveProvider client={client as unknown as Analytics}>
        <Probe />
      </ObserveProvider>,
    )
    act(() => onChangeText!('secret@example.com'))
    expect(client.capture).toHaveBeenCalledTimes(1)
    const [name, props] = client.capture.mock.calls[0]
    expect(name).toBe('$change')
    expect(props.$value).toEqual({ redacted: true, kind: 'email' })
    expect(JSON.stringify(props)).not.toContain('secret@example.com')
  })
})
