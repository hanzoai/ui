// @vitest-environment jsdom

/**
 * The builder's workspace pieces, mounted under the real provider, pressed and
 * keyed the way a person does, and held to the accessibility check.
 *
 * Each block asserts the WIRING a pure test cannot: that a click reaches the
 * callback through gui's press handling, that the keys a role promises move
 * what they should, that a refusal (a `javascript:` preview, a foreign message)
 * is refused in the mounted component and not only in `bridge.ts`.
 */
import { act, createRef, type ReactNode } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { GuiProvider } from '@hanzo/gui'

import config from '../gui-config'
import { audit } from '../../test/axe'
import { Attachments } from './Attachments'
import { ModeSelect, PageSelect } from './Choice'
import { Console } from './Console'
import { Feedback } from './Feedback'
import { FileTabs } from './FileTabs'
import { FileTree } from './FileTree'
import { HEAD, OPEN } from './log'
import { PreviewFrame, type PreviewHandle } from './PreviewFrame'
import { Suggestions, SUGGESTIONS } from './Suggestions'
import { CHAT, DEVICES, ProjectChip, VIEWS, Views, Workspace } from './Workspace'

declare global {
  // eslint-disable-next-line no-var
  var IS_REACT_ACT_ENVIRONMENT: boolean
}

let host: HTMLDivElement
let root: Root

beforeEach(() => {
  globalThis.IS_REACT_ACT_ENVIRONMENT = true
  host = document.createElement('div')
  document.body.appendChild(host)
  root = createRoot(host)
})

afterEach(() => {
  act(() => root.unmount())
  host.remove()
})

const mount = (ui: ReactNode) =>
  act(() => {
    root.render(
      <GuiProvider config={config} defaultTheme="dark">
        {ui}
      </GuiProvider>,
    )
  })

const $ = (selector: string) => host.querySelector(selector) as HTMLElement | null
const $$ = (selector: string) => Array.from(host.querySelectorAll(selector)) as HTMLElement[]
const click = (el: Element | null) => {
  if (!el) throw new Error('nothing to click')
  act(() => {
    ;(el as HTMLElement).click()
  })
}
const key = (el: Element | null, k: string, init: KeyboardEventInit = {}) => {
  if (!el) throw new Error('nothing to key')
  act(() => {
    el.dispatchEvent(new KeyboardEvent('keydown', { key: k, bubbles: true, cancelable: true, ...init }))
  })
}
const flush = () => act(async () => {})

describe('Workspace', () => {
  it('draws the bar, the chat and the work, and passes the check', async () => {
    mount(
      <Workspace start={<span>start</span>} middle={<span>middle</span>} end={<span>end</span>} chat={<p>chat</p>} dock={<p>dock</p>}>
        <p>view</p>
      </Workspace>,
    )
    expect($('[data-slot="workspace-bar"]')?.tagName).toBe('HEADER')
    expect($('[data-slot="workspace-chat"]')?.textContent).toBe('chat')
    expect($('[data-slot="workspace-main"]')?.textContent).toBe('viewdock')
    expect(host.textContent).toContain('startmiddleend')
    expect(await audit(host)).toEqual([])
  })
})

describe('Views', () => {
  it('is one tablist, labels only the chosen view, and moves on arrows', async () => {
    const onChange = vi.fn()
    mount(<Views views={[...VIEWS, CHAT]} value="preview" onChange={onChange} label="Editor view" />)
    const tabs = $$('[role="tab"]')
    expect(tabs).toHaveLength(5)
    expect($('[role="tablist"]')?.getAttribute('aria-label')).toBe('Editor view')
    expect(tabs[0]!.getAttribute('aria-selected')).toBe('true')
    expect(tabs[0]!.tabIndex).toBe(0)
    expect(tabs[1]!.tabIndex).toBe(-1)
    expect(tabs[0]!.textContent).toBe('Preview')
    expect(tabs[1]!.textContent).toBe('')
    key(tabs[0]!, 'ArrowRight')
    expect(onChange).toHaveBeenLastCalledWith('files')
    key(tabs[0]!, 'ArrowLeft')
    expect(onChange).toHaveBeenLastCalledWith('chat')
    click(tabs[2]!)
    expect(onChange).toHaveBeenLastCalledWith('code')
    expect(await audit(host)).toEqual([])
  })

  it('draws the phone-only Chat entry in the markup the narrow screen reveals', () => {
    mount(<Views views={DEVICES} value="mobile" onChange={() => {}} label="Device" labels="none" />)
    expect($$('[role="tab"]').map((t) => t.getAttribute('aria-label'))).toEqual(['Desktop', 'Mobile'])
  })
})

