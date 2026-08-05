// Write dist/styles.css — every rule @hanzo/ui's own components need, extracted
// at OUR publish time instead of at each app's.
//
// @hanzo/gui compiles a style prop to an atomic class the first time something
// RENDERS it, so the sheet does not exist until a render has happened. Every app
// therefore had to run a generator of its own and import the output. hanzo.app
// did not, and shipped 103 `_bg-` classes and 26 `_dsp-` classes against a
// stylesheet containing zero of either — every gui-styled element unstyled in
// production, with a green build for the whole life of the bug.
//
// The render happens here instead. src/gallery.tsx is the list of what to render
// and it is the same list the unit test mounts and the consumer test asserts
// against, so a component cannot be styled by one and missed by another.
//
// `config.getCSS()` returns gui's design-system rules, the token and font custom
// properties, the theme rule sets, and `getAllRules()` — the atomic rules this
// process accumulated. Accumulation happens during `getSplitStyles`, which is
// why a plain `renderToStaticMarkup` is enough and no DOM is involved.
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { createServer } from 'vite'

import { alias } from './alias.mjs'

const UI = dirname(dirname(fileURLToPath(import.meta.url)))

// Rendering must not be told the CSS was already emitted — that flag makes
// getCSS() and getAllRules() return empty and there is nothing to write.
delete process.env.GUI_DID_OUTPUT_CSS

const server = await createServer({
  root: UI,
  configFile: false,
  logLevel: 'error',
  css: { postcss: { plugins: [] } },
  resolve: { alias },
  // The aliases only reach source vite transforms, and the icon set's
  // `react-native-svg` import is inside @hanzogui — so gui has to be inlined for
  // the stub to apply. react-native-web stays external: it is Node-loadable, and
  // inlining it drags in CommonJS (`@react-native/normalize-color`) that vite's
  // SSR runner evaluates as ESM and dies on.
  ssr: { noExternal: [/@hanzogui\//, /@hanzo\/gui/] },
})


/**
 * Stop gui's ROOT theme from shadowing @hanzo/design's token names.
 *
 * design declares `--background`, `--black`, `--white` on `:root` and `.light`
 * — specificity (0,1,0). gui's generated theme classes redeclare the same three
 * on `:root.t_dark` / `:root.t_light` — (0,2,0). Specificity beats source order,
 * so gui wins in every app that wires GuiProvider's theme class onto <html>, and
 * design's palette is silently replaced by gui's default grey.
 *
 * That also means the obvious workaround does not work: re-importing design's
 * colors.css LAST cannot win against a higher specificity. It only appears to
 * work where the theme classes never reach <html>, and reverts the day someone
 * wires themes correctly — a fix that expires on being fixed.
 *
 * One fact, one home, at the CSS layer too: these three names belong to design,
 * so the ROOT theme blocks stop declaring them and `var(--background)` resolves
 * through design.
 *
 * SUB-THEMES ARE LEFT ALONE, and that distinction is the whole reason this is a
 * parser and not a regex. `.t_accent`, `.t_blue_Button` and ~248 others
 * legitimately scope their own background — that is what a nested theme IS.
 * Only a selector that is exactly `:root`, `:root.t_dark` or `:root.t_light` is
 * the root theme; anything with a further `.t_*` is a nested one and keeps its
 * override.
 *
 * Bare `:root` is in that list because gui shadows TWICE, by two different
 * mechanisms, and fixing only the loud one leaves the page just as wrong:
 *   · `:root.t_dark` / `:root.t_light` — (0,2,0), beats design on SPECIFICITY.
 *   · plain `:root { --background: var(--t1) }` — (0,1,0), TIES design and wins
 *     on SOURCE ORDER, because gui's block is appended after design's here.
 * The second one is why the acceptance test still read gui's grey after the
 * first fix.
 */
const SHADOWED = ['background', 'black', 'white']
const ROOT_THEME = /^:root(\.t_(dark|light))?$/

function unshadowDesignTokens(css) {
  let out = ''
  let i = 0
  let stripped = 0
  while (i < css.length) {
    const open = css.indexOf('{', i)
    if (open === -1) {
      out += css.slice(i)
      break
    }
    const close = css.indexOf('}', open)
    if (close === -1) {
      out += css.slice(i)
      break
    }
    const selector = css.slice(i, open)
    let body = css.slice(open + 1, close)
    const isRootTheme = selector
      .split(',')
      .some((sel) => ROOT_THEME.test(sel.trim()))
    if (isRootTheme) {
      for (const name of SHADOWED) {
        const before = body
        body = body.replace(new RegExp(`(^|;)\\s*--${name}\\s*:[^;}]*;?`, 'g'), '$1')
        if (body !== before) stripped++
      }
    }
    out += selector + '{' + body + '}'
    i = close + 1
  }
  console.log(`  unshadowed ${stripped} design token declaration(s) from gui's root themes`)
  return out
}

try {
  const { GuiProvider } = await server.ssrLoadModule('@hanzo/gui')
  const { config } = await server.ssrLoadModule(join(UI, 'src/gui-config.ts'))
  const { Gallery } = await server.ssrLoadModule(join(UI, 'src/gallery.tsx'))

  // Both themes: a theme is a set of custom-property values, but the styles that
  // READ them are per-theme classes, and a component only renders the ones its
  // theme resolves. Rendering dark alone leaves the light sheet incomplete.
  for (const theme of ['dark', 'light'])
    renderToStaticMarkup(
      createElement(GuiProvider, { config, defaultTheme: theme }, createElement(Gallery)),
    )

  const gui = unshadowDesignTokens(config.getCSS())
  // dist/theme.css, not src: the token layer is @hanzo/design's, composed in
  // by scripts/compose-theme.mjs. Reading src here would ship a stylesheet whose
  // components reference tokens the sheet never declares.
  const tokens = readFileSync(join(UI, 'dist/theme.css'), 'utf8')
  const motion = readFileSync(join(UI, 'src/styles/motion.css'), 'utf8')

  // `--hanzo-ui-styles` is what <Hanzo> looks up to tell a consumer, in
  // development, that this file never reached the document.
  const css = [
    '/* @hanzo/ui — generated by scripts/gen-css.mjs. Do not edit. */',
    ':root { --hanzo-ui-styles: 1; }',
    tokens,
    motion,
    gui,
  ].join('\n')

  mkdirSync(join(UI, 'dist'), { recursive: true })
  writeFileSync(join(UI, 'dist/styles.css'), css)

  const atomic = (gui.match(/\._[\w-]+/g) ?? []).length
  console.log(
    `dist/styles.css — ${css.length.toLocaleString()} bytes, ${atomic.toLocaleString()} atomic selectors`,
  )
} finally {
  await server.close()
}

// Vite's module runner leaves handles open that `close()` does not reap, and a
// build step that writes its output and then never exits hangs `prepack`, which
// hangs `pnpm pack`, which hangs `pnpm publish`. The work is done; leave.
process.exit(0)
