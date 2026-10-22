// The direction page, mounted the way an app mounts it — see stress.mount.tsx
// for why a server render measures nothing here.
import { createRoot } from 'react-dom/client'
import { GuiProvider } from '@hanzo/gui'

import '../dist/theme.css'
import '../src/styles/motion.css'
import { config } from '../src/gui-config'
import { Page } from './rtl'

createRoot(document.getElementById('root')!).render(
  <GuiProvider config={config} defaultTheme="dark">
    <div data-page="">
      <Page />
    </div>
  </GuiProvider>
)
