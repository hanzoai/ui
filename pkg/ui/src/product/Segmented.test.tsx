// @vitest-environment jsdom

/**
 * Segmented as a track: one choice from a few, as a radio group on a pill
 * capsule. Server markup for the shape, a live DOM for the choice.
 */
import { act, useState } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { renderToStaticMarkup } from 'react-dom/server'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { GuiProvider } from '@hanzo/gui'

import config from '../gui-config'
import { audit } from '../../test/axe'
import { Segmented } from './Filters'

const wrap = (node: React.ReactNode) => (
  <GuiProvider config={config} defaultTheme="dark">
    {node}
  </GuiProvider>
)
const OPTIONS = [
  { label: 'Send now', value: 'now' },
  { label: 'Schedule', value: 'later' },
] as const

describe('Segmented track, server-rendered', () => {
  const markup = renderToStaticMarkup(
    wrap(<Segmented variant="track" options={[...OPTIONS]} value="now" onChange={() => {}} aria-label="When" />),
  )
  const group = markup.match(/<[a-z]+[^>]*data-slot="segmented"[^>]*>/)?.[0] ?? ''
  const items = [...markup.matchAll(/<[a-z]+[^>]*data-slot="segmented-item"[^>]*>/g)].map((m) => m[0])

  it('is a radio group on a 32px capsule with a 3px inset', () => {
    expect(group).toContain('role="radiogroup"')
    expect(group).toMatch(/_height-32px/)
    expect(group).toMatch(/_pt-3px/)
    expect(group).toMatch(/_btlr-9999px|_btlr-c-radius-10/)
    expect(group).toMatch(/_bg-panel/)
  })

  it('the chosen option is checked and lifted; the others are not', () => {
    expect(items[0]).toContain('aria-checked="true"')
    expect(items[0]).toMatch(/_bg-raised/)
    expect(items[1]).toContain('aria-checked="false"')
    expect(items[1]).toMatch(/_bg-transparent/)
  })

  it('sm is 24px with a 1px inset', () => {
    const sm = renderToStaticMarkup(
      wrap(<Segmented variant="track" trackSize="sm" options={[...OPTIONS]} value="now" onChange={() => {}} />),
    )
    expect(sm.match(/<[a-z]+[^>]*data-slot="segmented"[^>]*>/)?.[0]).toMatch(/_height-24px/)
  })

  it('the default is still the row of buttons', () => {
    const row = renderToStaticMarkup(wrap(<Segmented options={[...OPTIONS]} value="now" onChange={() => {}} />))
    expect(row).toContain('aria-pressed="true"')
    expect(row).not.toContain('data-slot="segmented"')
  })
})

declare global {
  // eslint-disable-next-line no-var
  var IS_REACT_ACT_ENVIRONMENT: boolean
}

describe('Segmented track, live', () => {
  let host: HTMLDivElement
  let root: Root
  beforeEach(() => {
    globalThis.IS_REACT_ACT_ENVIRONMENT = true
    host = document.createElement('div')
    document.body.appendChild(host)
    root = createRoot(host)
  })
  afterEach(() => {
    act(() => root.unmount())
    host.remove()
  })

  function Live({ onChange }: { onChange: (v: string) => void }) {
    const [v, setV] = useState<'now' | 'later'>('now')
    return (
      <Segmented
        variant="track"
        options={[...OPTIONS]}
        value={v}
        onChange={(next) => {
          setV(next)
          onChange(next)
        }}
        aria-label="When"
      />
    )
  }

  it('a press chooses; the arrows move the choice and wrap', () => {
    const onChange = vi.fn()
    act(() => root.render(wrap(<Live onChange={onChange} />)))
    const items = () => [...host.querySelectorAll<HTMLElement>('[data-slot="segmented-item"]')]
    act(() => items()[1].click())
    expect(onChange).toHaveBeenLastCalledWith('later')
    expect(items()[1].getAttribute('aria-checked')).toBe('true')
    act(() => {
      items()[1].dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }))
    })
    expect(onChange).toHaveBeenLastCalledWith('now')
  })

  it('passes axe', async () => {
    act(() => root.render(wrap(<Live onChange={() => {}} />)))
    expect(await audit(host)).toEqual([])
  })
})
