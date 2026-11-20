// @vitest-environment jsdom

/**
 * The security posture, read off the element rather than off the source.
 *
 * `sandbox=""` is one attribute away from being the opposite of itself: adding
 * `allow-scripts` turns a picture into an execution surface inside the host
 * page, and nothing about the rendered result looks different. So these mount
 * the component and read the live `iframe` — its `sandbox` list, and that the
 * list is EMPTY — rather than trusting the JSX.
 *
 * The `Parts` arms are here for the same reason. Which of the two an artifact
 * gets is decided by one optional field, and both branches render something
 * plausible; asserting the `data-slot` is how a silently wrong branch is caught.
 */
import { act } from 'react'
import type { ReactNode } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { GuiProvider } from '@hanzo/gui'

import config from '../gui-config'
import { ChatHandoffProvider } from './Code'
import { Parts } from './Parts'
import { Preview } from './Preview'

declare global {
  // eslint-disable-next-line no-var
  var IS_REACT_ACT_ENVIRONMENT: boolean
}

let host: HTMLDivElement
let root: Root

const mount = (ui: ReactNode) => {
  act(() => {
    root.render(
      <GuiProvider config={config} defaultTheme="dark">
        {ui}
      </GuiProvider>,
    )
  })
}

const frame = () => host.querySelector('iframe')
const slots = () => [...host.querySelectorAll('[data-slot]')].map((el) => el.getAttribute('data-slot'))

/**
 * What the frame is allowed to do.
 *
 * Read off the ATTRIBUTE, because jsdom does not reflect `sandbox` as a
 * `DOMTokenList` — `iframe.sandbox` is `undefined` there, and every question
 * asked of it answers `undefined` rather than answering wrongly. The attribute
 * is what a browser parses, so this is the same fact one layer down; `null`
 * means no attribute at all, which is a fully trusted frame.
 */
const granted = (): string[] | null => {
  const attr = frame()?.getAttribute('sandbox')
  return attr == null ? null : attr.split(/\s+/).filter(Boolean)
}

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

const PAGE = '<style>b{color:red}</style><b>Pricing</b>'

describe('Preview', () => {
  it('renders the document the model wrote', () => {
    mount(<Preview markup={PAGE} title="Pricing page" />)
    expect(frame()?.getAttribute('srcdoc')).toBe(PAGE)
    // No url is involved, so nothing is fetched and no origin is pulled in.
    expect(frame()?.getAttribute('src')).toBeNull()
  })

  it('grants the document nothing', () => {
    mount(<Preview markup={PAGE} />)
    // Present AND empty. A MISSING attribute is a fully trusted frame, so
    // `toEqual([])` and not merely "no allow-scripts" is the assertion: both
    // failures have to be one expression apart or only one of them is watched.
    expect(granted()).toEqual([])
  })

  it('holds script without granting it', () => {
    // A model that writes a script tag anyway is normal, not an attack. The
    // markup is carried verbatim — and stays inert, because the grant is what
    // runs it and there is no grant.
    mount(<Preview markup={`${PAGE}<script>parent.location='/'</script>`} />)
    expect(frame()?.getAttribute('srcdoc')).toContain('<script>')
    // Still nothing granted — `toEqual([])` rather than "does not contain
    // allow-scripts", which a missing attribute would also satisfy.
    expect(granted()).toEqual([])
  })

  it('is named for assistive tech even with no title', () => {
    mount(<Preview markup={PAGE} />)
    expect(frame()?.getAttribute('title')).toBeTruthy()
  })
})

describe('an artifact', () => {
  it('is shown when the turn is holding it', () => {
    mount(<Parts parts={[{ type: 'artifact', title: 'Pricing', kind: 'view', markup: PAGE }]} />)
    expect(slots()).toContain('preview')
    expect(slots()).not.toContain('artifact-card')
    expect(frame()?.getAttribute('srcdoc')).toBe(PAGE)
  })

  it('is a card when the turn only names it', () => {
    mount(<Parts parts={[{ type: 'artifact', title: 'Report', kind: 'canvas' }]} />)
    expect(slots()).toContain('artifact-card')
    expect(slots()).not.toContain('preview')
    expect(frame()).toBeNull()
  })
})

describe('Preview, the toolbar', () => {
  const press = (slot: string) => act(() => host.querySelector<HTMLElement>(`[data-slot="${slot}"]`)!.click())

  it('downloads the page under its title', () => {
    const created = vi.fn(() => 'blob:x')
    Object.assign(URL, { createObjectURL: created, revokeObjectURL: () => {} })
    const names: string[] = []
    const click = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(function (this: HTMLAnchorElement) {
      names.push(this.download)
    })
    mount(<Preview markup={PAGE} title="Pricing Page" />)
    press('preview-download')
    expect(names).toEqual(['pricing-page.html'])
    click.mockRestore()
  })

  it('offers Open in Dev only where the surface can take it there', () => {
    mount(<Preview markup={PAGE} />)
    expect(host.querySelector('[data-slot="preview-open-in-dev"]')).toBeNull()
    const openInDev = vi.fn()
    mount(
      <ChatHandoffProvider value={{ openInDev }}>
        <Preview markup={PAGE} title="Pricing" />
      </ChatHandoffProvider>,
    )
    press('preview-open-in-dev')
    expect(openInDev).toHaveBeenCalledWith({ code: PAGE, language: 'html', title: 'Pricing' })
  })
})
