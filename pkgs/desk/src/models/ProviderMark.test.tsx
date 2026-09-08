import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'

import { ProviderMark } from './ProviderMark.js'
import { canonicalOrg } from './id.js'

/**
 * The mark a namespace resolves to, read off the markup it produces.
 *
 * `renderToStaticMarkup` rather than a DOM: the bytes are the subject, the
 * component has no state and no effects, and a server pass is a real one for it.
 */
const draw = (props: Parameters<typeof ProviderMark>[0]) =>
  renderToStaticMarkup(<ProviderMark {...props} />)

/** An `<svg>` is a mark; a `<span>` is the monogram fallback. */
const drawn = (html: string) => (html.startsWith('<svg') ? 'mark' : 'monogram')

describe('a lab we have a mark for gets the mark', () => {
  it('never decays a lab we draw into a letter', () => {
    for (const org of ['anthropic', 'openai', 'google', 'meta', 'mistralai', 'deepseek', 'nvidia', 'z-ai', 'moonshotai', 'x-ai']) {
      expect(drawn(draw({ org }))).toBe('mark')
    }
  })

  it('reaches the mark through the alias when the lab\'s namespace is not its slug', () => {
    // MARKS files Anthropic under `claude` and Z.ai under `zai`; OF is the road.
    expect(draw({ org: 'anthropic' })).toBe(draw({ org: 'claude' }))
    expect(draw({ org: 'z-ai' })).toBe(draw({ org: 'zai' }))
    expect(draw({ org: 'meta-llama' })).toBe(draw({ org: 'meta' }))
  })

  it('reads the latest-alias `~` as the same lab, as `canonicalOrg` does', () => {
    expect(draw({ org: '~anthropic' })).toBe(draw({ org: 'anthropic' }))
    expect(canonicalOrg('~anthropic')).toBe(canonicalOrg('anthropic'))
  })
})

describe('the model beats the lab that serves it', () => {
  it('draws the family, because our namespace holds every family under one lab', () => {
    // All three answer under `hanzo`; reading the lab first drew the H on all three.
    expect(draw({ org: 'hanzo', model: 'claude-opus-4.8' })).toBe(draw({ org: 'anthropic' }))
    expect(draw({ org: 'hanzo', model: 'gpt-5' })).toBe(draw({ org: 'openai' }))
    expect(draw({ org: 'hanzo', model: 'zen5-pro' })).not.toBe(draw({ org: 'hanzo' }))
  })

  it('falls back to the lab when the family names no mark', () => {
    expect(draw({ org: 'anthropic', model: 'something-unheard-of' })).toBe(draw({ org: 'anthropic' }))
  })

  it('reads the family as the leading run of letters, so o3 is OpenAI', () => {
    expect(draw({ org: 'hanzo', model: 'o3' })).toBe(draw({ org: 'openai' }))
    expect(draw({ org: 'hanzo', model: 'nemotron-4' })).toBe(draw({ org: 'nvidia' }))
  })
})

describe('a lab we have no mark for', () => {
  it('falls to a monogram rather than to nothing', () => {
    const html = draw({ org: 'some-new-lab' })
    expect(drawn(html)).toBe('monogram')
    expect(html).toContain('>s<')
  })

  it('draws a monogram for a namespace named after a prototype member, rather than throwing', () => {
    // `MARKS`, `OF` and the name table all answer `toString` from the prototype
    // unless the lookup is own-rows-only, and the mark would then be a function.
    for (const org of ['toString', 'constructor', 'valueOf', 'hasOwnProperty']) {
      const html = draw({ org })
      expect(drawn(html)).toBe('monogram')
      expect(html).toContain(`>${org[0]}<`)
    }
  })

  it('takes the initial from the lab\'s display name, not its namespace', () => {
    // `sao10k` is named `Sao10K`; both begin with the same letter, so use one
    // where the table changes the case that reaches the screen.
    expect(draw({ org: 'unknown-lab' })).toContain('>u<')
  })

  it('holds the same footprint as a mark, so a row does not reflow', () => {
    const html = draw({ org: 'some-new-lab', size: 40 })
    expect(html).toContain('width:40px')
    expect(html).toContain('height:40px')
  })
})

describe('a lab\'s own colour', () => {
  it('paints a lab that publishes a hex in that hex', () => {
    expect(draw({ org: 'anthropic' })).toContain('color:#C37E4E')
    expect(draw({ org: 'nvidia' })).toContain('color:#76B900')
  })

  it('leaves a lab whose brand IS black to the page ink, in both themes', () => {
    // OpenAI, xAI and Moonshot publish #000000; currentColor already resolves
    // to what they render on their own dark surfaces.
    expect(draw({ org: 'openai' })).not.toContain('color:#')
  })

  it('drops the hue on request, for a band where the name is already beside it', () => {
    expect(draw({ org: 'anthropic', ink: true })).not.toContain('color:#')
    expect(drawn(draw({ org: 'anthropic', ink: true }))).toBe('mark')
  })
})

describe('the wrapper the bodies assume', () => {
  it('repeats fill-rule=evenodd, without which Mistral\'s inner square fills in', () => {
    expect(draw({ org: 'mistralai' })).toContain('fill-rule="evenodd"')
  })

  it('draws at a 24-unit viewBox and the size it was asked for', () => {
    const html = draw({ org: 'anthropic', size: 16 })
    expect(html).toContain('viewBox="0 0 24 24"')
    expect(html).toContain('width="16"')
    expect(html).toContain('height="16"')
  })

  it('is decoration beside a name, so it is hidden from a reader who listens', () => {
    expect(draw({ org: 'anthropic' })).toContain('aria-hidden="true"')
    expect(draw({ org: 'some-new-lab' })).toContain('aria-hidden="true"')
  })
})

describe('what is drawn with nothing to go on', () => {
  it('draws Enso, the house mark, rather than an empty box', () => {
    expect(drawn(draw({}))).toBe('mark')
  })

  it('reads provider when org is absent, since a caller has one or the other', () => {
    expect(draw({ provider: 'anthropic' })).toBe(draw({ org: 'anthropic' }))
  })
})
