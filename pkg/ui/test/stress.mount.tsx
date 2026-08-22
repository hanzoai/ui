// Mounts the stress page in a REAL browser.
//
// Client-side on purpose. react-native-web and gui both register their style
// rules from the running app — rnw appends a <style> element on import, gui
// inserts an atomic rule the first time a prop renders. A server render emits
// neither, so a page assembled out of `renderToStaticMarkup` plus a hand-picked
// list of stylesheets is a page where those rules are simply absent, and every
// box on it measures wrong. Mounting the way an app mounts is the only way the
// numbers mean anything.
import { createRoot } from 'react-dom/client'
import { GuiProvider } from '@hanzo/gui'

import '../dist/theme.css'
import '../src/styles/motion.css'
import { config } from '../src/gui-config'
import { Stress } from './stress'

createRoot(document.getElementById('root')!).render(
  <GuiProvider config={config} defaultTheme="dark">
    <Stress />
  </GuiProvider>,
)
