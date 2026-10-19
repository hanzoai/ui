// @vitest-environment jsdom

/**
 * The selected tab has to LOOK selected. gui's `Tabs.Tab` spreads `activeStyle`
 * only onto the tab whose `value` is current, and the `unstyled` frame drops its
 * own active default — so a `TabsTrigger` that never passes `activeStyle` paints
 * the chosen tab identically to the rest, and the row reads as though nothing is
 * chosen. This asserts on the COMPILED classes, not on any computed style
 * (jsdom resolves the cascade for the first element only) and not on the text
 * (gui drops an unknown prop with no throw): the active trigger must carry a
 * background atomic class that its inactive siblings do not.
 *
 * Imports `./tabs` directly, not the backend barrel, so a sibling component's
 * dependency moving cannot fail this.
 */
import { describe, expect, it } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'
import { GuiProvider } from '@hanzo/gui'

import config from '../../gui-config'
import { Tabs, TabsList, TabsTrigger, TabsContent } from './tabs'

const html = (node: React.ReactNode) =>
  renderToStaticMarkup(
    <GuiProvider config={config} defaultTheme="dark">
      {node}
    </GuiProvider>,
  )

const three = () => (
  <Tabs defaultValue="a">
    <TabsList>
      {['a', 'b', 'c'].map((v) => (
        <TabsTrigger key={v} value={v}>
          tab {v}
        </TabsTrigger>
      ))}
    </TabsList>
    <TabsContent value="a">body a</TabsContent>
    <TabsContent value="b">body b</TabsContent>
    <TabsContent value="c">body c</TabsContent>
  </Tabs>
)

/** Every `data-slot="tabs-trigger"` open tag, in document order. */
const triggerTags = (markup: string) =>
  markup.match(/<[a-z0-9]+[^>]*data-slot="tabs-trigger"[^>]*>/g) ?? []

/** The atomic class tokens on one open tag. */
const classesOf = (tag: string) => new Set((tag.match(/class="([^"]*)"/)?.[1] ?? '').split(/\s+/).filter(Boolean))

/** Tamagui's atomic class for a background value, whatever the abbreviation. */
const bgClass = (cls: Set<string>) => [...cls].find((c) => /^_(bg|background)/.test(c)) ?? ''

describe('Tabs selected state', () => {
  it('paints the active tab differently from its inactive siblings', () => {
    const tags = triggerTags(html(three()))
    expect(tags).toHaveLength(3)

    const [active, inactive] = [classesOf(tags[0]!), classesOf(tags[1]!)]

    // The bug: identical class sets — nothing tells the reader which tab is chosen.
    expect([...active].sort()).not.toEqual([...inactive].sort())

    // The activeStyle background lands on the active tab and on no other.
    const onlyActive = [...active].filter((c) => !inactive.has(c))
    expect(bgClass(new Set(onlyActive))).not.toBe('')
    expect(bgClass(classesOf(tags[2]!))).toBe(bgClass(inactive)) // c is inactive, like b
  })
})

describe('Tabs variant line', () => {
  const strip = () =>
    html(
      <Tabs variant="line" defaultValue="b">
        <TabsList>
          <TabsTrigger value="a" startIcon={<i data-icon />} badge={<b data-badge>3</b>}>
            tab a
          </TabsTrigger>
          <TabsTrigger value="b">tab b</TabsTrigger>
          <TabsTrigger value="c" size="sm" highlighted>
            tab c
          </TabsTrigger>
        </TabsList>
      </Tabs>,
    )

  it('is a transparent list over a 1px baseline, tabs 40px tall', () => {
    const markup = strip()
    const list = markup.match(/<[a-z0-9]+[^>]*data-slot="tabs-list"[^>]*>/)![0]
    expect(list).toMatch(/_borderBottomWidth-1px/)
    expect(list).toMatch(/_bg-transparent/)
    for (const tag of triggerTags(markup)) expect(tag).toMatch(/_minH-40px/)
  })

  it('draws the ink line under the chosen tab only, and its label in full ink', () => {
    const markup = strip()
    expect(markup.match(/data-slot="tabs-indicator"/g)).toHaveLength(1)
    const chosen = triggerTags(markup).findIndex((t) => t.includes('data-chosen'))
    expect(chosen).toBe(1)
    expect(markup).toMatch(/_bg-ink/)
  })

  it('seats the icon and the badge round the label, and rings a highlighted tab', () => {
    const markup = strip()
    expect(markup.indexOf('data-icon')).toBeLessThan(markup.indexOf('tab a'))
    expect(markup.indexOf('tab a')).toBeLessThan(markup.indexOf('data-badge'))
    expect(markup).toMatch(/_outlineWidth-1px/)
  })

  it('the default variant is still the segmented pill', () => {
    const list = html(three()).match(/<[a-z0-9]+[^>]*data-slot="tabs-list"[^>]*>/)![0]
    expect(list).toMatch(/_height-36px/)
  })
})
