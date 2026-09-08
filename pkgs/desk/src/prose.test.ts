import { describe, expect, it } from 'vitest'

import { prose } from './prose.js'

/**
 * The claims this module makes about a message, checked as behaviour.
 *
 * Every case below is text a model can put in an answer, so none of it is
 * hypothetical: a turn about XSS quotes a `javascript:` link, a turn about HTML
 * contains tags, and a turn about markdown contains a fence with tags inside it.
 * The suite runs in a node environment with no `document`, which is the server
 * pass — the branch where a sanitizer that needs a DOM would have nothing to do.
 */

describe('markdown a model actually writes', () => {
  it('reads a fence as code rather than printing the backticks', () => {
    const html = prose('```ts\nconst x = 1\n```')
    expect(html).toContain('<pre>')
    expect(html).toContain('const x = 1')
    expect(html).not.toContain('```')
  })

  it('keeps a tag inside a fence as text, and the fence intact', () => {
    const html = prose('```html\n<img src=x onerror=alert(1)>\n```')
    expect(html).toContain('&lt;img src=x onerror=alert(1)&gt;')
    expect(html).not.toContain('<img')
  })

  it('draws lists, emphasis and tables', () => {
    expect(prose('- one\n- two')).toContain('<li>')
    expect(prose('**bold**')).toContain('<strong>')
    expect(prose('| a | b |\n| - | - |\n| 1 | 2 |')).toContain('<table>')
  })

  it('answers nothing for nothing, on every token of a turn that has not started', () => {
    expect(prose('')).toBe('')
  })
})

describe('raw html in a message is text somebody typed', () => {
  it('shows a script tag instead of running it', () => {
    const html = prose('<script>alert(1)</script>')
    expect(html).not.toContain('<script')
    expect(html).toContain('&lt;script&gt;')
  })

  it('shows an event handler on an element instead of mounting it', () => {
    const html = prose('<div onclick="steal()">click</div>')
    expect(html).not.toContain('<div onclick')
    expect(html).toContain('&lt;div onclick=&quot;steal()&quot;&gt;')
  })

  it('escapes an inline tag too, not only a block one', () => {
    expect(prose('an <b>inline</b> tag')).toContain('&lt;b&gt;')
  })
})

describe('a link keeps only a scheme a message is allowed to carry', () => {
  const href = (html: string) => html.match(/href="([^"]*)"/)?.[1]

  it('keeps http, https, mailto and tel', () => {
    expect(href(prose('[a](https://hanzo.ai)'))).toBe('https://hanzo.ai')
    expect(href(prose('[a](http://hanzo.ai)'))).toBe('http://hanzo.ai')
    expect(href(prose('[a](mailto:z@hanzo.ai)'))).toBe('mailto:z@hanzo.ai')
    expect(href(prose('[a](tel:+15550100)'))).toBe('tel:+15550100')
  })

  it('keeps a relative path and a fragment, which carry no scheme at all', () => {
    expect(href(prose('[a](/chat)'))).toBe('/chat')
    expect(href(prose('[a](#part-two)'))).toBe('#part-two')
  })

  it('drops the link and keeps the words for a scheme that is a script', () => {
    for (const bad of ['javascript:alert(1)', 'data:text/html,<script>1</script>', 'vbscript:msgbox']) {
      const html = prose(`[press me](${bad})`)
      expect(html).not.toContain('<a')
      expect(html).toContain('press me')
    }
  })

  it('is not fooled by case or by leading space, which a browser ignores', () => {
    expect(prose('[a](JaVaScRiPt:alert(1))')).not.toContain('<a')
    expect(prose('[a]( javascript:alert(1))')).not.toContain('<a')
  })
})

describe('where a link opens', () => {
  it('sends an absolute address to a new tab with no handle on this one', () => {
    const html = prose('[docs](https://hanzo.ai/docs)')
    expect(html).toContain('target="_blank"')
    expect(html).toContain('rel="noopener noreferrer nofollow"')
  })

  it('leaves a link back into this app where the reader is', () => {
    const html = prose('[home](/home)')
    expect(html).toContain('<a href="/home"')
    expect(html).not.toContain('target=')
  })
})

describe('an image is a fetch to wherever the message says', () => {
  it('renders the alt text instead of the request', () => {
    const html = prose('![a receipt for your address](https://tracker.example/pixel.png)')
    expect(html).not.toContain('<img')
    expect(html).toContain('a receipt for your address')
  })
})

describe('the same bytes on the server and in the browser', () => {
  it('needs no DOM: this suite has none, and every case above rendered', () => {
    expect(typeof globalThis.document).toBe('undefined')
  })

  it('is a pure function of its text, so two passes agree', () => {
    const turn = '# Title\n\nSee [docs](https://hanzo.ai) and `code`.\n\n```js\nx\n```'
    expect(prose(turn)).toBe(prose(turn))
  })
})
