/**
 * MDX for a Hanzo site: each file a module whose default export is its body,
 * with `frontmatter` (its YAML header) and `toc` (its headings) beside it.
 *
 *   ## Why Rust              id="why-rust", as GitHub slugs it
 *   ## Recursos [#features]  id="features": a translation keeps its English anchors
 *
 * Code is left as `<pre><code className="language-x">`: the site's `pre`
 * component highlights it, where its theme lives.
 */
import compile from '@mdx-js/rollup'
import Slugger from 'github-slugger'
import { valueToEstree } from 'estree-util-value-to-estree'
import remarkFrontmatter from 'remark-frontmatter'
import remarkGfm from 'remark-gfm'
import remarkMdxFrontmatter from 'remark-mdx-frontmatter'
import { visit } from 'unist-util-visit'
import type { Plugin } from 'vite'

export interface Heading {
  depth: number
  title: string
  url: string
}

interface Node {
  type: string
  value?: string
  depth?: number
  children?: Node[]
  data?: { hProperties?: Record<string, unknown> }
}

/** A heading's text: its text and code, nothing an image or a tag holds. */
export const flatten = (node: Node): string => (node.children ? node.children.map(flatten).join('') : (node.value ?? ''))

const CUSTOM = /\s*\[#([^\]]+?)]\s*$/

/** Each heading's id (its `[#id]`, else its slug) and the `toc` export. */
export function remarkHeadings() {
  return (tree: Node) => {
    const slugger = new Slugger()
    const toc: Heading[] = []
    visit(tree as never, 'heading', (heading: Node) => {
      heading.data ??= {}
      heading.data.hProperties ??= {}
      let id = heading.data.hProperties.id as string | undefined
      const last = heading.children?.at(-1)
      if (!id && last?.type === 'text' && last.value) {
        const m = CUSTOM.exec(last.value)
        if (m?.[1]) {
          id = m[1]
          last.value = last.value.slice(0, m.index)
        }
      }
      const title = flatten(heading)
      id ??= slugger.slug(title)
      heading.data.hProperties.id = id
      toc.push({ depth: heading.depth ?? 1, title, url: `#${id}` })
      return 'skip'
    })
    ;(tree.children ??= []).unshift({
      type: 'mdxjsEsm',
      value: '',
      data: {
        estree: {
          type: 'Program',
          sourceType: 'module',
          body: [
            {
              type: 'ExportNamedDeclaration',
              specifiers: [],
              declaration: {
                type: 'VariableDeclaration',
                kind: 'const',
                declarations: [{ type: 'VariableDeclarator', id: { type: 'Identifier', name: 'toc' }, init: valueToEstree(toc) }],
              },
            },
          ],
        },
      },
    } as unknown as Node)
  }
}

export interface MdxOptions {
  /** The module that exports `useMDXComponents`, e.g. '@/mdx-components'. */
  components?: string
}

export function mdx(options: MdxOptions = {}): Plugin {
  return {
    enforce: 'pre',
    ...compile({
      providerImportSource: options.components,
      remarkPlugins: [remarkFrontmatter, [remarkMdxFrontmatter, { name: 'frontmatter' }], remarkGfm, remarkHeadings],
    }),
  } as Plugin
}