describe('ProjectChip', () => {
  it('is a real, named button that says there are others', async () => {
    const onPress = vi.fn()
    mount(<ProjectChip name="MEGA Shop" onPress={onPress} />)
    const chip = $('[data-slot="project-chip"]')!
    expect(chip.tagName).toBe('BUTTON')
    expect(chip.getAttribute('aria-label')).toBe('Project: MEGA Shop')
    expect(chip.getAttribute('aria-haspopup')).toBe('menu')
    expect(chip.textContent).toBe('MMEGA Shop')
    click(chip)
    expect(onPress).toHaveBeenCalledOnce()
    expect(await audit(host)).toEqual([])
  })
})

describe('ModeSelect and PageSelect', () => {
  const MODES = [
    { id: 'build', label: 'Build', hint: 'Edits, commits and pushes' },
    { id: 'plan', label: 'Plan', hint: 'Plans without writing' },
  ]

  it('names the chosen mode and opens a menu of the rest', async () => {
    const onChange = vi.fn()
    mount(<ModeSelect modes={MODES} value="build" onChange={onChange} />)
    const chip = $('[data-slot="mode-select"]')!
    expect(chip.getAttribute('aria-label')).toBe('Mode: Build')
    expect(chip.getAttribute('aria-haspopup')).toBe('menu')
    expect(chip.textContent).toBe('Build')
    expect(await audit(host)).toEqual([])
    // Opened by a press, the menu lists every mode with its hint, and picking
    // one hands the id out. The menu portals to the body, not into `host`.
    click(chip)
    await act(async () => {
      await new Promise((r) => setTimeout(r, 30))
    })
    expect(chip.getAttribute('aria-expanded')).toBe('true')
    const items = Array.from(document.body.querySelectorAll('[role="menuitem"]')) as HTMLElement[]
    expect(items.map((i) => i.textContent)).toEqual(['BuildEdits, commits and pushes', 'PlanPlans without writing'])
    click(items[1]!)
    expect(onChange).toHaveBeenLastCalledWith('plan')
  })

  it('draws the page field with the chosen page', async () => {
    mount(<PageSelect pages={[{ id: '/', label: 'Homepage' }]} value="/" onChange={() => {}} />)
    expect($('[data-slot="page-select"]')?.textContent).toBe('Homepage')
    expect(await audit(host)).toEqual([])
  })
})

