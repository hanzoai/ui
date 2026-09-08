// What a message says, as it was written.
//
// A model answers in markdown — fences, lists, emphasis, tables — and a surface
// that prints those characters shows the reader the notation instead of the
// answer. `marked` reads it, and it is the engine the rest of the estate reads
// markdown with, so a fence means the same thing wherever it is written.
//
// THIS IS THE PARSER `@hanzo/ui/chat` DECLINES TO SHIP. `Parts` takes a `prose`
// callback because the plugin set is a surface's decision; this is the Hanzo
// dialect for it — one grammar, one safety rule, every surface.
//
// IT IS NOT ITSELF THE CALLBACK, and the difference is invisible to a compiler.
// `Parts` wants nodes, this answers HTML, and `(text) => string` satisfies
// `(text, part) => ReactNode` because a string IS a ReactNode — so passing it
// straight in typechecks and then renders the tags as words on screen. Hand the
// bytes to the DOM at the call site:
//
//   <Parts parts={parts} prose={(t) => <div dangerouslySetInnerHTML={{ __html: prose(t) }} />} />
//
// SAFE BY CONSTRUCTION RATHER THAN BY CLEANUP. Rendering everything and handing
// the result to DOMPurify needs a DOM, and a server pass has none — so nothing
// dangerous is produced in the first place. Raw HTML is dropped at the token
// and a link keeps only a scheme a message is allowed to carry. The same bytes
// come out on the server and in the browser, which is also what keeps hydration
// quiet.

import { Marked } from 'marked'

/** Schemes a message may link to. Anything else — `javascript:`, `data:`,
 *  `vbscript:` — is a script delivered as a destination, so the text stays and
 *  the link does not. A relative or fragment href has no scheme and is kept. */
const SCHEME = /^(https?:|mailto:|tel:|[^a-z]|[a-z][a-z0-9+.-]*$)/i

const escaped = (s: string): string =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')

const reader = new Marked({
  gfm: true,
  breaks: true,
  renderer: {
    /** Raw HTML in a message is not markup, it is text somebody typed. Shown as
     *  what it is rather than run, which is the honest reading and also the one
     *  that cannot execute. */
    html({ text }) {
      return escaped(text)
    },
    link({ href, title, tokens }) {
      const inner = this.parser.parseInline(tokens)
      if (!SCHEME.test(href.trim())) return inner
      const t = title ? ` title="${escaped(title)}"` : ''
      // AWAY IS A NEW TAB, HOME IS NOT. Someone else's page opened from a
      // message never gets a handle on this one and never inherits the
      // referrer; a link back into this app is a link, and hijacking it into a
      // second tab loses the reader their place for nothing.
      const away = /^[a-z][a-z0-9+.-]*:/i.test(href.trim())
        ? ' target="_blank" rel="noopener noreferrer nofollow"'
        : ''
      return `<a href="${escaped(href)}"${t}${away}>${inner}</a>`
    },
    /** An image is a fetch to wherever the message says, which is a reader's
     *  address leaking to whoever wrote it. The alt text is the message. */
    image({ text }) {
      return escaped(text)
    },
  },
})

/** One message's text as HTML. Empty in, empty out — a caller rendering a
 *  streaming turn asks this on every token and the first is nothing. */
export function prose(text: string): string {
  if (!text) return ''
  return reader.parse(text, { async: false }) as string
}
