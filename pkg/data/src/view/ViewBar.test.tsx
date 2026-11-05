// @vitest-environment jsdom

/**
 * RecordsToolbar as the record kit's view bar (compact density) against a live
 * DOM, and as the sheet toolbar it always was (regular).
 *
 * The 39px top row with the view picker ("· N") and the quiet Filter, Sort and
 * Options buttons; the details row only while the view sorts or filters, its
 * chips 24 high with a rule between the sorts and the filters; a sort chip that
 * turns its direction; removes that take a rule out; "+ Add filter" opening the
 * field search; Reset and Update view only while the view differs from its
 * saved state; and axe.
 */
import { act, type ReactNode } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { renderToStaticMarkup } from 'react-dom/server'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { GuiProvider } from '@hanzo/gui'
import { Density, config } from '@hanzo/ui'

import '../field/registerDefaults'
import { audit } from '../../../ui/test/axe'
import type { FieldDefinition } from '../field/types'
import { RecordsToolbar } from './Toolbar'
import { emptyView } from './logic'
import type { ViewConfig } from './types'

declare global {
  // eslint-disable-next-line no-var
  var IS_REACT_ACT_ENVIRONMENT: boolean
}

const FIELDS: FieldDefinition[] = [
  { name: 'name', label: 'Name', type: 'text' },
  {
    name: 'stage',
    label: 'Stage',
    type: 'select',
    metadata: { options: [{ value: 'lead', label: 'Lead', color: 'blue' }] },
  },
]
const plain = { ...emptyView('table'), name: 'All companies' }
const busy: ViewConfig = {
  ...plain,
  sorts: [{ field: 'name', dir: 'asc' }],
  filters: [{ field: 'stage', op: 'is', value: 'lead' }],
}

const html = (node: ReactNode) =>
  renderToStaticMarkup(
    <GuiProvider config={config} defaultTheme="dark">
      {node}
    </GuiProvider>,
  )
const tag = (markup: string, slot: string) => markup.match(new RegExp(`<[a-z]+[^>]*data-slot="${slot}"[^>]*>`))?.[0] ?? ''

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

const mount = (ui: ReactNode) =>
  act(() => {
    root.render(
      <GuiProvider config={config} defaultTheme="dark">
        <Density value="compact">{ui}</Density>
      </GuiProvider>,
    )
  })

const byLabel = (label: string) => document.querySelector(`[aria-label="${label}"]`) as HTMLElement

