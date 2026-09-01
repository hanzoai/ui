// @vitest-environment jsdom

/**
 * The Select's DISABLED.
 *
 * gui carries `disabled` on the Trigger; the compound API every call site is
 * written against carries it on the root. A root that did not accept it dropped
 * the word on the floor — silently, because an unknown prop is not an error and
 * the control still renders, just live.
 *
 * The root declares it and the trigger honours it. A trigger that names its own
 * still wins, so the narrower statement beats the inherited one.
 */
import { describe, expect, it, vi } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'

const seen: { disabled?: boolean }[] = []

vi.mock('@hanzo/gui', async (importActual) => {
  const actual = await importActual<Record<string, unknown>>()
  const Root = ({ children }: { children?: React.ReactNode }) => <div>{children}</div>
  // Real statics first, then the two this file replaces — the other order lets
  // the real Trigger win and it reaches for a floating context nothing provides.
  Object.assign(Root, (actual as { Select: object }).Select)
  Root.Trigger = ({ disabled, children }: { disabled?: boolean; children?: React.ReactNode }) => {
    seen.push({ disabled })
    return <button disabled={disabled}>{children}</button>
  }
  Root.Icon = ({ children }: { children?: React.ReactNode }) => <>{children}</>
  return { ...actual, Select: Root }
})

vi.mock('./ink', () => ({ ink: (c: React.ReactNode) => c }))

const { GuiProvider } = await import('@hanzo/gui')
const { default: config } = await import('../../gui-config')
const { Select, SelectTrigger } = await import('./select')

const render = (node: React.ReactNode) => {
  seen.length = 0
  renderToStaticMarkup(
    <GuiProvider config={config} defaultTheme="dark">
      {node}
    </GuiProvider>,
  )
  return seen
}

describe('Select disabled', () => {
  it('is live by default', () => {
    const [trigger] = render(
      <Select>
        <SelectTrigger>Pick</SelectTrigger>
      </Select>,
    )
    expect(trigger.disabled).toBe(false)
  })

  it('reaches the trigger when the root declares it', () => {
    const [trigger] = render(
      <Select disabled>
        <SelectTrigger>Pick</SelectTrigger>
      </Select>,
    )
    expect(trigger.disabled).toBe(true)
  })

  it('lets the trigger state its own, which outranks the root', () => {
    const [trigger] = render(
      <Select disabled>
        <SelectTrigger disabled={false}>Pick</SelectTrigger>
      </Select>,
    )
    expect(trigger.disabled).toBe(false)
  })
})
