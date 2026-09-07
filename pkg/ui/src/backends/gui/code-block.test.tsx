// @vitest-environment jsdom

/**
 * CodeBlock's line accounting (numbers, highlighted range, diff markers) and
 * its copy-to-clipboard button, asserted on the compiled markup and on a live
 * tree — never on the text alone, for the reason `accordion.test.tsx` gives:
 * @hanzo/gui drops an unrecognised prop with no throw and no type error.
 */
import { afterEach, describe, expect, it, vi } from 'vitest'
import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { renderToStaticMarkup } from 'react-dom/server'
import { GuiProvider } from '@hanzo/gui'

import config from '../../gui-config'
import { CodeBlock } from './code-block'

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
const codeLines = (markup: string) =>
  markup.split('data-slot="code-block-line"').slice(1).map((s) => `data-slot="code-block-line"${s}`)

/** The compiled class for one style property on a fragment, e.g. cls(row, 'borderLeftColor'). */
const cls = (fragment: string, prop: string) =>
  (fragment.match(/class="([^"]*)"/)?.[1] ?? '').split(/\s+/).find((c) => c.startsWith(`_${prop}-`)) ?? ''

describe('CodeBlock', () => {
  it('renders one line per source line, numbered from 1', () => {
    const markup = html(<CodeBlock code={SAMPLE} />)
    const lines = [...markup.matchAll(/data-slot="code-block-line"[^>]*data-line="(\d+)"/g)].map(
      (m) => m[1],
    )

    expect(lines).toEqual(['1', '2', '3'])
    expect(markup).toContain('const a = 1')
    expect(markup).toContain('const b = 2')
  })

  it('drops the gutter when showLineNumbers is false', () => {
    const shown = html(<CodeBlock code={SAMPLE} showLineNumbers />)
    const hidden = html(<CodeBlock code={SAMPLE} showLineNumbers={false} />)

    expect(shown).toContain('>1<')
    expect(hidden).not.toContain('>1<')
  })

  it('marks a highlighted line and leaves the others unmarked', () => {
    const markup = html(<CodeBlock code={SAMPLE} highlightLines={[2]} />)
    const rows = codeLines(markup)

    expect(rows).toHaveLength(3)
    // The compiled left-border color class differs on the highlighted row alone.
    expect(cls(rows[1], 'borderLeftColor')).not.toBe(cls(rows[0], 'borderLeftColor'))
    expect(cls(rows[1], 'borderLeftColor')).not.toBe(cls(rows[2], 'borderLeftColor'))
    expect(cls(rows[0], 'borderLeftColor')).toBe(cls(rows[2], 'borderLeftColor'))
  })

  it('marks diff-added and diff-removed lines with a sign and takes them over a highlight', () => {
    const markup = html(
      <CodeBlock code={SAMPLE} highlightLines={[1]} diff={{ added: [2], removed: [1] }} />,
    )
    const rows = codeLines(markup)

    // Row 1 is BOTH highlighted and diff-removed; diff wins and shows the sign.
    expect(rows[0]).toContain('>-<')
    expect(rows[1]).toContain('>+<')
    expect(rows[2]).not.toMatch(/>[+-]</)
    // The removed row's left border is its own color, not the highlight's.
    expect(cls(rows[0], 'borderLeftColor')).not.toBe(cls(rows[2], 'borderLeftColor'))
  })

  it('shows the filename and language, and hides the header entirely without either or a copy button', () => {
    const withHeader = html(<CodeBlock code={SAMPLE} filename="a.ts" language="typescript" />)
    const bare = html(<CodeBlock code={SAMPLE} language="" showCopyButton={false} />)

    expect(withHeader).toContain('a.ts')
    expect(withHeader).toContain('typescript')
    expect(bare).not.toContain('data-slot="code-block-header"')
    expect(bare).not.toContain('data-slot="code-block-language"')
  })

  it('copies the code to the clipboard and shows a confirmation', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined)
    Object.assign(navigator, { clipboard: { writeText } })
    vi.useFakeTimers()

    const el = mount(<CodeBlock code={SAMPLE} filename="a.ts" />)
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
    const dark = html(<CodeBlock code={SAMPLE} theme="dark" />)
    const nord = html(<CodeBlock code={SAMPLE} theme="nord" />)
    const bg = (markup: string) => markup.match(/data-slot="code-block"[^>]*style="([^"]*)"/)?.[1]

    expect(bg(dark)).toBeTruthy()
    expect(bg(dark)).not.toBe(bg(nord))
  })
})
