/**
 * A docs page: `data/docs/<slug>.mdx`, compiled to the component body the route
 * evaluates, with its outline for the quick nav and the sidebar beside it.
 *
 * Server only, like the catalog — the routes reach it through a dynamic import
 * inside their loaders, so the compiler (a native binding) never meets the
 * browser bundle. Code samples are spelled as this build spells the package.
 */
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { codeToHTML } from '@hanzogui/code-to-html'
import { getHeadings, getMDX } from '@vxrn/mdx-rust'

import { docsDir, sample, sections } from './catalog'
import type { Heading, Section } from './features/docs'

export type Doc = {
  slug: string
  title: string
  description: string
  /** The compiled body; `render` in features/mdx evaluates it. */
  code: string
  headings: Heading[]
  sections: Section[]
}

/** A fence's `title="…"` — the file the sample belongs in. */
const TITLE = /\btitle="([^"]*)"/

const escape = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')

/** The tokens the module pages draw, for a grammar the highlighter knows; the text as it is otherwise. */
const highlight = (text: string, lang: string): string => {
  try {
    return codeToHTML(text, lang)
  } catch {
    return escape(text)
  }
}

/**
 * Code fences. The compiled tree keeps `pre > code`, and the `code` element
 * carries the highlighted markup as `html` and the fence's title as `title`;
 * its text moves out, so nothing is drawn twice. Inline code carries neither.
 */
const fence = {
  name: 'fence',
  element: {
    filter: ['code'],
    visit(node: any, ctx: any) {
      const cls = node.properties?.className
      const lang = String(Array.isArray(cls) ? cls[0] : (cls ?? '')).replace(/^language-/, '')
      if (!lang) return
      const text = node.children
        .map((c: any) => c.value ?? '')
        .join('')
        .replace(/\n$/, '')
      const title = String(node.data?.meta ?? '').match(TITLE)?.[1]
      ctx.replaceNode(node, {
        ...node,
        properties: { ...node.properties, title, html: highlight(text, lang) },
        children: [],
      })
    },
  },
}

/**
 * The page's h2 and h3, with the ids the compiled headings carry. Fences are
 * cut first: a `#` comment in a shell sample is not a heading.
 */
const outline = (source: string): Heading[] =>
  getHeadings(source.replace(/```[\s\S]*?```/g, ''))
    .filter((h) => h.priority === 2 || h.priority === 3)
    .map((h) => ({ id: h.id, title: h.title, level: h.priority as 2 | 3 }))

export async function doc(slug: string): Promise<Doc> {
  const source = sample(readFileSync(join(docsDir, `${slug}.mdx`), 'utf8'))
  const { frontmatter, code } = await getMDX(source, { expressiveCode: false, hastPlugins: [fence] })
  return {
    slug,
    title: frontmatter.title,
    description: frontmatter.description ?? '',
    code,
    headings: outline(source),
    sections: sections(),
  }
}
