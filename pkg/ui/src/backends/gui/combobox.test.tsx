// @vitest-environment jsdom

/**
 * The Combobox's SELECTION contract: the trigger shows the placeholder until a
 * value is picked, then the picked label; opening the panel exposes a search
 * box and every option; picking a row closes the panel and reports the value;
 * picking the already-selected row clears it.
 *
 * Asserted on a live DOM, since opening the popover and clicking a row are the
 * only places this component does anything.
 */
import { describe, expect, it, vi } from 'vitest'
import { act } from 'react'
import { createRoot } from 'react-dom/client'
import { GuiProvider } from '@hanzo/gui'

import config from '../../gui-config'
import { Combobox, ComboboxWithIcons, type ComboboxIconOption } from './combobox'

const wrap = (node: React.ReactNode) => (
  <GuiProvider config={config} defaultTheme="dark">
    {node}
  </GuiProvider>
)

const mount = (node: React.ReactNode) => {
  ;(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true
  const host = document.createElement('div')
  document.body.appendChild(host)
  const root = createRoot(host)
  act(() => root.render(wrap(node)))
  return {
    host,
    trigger: () => host.querySelector<HTMLElement>('[data-slot="combobox-trigger"]')!,
    items: () => [...document.querySelectorAll<HTMLElement>('[data-slot="command-item"]')],
    input: () => document.querySelector<HTMLInputElement>('[data-slot="command-input"]'),
    cleanup: () => {
      act(() => root.unmount())
      host.remove()
    },
  }
}

const options = [
  { value: 'next.js', label: 'Next.js' },
  { value: 'sveltekit', label: 'SvelteKit' },
  { value: 'nuxt.js', label: 'Nuxt.js' },
]

describe('Combobox', () => {
  it('shows the placeholder with nothing selected, and marks the trigger as a combobox', () => {
    const view = mount(<Combobox options={options} placeholder="Select framework..." />)

    expect(view.trigger().textContent).toContain('Select framework...')
    expect(view.trigger().getAttribute('role')).toBe('combobox')
    expect(view.trigger().getAttribute('aria-expanded')).toBe('false')
    view.cleanup()
  })

  it('shows the selected option label when a value is given', () => {
    const view = mount(<Combobox options={options} value="sveltekit" />)

    expect(view.trigger().textContent).toContain('SvelteKit')
    view.cleanup()
  })

  it('opens the panel with the option list on click', () => {
    const view = mount(<Combobox options={options} />)

    act(() => view.trigger().click())

    expect(view.trigger().getAttribute('aria-expanded')).toBe('true')
    expect(view.input()).toBeTruthy()
    expect(view.items()).toHaveLength(options.length)
    view.cleanup()
  })

  it('picking a row reports its value and closes the panel', () => {
    const onChange = vi.fn()
    const view = mount(<Combobox options={options} onChange={onChange} />)

    act(() => view.trigger().click())
    const nuxt = view.items().find((el) => el.textContent?.includes('Nuxt.js'))!
    act(() => nuxt.click())

    expect(onChange).toHaveBeenCalledWith('nuxt.js')
    expect(view.trigger().getAttribute('aria-expanded')).toBe('false')
    view.cleanup()
  })

  it('picking the already-selected row clears it', () => {
    const onChange = vi.fn()
    const view = mount(<Combobox options={options} value="next.js" onChange={onChange} />)

    act(() => view.trigger().click())
    const nextjs = view.items().find((el) => el.textContent?.includes('Next.js'))!
    act(() => nextjs.click())

    expect(onChange).toHaveBeenCalledWith('')
    view.cleanup()
  })

  it('filters the list as the search box is typed into', () => {
    const view = mount(<Combobox options={options} />)

    act(() => view.trigger().click())
    const input = view.input()!
    const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value')!.set!
    act(() => {
      setter.call(input, 'svelte')
      input.dispatchEvent(new Event('input', { bubbles: true }))
    })

    const visible = view.items().filter((el) => getComputedStyle(el).display !== 'none')
    expect(visible).toHaveLength(1)
    expect(visible[0].textContent).toContain('SvelteKit')
    view.cleanup()
  })

  it('a disabled combobox is marked unusable to the pointer and to the reader', () => {
    const view = mount(<Combobox options={options} disabled />)

    expect(view.trigger().getAttribute('aria-disabled')).toBe('true')
    view.cleanup()
  })
})

describe('ComboboxWithIcons', () => {
  const iconOptions: ComboboxIconOption[] = [
    { value: 'todo', label: 'Todo', icon: () => <span data-slot="icon-todo" /> },
    { value: 'done', label: 'Done', icon: () => <span data-slot="icon-done" /> },
  ]

  it('renders the selected option’s icon beside its label in the trigger', () => {
    const view = mount(<ComboboxWithIcons options={iconOptions} value="done" />)

    expect(view.trigger().textContent).toContain('Done')
    expect(view.trigger().querySelector('[data-slot="icon-done"]')).toBeTruthy()
    view.cleanup()
  })

  it('lists every option with its own icon when opened', () => {
    const view = mount(<ComboboxWithIcons options={iconOptions} />)

    act(() => view.trigger().click())

    expect(view.items()).toHaveLength(2)
    expect(document.querySelector('[data-slot="icon-todo"]')).toBeTruthy()
    expect(document.querySelector('[data-slot="icon-done"]')).toBeTruthy()
    view.cleanup()
  })
})
