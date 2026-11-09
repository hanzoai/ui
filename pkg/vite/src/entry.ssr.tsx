/**
 * The HTML half: a Server Components payload rendered to a document, with the
 * payload inlined so the browser hydrates without asking again. A build fails
 * on any error; the dev server falls back to a client render and says so.
 */
import './server.js'
import { createFromReadableStream, getClientEntryUrl } from '@vitejs/plugin-rsc/ssr'
import { use, type ReactNode } from 'react'
import { renderToReadableStream } from 'react-dom/server.edge'
import { prerender } from 'react-dom/static.edge'
import { injectRSCPayload } from 'rsc-html-stream/server'

export async function renderHtml(rscStream: ReadableStream<Uint8Array>, options: { ssg?: boolean } = {}) {
  const [forHtml, forBrowser] = rscStream.tee()
  let payload: Promise<{ root: ReactNode }> | undefined
  function Root() {
    payload ??= createFromReadableStream<{ root: ReactNode }>(forHtml)
    return use(payload).root
  }
  const bootstrapScriptContent = `import(${JSON.stringify(getClientEntryUrl())})`
  let stream: ReadableStream<Uint8Array>
  let status: number | undefined
  if (options.ssg) {
    stream = (await prerender(<Root />, { bootstrapScriptContent })).prelude
  } else {
    try {
      stream = await renderToReadableStream(<Root />, { bootstrapScriptContent })
    } catch {
      status = 500
      stream = await renderToReadableStream(
        <html lang="en">
          <body>
            <noscript>The server render failed.</noscript>
          </body>
        </html>,
        { bootstrapScriptContent: `self.__NO_HYDRATE=1;${bootstrapScriptContent}` },
      )
    }
  }
  return { stream: stream.pipeThrough(injectRSCPayload(forBrowser)), status }
}
