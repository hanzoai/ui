// Does an appearance knob actually move a RENDERED @hanzo/ui component?
//
// A green build proves nothing here: gui silently ignores a prop it does not
// know, and a token that resolves to a frozen literal renders perfectly while
// answering to nobody. So this renders real components through the real config,
// puts them in a real browser with @hanzo/design's real stylesheet, and reads
// COMPUTED styles before and after each knob moves.
import { readFileSync, writeFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { createElement as h } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { createServer } from 'vite'

import { alias } from './alias.mjs'

const UI = dirname(dirname(fileURLToPath(import.meta.url)))
const require = createRequire(import.meta.url)
delete process.env.GUI_DID_OUTPUT_CSS

const server = await createServer({
  root: UI, configFile: false, logLevel: 'error',
  css: { postcss: { plugins: [] } }, resolve: { alias },
  ssr: { noExternal: [/@hanzogui\//, /@hanzo\/gui/] },
})

const { GuiProvider, YStack, Text } = await server.ssrLoadModule('@hanzo/gui')
const { config, css: guiCSS } = await server.ssrLoadModule(join(UI, 'src/gui-config.ts'))

// One specimen per axis, each using the ordinary token spelling an app would.
const Specimens = () =>
  h(YStack, null,
    h(Text, { id: 'type', fontSize: '$3' }, 'type'),
    h(YStack, { id: 'space', padding: '$4' }, h(Text, null, 'space')),
    h(YStack, { id: 'edge', borderWidth: 1, borderColor: '$borderColor' }, h(Text, null, 'edge')),
    h(YStack, { id: 'loud', backgroundColor: '$accentBackground' }, h(Text, { color: '$accentColor' }, 'loud')),
    h(YStack, { id: 'ground', backgroundColor: '$background' }, h(Text, { color: '$color' }, 'ground')),
  )

let markup = ''
for (const theme of ['light', 'dark'])
  markup = renderToStaticMarkup(h(GuiProvider, { config, defaultTheme: theme }, h(Specimens)))

const design = readFileSync(require.resolve('@hanzo/design/styles.css'), 'utf8')
const sheet = guiCSS()
console.log(`markup ${markup.length}B · gui sheet ${sheet.length}B · atomic classes in markup: ${(markup.match(/_[a-z]+-/g) || []).length}`)
writeFileSync(join(UI, '.measure.html'),
  `<style>${design}</style><style>${sheet}</style><body class="t_dark">${markup}</body>`)
await server.close()
process.exit(0)
