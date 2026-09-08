// @vitest-environment jsdom

/**
 * Tags renders a badge per entry and, only when `onRemove` is given, a labelled
 * remove button that reports which entry was pressed. Asserted on compiled
 * markup and on a live DOM, not on text, for the same reason accordion.test.tsx
 * gives: gui drops an unrecognised prop silently, so only mounted behaviour
 * proves the wiring.
 */
import { describe, expect, it, vi } from 'vitest'
import { act } from 'react'
import { createRoot } from 'react-dom/client'
import { renderToStaticMarkup } from 'react-dom/server'
import { GuiProvider } from '@hanzo/gui'

import config from '../../gui-config'
import { Tags, type Tag } from './tags'

const wrap = (node: React.ReactNode) => (
  <GuiProvider config={config} defaultTheme="dark">
    {node}
  </GuiProvider>
)

const html = (node: React.ReactNode) => renderToStaticMarkup(wrap(node))

const mount = (node: React.ReactNode) => {
  ;(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true
  const host = document.createElement('div')
  document.body.appendChild(host)
  const root = createRoot(host)
  act(() => root.render(wrap(node)))
  return {
    host,
    removers: () => [...host.querySelectorAll<HTMLElement>('[data-slot="tags-remove"]')],
    cleanup: () => {
      act(() => root.unmount())
      host.remove()
    },
  }
}

const tags: Tag[] = [
  { id: 'a', label: 'React' },
  { id: 'b', label: 'TypeScript' },
  { id: 'c', label: 'Next.js' },
]

describe('Tags', () => {
  it('renders one badge per entry', () => {
    const markup = html(<Tags tags={tags} />)
    const items = [...markup.matchAll(/data-slot="badge"/g)]

    expect(items).toHaveLength(3)
    expect(markup).toContain('React')
    expect(markup).toContain('TypeScript')
    expect(markup).toContain('Next.js')
  })

  it('carries the requested variant onto every badge', () => {
    const markup = html(<Tags tags={tags} variant="outline" />)
    const variants = [...markup.matchAll(/data-variant="([^"]+)"/g)].map((m) => m[1])

    expect(variants).toEqual(['outline', 'outline', 'outline'])
  })

  it('adds no remove button when onRemove is absent', () => {
    const markup = html(<Tags tags={tags} />)

    expect(markup).not.toContain('tags-remove')
  })

  it('labels each remove button after the tag it removes', () => {
    const markup = html(<Tags tags={tags} onRemove={() => {}} />)
    const removers = [...markup.matchAll(/<button[^>]*data-slot="tags-remove"[^>]*aria-label="([^"]+)"/g)].map(
      (m) => m[1],
    )

    expect(removers).toEqual(['Remove React', 'Remove TypeScript', 'Remove Next.js'])
  })

  it('reports the id of the tag whose remove button was pressed', () => {
    const onRemove = vi.fn()
    const view = mount(<Tags tags={tags} onRemove={onRemove} />)

    act(() => {
      view.removers()[1].click()
    })

    expect(onRemove).toHaveBeenCalledWith('b')
    view.cleanup()
  })
})
