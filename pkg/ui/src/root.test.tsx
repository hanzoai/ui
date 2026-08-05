// @vitest-environment jsdom

/**
 * `<Hanzo analytics>` — the opt-in contract.
 *
 * Two properties matter more than anything the provider does once it is on, and
 * neither is visible from a typecheck:
 *
 *   1. Mounting a component library must not start a network conversation the
 *      app did not ask for. Without the prop, NO telemetry provider is rendered
 *      at all — not a disabled one, not one that decides at runtime.
 *   2. With the prop, the app configures nothing else. One flag is the setup,
 *      and a config object rides through untouched to the one provider.
 *
 * The provider itself is @hanzogui/telemetry's, tested in its own package; what
 * is asserted here is whether @hanzo/ui renders it, and with what.
 */
import { describe, expect, it, vi, beforeEach } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'

const mounted: unknown[] = []

vi.mock('@hanzogui/telemetry', () => ({
  TelemetryProvider: ({ children, ...props }: { children?: React.ReactNode }) => {
    mounted.push(props)
    return children
  },
}))

// Imported after the mock so the module graph picks it up.
const { Hanzo } = await import('./root')

beforeEach(() => {
  mounted.length = 0
  // `<Hanzo>` asserts in development that `styles.css` reached the document.
  // This suite renders the root off `src`, where that sheet does not exist —
  // it is generated into `dist` at publish time — and jsdom resolves a custom
  // property from an inline style but not from a stylesheet, so declaring it
  // here is the one way to answer the check. What the sheet actually contains
  // is asserted against a real browser in `test/consumer.spec.ts`.
  document.documentElement.style.setProperty('--hanzo-ui-styles', '1')
})

describe('<Hanzo analytics>', () => {
  it('mounts no telemetry provider unless asked', () => {
    renderToStaticMarkup(<Hanzo>ship</Hanzo>)
    expect(mounted).toEqual([])
  })

  it('is the whole setup when true', () => {
    renderToStaticMarkup(<Hanzo analytics>ship</Hanzo>)
    expect(mounted).toEqual([{}])
  })

  it('passes a config through to the one provider', () => {
    renderToStaticMarkup(
      <Hanzo analytics={{ product: 'console', ingestKey: 'pk-abc' }}>ship</Hanzo>,
    )
    expect(mounted).toEqual([{ product: 'console', ingestKey: 'pk-abc' }])
  })

  it('renders the tree either way', () => {
    expect(renderToStaticMarkup(<Hanzo>ship</Hanzo>)).toContain('ship')
    expect(renderToStaticMarkup(<Hanzo analytics>ship</Hanzo>)).toContain('ship')
  })
})