describe('FileTree', () => {
  const FILES = ['src/app.tsx', 'src/lib/a.ts', 'README.md']

  it('draws folders first, opens on click, picks a file, and reveals the chosen one', async () => {
    const onSelect = vi.fn()
    mount(<FileTree files={FILES} value="src/lib/a.ts" onSelect={onSelect} />)
    const paths = () => $$('[role="treeitem"]').map((r) => r.getAttribute('data-path'))
    // The chosen file's folders are opened for it.
    expect(paths()).toEqual(['src', 'src/lib', 'src/lib/a.ts', 'src/app.tsx', 'README.md'])
    expect($('[data-path="src/lib/a.ts"]')?.getAttribute('aria-selected')).toBe('true')
    expect($('[data-path="src"]')?.getAttribute('aria-expanded')).toBe('true')
    click($('[data-path="src"]'))
    expect(paths()).toEqual(['src', 'README.md'])
    click($('[data-path="README.md"]'))
    expect(onSelect).toHaveBeenLastCalledWith('README.md')
    expect(await audit(host)).toEqual([])
  })

  it('moves and picks on the keyboard', () => {
    const onSelect = vi.fn()
    mount(<FileTree files={FILES} onSelect={onSelect} />)
    const tree = $('[role="tree"]')!
    // src, README.md — focus starts on the first row.
    expect($$('[role="treeitem"]')[0]!.tabIndex).toBe(0)
    key(tree, 'ArrowRight') // open src
    expect($$('[role="treeitem"]').map((r) => r.getAttribute('data-path'))).toContain('src/app.tsx')
    key(tree, 'End')
    key(tree, 'Enter')
    expect(onSelect).toHaveBeenLastCalledWith('README.md')
  })

  it('reads one folder at a time, and says so when a read fails', async () => {
    const load = vi.fn(async (dir: string) => {
      if (dir === '') return [{ path: 'src', kind: 'dir' as const }, { path: 'a.md', kind: 'file' as const }]
      if (dir === 'src') throw new Error('Could not read src')
      return []
    })
    mount(<FileTree load={load} />)
    await flush()
    expect(load).toHaveBeenCalledWith('')
    expect($$('[role="treeitem"]').map((r) => r.getAttribute('data-path'))).toEqual(['src', 'a.md'])
    click($('[data-path="src"]'))
    await flush()
    expect(load).toHaveBeenCalledWith('src')
    expect(host.textContent).toContain('Could not read src')
  })

  it('says it is empty rather than drawing nothing', () => {
    mount(<FileTree files={[]} />)
    expect(host.textContent).toBe('No files yet.')
  })
})

describe('FileTabs', () => {
  const FILES = [
    { path: 'src/app.tsx', content: 'export const x = 1', dirty: true },
    { path: 'README.md', content: '# hi' },
    { path: 'big.bin', error: 'Too large to show here.' },
  ]

  it('shows the chosen file as text in a named field, and switches on arrows', async () => {
    const onSelect = vi.fn()
    mount(<FileTabs files={FILES} value="src/app.tsx" onSelect={onSelect} onClose={() => {}} />)
    const tabs = $$('[role="tab"]')
    expect(tabs.map((t) => t.getAttribute('aria-label'))).toEqual(['src/app.tsx, unsaved', 'README.md', 'big.bin'])
    const field = host.querySelector('textarea')!
    expect(field.value).toBe('export const x = 1')
    expect(field.getAttribute('aria-label')).toBe('src/app.tsx')
    // No onChange: the field is read-only.
    expect(field.readOnly).toBe(true)
    key(tabs[0]!, 'ArrowRight')
    expect(onSelect).toHaveBeenLastCalledWith('README.md')
    expect(await audit(host)).toEqual([])
  })

  it('closes on Delete and on the pointer x, and says why a file cannot be shown', () => {
    const onClose = vi.fn()
    mount(<FileTabs files={FILES} value="big.bin" onSelect={() => {}} onClose={onClose} />)
    expect(host.textContent).toContain('Too large to show here.')
    const tabs = $$('[role="tab"]')
    key(tabs[2]!, 'Delete')
    expect(onClose).toHaveBeenLastCalledWith('big.bin')
    click($$('[data-slot="file-tabs-close"]')[1]!)
    expect(onClose).toHaveBeenLastCalledWith('README.md')
  })

  it('hands every edit back when the host takes edits', () => {
    const onChange = vi.fn()
    mount(<FileTabs files={FILES} value="README.md" onSelect={() => {}} onChange={onChange} />)
    expect(host.querySelector('textarea')!.readOnly).toBe(false)
  })
})

