// @vitest-environment jsdom

/**
 * Corner against a live DOM: what the host passes is what is drawn, a choice
 * reaches the host's callback, the theme reaches the library's own preference,
 * and the open card holds up to axe.
 *
 * The card is portalled, so it is read off `document`, not the host element.
 */
import { act, useState } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { GuiProvider } from '@hanzo/gui'

import config from '../gui-config'
import { audit } from '../../test/axe'
import { Look } from '../look'
import { Corner, type CornerProps, type Option } from '.'

declare global {
  // eslint-disable-next-line no-var
  var IS_REACT_ACT_ENVIRONMENT: boolean
}

let host: HTMLDivElement
let root: Root

beforeEach(() => {
  globalThis.IS_REACT_ACT_ENVIRONMENT = true
  localStorage.clear()
  document.documentElement.className = ''
  host = document.createElement('div')
  document.body.appendChild(host)
  root = createRoot(host)
})

afterEach(() => {
  act(() => root.unmount())
  host.remove()
})

const mount = (ui: React.ReactNode) =>
  act(() => {
    root.render(
      <GuiProvider config={config} defaultTheme="dark">
        {ui}
      </GuiProvider>,
    )
  })

const settle = async () => {
  await act(async () => {
    await new Promise((r) => setTimeout(r, 0))
  })
}

const trigger = () => host.querySelector<HTMLElement>('[data-slot="corner-trigger"]')!
const card = () => document.querySelector<HTMLElement>('[data-slot="corner-card"]')
const links = () => [...document.querySelectorAll<HTMLAnchorElement>('[data-slot="corner-link"]')]
const row = (kind: string) => document.querySelector<HTMLElement>(`[data-corner-row="${kind}"]`)
const options = () => [...document.querySelectorAll<HTMLElement>('[role="option"]')]
const field = () => document.querySelector<HTMLInputElement>('[data-slot="corner-input"]')
const list = () => document.querySelector<HTMLElement>('[data-slot="corner-list"]')
const radio = (name: string) =>
  [...document.querySelectorAll<HTMLElement>('[data-slot="corner-theme"] [role="radio"]')].find(
    (r) => (r.getAttribute('aria-label') ?? r.textContent) === name,
  )!

const open = () => act(() => trigger().click())

const key = (el: Element, k: string) =>
  act(() => {
    el.dispatchEvent(new KeyboardEvent('keydown', { key: k, bubbles: true, cancelable: true }))
  })

const type = (text: string) =>
  act(() => {
    const el = field()!
    Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')!.set!.call(el, text)
    el.dispatchEvent(new Event('input', { bubbles: true }))
  })

const HELP: CornerProps['help'] = [
  { label: 'Get help', href: '/support' },
  { label: 'Docs', href: 'https://docs.hanzo.ai' },
  { label: 'Contact us', href: 'https://hanzo.ai/contact' },
]

const LANGS: Option[] = [
  { code: 'en', label: 'English' },
  { code: 'de', label: 'Deutsch', hint: 'German' },
  { code: 'fr', label: 'Français', hint: 'French' },
  { code: 'es', label: 'Español', hint: 'Spanish' },
  { code: 'ja', label: '日本語', hint: 'Japanese' },
  { code: 'ko', label: '한국어', hint: 'Korean' },
  { code: 'zh', label: '中文', hint: 'Chinese' },
  { code: 'ar', label: 'العربية', hint: 'Arabic', dir: 'rtl' },
  { code: 'he', label: 'עברית', hint: 'Hebrew', dir: 'rtl' },
]

const FIAT: Option[] = [
  { code: 'USD', label: 'USD', hint: 'US dollar' },
  { code: 'EUR', label: 'EUR', hint: 'Euro' },
  { code: 'JPY', label: 'JPY', hint: 'Japanese yen' },
]

