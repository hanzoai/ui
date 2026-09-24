// @vitest-environment jsdom

/**
 * The accessibility check runs, and it can fail.
 *
 * `test/axe.ts` is what every component suite hands its mounted markup to. A
 * check nobody has watched fail is not known to run, so this mounts one
 * control that passes and one that must not — an icon-only button with no
 * name — and asserts both answers.
 */
import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { afterEach, beforeEach, expect, it } from 'vitest'
import { GuiProvider } from '@hanzo/gui'

import config from '../gui-config'
import { Button } from '../backends/gui'
import { audit } from '../../test/axe'

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

const mount = (ui: React.ReactNode) =>
  act(() => {
    root.render(
      <GuiProvider config={config} defaultTheme="dark">
        {ui}
      </GuiProvider>,
    )
  })

it('passes a named control', async () => {
  mount(<Button>Ship</Button>)
  expect(await audit(host)).toEqual([])
})

it('fails a control with no accessible name', async () => {
  mount(<button type="button" />)
  const ids = (await audit(host)).map((f) => f.id)
  expect(ids).toContain('button-name')
})
