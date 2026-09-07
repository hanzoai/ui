// @vitest-environment jsdom

/**
 * The Dropzone, asserted on real DOM events — a click that opens the file
 * input, a drop that sorts accepted files from rejected ones, and a remove
 * button that takes one back out of the list. Never on rendered text alone:
 * @hanzo/gui drops a prop it does not recognise with no throw, so a string
 * landing on screen proves only that it reached a Text host.
 *
 * Imports `./dropzone` directly rather than the backend barrel, so this test
 * cannot fail because an unrelated component's dependency moved.
 */
import { describe, expect, it, vi } from 'vitest'
import { act } from 'react'
import { createRoot } from 'react-dom/client'
import { renderToStaticMarkup } from 'react-dom/server'
import { GuiProvider } from '@hanzo/gui'

import config from '../../gui-config'
import { Dropzone } from './dropzone'

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
    region: () => host.querySelector<HTMLElement>('[data-slot="dropzone-region"]')!,
    input: () => host.querySelector<HTMLInputElement>('[data-slot="dropzone-input"]')!,
    items: () => [...host.querySelectorAll<HTMLElement>('[data-slot="dropzone-item"]')],
    cleanup: () => {
      act(() => root.unmount())
      host.remove()
    },
  }
}

const file = (name: string, size: number, type: string) => {
  const f = new File(['x'.repeat(size)], name, { type })
  Object.defineProperty(f, 'size', { value: size })
  return f
}

/** A DragEvent jsdom does not construct, carrying the one field the handlers read. */
const dragEvent = (kind: string, files: File[] = []) => {
  const event = new Event(kind, { bubbles: true, cancelable: true })
  Object.defineProperty(event, 'dataTransfer', { value: { files } })
  return event
}

describe('Dropzone', () => {
  it('renders the region and a hidden file input', () => {
    const markup = html(<Dropzone />)

    expect(markup).toContain('data-slot="dropzone"')
    expect(markup).toContain('data-slot="dropzone-region"')
    expect(markup).toContain('data-slot="dropzone-input"')
    expect(markup).toContain('type="file"')
    expect(markup).toContain('role="button"')
  })

  it('opens the file picker when the region is clicked', () => {
    const view = mount(<Dropzone />)
    const openPicker = vi.spyOn(view.input(), 'click').mockImplementation(() => {})

    act(() => {
      view.region().dispatchEvent(new MouseEvent('click', { bubbles: true }))
    })

    expect(openPicker).toHaveBeenCalledTimes(1)
    view.cleanup()
  })

  it('marks the region active while a drag is over it, and idle again once it leaves', () => {
    const view = mount(<Dropzone />)

    act(() => {
      view.region().dispatchEvent(dragEvent('dragenter'))
    })
    expect(view.region().getAttribute('data-state')).toBe('active')

    act(() => {
      view.region().dispatchEvent(dragEvent('dragleave'))
    })
    expect(view.region().getAttribute('data-state')).toBe('idle')

    view.cleanup()
  })

  it('accepts a dropped file that matches, and lists it', () => {
    const onFilesAccepted = vi.fn()
    const view = mount(<Dropzone onFilesAccepted={onFilesAccepted} />)
    const good = file('photo.png', 1024, 'image/png')

    act(() => {
      view.region().dispatchEvent(dragEvent('drop', [good]))
    })

    expect(onFilesAccepted).toHaveBeenCalledWith([good])
    expect(view.items()).toHaveLength(1)
    expect(view.items()[0].textContent).toContain('photo.png')

    view.cleanup()
  })

  it('rejects a dropped file over maxSize instead of listing it', () => {
    const onFilesAccepted = vi.fn()
    const onFilesRejected = vi.fn()
    const view = mount(
      <Dropzone maxSize={10} onFilesAccepted={onFilesAccepted} onFilesRejected={onFilesRejected} />,
    )
    const big = file('huge.png', 1024, 'image/png')

    act(() => {
      view.region().dispatchEvent(dragEvent('drop', [big]))
    })

    expect(onFilesAccepted).not.toHaveBeenCalled()
    expect(onFilesRejected).toHaveBeenCalledWith([big])
    expect(view.items()).toHaveLength(0)

    view.cleanup()
  })

  it('rejects a dropped file whose type is not in accept', () => {
    const onFilesRejected = vi.fn()
    const view = mount(
      <Dropzone accept={{ 'image/*': ['.png'] }} onFilesRejected={onFilesRejected} />,
    )
    const doc = file('report.pdf', 100, 'application/pdf')

    act(() => {
      view.region().dispatchEvent(dragEvent('drop', [doc]))
    })

    expect(onFilesRejected).toHaveBeenCalledWith([doc])
    expect(view.items()).toHaveLength(0)

    view.cleanup()
  })

  it('never accepts a drop, and never opens the picker, while disabled', () => {
    const onFilesAccepted = vi.fn()
    const view = mount(<Dropzone disabled onFilesAccepted={onFilesAccepted} />)
    const openPicker = vi.spyOn(view.input(), 'click').mockImplementation(() => {})
    const good = file('photo.png', 1024, 'image/png')

    expect(view.region().getAttribute('aria-disabled')).toBe('true')

    act(() => {
      view.region().dispatchEvent(new MouseEvent('click', { bubbles: true }))
      view.region().dispatchEvent(dragEvent('drop', [good]))
    })

    expect(openPicker).not.toHaveBeenCalled()
    expect(onFilesAccepted).not.toHaveBeenCalled()

    view.cleanup()
  })

  it('removes a listed file when its remove control is activated', () => {
    const view = mount(<Dropzone />)
    const good = file('photo.png', 1024, 'image/png')

    act(() => {
      view.region().dispatchEvent(dragEvent('drop', [good]))
    })
    expect(view.items()).toHaveLength(1)

    act(() => {
      view.host
        .querySelector<HTMLElement>('[data-slot="dropzone-item-remove"]')!
        .dispatchEvent(new MouseEvent('click', { bubbles: true }))
    })
    expect(view.items()).toHaveLength(0)

    view.cleanup()
  })

  it('caps the list at maxFiles', () => {
    const view = mount(<Dropzone maxFiles={1} />)
    const a = file('a.png', 10, 'image/png')
    const b = file('b.png', 10, 'image/png')

    act(() => {
      view.region().dispatchEvent(dragEvent('drop', [a, b]))
    })

    expect(view.items()).toHaveLength(1)
    view.cleanup()
  })
})