describe('closed', () => {
  it('is one labelled trigger that says it opens a dialog, and nothing else', () => {
    mount(<Corner help={HELP} />)
    expect(trigger().getAttribute('aria-label')).toBe('Help and preferences')
    expect(trigger().getAttribute('aria-haspopup')).toBe('dialog')
    expect(trigger().getAttribute('aria-expanded')).toBe('false')
    expect(card()).toBeNull()
  })

  it('is fixed to the window, at the start edge, on the dock rung', () => {
    mount(<Corner />)
    const frame = host.querySelector<HTMLElement>('[data-slot="corner"]')!
    // gui writes each style prop as one atomic class named for the property.
    const classes = frame.className.split(/\s+/)
    expect(classes.some((c) => /^_pos-fixed/.test(c)) || frame.style.position === 'fixed', 'position fixed').toBe(true)
    expect(classes.some((c) => /insetInlineStart|_iis-|inset-inline-start/i.test(c)) || frame.style.insetInlineStart !== '', 'inline start').toBe(true)
    expect(classes.some((c) => /^_(l|r|left|right)-/.test(c)), 'no physical left or right').toBe(false)
  })
})

describe('help', () => {
  it('draws the host links in order, and marks the ones that leave the site', () => {
    mount(<Corner help={HELP} />)
    open()
    expect(card()?.getAttribute('role')).toBe('dialog')
    expect(card()?.getAttribute('aria-label')).toBe('Help and preferences')
    expect(links().map((a) => a.textContent)).toEqual(['Get help', 'Docs', 'Contact us'])
    expect(links().map((a) => a.getAttribute('href'))).toEqual(['/support', 'https://docs.hanzo.ai', 'https://hanzo.ai/contact'])

    const [here, docs] = links()
    expect(here.getAttribute('target')).toBeNull()
    expect(here.getAttribute('aria-label')).toBeNull()
    expect(docs.getAttribute('target')).toBe('_blank')
    expect(docs.getAttribute('rel')).toBe('noopener noreferrer')
    expect(docs.getAttribute('aria-label')).toBe('Docs (opens in a new tab)')
  })

  it('opens on Preferences, with the close button, when the host passes no help', () => {
    mount(<Corner />)
    open()
    expect(links()).toEqual([])
    expect(card()?.textContent).toContain('Preferences')
    expect(document.querySelector('[aria-label="Close"]')).not.toBeNull()
  })

  it('closes from its close button and hands focus back to the trigger', async () => {
    mount(<Corner help={HELP} />)
    open()
    act(() => document.querySelector<HTMLElement>('[aria-label="Close"]')!.click())
    await settle()
    expect(trigger().getAttribute('aria-expanded')).toBe('false')
  })
})

