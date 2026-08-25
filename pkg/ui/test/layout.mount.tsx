// The layout surface, mounted the way an app mounts it.
//
// Client-side on purpose, for the reason `stress.mount.tsx` gives: rnw appends
// its <style> on import and gui inserts an atomic rule on first render, so a
// server-rendered page has neither and every box on it measures unstyled.
//
// And a real browser rather than jsdom, because jsdom cannot answer this at
// all: measured on jsdom 28.1.0, three identical `display:grid` boxes in one
// document read grid, flex, flex — `getComputedStyle` resolves the cascade for
// the FIRST element queried and hands every later element the base rule.
import { createRoot } from 'react-dom/client'
import { GuiProvider } from '@hanzo/gui'

import '../dist/theme.css'
import '../src/styles/motion.css'
import { config } from '../src/gui-config'
import { Layout } from './layout'

createRoot(document.getElementById('root')!).render(
  <GuiProvider config={config} defaultTheme="dark">
    <Layout />
  </GuiProvider>
)
