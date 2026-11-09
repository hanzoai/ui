/**
 * The browser half: hydrate the document from the payload the HTML carries.
 * Following a link loads the next page, so there is nothing else to do; in dev
 * a server change re-asks this page's payload and renders it in place.
 */
import { createFromFetch, createFromReadableStream } from '@vitejs/plugin-rsc/browser'
import { startTransition, StrictMode, useEffect, useState, type ReactNode } from 'react'
import { createRoot, hydrateRoot } from 'react-dom/client'
import { rscStream } from 'rsc-html-stream/client'

type Payload = { root: ReactNode }

async function main() {
  const first = await createFromReadableStream<Payload>(rscStream)
  let set: ((p: Payload) => void) | undefined
  function Root() {
    const [payload, setPayload] = useState(first)
    useEffect(() => {
      set = (p) => startTransition(() => setPayload(p))
    }, [])
    return payload.root
  }
  const root = (
    <StrictMode>
      <Root />
    </StrictMode>
  )
  if ('__NO_HYDRATE' in globalThis) createRoot(document).render(root)
  else hydrateRoot(document, root)
  if (import.meta.hot) {
    import.meta.hot.on('rsc:update', async () => {
      const url = new URL(window.location.href)
      url.pathname += '_.rsc'
      set?.(await createFromFetch<Payload>(fetch(url)))
    })
  }
}

main()
