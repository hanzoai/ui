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

    const [active, inactive] = [classesOf(tags[0]), classesOf(tags[1])]

    // The bug: identical class sets — nothing tells the reader which tab is chosen.
    expect([...active].sort()).not.toEqual([...inactive].sort())

    // The activeStyle background lands on the active tab and on no other.
    const onlyActive = [...active].filter((c) => !inactive.has(c))
    expect(bgClass(new Set(onlyActive))).not.toBe('')
    expect(bgClass(classesOf(tags[2]))).toBe(bgClass(inactive)) // c is inactive, like b
  })
})
