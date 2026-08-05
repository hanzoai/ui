'use client'

/**
 * `Hanzo` — the root. The only thing an app has to mount.
 *
 *   import { Hanzo, Button } from '@hanzo/ui'
 *   <Hanzo><Button>Ship</Button></Hanzo>
 *
 * No config file, no CSS import, no generator script, no bundler aliases. Three
 * things used to be the app's job and are now the package's:
 *
 *   the config — @hanzo/gui resolves `$3` / `$background` / `$borderColor`
 *     against ONE process-global config, and @hanzo/ui owns it (gui-config.ts).
 *     It is passed here as a value, not imported for its side effect: Vite 8
 *     ignores package.json `sideEffects` ARRAYS outright, so a bare
 *     `import './gui-config'` is dropped and the first render dies on "Missing
 *     hanzogui config". A value a rendered component needs cannot be shaken out.
 *
 *   the stylesheet — `styles.css` is generated at OUR publish time by rendering
 *     every component and harvesting the atomic CSS that render produces
 *     (scripts/gen-css.mjs). It used to be each app's job to run a generator and
 *     import its output; hanzo.app never did, and shipped 103 `_bg-` classes
 *     against zero `_bg-` rules with a green build the whole time.
 *
 *   the theme — gui throws "Missing theme." for any component without a root
 *     theme context, so there is no version of this that works with no root at
 *     all. Dark-first, matching the Hanzo identity.
 *
 * `disableInjectCSS` because the sheet is a real file. Left on, the provider
 * inlines `config.getCSS()` into the document on every streaming flush — that is
 * how hanzo.ai once shipped thirteen byte-identical copies, 591,305 of its
 * 638,443 bytes. A file is cached once and costs nothing after the first page.
 * Styles gui generates at runtime for props we could not know at publish time
 * still reach the document: that path is `insertStyleRules`, and it is not what
 * this flag controls.
 */
import { GuiProvider } from '@hanzo/gui'
import { TelemetryProvider, type TelemetryConfig } from '@hanzogui/telemetry'
import type { ReactNode } from 'react'

import { config } from './gui-config'
import './styles.css'

export type HanzoProps = {
  children?: ReactNode
  /** Dark-first Hanzo identity. `light` retunes it. */
  theme?: 'dark' | 'light'
  /**
   * Interaction analytics for everything inside — OFF unless you ask.
   *
   *   <Hanzo analytics>                              // zero config
   *   <Hanzo analytics={{ product: 'console' }}>     // named surface
   *
   * `true` is the whole setup: every click, form change, submit and route
   * change inside this tree arrives on the ONE front door (`POST /v1/event`)
   * annotated with the component it happened on — `card/button[Save]` — with
   * input values withheld. Nothing to instrument at a call site.
   *
   * It is a PROP, not the default, because mounting a component library must
   * never start a network conversation an app did not ask for. Off, this
   * renders no provider, installs no listener and sends nothing.
   *
   * On, it is the one wiring: ONE client (@hanzo/event), ONE capture engine
   * (@hanzo/observe), ONE endpoint, ONE publishable key — and consent decides
   * whether any of it runs (Global Privacy Control, Do Not Track, and a stored
   * choice a banner records, which outranks both). An app that already mounts
   * `<TelemetryProvider/>` itself leaves this off; both would be the same
   * client on the same stream, and the capture engine refuses a root another
   * engine holds, so the events do not double either way.
   */
  analytics?: boolean | TelemetryConfig
}

/** A stylesheet that did not reach the document is invisible until someone opens
 *  production. `styles.css` declares `--hanzo-ui-styles`, so the check is one
 *  lookup, it runs once, and it names the fix. Development only.
 *
 *  A document with NO stylesheets at all is jsdom, where nothing loads CSS and
 *  there is nothing to be wrong about — throwing there would break every
 *  consumer's unit tests to report a condition that cannot exist. */
let checked = false
const assertStylesheet = () => {
  if (checked || typeof document === 'undefined' || document.styleSheets.length === 0) return
  checked = true
  if (getComputedStyle(document.documentElement).getPropertyValue('--hanzo-ui-styles').trim()) return
  throw new Error(
    '@hanzo/ui: styles.css did not reach the document. <Hanzo> imports it, so a bundler ' +
      'that does not process CSS imported from node_modules has dropped it. Import it ' +
      "directly instead: import '@hanzo/ui/styles.css'.",
  )
}

export const Hanzo = ({ children, theme = 'dark', analytics }: HanzoProps) => {
  if (process.env.NODE_ENV !== 'production') assertStylesheet()
  const tree = (
    <GuiProvider config={config} defaultTheme={theme} disableInjectCSS>
      {children}
    </GuiProvider>
  )
  // OUTSIDE the gui provider: capture is delegated at the document, so it does
  // not need to be inside the styled tree, and an app that renders its own
  // `<TelemetryProvider/>` above `<Hanzo>` then nests two providers of the same
  // kind rather than interleaving them with the theme.
  if (!analytics) return tree
  return <TelemetryProvider {...(analytics === true ? {} : analytics)}>{tree}</TelemetryProvider>
}

export default Hanzo
