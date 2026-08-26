// @vitest-environment jsdom

/**
 * Every block type renders, and renders its content.
 *
 * The whole point of this layer is that a page is DATA — so the thing worth
 * asserting is that data in produces markup out, for each type, through the
 * same dispatcher a site uses. A typecheck says nothing about a component that
 * throws on first paint, and these blocks came off a Tailwind build where every
 * layout class was resolved by an engine that is no longer here.
 */
import { describe, expect, it } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'
import { GuiProvider } from '@hanzo/gui'

import config from '../gui-config'
import { COMMON_GRID_2_COL } from '../types'
import { Content, registerBlockType } from './content'
import type { Block } from './def'
import { ScreenfulBlockComponent } from './screenful'

const html = (node: React.ReactNode) =>
  renderToStaticMarkup(
    <GuiProvider config={config as never} defaultTheme="dark">
      {node}
    </GuiProvider>,
  )

const draw = (blocks: Block | Block[], agent?: string) => html(<Content blocks={blocks} agent={agent} />)

/**
 * The markup with the provider's own wrapper taken off.
 *
 * GuiProvider emits a stylesheet and a `display: contents` span around whatever
 * it is given, so "this block rendered nothing" is never the empty string — it
 * is the wrapper on its own.
 */
const body = (markup: string) =>
  markup
    .replace(/<style[\s\S]*?<\/style>/g, '')
    .replace(/^<span[^>]*>/, '')
    .replace(/<\/span>$/, '')
    .replace(/<div style="display:contents"><\/div>/g, '')