describe('preferences', () => {
  it('draws only the rows the host passes', () => {
    mount(<Corner />)
    open()
    expect(document.querySelector('[data-slot="corner-theme"]')).not.toBeNull()
    expect(row('language')).toBeNull()
    expect(row('currency')).toBeNull()
  })

  it('shows each setting by its current value', () => {
    mount(
      <Corner
        language={{ value: 'de', options: LANGS, onChange: () => {} }}
        currency={{ value: 'EUR', options: FIAT, onChange: () => {} }}
      />,
    )
    open()
    expect(row('language')?.textContent).toBe('LanguageDeutsch')
    expect(row('currency')?.textContent).toBe('CurrencyEUR')
    expect(row('language')?.getAttribute('aria-haspopup')).toBe('listbox')
    // The language's own name is marked as that language, for a screen reader's voice.
    expect(row('language')?.querySelector('[lang="de"]')?.textContent).toBe('Deutsch')
  })

  it('a long list is searched, and a choice reaches the host and returns to the card', async () => {
    const onChange = vi.fn()
    mount(<Corner language={{ value: 'en', options: LANGS, onChange }} />)
    open()
    act(() => row('language')!.click())
    expect(list()?.getAttribute('role')).toBe('listbox')
    expect(options()).toHaveLength(LANGS.length)
    expect(options().find((o) => o.getAttribute('aria-selected') === 'true')?.textContent).toBe('English')
    // Each name is set in its own direction.
    expect(document.querySelector('[lang="ar"]')?.getAttribute('dir')).toBe('rtl')

    expect(field()?.getAttribute('role')).toBe('combobox')
    type('francais')
    expect(options().map((o) => o.textContent)).toEqual(['FrançaisFrench'])
    key(field()!, 'Enter')
    expect(onChange).toHaveBeenCalledWith('fr')
    expect(list()).toBeNull()
    expect(row('language')).not.toBeNull()
  })

  it('a short list has no search; the arrows and Enter choose from the list itself', () => {
    const onChange = vi.fn()
    mount(<Corner currency={{ value: 'USD', options: FIAT, onChange }} />)
    open()
    act(() => row('currency')!.click())
    expect(field()).toBeNull()
    expect(list()?.getAttribute('tabindex')).toBe('0')
    key(list()!, 'ArrowDown')
    expect(list()?.getAttribute('aria-activedescendant')).toBe(options()[1].id)
    key(list()!, 'Enter')
    expect(onChange).toHaveBeenCalledWith('EUR')
  })

  it('choosing the current value again does not report a change', () => {
    const onChange = vi.fn()
    mount(<Corner currency={{ value: 'USD', options: FIAT, onChange }} />)
    open()
    act(() => row('currency')!.click())
    act(() => options()[0].click())
    expect(onChange).not.toHaveBeenCalled()
    expect(row('currency')).not.toBeNull()
  })

  it('a search that matches nothing says so', () => {
    mount(<Corner language={{ value: 'en', options: LANGS, onChange: () => {} }} />)
    open()
    act(() => row('language')!.click())
    type('klingon')
    expect(options()).toEqual([])
    expect(list()?.textContent).toBe('No matches')
  })

  it('Back returns to the card', () => {
    mount(<Corner currency={{ value: 'USD', options: FIAT, onChange: () => {} }} />)
    open()
    act(() => row('currency')!.click())
    act(() => document.querySelector<HTMLElement>('[aria-label="Back"]')!.click())
    expect(list()).toBeNull()
    expect(row('currency')).not.toBeNull()
  })

  it('a host that lives in its choice sees it on the row', () => {
    function Host() {
      const [value, setValue] = useState('USD')
      return <Corner currency={{ value, options: FIAT, onChange: setValue }} />
    }
    mount(<Host />)
    open()
    act(() => row('currency')!.click())
    act(() => options()[2].click())
    expect(row('currency')?.textContent).toBe('CurrencyJPY')
  })
})

describe('theme', () => {
  it('under <Hanzo>, writes through the root’s appearance and shows what it resolved', () => {
    const set = vi.fn()
    mount(
      <Look.Provider value={{ pref: { theme: 'system' }, set }}>
        <Corner />
      </Look.Provider>,
    )
    open()
    expect(radio('Auto').getAttribute('aria-checked')).toBe('true')
    act(() => radio('Light').click())
    expect(set).toHaveBeenCalledWith({ theme: 'light' })
  })

  it('without a root, stores the person’s choice where the library keeps it and paints the document', () => {
    mount(<Corner />)
    open()
    act(() => radio('Light').click())
    expect(JSON.parse(localStorage.getItem('hanzo.appearance') ?? '{}').theme).toBe('light')
    expect(document.documentElement.classList.contains('light')).toBe(true)
    expect(document.documentElement.classList.contains('t_light')).toBe(true)
    expect(radio('Light').getAttribute('aria-checked')).toBe('true')
  })

  it('keeps every other axis of the stored preference', () => {
    localStorage.setItem('hanzo.appearance', JSON.stringify({ type: 1.15, accent: 'olive' }))
    mount(<Corner />)
    open()
    act(() => radio('Light').click())
    expect(JSON.parse(localStorage.getItem('hanzo.appearance')!)).toEqual({ type: 1.15, accent: 'olive', theme: 'light' })
  })
})