describe('PreviewFrame', () => {
  const attr = () => host.querySelector('iframe')?.getAttribute('sandbox')?.split(' ') ?? null

  it('frames a foreign page with its own origin, and never the top window', async () => {
    mount(<PreviewFrame src="https://app.example/" title="Preview of app" />)
    const frame = host.querySelector('iframe')!
    expect(frame.getAttribute('src')).toBe('https://app.example/')
    expect(frame.getAttribute('title')).toBe('Preview of app')
    expect(attr()).toEqual(['allow-scripts', 'allow-forms', 'allow-popups', 'allow-popups-to-escape-sandbox', 'allow-same-origin'])
    expect(attr()).not.toContain('allow-top-navigation')
    expect(await audit(host)).toEqual([])
  })

  it('runs a same-origin page with no origin at all', () => {
    mount(<PreviewFrame src="/p" />)
    expect(attr()).not.toContain('allow-same-origin')
    expect(attr()).toContain('allow-scripts')
  })

  it.each(['javascript:alert(1)', 'data:text/html,<b>x</b>'])('refuses %s and frames nothing', (src) => {
    mount(<PreviewFrame src={src} />)
    expect(host.querySelector('iframe')).toBeNull()
    expect(host.textContent).toContain('This address cannot be previewed.')
  })

  it('says nothing is deployed when there is no address', () => {
    mount(<PreviewFrame src={null} />)
    expect(host.textContent).toContain('Nothing deployed yet.')
  })

  it('narrows to a phone and reloads on the handle', () => {
    const ref = createRef<PreviewHandle>()
    mount(<PreviewFrame ref={ref} src="https://app.example/" device="mobile" />)
    expect($('[data-slot="preview-frame"]')?.getAttribute('data-device')).toBe('mobile')
    const before = host.querySelector('iframe')
    act(() => ref.current!.reload())
    expect(host.querySelector('iframe')).not.toBe(before)
  })

  it('believes the frame, from its origin, and nobody else', () => {
    const onBridge = vi.fn()
    mount(<PreviewFrame src="https://app.example/" onBridge={onBridge} />)
    const win = host.querySelector('iframe')!.contentWindow
    const post = (origin: string, source: MessageEventSource | null, data: unknown) =>
      act(() => {
        window.dispatchEvent(new MessageEvent('message', { origin, source, data }))
      })
    post('https://evil.example', win, { type: 'preview:ready' })
    post('https://app.example', window, { type: 'preview:ready' })
    expect(onBridge).not.toHaveBeenCalled()
    post('https://app.example', win, { type: 'preview:ready' })
    expect(onBridge).toHaveBeenCalledWith({ type: 'preview:ready' })
  })

  it('posts to the frame at its origin only', () => {
    const ref = createRef<PreviewHandle>()
    mount(<PreviewFrame ref={ref} src="https://app.example/x" />)
    const win = host.querySelector('iframe')!.contentWindow!
    const spy = vi.spyOn(win, 'postMessage').mockImplementation(() => {})
    act(() => ref.current!.post({ type: 'preview:editable', active: true }))
    expect(spy).toHaveBeenCalledWith({ type: 'preview:editable', active: true }, 'https://app.example')
  })

  it('floats the toolbar over the frame', () => {
    mount(<PreviewFrame src="https://app.example/" toolbar={<button type="button">Pick</button>} />)
    expect($('[data-slot="preview-toolbar"]')?.textContent).toBe('Pick')
  })
})

