// @vitest-environment jsdom

/**
 * The kanban card and the board under a compact density — the record kit's
 * board — against a live DOM, and the same two at regular density unchanged.
 *
 * Card: the panel ground at a 4px corner, a 32px header with the record as a
 * chip, the checkbox slot shut until hover or selection, one open per press
 * whether it lands on the card or the chip, the strong rim when active, the
 * faded source of a drag. Board: 200px columns headed by their Tag and count,
 * a quiet add button named for its column, the selection reaching each card,
 * and axe.
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
import { RecordCard } from '../table/RecordCard'
import { BoardView } from './BoardView'

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
    metadata: { options: [{ value: 'lead', label: 'Lead', color: 'blue' }, { value: 'won', label: 'Won', color: 'green' }] },
  },
  { name: 'city', label: 'City', type: 'text' },
]
const ACME = { id: 'acme', name: 'Acme', stage: 'lead', city: 'Paris' }
const GLOBEX = { id: 'globex', name: 'Globex', stage: 'won', city: 'Rome' }

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

describe('the kanban card', () => {
  it('at regular density renders as it always has', () => {
    const markup = html(<RecordCard fields={FIELDS} record={ACME} />)
    expect(markup).not.toContain('data-slot="record-card"')
    expect(markup).toContain('Acme')
  })

  it('compact: the panel ground at a 4px corner, a 32px header holding the record chip', () => {
    const markup = html(
      <Density value="compact">
        <RecordCard fields={FIELDS} record={ACME} />
      </Density>,
    )
    const card = tag(markup, 'record-card')
    expect(card).toMatch(/_bg-panel/)
    expect(card).toMatch(/_btlr-c-radius-xs/)
    expect(card).toMatch(/_btw-1px/)
    expect(tag(markup, 'record-card-header')).toMatch(/_minH-32px/)
    expect(markup).toContain('data-slot="chip"')
    expect(markup).toContain('data-slot="avatar"')
    // The body leaves the title out and keeps the rest.
    expect(markup).toContain('Paris')
  })

  it('keeps the checkbox slot shut until it is selected, then opens it to 24', () => {
    const shut = tag(
      html(
        <Density value="compact">
          <RecordCard fields={FIELDS} record={ACME} onSelectedChange={() => {}} />
        </Density>,
      ),
      'record-card-check',
    )
    expect(shut).toMatch(/_width-0px/)
    const open = tag(
      html(
        <Density value="compact">
          <RecordCard fields={FIELDS} record={ACME} selected onSelectedChange={() => {}} />
        </Density>,
      ),
      'record-card-check',
    )
    expect(open).toMatch(/_width-24px/)
  })

  it('opens once per press, on the card or on its chip, and the checkbox only selects', () => {
    const onPress = vi.fn()
    const onSelected = vi.fn()
    mount(<RecordCard fields={FIELDS} record={ACME} selected onPress={onPress} onSelectedChange={onSelected} />)
    act(() => (host.querySelector('[data-slot="record-card-body"]') as HTMLElement).click())
    expect(onPress).toHaveBeenCalledTimes(1)
    act(() => (host.querySelector('[data-slot="chip"]') as HTMLElement).click())
    expect(onPress).toHaveBeenCalledTimes(2)
    act(() => (host.querySelector('[role="checkbox"]') as HTMLElement).click())
    expect(onSelected).toHaveBeenCalledWith(false)
    expect(onPress).toHaveBeenCalledTimes(2)
  })

  it('is edged in the strong rim while active, and fades as a drag’s source', () => {
    const active = tag(
      html(
        <Density value="compact">
          <RecordCard fields={FIELDS} record={ACME} active />
        </Density>,
      ),
      'record-card',
    )
    expect(active).toMatch(/_btc-rim/)
    expect(active).toMatch(/_bg-hover/)
    const source = tag(
      html(
        <Density value="compact">
          <RecordCard fields={FIELDS} record={ACME} drag="source" />
        </Density>,
      ),
      'record-card',
    )
    expect(source).toMatch(/_o-0--3/)
  })
})

describe('the board', () => {
  it('compact: 200px columns headed by their Tag and count, with an add button named for the column', () => {
    const onCreate = vi.fn()
    mount(<BoardView fields={FIELDS} records={[ACME, GLOBEX]} groupField="stage" onCreate={onCreate} />)
    const cols = [...host.querySelectorAll('[data-slot="board-column"]')]
    expect(cols.length).toBeGreaterThanOrEqual(2)
    expect(cols[0].className).toMatch(/_width-200px/)
    expect(host.querySelector('[data-slot="tag"]')?.textContent).toContain('Lead')
    act(() => (host.querySelector('[aria-label="Add to Lead"]') as HTMLElement).click())
    expect(onCreate).toHaveBeenCalledWith('lead')
  })

  it('hands the selection and the open record to its cards', () => {
    mount(
      <BoardView
        fields={FIELDS}
        records={[ACME, GLOBEX]}
        groupField="stage"
        selectedIds={new Set(['acme'])}
        onSelectedChange={() => {}}
        activeId="globex"
      />,
    )
    const cards = [...host.querySelectorAll('[data-slot="record-card"]')]
    expect(cards.find((c) => c.textContent?.includes('Acme'))?.hasAttribute('data-selected')).toBe(true)
    expect(cards.find((c) => c.textContent?.includes('Globex'))?.hasAttribute('data-active')).toBe(true)
  })

  it('passes axe', async () => {
    mount(<BoardView fields={FIELDS} records={[ACME, GLOBEX]} groupField="stage" onOpen={() => {}} onSelectedChange={() => {}} onCreate={() => {}} />)
    expect(await audit(host)).toEqual([])
  })
})