describe('every block type draws its content', () => {
  it('heading — the heading and its byline', () => {
    const out = draw({
      blockType: 'heading',
      heading: 'Consensus',
      byline: 'Photon to Wave to Focus',
    } as Block)
    expect(out).toContain('Consensus')
    expect(out).toContain('Photon to Wave to Focus')
    // Level defaults to 3, and the byline sits two rungs below it.
    expect(out).toMatch(/<h3[^>]*>Consensus/)
    expect(out).toMatch(/<h5[^>]*>Photon/)
  })

  it('enh-heading — preheading, heading and byline, each at its own level', () => {
    const out = draw({
      blockType: 'enh-heading',
      preheading: { text: 'Lux', level: 4 },
      heading: { text: 'Quasar', level: 1 },
      byline: { text: 'Triple seal' },
    } as Block)
    expect(out).toMatch(/<h4[^>]*>Lux/)
    expect(out).toMatch(/<h1[^>]*>Quasar/)
    expect(out).toMatch(/<h6[^>]*>Triple seal/)
  })

  it('image — src, alt and the dimensions that reserve the box', () => {
    const out = draw({
      blockType: 'image',
      src: '/mark.svg',
      alt: 'the mark',
      dim: { w: 200, h: 100 },
    } as Block)
    expect(out).toContain('src="/mark.svg"')
    expect(out).toContain('alt="the mark"')
    expect(out).toContain('width="200"')
    expect(out).toContain('height="100"')
  })

  it('image — an absent alt falls back to the filename, not to undefined', () => {
    // The 5.x original read one past the end of the split, so this was the
    // literal string "undefined" on every image a site had not labelled.
    const out = draw({ blockType: 'image', src: '/a/b/mark.svg', dim: { w: 10, h: 10 } } as Block)
    expect(out).toContain('alt="mark.svg"')
    expect(out).not.toContain('alt="undefined"')
  })

  it('accordian — a trigger per item, each closed and holding no content yet', () => {
    const out = draw({
      blockType: 'accordian',
      items: [
        { trigger: 'What is Pulsar', content: 'A Ring-LWE threshold signature.' },
        { trigger: 'What is Prism', content: 'A cut.' },
      ],
    } as Block)
    expect(out).toContain('What is Pulsar')
    expect(out).toContain('What is Prism')
    // Both panels start closed, and a closed panel does not render its content
    // at all — so a page of twenty entries costs twenty headings, not twenty
    // bodies. Asserting the body were present would be asserting the opposite.
    expect(out.match(/data-slot="accordion-item"/g)).toHaveLength(2)
    expect(out).toContain('data-state="closed"')
    expect(out).not.toContain('A Ring-LWE threshold signature.')
  })

  it('grid — lays its cells out and draws each one', () => {
    const out = draw({
      blockType: 'grid',
      grid: COMMON_GRID_2_COL,
      cells: [
        { blockType: 'heading', heading: 'One' },
        { blockType: 'heading', heading: 'Two' },
      ],
    } as Block)
    expect(out).toContain('One')
    expect(out).toContain('Two')
  })

  it('bullet-cards — every card, with its text', () => {
    const out = draw({
      blockType: 'bullet-cards',
      grid: COMMON_GRID_2_COL,
      cards: [{ text: 'Byte-identical roots' }, { text: 'GPU-native VMs' }],
    } as Block)
    expect(out).toContain('Byte-identical roots')
    expect(out).toContain('GPU-native VMs')
  })

  it('space — a single height, resolved to pixels with no engine present', () => {
    // `h-8` is 32px on the spacing ramp. This is the assertion that says tw()
    // did the job the Tailwind build used to: a class went in, a real height
    // came out. Under the old setup an unsafelisted `h-8` resolved to nothing.
    const out = draw({ blockType: 'space', sizes: 8 } as Block)
    expect(out).toContain('_height-32px')
    // `invisible` converts too, so it is an opacity rather than a class name.
    // A spacer is decorative, so it also says so to a screen reader — opacity
    // alone leaves it in the accessibility tree.
    expect(out).toContain('_o-0')
    expect(out).toContain('aria-hidden')
  })

  it('space — the rung ladder gives every breakpoint its own height', () => {
    const out = draw({ blockType: 'space' } as Block)
    // SPACE_DEFAULTS starts at xs, which lands at the BASE rung — so the
    // smallest size is a plain height rather than a media-wrapped one.
    expect(out).toContain('_height-8px')
  })

  it('space — level 0 is a paragraph of height, not the rung ladder', () => {
    // `if (b.level)` read 0 as absent, so this branch was unreachable in 5.x.
    // h-4 is 16px.
    const out = draw({ blockType: 'space', level: 0 } as Block)
    expect(out).toContain('_height-16px')
  })

  it('card — title, byline and content', () => {
    const out = draw({
      blockType: 'card',
      title: 'Quasar',
      byline: 'Consensus',
      content: 'Photon, Wave, Focus.',
    } as Block)
    expect(out).toContain('Quasar')
    expect(out).toContain('Consensus')
    expect(out).toContain('Photon, Wave, Focus.')
  })

  it('carte-blanche — heading and body', () => {
    const out = draw({
      blockType: 'carte-blanche',
      heading: { blockType: 'enh-heading', heading: { text: 'Prism' } },
      content: [{ blockType: 'heading', heading: 'A cut' }],
    } as Block)
    expect(out).toContain('Prism')
    expect(out).toContain('A cut')
  })

  it('cta — renders each link with its href', () => {
    const out = draw({
      blockType: 'cta',
      elements: [
        { title: 'Docs', href: '/docs' },
        { title: 'Github', href: 'https://github.com/luxfi' },
      ],
    } as Block)
    expect(out).toContain('href="/docs"')
    expect(out).toContain('href="https://github.com/luxfi"')
    expect(out).toContain('Docs')
    // An external link opens away and must not hand over the opener.
    expect(out).toContain('rel="noreferrer noopener"')
  })

  it('group — needs a layout hint, and says so when it is wrong', () => {
    expect(draw({ blockType: 'group', specifiers: 'layout-grid-99-starting-md', elements: [] } as Block))
      .toContain('invalid or missing layout specifier')
    const ok = draw({
      blockType: 'group',
      specifiers: 'layout-grid-3-starting-md',
      elements: [{ blockType: 'heading', heading: 'In a group' }],
    } as Block)
    expect(ok).toContain('In a group')
  })

  it('element — hands back the node it was given', () => {
    const out = draw({ blockType: 'element', element: <p>verbatim</p> } as Block)
    expect(out).toContain('<p>verbatim</p>')
  })

  it('screenful — draws its columns', () => {
    const out = html(
      <ScreenfulBlockComponent
        block={{
          blockType: 'screenful',
          contentColumns: [
            [{ blockType: 'heading', heading: 'Left' }],
            [{ blockType: 'heading', heading: 'Right' }],
          ],
        } as Block}
        agent="desktop"
      />,
    )
    expect(out).toContain('Left')
    expect(out).toContain('Right')
  })
})

