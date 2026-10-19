// @vitest-environment jsdom

/**
 * The small data-hue parts — IconTile, ColorSample, StackIcon — and the two
 * typography folds, Label's section variant and Heading's tone, plus Crossfade.
 */
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { GuiProvider } from '@hanzo/gui'

import config from '../../gui-config'
import { IconTile, tileTones } from './icon-tile'
import { ColorSample } from './color-sample'
import { StackIcon } from './stack-icon'
import { Label } from './label'
import { Heading } from './heading'
import { Tags } from './tags'
import { Crossfade } from '../../motion'

const html = (node: React.ReactNode) =>
  renderToStaticMarkup(<GuiProvider config={config} defaultTheme="dark">{node}</GuiProvider>)
const tag = (markup: string, slot: string) => markup.match(new RegExp(`<[a-z0-9]+[^>]*data-slot="${slot}"[^>]*>`))?.[0] ?? ''

describe('IconTile', () => {
  it('16px, 4px corner, step 4 under a step 10 glyph, decorative', () => {
    const Icon = ({ color, size }: { color?: string; size?: number }) => <i data-c={color} data-s={size} />
    const markup = html(<IconTile color="sky" icon={<Icon />} />)
    const el = tag(markup, 'icon-tile')
    expect(el).toMatch(/_width-16px/)
    expect(el).toMatch(/_btlr-c-radius-xs/)
    expect(el).toContain('--tone-4:var(--data-sky-4)')
    expect(el).toContain('aria-hidden="true"')
    expect(markup).toContain('data-c="var(--tone-10)"')
    expect(tileTones('red')).toEqual({ fill: 'var(--data-red-4)', glyph: 'var(--data-red-10)' })
  })
})

describe('ColorSample', () => {
  it('a 12x16 capsule, or a 16px circle, step 3 inside a step 11 edge', () => {
    const cap = tag(html(<ColorSample colorName="pink" />), 'color-sample')
    expect(cap).toMatch(/_width-12px/)
    expect(cap).toMatch(/_height-16px/)
    expect(cap).toContain('--tone-11:var(--data-pink-11)')
    expect(tag(html(<ColorSample colorName="pink" variant="circle" />), 'color-sample')).toMatch(/_width-16px/)
    expect(tag(html(<ColorSample color="#123456" />), 'color-sample')).toContain('background-color:#123456')
  })
})

describe('StackIcon', () => {
  it('pins the second icon at 8 from the left and 7 from the top', () => {
    const markup = html(<StackIcon icon={<i />} stackedIcon={<b />} />)
    expect(markup).toMatch(/_l-8px/)
    expect(markup).toMatch(/_t-7px/)
  })
})

describe('Label section', () => {
  it('is 12px semibold in the tertiary ink; the default label is untouched', () => {
    const el = tag(html(<Label variant="section">Favorites</Label>), 'label')
    expect(el).toContain('data-variant="section"')
    expect(el).toMatch(/_col-hint/)
    expect(tag(html(<Label>Name</Label>), 'label')).toMatch(/_col-ink/)
  })
})

describe('Heading tone', () => {
  it('secondary and tertiary read in the design text ranks', () => {
    expect(html(<Heading tone="secondary">x</Heading>)).toMatch(/_col-aside/)
    expect(html(<Heading tone="tertiary">x</Heading>)).toMatch(/_col-hint/)
  })
})

describe('Tags', () => {
  it('a coloured entry is a Tag, a plain one the badge it always was', () => {
    const markup = html(<Tags tags={[{ id: 'a', label: 'Lead', color: 'sky' }, { id: 'b', label: 'Plain' }]} onRemove={() => {}} />)
    expect(markup).toContain('data-slot="tag"')
    expect(markup).toContain('data-slot="badge"')
    expect(markup.split('aria-label="Remove').length - 1).toBe(2)
  })
})

describe('Crossfade', () => {
  it('shows the active icon and hides the other, both in one 14px place', () => {
    const markup = html(<Crossfade isActive activeIcon={<b data-on />} inactiveIcon={<b data-off />} />)
    expect(tag(markup, 'crossfade')).toMatch(/_width-14px/)
    expect(markup).toMatch(/aria-hidden="true"[^>]*><b data-off/)
  })
})
