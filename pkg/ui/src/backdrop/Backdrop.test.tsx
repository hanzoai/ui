// @vitest-environment jsdom

/**
 * The backdrop paints, against a live DOM.
 *
 * A static render cannot answer this one. The canvas reads `location` AFTER
 * mount — a server has none, and a player src built from a guessed origin is a
 * hydration mismatch on top of a handshake the provider would refuse — so
 * `renderToStaticMarkup` correctly returns nothing and would prove nothing.
 *
 * What is asserted is what fails silently: `off` leaving a third-party frame
 * mounted (a setting that says off while video streams behind it), a clip
 * revealed before a frame exists (a black flash at every handover), and a media
 * URL reaching a `src` without passing the rule (an element fetching from a host
 * nobody chose, on every load, forever).
 */
import { act } from 'react'
import type { ReactNode } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { GuiProvider } from '@hanzo/gui'

import config from '../gui-config'
import { Backdrop } from './Backdrop'

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

const layer = () => host.querySelector('[data-slot="backdrop"]')
const clips = () => [...host.querySelectorAll('video')]

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

describe('off means absent', () => {
  it('mounts nothing at all with no props', () => {
    // A component library must not begin streaming video because it was
    // imported. `BLANK` is off, and off is the default.
    mount(<Backdrop />)
    expect(layer()).toBeNull()
  })

  it('unmounts the frame rather than hiding it', () => {
    mount(<Backdrop mode="clips" clips={['/a.mp4']} />)
    expect(clips()).toHaveLength(2)
    mount(<Backdrop mode="off" clips={['/a.mp4']} />)
    // Left mounted at opacity 0 it would keep decoding video behind a setting
    // that says it is off.
    expect(clips()).toHaveLength(0)
  })
})

describe('clips', () => {
  it('stacks two players so one can load while the other plays', () => {
    mount(<Backdrop mode="clips" clips={['/a.mp4', '/b.mp4']} />)
    expect(clips()).toHaveLength(2)
    // The first clip goes into the HIDDEN slot and is revealed by the same flip
    // every later one uses, so there is one reveal path and no black first
    // frame — which is why exactly one of the two carries a source at rest.
    expect(clips().filter((v) => v.getAttribute('src')).map((v) => v.getAttribute('src'))).toEqual([
      '/a.mp4',
    ])
  })

  it('reveals nothing until a frame is really playing', () => {
    mount(<Backdrop mode="clips" clips={['/a.mp4']} />)
    for (const v of clips()) expect(v.style.opacity).toBe('0')
    act(() => {
      clips()
        .find((v) => v.getAttribute('src'))
        ?.dispatchEvent(new Event('playing'))
    })
    expect(clips().filter((v) => v.style.opacity === '1')).toHaveLength(1)
  })

  it('loops a lone clip and lets a member of a list end', () => {
    // Looping a member would freeze the cycle on it; the next can only cross in
    // if this one is allowed to finish.
    mount(<Backdrop mode="clips" clips={['/a.mp4']} />)
    expect(clips()[0].loop).toBe(true)
    mount(<Backdrop mode="clips" clips={['/a.mp4', '/b.mp4']} />)
    expect(clips()[0].loop).toBe(false)
  })

  it('holds a src to the media rule even when props were written by hand', () => {
    // `merge` guards what a surface STORES. This guards what reaches an element,
    // so there is no way in that skips the rule.
    mount(<Backdrop mode="clips" clips={['https://tracker.example/x.mp4', '/ok.mp4']} />)
    const srcs = clips().map((v) => v.getAttribute('src'))
    expect(srcs).not.toContain('https://tracker.example/x.mp4')
    expect(srcs).toContain('/ok.mp4')
  })
})

describe('the layer is scenery, not UI', () => {
  it('takes no pointer and is hidden from assistive tech', () => {
    // A backdrop that could take a click would be a trap sitting under the
    // conversation.
    mount(<Backdrop mode="clips" clips={['/a.mp4']} />)
    const el = layer() as HTMLElement
    expect(el.getAttribute('aria-hidden')).toBe('true')
    expect(el.style.pointerEvents || getComputedStyle(el).pointerEvents).toBe('none')
  })
})
