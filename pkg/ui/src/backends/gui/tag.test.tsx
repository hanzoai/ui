// @vitest-environment jsdom

/**
 * Tag draws a data hue: the element states the hue once as custom properties
 * (`--tone-3: var(--data-red-3)`), and the frame and label read `var(--tone-…)`
 * through one class each. Asserted on server markup, where a style that never
 * reached a rule cannot pass.
 */
import { describe, expect, it } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'
import { GuiProvider } from '@hanzo/gui'

import config from '../../gui-config'
import { Tag } from './tag'

const html = (node: React.ReactNode, theme: 'dark' | 'light' = 'dark') =>
  renderToStaticMarkup(
    <GuiProvider config={config} defaultTheme={theme}>
      {node}
    </GuiProvider>,
  )

const tag = (markup: string, slot = 'tag') =>
  markup.match(new RegExp(`<[a-z0-9]+[^>]*data-slot="${slot}"[^>]*>`))?.[0] ?? ''

describe('Tag', () => {
  it('soft: the hue’s step 3 fill under step 11 ink, 20px, 8px gutter, 4px radius', () => {
    const markup = html(<Tag color="red">Qualified</Tag>)
    const el = tag(markup)
    expect(el.startsWith('<span')).toBe(true)
    expect(el).toContain('data-color="red"')
    expect(el).toContain('--tone-3:var(--data-red-3)')
    expect(el).toContain('--tone-11:var(--data-red-11)')
    expect(el).toMatch(/_height-20px/)
    expect(el).toMatch(/_pl-c-space-2/)
    expect(el).toMatch(/_btlr-c-radius-xs/)
    expect(markup).toContain('Qualified')
  })

  it('one class per step, whatever the hue', () => {
    const a = tag(html(<Tag color="red">a</Tag>)).match(/_bg-[^\s"]+/)?.[0]
    const b = tag(html(<Tag color="sky">b</Tag>)).match(/_bg-[^\s"]+/)?.[0]
    expect(a).toBeDefined()
    expect(a).toBe(b)
  })

  it('an unknown colour reads as gray', () => {
    expect(tag(html(<Tag color="chartreuse">x</Tag>))).toContain('data-color="gray"')
  })

  it('transparent has no fill and the secondary ink', () => {
    const markup = html(<Tag color="transparent">None</Tag>)
    expect(tag(markup)).toMatch(/_bg-transparent/)
    expect(markup).toMatch(/_col-aside/)
  })

  it('outline draws the strong edge, dashed on request', () => {
    const el = tag(html(<Tag variant="outline" borderStyle="dashed">No value</Tag>))
    expect(el).toMatch(/_btw-1px/)
    expect(el).toMatch(/_btc-rim/)
    expect(el).toMatch(/dashed/)
  })

  it('solid swaps the ink onto the ground', () => {
    const markup = html(<Tag color="green" variant="solid">Won</Tag>)
    expect(markup).toMatch(/_col-background/)
  })

  it('is a button when pressable and a link when given an address', () => {
    expect(tag(html(<Tag onPress={() => {}}>x</Tag>))).toMatch(/role="button"/)
    expect(tag(html(<Tag href="/x">x</Tag>)).startsWith('<a')).toBe(true)
  })

  it('a start icon takes the tag’s size and ink', () => {
    const Icon = ({ size, color }: { size?: number; color?: string }) => <i data-icon data-size={size} data-color={color} />
    const markup = html(<Tag color="blue" startIcon={<Icon />}>x</Tag>)
    expect(markup).toContain('data-size="14"')
    expect(markup).toContain('data-color="var(--tone-11)"')
  })
})
