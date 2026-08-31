// @vitest-environment jsdom

/**
 * The mapping, and that it really reaches a player.
 *
 * `clip` is pure and could be asserted alone, but the interesting failure is one
 * layer out: a mapping that is right while the prop it feeds is spelled wrong
 * leaves the persona stuck on whatever it opened with, and nothing errors. So
 * these mount it and read the `<video>` that resulted.
 */
import { act } from 'react'
import type { ReactNode } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { GuiProvider } from '@hanzo/gui'

import config from '../gui-config'
import { Persona, clip } from './Persona'

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

const playing = () => [...host.querySelectorAll('video')].map((v) => v.getAttribute('src'))

const scenes = { idle: '/idle.mp4', thinking: '/thinking.mp4' }

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

describe('clip', () => {
  it('falls back to idle for a mood the persona has no clip for', () => {
    // Every emotion but idle is optional, so a persona with one clip is a legal
    // persona and there is never a gap on the canvas to design around.
    expect(clip(scenes, 'thinking')).toBe('/thinking.mp4')
    expect(clip(scenes, 'surprised')).toBe('/idle.mp4')
    expect(clip(scenes, 'idle')).toBe('/idle.mp4')
  })
})

describe('Persona', () => {
  it('plays the clip the emotion names', () => {
    mount(<Persona scenes={scenes} emotion="thinking" />)
    expect(playing()).toContain('/thinking.mp4')
  })

  it('opens idle', () => {
    mount(<Persona scenes={scenes} />)
    expect(playing()).toContain('/idle.mp4')
  })

  it('changes mood by changing the clip, with no second player', () => {
    // The whole point of building on `clips`: the crossfade already there does
    // the switching, so a mood change is a prop change and there is one piece of
    // machinery playing video in this package rather than two.
    mount(<Persona scenes={scenes} />)
    expect(playing()).toContain('/idle.mp4')
    mount(<Persona scenes={scenes} emotion="thinking" />)
    expect(host.querySelectorAll('video')).toHaveLength(2)
    expect(playing()).toContain('/thinking.mp4')
  })
})