describe('Console', () => {
  const LINES = [
    { id: 1, level: 'log' as const, text: 'building…', source: 'run' },
    { id: 2, level: 'error' as const, text: '<script>alert(1)</script>' },
  ]

  it('shows only its header when shut, and opens to the last height', async () => {
    const onHeight = vi.fn()
    mount(<Console lines={LINES} height={HEAD} onHeight={onHeight} />)
    expect($('[data-slot="console-lines"]')).toBeNull()
    expect($('[data-slot="console-errors"]')?.textContent).toBe('1')
    click(host.querySelector('[aria-label="Expand console"]'))
    expect(onHeight).toHaveBeenLastCalledWith(OPEN)
    expect(await audit(host)).toEqual([])
  })

  it('draws lines as text — markup is characters, not elements', async () => {
    mount(<Console lines={LINES} height={300} onHeight={() => {}} />)
    const lines = $('[data-slot="console-lines"]')!
    expect(lines.textContent).toContain('<script>alert(1)</script>')
    expect(lines.querySelector('script')).toBeNull()
    expect(lines.querySelector('[data-level="error"]')).not.toBeNull()
    expect(await audit(host)).toEqual([])
  })

  it('resizes from the keyboard on its grip, and shuts on Enter', () => {
    const onHeight = vi.fn()
    mount(<Console lines={[]} height={300} onHeight={onHeight} />)
    const grip = $('[data-slot="console-grip"]')!
    expect(grip.getAttribute('role')).toBe('separator')
    key(grip, 'ArrowUp')
    expect(onHeight).toHaveBeenLastCalledWith(324)
    key(grip, 'Enter')
    expect(onHeight).toHaveBeenLastCalledWith(HEAD)
  })

  it('runs a typed command and clears the log', () => {
    const onRun = vi.fn()
    const onClear = vi.fn()
    mount(<Console lines={LINES} height={300} onHeight={() => {}} onRun={onRun} onClear={onClear} />)
    const field = host.querySelector('input[aria-label="Run a command"]') as HTMLInputElement
    expect(field).not.toBeNull()
    click(host.querySelector('[aria-label="Clear console"]'))
    expect(onClear).toHaveBeenCalledOnce()
  })

  it('switches to a host tab', () => {
    const onTab = vi.fn()
    mount(
      <Console lines={[]} height={300} onHeight={() => {}} tab="term" onTab={onTab} tabs={[{ id: 'term', label: 'Terminal', content: <p>tty</p> }]} />,
    )
    expect($('[role="tabpanel"]')?.textContent).toBe('tty')
    click($$('[role="tab"]')[0]!)
    expect(onTab).toHaveBeenLastCalledWith('log')
  })
})

describe('Suggestions', () => {
  it('sends a chip and can be put away', async () => {
    const onPick = vi.fn()
    const onDismiss = vi.fn()
    mount(<Suggestions items={SUGGESTIONS} onPick={onPick} onDismiss={onDismiss} />)
    const chips = $$('[data-slot="suggestions"] button')
    expect(chips.map((c) => c.textContent)).toEqual([...SUGGESTIONS, ''])
    click(chips[1]!)
    expect(onPick).toHaveBeenLastCalledWith('Review SEO')
    click(host.querySelector('[aria-label="Hide suggestions"]'))
    expect(onDismiss).toHaveBeenCalledOnce()
    expect(await audit(host)).toEqual([])
  })

  it('draws nothing when there is nothing to suggest', () => {
    mount(<Suggestions items={[]} onPick={() => {}} />)
    expect(host.textContent).toBe('')
  })
})

describe('Attachments', () => {
  it('lists what the next turn is about, each removable', async () => {
    const onRemove = vi.fn()
    mount(
      <Attachments
        items={[
          { id: 'a', kind: 'file', label: 'src/app.tsx' },
          { id: 'b', kind: 'element', label: '<button> .cta' },
        ]}
        onRemove={onRemove}
      />,
    )
    expect($$('li').map((l) => l.textContent)).toEqual(['src/app.tsx', '<button> .cta'])
    click(host.querySelector('[aria-label="Remove <button> .cta"]'))
    expect(onRemove).toHaveBeenLastCalledWith('b')
    expect(await audit(host)).toEqual([])
  })
})

describe('Feedback', () => {
  it('toggles a verdict and copies the reply', async () => {
    const onVerdict = vi.fn()
    const writeText = vi.fn(async () => {})
    Object.defineProperty(navigator, 'clipboard', { value: { writeText }, configurable: true })
    mount(<Feedback text="the reply" onVerdict={onVerdict} />)
    const up = host.querySelector('[aria-label="Good result"]')!
    click(up)
    expect(onVerdict).toHaveBeenLastCalledWith('up')
    expect(up.getAttribute('aria-pressed')).toBe('true')
    click(up)
    expect(onVerdict).toHaveBeenLastCalledWith(null)
    click(host.querySelector('[aria-label="Copy reply"]'))
    await flush()
    expect(writeText).toHaveBeenCalledWith('the reply')
    expect(host.querySelector('[aria-label="Copied"]')).not.toBeNull()
    expect(await audit(host)).toEqual([])
  })
})
