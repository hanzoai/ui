// @vitest-environment jsdom

/**
 * Badge: today's 24px label when no size is named, the record counts (14 / 16
 * / 18 pills) when one is, a circle for one digit, and the three record colours.
 */
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { GuiProvider } from '@hanzo/gui'

import config from '../../gui-config'
import { Badge } from './badge'

const html = (node: React.ReactNode) =>
  renderToStaticMarkup(<GuiProvider config={config} defaultTheme="dark">{node}</GuiProvider>)
const tag = (markup: string) => markup.match(/<[a-z0-9]+[^>]*data-slot="badge"[^>]*>/)?.[0] ?? ''

describe('Badge', () => {
  it('with no size it is the 24px label it always was', () => {
    const el = tag(html(<Badge>New</Badge>))
    expect(el).toMatch(/_minH-24px/)
    expect(el).not.toContain('data-size')
  })

  it.each([
    ['xs', 14],
    ['sm', 16],
    ['md', 18],
  ] as const)('%s is a %ipx pill', (size, px) => {
    const el = tag(html(<Badge size={size}>3</Badge>))
    expect(el).toMatch(new RegExp(`_height-${px}px`))
    expect(el).toMatch(/_btlr-c-radius-10/)
  })

  it('circle: width equals height, no gutter', () => {
    const el = tag(html(<Badge size="sm" shape="circle">2</Badge>))
    expect(el).toMatch(/_width-16px/)
    expect(el).toMatch(/_pl-0px/)
  })

  it('muted, accent and inherit', () => {
    expect(html(<Badge size="sm" variant="muted">1</Badge>)).toMatch(/_col-soft/)
    const accent = html(<Badge size="sm" variant="accent">1</Badge>)
    expect(tag(accent)).toMatch(/_bg-var\(--primary\)|primary/)
    expect(tag(html(<Badge size="sm" variant="inherit">1</Badge>))).toMatch(/color-mix\(in srgb, currentColor 16%/)
  })
})
