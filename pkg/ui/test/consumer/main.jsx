// What a consumer writes. Nothing else is allowed in this file.
//
// No CSS import, no gui config, no generator, no token setup — if any of those
// were needed, @hanzo/ui would not be correct out of the box, and this app is how
// that is proven rather than asserted. It renders from the INSTALLED TARBALL, not
// a workspace link, because a link resolves through the source tree and hides
// exactly the packaging defects this exists to catch.
import { createRoot } from 'react-dom/client'
import { Hanzo } from '@hanzo/ui'
import { Gallery } from '@hanzo/ui/gallery'

const theme = new URLSearchParams(location.search).get('theme') === 'light' ? 'light' : 'dark'

createRoot(document.getElementById('root')).render(
  <Hanzo theme={theme}>
    <Gallery />
  </Hanzo>,
)