describe('no unqualified class reaches the document', () => {
  /**
   * These blocks came off a Tailwind build, so every layout class in them was
   * resolved by an engine that is no longer here. A class that survives to the
   * markup now is two failures at once: the element is unstyled, and the name
   * sits in the global scope where a consumer's own `.flex` can catch it.
   *
   * This is the assertion the source scan in styles.test.tsx stands in for. It
   * renders instead of reading, so it cannot be fooled by a call site the
   * scanner's regex does not recognise.
   */
  const KNOWN = /^(_|r-|css-|is_|t_|font_|hz-|btn|glass$|elevation-\d)/

  const stray = (markup: string) =>
    [
      ...new Set(
        [...markup.matchAll(/class="([^"]*)"/g)]
          .flatMap((m) => m[1].split(/\s+/))
          .filter((t) => t && !KNOWN.test(t)),
      ),
    ].sort()

  const CASES: [string, Block][] = [
    ['heading', { blockType: 'heading', heading: 'H', byline: 'B' } as Block],
    ['enh-heading', { blockType: 'enh-heading', heading: { text: 'H' }, byline: { text: 'B' } } as Block],
    ['image', { blockType: 'image', src: '/a.png', dim: { w: 4, h: 2 } } as Block],
    ['accordian', { blockType: 'accordian', items: [{ trigger: 'T', content: 'C' }] } as Block],
    ['space', { blockType: 'space', sizes: 4 } as Block],
    ['grid', { blockType: 'grid', grid: COMMON_GRID_2_COL, cells: [{ blockType: 'heading', heading: 'C' }] } as Block],
    ['bullet-cards', { blockType: 'bullet-cards', grid: COMMON_GRID_2_COL, cards: [{ text: 'T' }] } as Block],
    ['card', { blockType: 'card', title: 'T', byline: 'B', content: 'C' } as Block],
    ['carte-blanche', { blockType: 'carte-blanche', heading: { blockType: 'enh-heading', heading: { text: 'H' } }, content: [{ blockType: 'heading', heading: 'C' }] } as Block],
    ['cta', { blockType: 'cta', elements: [{ title: 'D', href: '/d' }] } as Block],
    ['group', { blockType: 'group', specifiers: 'layout-grid-2-starting-md', elements: [{ blockType: 'heading', heading: 'G' }] } as Block],
  ]

  for (const [name, block] of CASES) {
    it(`${name} emits only classes something defines`, () => {
      const left = stray(draw(block))
      expect(left, `${name} leaked: ${left.join(', ')}`).toEqual([])
    })
  }

  it('screenful emits only classes something defines', () => {
    const left = stray(
      html(
        <ScreenfulBlockComponent
          block={{ blockType: 'screenful', contentColumns: [[{ blockType: 'heading', heading: 'L' }]] } as Block}
          agent="desktop"
        />,
      ),
    )
    expect(left, `screenful leaked: ${left.join(', ')}`).toEqual([])
  })
})

describe('the dispatcher', () => {
  it('draws a list in order', () => {
    const out = draw([
      { blockType: 'heading', heading: 'First' } as Block,
      { blockType: 'heading', heading: 'Second' } as Block,
    ])
    expect(out.indexOf('First')).toBeLessThan(out.indexOf('Second'))
  })

  it('an unknown type draws nothing rather than throwing', () => {
    // A page from a CMS can name a block this build does not have. Skipping it
    // is what lets the rest of the page render.
    expect(body(draw({ blockType: 'no-such-thing' } as Block))).toBe('')
  })

  it('undefined draws nothing', () => {
    expect(body(draw(undefined as never))).toBe('')
  })

  it('a registered type replaces the shipped one — the substitution point', () => {
    // This is how a Next host swaps in its optimizing image without the library
    // ever importing a framework.
    registerBlockType('image', ({ block }) => <i>{(block as { src?: string }).src}</i>)
    expect(draw({ blockType: 'image', src: '/x.png', dim: { w: 1, h: 1 } } as Block)).toContain(
      '<i>/x.png</i>',
    )
  })
})
