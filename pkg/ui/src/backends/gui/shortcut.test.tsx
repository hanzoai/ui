// @vitest-environment jsdom

/**
 * Shortcut: key names per platform, one combination or a sequence, one spoken
 * label for the whole thing with the caps hidden, and three looks.
 */
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { GuiProvider } from '@hanzo/gui'

import config from '../../gui-config'
import { Shortcut, formatShortcut, speakShortcut, keyName } from './shortcut'
import { Kbd } from './kbd'

const html = (node: React.ReactNode) =>
  renderToStaticMarkup(<GuiProvider config={config} defaultTheme="dark">{node}</GuiProvider>)
const tag = (markup: string, slot: string) => markup.match(new RegExp(`<[a-z0-9]+[^>]*data-slot="${slot}"[^>]*>`))?.[0] ?? ''

describe('formatShortcut', () => {
  it('Mod is ⌘ on a Mac and Ctrl elsewhere', () => {
    expect(formatShortcut(['Mod', 'K'], { platform: 'mac' })).toBe('⌘K')
    expect(formatShortcut(['Mod', 'K'], { platform: 'other' })).toBe('Ctrl K')
    expect(formatShortcut(['CommandOrControl', 'Enter'], { platform: 'mac' })).toBe('⌘⏎')
  })

  it('Alt is ⌥ on a Mac; Command is ⌘ everywhere', () => {
    expect(formatShortcut(['Alt', 'Shift', 'F'], { platform: 'mac' })).toBe('⌥⇧F')
    expect(formatShortcut(['Command', 'P'], { platform: 'other' })).toBe('⌘ P')
  })

  it('a sequence joins its combinations with "then"', () => {
    expect(formatShortcut([['G'], ['P']], { platform: 'other' })).toBe('G then P')
    expect(formatShortcut([['g'], ['p']], { platform: 'mac', sequenceJoinLabel: 'and' })).toBe('G and P')
  })
})

describe('speakShortcut', () => {
  it('spells each key out', () => {
    expect(speakShortcut(['Mod', 'K'], 'mac')).toBe('Command + K')
    expect(speakShortcut(['Mod', 'K'], 'other')).toBe('Control + K')
    expect(speakShortcut([['G'], ['P']], 'mac')).toBe('G then P')
    expect(speakShortcut(['Escape'], 'mac')).toBe('Escape')
    expect(keyName('ArrowUp', 'other').glyph).toBe('↑')
  })
})

describe('Shortcut', () => {
  it('is one image named in words; the caps inside are hidden', () => {
    const markup = html(<Shortcut keys={['Mod', 'K']} platform="mac" />)
    const el = tag(markup, 'shortcut')
    expect(el).toContain('role="img"')
    expect(el).toContain('aria-label="Command + K"')
    expect(markup).toMatch(/aria-hidden="true"[^>]*>/)
    expect(markup.split('data-variant="cap"').length - 1).toBe(2)
  })

  it('the text variant is plain text', () => {
    const markup = html(<Shortcut keys={['Shift', 'Enter']} variant="text" platform="mac" />)
    expect(markup).toContain('⇧⏎')
    expect(markup).not.toContain('data-slot="kbd"')
  })

  it('the button variant dims and leads with a divider', () => {
    const el = tag(html(<Shortcut keys={['Mod', 'Enter']} variant="button" platform="mac" />), 'shortcut')
    expect(el).toMatch(/_o-0--5/)
    expect(el).toMatch(/_ml-c-space-1/)
  })

  it('desktop visibility hides it under a coarse pointer', () => {
    expect(tag(html(<Shortcut keys={['Escape']} visibility="desktop" />), 'shortcut')).toMatch(/touchable/)
  })

  it('renders the server answer without a navigator', () => {
    expect(tag(html(<Shortcut keys={['Mod', 'K']} />), 'shortcut')).toContain('aria-label="Control + K"')
  })
})

describe('Kbd variant="cap"', () => {
  it('is an 18px keycap with an edge and the underline; the default stays flat', () => {
    const cap = tag(html(<Kbd variant="cap">K</Kbd>), 'kbd')
    expect(cap).toMatch(/_height-18px/)
    expect(cap).toMatch(/_btw-1px/)
    expect(cap).toMatch(/_bg-panel/)
    expect(cap).toMatch(/box-shadow:var\(--shadow-underline/)
    const flat = tag(html(<Kbd>K</Kbd>), 'kbd')
    expect(flat).toMatch(/_height-20px/)
    expect(flat).not.toMatch(/box-shadow/)
  })

  it('a keycap reads its legend in the secondary rank; the flat chip keeps the quiet rung', () => {
    expect(html(<Kbd variant="cap">K</Kbd>)).toMatch(/_col-aside[^"]*"[^>]*>K</)
    expect(html(<Kbd>K</Kbd>)).toMatch(/_col-quiet[^"]*"[^>]*>K</)
  })
})
