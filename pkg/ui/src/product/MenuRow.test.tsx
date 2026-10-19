// @vitest-environment jsdom

/**
 * MenuRow keeps the sheet row OrgSwitcher and UserMenu were drawn with, and its
 * `row` size is the record geometry; the shared anatomy draws contextual text,
 * keys, the icon well, a grip, the submenu chevron and trailing actions.
 * Asserted on server-rendered markup: gui compiles each box to an atomic class,
 * so the class is the rendered size.
 */
import { describe, expect, it } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'
import { GuiProvider } from '@hanzo/gui'

import config from '../gui-config'
import { MenuRow } from './MenuRow'

const html = (node: React.ReactNode) =>
  renderToStaticMarkup(
    <GuiProvider config={config} defaultTheme="dark">
      {node}
    </GuiProvider>,
  ).replace(/<style[^>]*>[\s\S]*?<\/style>/g, '')

/** The row's own opening tag: the first element carrying a menu role. */
const rowTag = (markup: string) => markup.match(/<[a-z]+[^>]*role="menuitem(radio)?"[^>]*>/)?.[0] ?? ''
const NOOP = () => {}

describe('MenuRow', () => {
  it('the default is the sheet row: 8 round, 8 inset, 10 between, a $raised hover', () => {
    const el = rowTag(html(<MenuRow label="Settings" onPress={NOOP} />))
    expect(el).toMatch(/_btlr-c-radius-3/)
    expect(el).toMatch(/_pl-c-space-2/)
    expect(el).toMatch(/_gap-c-space-2--/)
    expect(el).toMatch(/_bg-0hover-raised/)
  })

  it('the sheet row keeps its red for danger; the record row reads the error state', () => {
    expect(html(<MenuRow label="Sign out" danger onPress={NOOP} />)).toMatch(/_col-red10/)
    expect(html(<MenuRow size="row" label="Delete" danger onPress={NOOP} />)).toMatch(/_col-bad/)
  })

  it('size row is the record geometry: 32 floor, 4 inset, 8 between, 4 corner, hover rung, the secondary ink', () => {
    const markup = html(<MenuRow size="row" label="People" onPress={NOOP} />)
    const el = rowTag(markup)
    expect(el).toMatch(/_minH-32px/)
    expect(el).toMatch(/_pl-4px/)
    expect(el).toMatch(/_gap-8px/)
    expect(el).toMatch(/_btlr-c-radius-xs/)
    expect(el).toMatch(/_bg-0hover-hover/)
    expect(el).toMatch(/_minH-_touchable|data-touch-y/)
    expect(markup).toMatch(/_col-aside/)
  })

  it('a row that can be current is a menuitemradio; one that cannot is a menuitem', () => {
    expect(rowTag(html(<MenuRow label="Acme" active onPress={NOOP} />))).toMatch(/role="menuitemradio"[^>]*aria-checked="true"|aria-checked="true"[^>]*role="menuitemradio"/)
    expect(rowTag(html(<MenuRow label="Settings" onPress={NOOP} />))).toContain('role="menuitem"')
  })

  it('draws contextual text on either side, and keys as a chord', () => {
    const left = html(<MenuRow size="row" label="Companies" contextual="12" onPress={NOOP} />)
    expect(left.indexOf('Companies')).toBeLessThan(left.indexOf('>12<'))
    expect(left).toMatch(/_col-hint/)
    const keys = html(<MenuRow size="row" label="Copy" shortcut={['⌘', 'L']} onPress={NOOP} />)
    expect(keys.match(/data-slot="kbd"/g)).toHaveLength(2)
    expect(keys).toContain('data-slot="kbd-group"')
  })

  it('seats an icon in its well, swaps a grip in, and turns an open submenu chevron', () => {
    expect(html(<MenuRow size="row" label="X" icon={<i data-icon />} iconContainer onPress={NOOP} />)).toMatch(/_bg-hover[^-]/)
    const grip = html(<MenuRow size="row" label="Name" icon={<i data-icon />} grip="always" onPress={NOOP} />)
    expect(grip).not.toContain('data-icon')
    expect(html(<MenuRow size="row" label="Sort" submenu="open" onPress={NOOP} />)).toContain('data-open=""')
  })

  it('hides hover actions until reached, shows `always` ones, and keeps them on touch', () => {
    const hover = html(<MenuRow size="row" label="Phones" actions={<b>edit</b>} onPress={NOOP} />)
    const actions = hover.match(/<[a-z]+[^>]*data-slot="menu-row-actions"[^>]*>/)![0]
    expect(actions).toMatch(/_o-0\b/)
    expect(actions).toMatch(/_o-_touchable_1|_touchable/)
    const always = html(<MenuRow size="row" label="Links" actions={<b>edit</b>} actionsVisibility="always" onPress={NOOP} />)
    expect(always.match(/<[a-z]+[^>]*data-slot="menu-row-actions"[^>]*>/)![0]).toMatch(/_o-1\b/)
  })

  it('a suggestion row the caret is on is a rung stronger than hover, and says it is selected', () => {
    const el = rowTag(html(<MenuRow size="row" label="Ada" variant="suggestion" selected onPress={NOOP} />))
    expect(el).toMatch(/_bg-raised/)
    expect(el).toContain('aria-selected="true"')
  })

  it('a disabled row says so and is not pressable', () => {
    const el = rowTag(html(<MenuRow size="row" label="Off" disabled onPress={NOOP} />))
    expect(el).toContain('aria-disabled="true"')
    expect(el).toMatch(/_o-0--5/)
  })
})