describe('the records toolbar', () => {
  it('at regular density is the sheet toolbar it always was', () => {
    const markup = html(<RecordsToolbar fields={FIELDS} view={plain} onView={() => {}} />)
    expect(markup).not.toContain('data-slot="view-bar"')
    expect(markup).toContain('Search…')
  })

  it('at regular density, Filter and Sort open their menus, and a rule takes or between two', () => {
    // The triggers are popover children (asChild): a trigger that drops the props it
    // is handed opens nothing, which is how these menus stayed shut.
    const onView = vi.fn()
    act(() => {
      root.render(
        <GuiProvider config={config} defaultTheme="dark">
          <RecordsToolbar fields={FIELDS} view={{ ...busy, filters: [...busy.filters, { field: 'name', op: 'contains', value: 'acme' }] }} onView={onView} />
        </GuiProvider>,
      )
    })
    act(() => byLabel('Filter').click())
    expect(document.body.textContent).toContain('Add filter')
    const connector = document.querySelector('[aria-label^="Rules combine by and"]') as HTMLElement
    act(() => connector.click())
    expect(onView).toHaveBeenLastCalledWith(expect.objectContaining({ match: 'or' }))
    act(() => byLabel('Sort').click())
    expect([...document.querySelectorAll('[role="menuitem"]')].map((m) => m.textContent)).toContain('Name')
  })

  it('compact: a top row 39 high over its hairline, the picker naming the view and its count', () => {
    const markup = html(
      <Density value="compact">
        <RecordsToolbar fields={FIELDS} view={plain} onView={() => {}} count={12} />
      </Density>,
    )
    const top = tag(markup, 'view-bar-top')
    expect(top).toMatch(/_minH-40px/)
    expect(top).toMatch(/_borderBottomWidth-1px/)
    expect(markup).toContain('All companies')
    expect(markup).toContain('· 12')
    // Filter, Sort and Options are the quiet 24px buttons.
    const buttons = [...markup.matchAll(/<button[^>]*data-size="xs"[^>]*>/g)].map((m) => m[0])
    expect(buttons.length).toBeGreaterThanOrEqual(4)
    for (const b of buttons) expect(b).toMatch(/_minH-24px/)
    // Nothing sorts or filters, so there is no details row.
    expect(markup).not.toContain('data-slot="view-bar-details"')
  })

  it('compact: a details row of 24px chips, a rule between the sorts and the filters', () => {
    const markup = html(
      <Density value="compact">
        <RecordsToolbar fields={FIELDS} view={busy} onView={() => {}} />
      </Density>,
    )
    expect(tag(markup, 'view-bar-details')).toMatch(/_minH-32px/)
    const chips = [...markup.matchAll(/<div[^>]*data-slot="view-chip"[^>]*>/g)].map((m) => m[0])
    expect(chips).toHaveLength(2)
    for (const c of chips) {
      expect(c).toMatch(/_height-24px/)
      expect(c).toMatch(/_btlr-c-radius-xs/)
      expect(c).toMatch(/_bg-hover/)
    }
    expect(markup.indexOf('data-slot="view-bar-rule"')).toBeGreaterThan(markup.indexOf('view-chip'))
    expect(markup).toContain(': is Lead')
  })

  it('a sort chip turns its direction; a remove takes its rule out', () => {
    const onView = vi.fn()
    mount(<RecordsToolbar fields={FIELDS} view={busy} onView={onView} />)
    act(() => byLabel('Sort by Name, ascending').click())
    expect(onView.mock.calls.at(-1)?.[0].sorts).toEqual([{ field: 'name', dir: 'desc' }])
    act(() => byLabel('Remove filter on Stage').click())
    expect(onView.mock.calls.at(-1)?.[0].filters).toEqual([])
    act(() => byLabel('Remove sort by Name').click())
    expect(onView.mock.calls.at(-1)?.[0].sorts).toEqual([])
  })

  it('"Add filter" opens the field search', () => {
    mount(<RecordsToolbar fields={FIELDS} view={busy} onView={() => {}} />)
    const add = [...host.querySelectorAll('button')].find((b) => b.textContent?.includes('Add filter')) as HTMLElement
    act(() => add.click())
    expect(document.querySelector('input[placeholder="Search fields"]')).toBeTruthy()
  })

  it('offers Reset and Update view only while the view differs from what was saved', () => {
    const onSave = vi.fn()
    const onReset = vi.fn()
    const markup = html(
      <Density value="compact">
        <RecordsToolbar fields={FIELDS} view={busy} onView={() => {}} onSaveView={onSave} onResetView={onReset} />
      </Density>,
    )
    expect(markup).not.toContain('>Update view<')
    mount(<RecordsToolbar fields={FIELDS} view={busy} onView={() => {}} dirty onSaveView={onSave} onResetView={onReset} onSaveAsView={() => {}} />)
    const update = [...host.querySelectorAll('button')].find((b) => b.textContent === 'Update view') as HTMLElement
    act(() => update.click())
    expect(onSave).toHaveBeenCalledTimes(1)
    const reset = [...host.querySelectorAll('button')].find((b) => b.textContent === 'Reset') as HTMLElement
    act(() => reset.click())
    expect(onReset).toHaveBeenCalledTimes(1)
    expect(byLabel('More ways to save the view')).toBeTruthy()
  })

  it('passes axe', async () => {
    mount(<RecordsToolbar fields={FIELDS} view={busy} onView={() => {}} dirty onSaveView={() => {}} onResetView={() => {}} onCreate={() => {}} count={3} />)
    expect(await audit(host)).toEqual([])
  })
})
