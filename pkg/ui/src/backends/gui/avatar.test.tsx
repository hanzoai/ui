// @vitest-environment jsdom

/**
 * Avatar keeps its 32px account look when given nothing new, and draws the
 * record avatar — five sizes, three shapes, an initial in the name's hue — when
 * given a size. The hue is the source kit's string hash, so a record keeps the
 * colour it had there.
 */
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { GuiProvider } from '@hanzo/gui'
import { hueOf, hues } from '@hanzo/tokens/data'

import config from '../../gui-config'
import { Avatar, AvatarFallback, initialOf } from './avatar'

const html = (node: React.ReactNode) =>
  renderToStaticMarkup(<GuiProvider config={config} defaultTheme="dark">{node}</GuiProvider>)
const tag = (markup: string, slot = 'avatar') => markup.match(new RegExp(`<[a-z0-9]+[^>]*data-slot="${slot}"[^>]*>`))?.[0] ?? ''

/** The source kit's stringToThemeColor, written out here as the reference. */
const reference = (s: string) => {
  let hash = 0
  for (let i = 0; i < s.length; i++) hash = s.charCodeAt(i) + ((hash << 5) - hash)
  return hues[Math.abs(hash) % hues.length]
}

describe('hueOf', () => {
  it.each(['', 'a', 'Acme', 'Ada Lovelace', '6f1c2d3e-0000-4000-8000-123456789abc', 'x'.repeat(400), 'Ωμέγα 漢字'])(
    'matches the source kit’s formula on %s',
    (seed) => expect(hueOf(seed)).toBe(reference(seed)),
  )

  it('lands on known hues', () => {
    expect(hueOf('Acme')).toBe('green')
    expect(hueOf('Ada Lovelace')).toBe('brown')
  })
})

describe('initialOf', () => {
  it('is the first character, trimmed and uppercased; a dash with none', () => {
    expect(initialOf('  ada')).toBe('A')
    expect(initialOf('')).toBe('-')
    expect(initialOf(null)).toBe('-')
    expect(initialOf('😀 smile')).toBe('😀')
  })
})

describe('Avatar', () => {
  it('with nothing new it is the 32px circle it always was', () => {
    const markup = html(
      <Avatar>
        <AvatarFallback>AB</AvatarFallback>
      </Avatar>,
    )
    const el = tag(markup)
    expect(el).not.toContain('data-size')
    expect(el).not.toContain('--tone-')
    expect(markup).toContain('AB')
  })

  it('a number is a box, as it was before the record sizes: the account circle at that size', () => {
    // hanzo.app's settings draw <Avatar size={32}> and <Avatar size={64}>.
    const el = tag(
      html(
        <Avatar size={64}>
          <AvatarFallback>AB</AvatarFallback>
        </Avatar>,
      ),
    )
    expect(el).not.toContain('data-size')
    expect(el).toMatch(/_width-64px/)
    expect(el).not.toMatch(/_btlr-c-radius-2x/)
  })

  it.each([
    ['xs', 12],
    ['sm', 14],
    ['md', 16],
    ['lg', 24],
    ['xl', 40],
  ] as const)('%s is %ipx, square by default', (size, px) => {
    const el = tag(html(<Avatar size={size} name="Acme" />))
    expect(el).toContain(`data-size="${size}"`)
    expect(el).toMatch(new RegExp(`_width-${px}px`))
    expect(el).toMatch(/_btlr-c-radius-2x/)
  })

  it('rounded and circle corners', () => {
    expect(tag(html(<Avatar size="lg" shape="rounded" name="a" />))).toMatch(/_btlr-c-radius-xs/)
    expect(tag(html(<Avatar size="lg" shape="circle" name="a" />))).toMatch(/radius-10|100000|9999/)
  })

  it('the initial is the name’s, in its hue: step 12 on step 4', () => {
    const markup = html(<Avatar size="md" name="Acme" />)
    expect(tag(markup)).toContain(`--tone-4:var(--data-${hueOf('Acme')}-4)`)
    expect(markup).toContain('>A<')
    expect(tag(markup, 'avatar-fallback')).toMatch(/_bg-var\(--tone-4\)|_bg-[^\s"]*tone/)
  })

  it('the colour follows the seed, not the name', () => {
    const a = tag(html(<Avatar size="md" name="Old name" colorSeed="rec_1" />))
    const b = tag(html(<Avatar size="md" name="New name" colorSeed="rec_1" />))
    expect(a.match(/--tone-4:[^;"]+/)?.[0]).toBe(b.match(/--tone-4:[^;"]+/)?.[0])
  })

  it('outline draws the step 6 edge on a step 5 fill', () => {
    const markup = html(<Avatar size="lg" name="Grace" variant="outline" />)
    expect(tag(markup, 'avatar-fallback')).toMatch(/_btw-1px/)
  })

  it('no name: a dash on the hover ground', () => {
    const markup = html(<Avatar size="lg" name="" />)
    expect(markup).toContain('>-<')
    expect(tag(markup, 'avatar-fallback')).toMatch(/_bg-hover/)
  })

  it('a ring separates it from its neighbours; a press makes it a button', () => {
    expect(tag(html(<Avatar size="lg" name="a" ring />))).toMatch(/box-shadow:0 0 0 1px var\(--border\)/)
    expect(tag(html(<Avatar size="lg" name="a" onPress={() => {}} />))).toMatch(/role="button"/)
    expect(tag(html(<Avatar size="lg" name="a" pulsing />))).toContain('data-motion="pulse"')
  })
})
