// @vitest-environment jsdom

/**
 * Snippet's three variants, its line/highlight accounting, its expand toggle,
 * and its copy-to-clipboard button — asserted on the compiled markup and on a
 * live tree, never on text alone, for the reason `accordion.test.tsx` gives:
 * @hanzo/gui drops an unrecognised prop with no throw and no type error.
 */
import { afterEach, describe, expect, it, vi } from 'vitest'
import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { renderToStaticMarkup } from 'react-dom/server'
import { GuiProvider } from '@hanzo/gui'

import config from '../../gui-config'
import { InlineCode, Snippet } from './snippet'

const wrap = (node: React.ReactNode) => (
  <GuiProvider config={config} defaultTheme="dark">
    {node}
  </GuiProvider>
)

const html = (node: React.ReactNode) => renderToStaticMarkup(wrap(node))

let root: Root | null = null
let host: HTMLDivElement | null = null

const mount = (node: React.ReactNode) => {
  ;(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true
  host = document.createElement('div')
  document.body.appendChild(host)
  root = createRoot(host)
  act(() => root!.render(wrap(node)))
  return host
}

afterEach(() => {
  if (root && host) act(() => root!.unmount())
  host?.remove()
  root = null
  host = null
})

const SAMPLE = 'const a = 1\nconst b = 2\nconst c = 3'

/** Each rendered line, as its own markup fragment (split at the next sibling). */
const snippetLines = (markup: string) =>
  markup.split('data-slot="snippet-line"').slice(1).map((s) => `data-slot="snippet-line"${s}`)

describe('Snippet', () => {
  it('renders one line per source line, numbered from 1', () => {
    const markup = html(<Snippet code={SAMPLE} />)
    const lines = [...markup.matchAll(/data-slot="snippet-line"[^>]*data-line="(\d+)"/g)].map(
      (m) => m[1],
    )

    expect(lines).toEqual(['1', '2', '3'])
    expect(markup).toContain('const a = 1')
    expect(markup).toContain('const b = 2')
  })

  it('numbers from startLineNumber', () => {
    const markup = html(<Snippet code={SAMPLE} startLineNumber={10} />)
    const lines = [...markup.matchAll(/data-line="(\d+)"/g)].map((m) => m[1])

    expect(lines).toEqual(['10', '11', '12'])
  })

  it('drops the gutter when showLineNumbers is false', () => {
    const shown = html(<Snippet code={SAMPLE} showLineNumbers />)
    const hidden = html(<Snippet code={SAMPLE} showLineNumbers={false} />)

    expect(shown).toContain('>1<')
    expect(hidden).not.toContain('>1<')
  })

  it('marks a highlighted line and leaves the others unmarked', () => {
    const markup = html(<Snippet code={SAMPLE} highlightLines={[2]} />)
    const rows = snippetLines(markup)

    expect(rows).toHaveLength(3)
    expect(rows[1]).toContain('data-highlighted="true"')
    expect(rows[0]).not.toContain('data-highlighted="true"')
    expect(rows[2]).not.toContain('data-highlighted="true"')
  })

  it('shows the filename and language, and hides the header entirely without either or a copy button', () => {
    const withHeader = html(<Snippet code={SAMPLE} filename="a.ts" language="typescript" />)
    const bare = html(<Snippet code={SAMPLE} language="" showCopyButton={false} />)

    expect(withHeader).toContain('a.ts')
    expect(withHeader).toContain('typescript')
    expect(bare).not.toContain('data-slot="snippet-header"')
    expect(bare).not.toContain('data-slot="snippet-language"')
  })

  it('renders variant="inline" as an inline code span with no header or gutter', () => {
    const markup = html(<Snippet code="const x = 1" variant="inline" />)

    expect(markup).toContain('data-variant="inline"')
    expect(markup).not.toContain('data-slot="snippet-header"')
    expect(markup).not.toContain('data-slot="snippet-line"')
    expect(markup).toContain('const x = 1')
  })

  it('InlineCode renders as an inline Snippet with no chrome', () => {
    const markup = html(<InlineCode language="ts">const x = 1</InlineCode>)

    expect(markup).toContain('data-variant="inline"')
    expect(markup).toContain('const x = 1')
    expect(markup).not.toContain('data-slot="snippet-header"')
  })

  it('renders variant="minimal" with a floating copy button and no border header', () => {
    const markup = html(<Snippet code={SAMPLE} variant="minimal" />)

    expect(markup).toContain('data-variant="minimal"')
    expect(markup).not.toContain('data-slot="snippet-header"')
    expect(markup).toContain('aria-label="Copy code"')
  })

  it('starts collapsed when expandable and expands on click', async () => {
    const el = mount(<Snippet code={SAMPLE} expandable maxHeight={600} collapsedHeight={100} />)
    const expandBtn = el.querySelector<HTMLButtonElement>('[aria-label="Expand"]')
    expect(expandBtn).toBeTruthy()

    const body = () => el.querySelector<HTMLElement>('[data-slot="snippet-body"]')
    expect(body()?.style.maxHeight).toBe('100px')

    await act(async () => {
      expandBtn!.click()
    })

    expect(el.querySelector('[aria-label="Collapse"]')).toBeTruthy()
    expect(body()?.style.maxHeight).toBe('600px')
  })

  it('copies the code to the clipboard and shows a confirmation', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined)
    Object.assign(navigator, { clipboard: { writeText } })
    vi.useFakeTimers()

    const el = mount(<Snippet code={SAMPLE} filename="a.ts" />)
    const button = el.querySelector<HTMLButtonElement>('[aria-label="Copy code"]')
    expect(button).toBeTruthy()

    await act(async () => {
      button!.click()
      await Promise.resolve()
    })

    expect(writeText).toHaveBeenCalledWith(SAMPLE)
    expect(el.querySelector('[aria-label="Copied"]')).toBeTruthy()

    act(() => {
      vi.advanceTimersByTime(2000)
    })
    expect(el.querySelector('[aria-label="Copy code"]')).toBeTruthy()

    vi.useRealTimers()
  })

  it('renders a distinct background per named theme', () => {
    const dark = html(<Snippet code={SAMPLE} theme="dark" />)
    const retro = html(<Snippet code={SAMPLE} theme="retro" />)
    const bg = (markup: string) => markup.match(/data-slot="snippet"[^>]*style="([^"]*)"/)?.[1]

    expect(bg(dark)).toBeTruthy()
    expect(bg(dark)).not.toBe(bg(retro))
  })
})
