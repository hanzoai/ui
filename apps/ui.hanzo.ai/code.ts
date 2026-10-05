/**
 * The site's highlighter: shiki, in the code theme every Hanzo surface draws
 * (`codeTheme` — Dracula on dark, GitHub Light on light).
 *
 * Server only, like the catalog and the docs compiler that call it: a page is
 * rendered to HTML at build time and ships no highlighter. Each token is written
 * as `color: light-dark(<light>, <dark>)` and the block's ground the same way,
 * so the page's `color-scheme` — which the scheme provider keeps on <html> —
 * picks the palette, and no stylesheet knows which theme is on.
 */
import { codeTheme } from '@hanzo/ui/core'
import { createHighlighter } from 'shiki'

/** The grammars the samples are written in; anything else is drawn as text. */
const LANGS = ['tsx', 'ts', 'js', 'jsx', 'bash', 'sh', 'css', 'json', 'html', 'yaml', 'diff']

const ready = createHighlighter({ themes: [codeTheme.dark, codeTheme.light], langs: LANGS })

/** A `pre.code` of `text` in `lang`, as HTML. Resolves once, then highlights synchronously. */
export async function highlighter(): Promise<(text: string, lang: string) => string> {
  const shiki = await ready
  return (text, lang) =>
    shiki.codeToHtml(text, {
      lang: LANGS.includes(lang) ? lang : 'text',
      themes: codeTheme,
      defaultColor: 'light-dark()',
      transformers: [
        {
          pre(node) {
            this.addClassToHast(node, 'code')
          },
        },
      ],
    })
}