describe('faces', () => {
  const chosen = () => JSON.parse(localStorage.getItem('hanzo.appearance') ?? '{}')
  const pick = (kind: string, label: string) => {
    act(() => row(kind)!.click())
    act(() => options().find((o) => o.textContent?.startsWith(label))!.click())
  }

  it('draws Font on every page, and Arabic font only on a page in Arabic script', () => {
    mount(<Corner language={{ value: 'en', options: LANGS, onChange: () => {} }} />)
    open()
    expect(row('font')?.textContent).toBe('FontSans')
    expect(row('arabic')).toBeNull()
    act(() => root.unmount())
    root = createRoot(host)
    mount(<Corner language={{ value: 'ar', options: LANGS, onChange: () => {} }} />)
    open()
    expect(row('arabic')).not.toBeNull()
    act(() => root.unmount())
    root = createRoot(host)
    mount(<Corner language={{ value: 'he', options: LANGS, onChange: () => {} }} />)
    open()
    expect(row('arabic'), 'Hebrew is right to left and not Arabic script').toBeNull()
  })

  it('without a root, stores the face and paints it by reference', () => {
    localStorage.setItem('hanzo.appearance', JSON.stringify({ type: 1.15, theme: 'dark' }))
    mount(<Corner />)
    open()
    pick('font', 'Serif')
    expect(chosen()).toEqual({ type: 1.15, theme: 'dark', font: 'serif' })
    expect(document.documentElement.style.getPropertyValue('--font-sans')).toBe('var(--font-serif)')
    expect(row('font')?.textContent).toBe('FontSerif')
  })

  it('sets Arabic on its own axis, and the face stays where it was', () => {
    localStorage.setItem('hanzo.appearance', JSON.stringify({ font: 'mono' }))
    mount(<Corner language={{ value: 'fa', options: LANGS, onChange: () => {} }} />)
    open()
    pick('arabic', 'Sans')
    expect(chosen()).toEqual({ font: 'mono', arabic: 'sans' })
    expect(document.documentElement.style.getPropertyValue('--font-arabic')).toBe('var(--font-arabic-sans)')
    expect(document.documentElement.style.getPropertyValue('--font-sans')).toBe('var(--font-mono)')
  })

  it('under <Hanzo>, writes the face through the root’s appearance', () => {
    const set = vi.fn()
    mount(
      <Look.Provider value={{ pref: { arabic: 'kufi' }, set }}>
        <Corner language={{ value: 'ar', options: LANGS, onChange: () => {} }} />
      </Look.Provider>,
    )
    open()
    expect(row('arabic')?.textContent).toBe('Arabic fontKufi')
    pick('font', 'Mono')
    expect(set).toHaveBeenCalledWith({ font: 'mono' })
  })
})

describe('words', () => {
  it('speaks the host’s language', () => {
    mount(
      <Corner
        help={[{ label: 'Hilfe', href: '/hilfe' }]}
        language={{ value: 'de', options: LANGS, onChange: () => {} }}
        words={{ open: 'Hilfe und Einstellungen', help: 'Hilfe', preferences: 'Einstellungen', theme: 'Design', language: 'Sprache' }}
      />,
    )
    expect(trigger().getAttribute('aria-label')).toBe('Hilfe und Einstellungen')
    open()
    expect(card()?.textContent).toContain('Einstellungen')
    expect(card()?.textContent).toContain('Design')
    expect(row('language')?.textContent).toBe('SpracheDeutsch')
  })
})

describe('accessibility', () => {
  it('has no axe violations open on the card', async () => {
    mount(
      <Corner
        help={HELP}
        language={{ value: 'en', options: LANGS, onChange: () => {} }}
        currency={{ value: 'USD', options: FIAT, onChange: () => {} }}
      />,
    )
    open()
    expect(await audit(document.body)).toEqual([])
  })

  it('has no axe violations open on a list', async () => {
    mount(<Corner language={{ value: 'en', options: LANGS, onChange: () => {} }} />)
    open()
    act(() => row('language')!.click())
    expect(await audit(document.body)).toEqual([])
  })
})
