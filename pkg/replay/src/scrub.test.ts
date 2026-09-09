import { describe as group, expect, it } from 'vitest'
import { scrubEvent } from './scrub'
import type { eventWithTime } from './types'

const CALLBACK = 'https://hanzo.id/callback?code=4%2F0AeanS0bQx7Lm&state=xyzzy123'

function ev(type: number, data: unknown): eventWithTime {
  return { type, data, timestamp: 1 } as unknown as eventWithTime
}

group('scrubEvent', () => {
  it('redacts the credential params on a Meta href — the page URL of every recording', () => {
    const e = scrubEvent(ev(4, { href: CALLBACK, width: 800, height: 600 }))
    const href = (e.data as { href: string }).href
    expect(href).not.toContain('4%2F0AeanS0bQx7Lm')
    expect(href).not.toContain('xyzzy123')
    expect(href).toContain('https://hanzo.id/callback')
    expect(href).toContain('code=[redacted]')
    expect(href).toContain('state=[redacted]')
    // the non-credential shape of the URL still reads
    expect((scrubEvent(ev(4, { href: 'https://hanzo.ai/pricing?plan=pro' })).data as { href: string }).href).toBe(
      'https://hanzo.ai/pricing?plan=pro',
    )
  })

  it('redacts URLs nested anywhere in a full snapshot', () => {
    const e = scrubEvent(
      ev(2, {
        node: {
          type: 0,
          id: 1,
          childNodes: [
            {
              type: 2,
              tagName: 'html',
              attributes: {},
              id: 2,
              childNodes: [
                {
                  type: 2,
                  tagName: 'a',
                  id: 3,
                  attributes: { href: CALLBACK, class: 'link' },
                  childNodes: [
                    {
                      type: 2,
                      tagName: 'img',
                      id: 4,
                      attributes: {
                        src: 'https://cdn.example/x.png?token=sekrit',
                        alt: 'x',
                        style: 'background:url(https://cdn.example/y.png?sig=abc)',
                      },
                      childNodes: [],
                    },
                  ],
                },
              ],
            },
          ],
        },
      }),
    )
    const json = JSON.stringify(e)
    expect(json).not.toContain('4%2F0AeanS0bQx7Lm')
    expect(json).not.toContain('xyzzy123')
    expect(json).not.toContain('sekrit')
    expect(json).not.toContain('sig=abc')
    // untouched non-URL attributes survive, so the replay still renders
    expect(json).toContain('"class":"link"')
    expect(json).toContain('"alt":"x"')
  })

  it('redacts URLs on mutation adds and attribute changes', () => {
    const e = scrubEvent(
      ev(3, {
        source: 0,
        texts: [],
        removes: [],
        adds: [
          {
            parentId: 2,
            nextId: null,
            node: { type: 2, tagName: 'link', id: 9, attributes: { href: CALLBACK }, childNodes: [] },
          },
        ],
        attributes: [{ id: 3, attributes: { src: 'https://x.dev/a?access_token=live', title: 'ok' } }],
      }),
    )
    const json = JSON.stringify(e)
    expect(json).not.toContain('4%2F0AeanS0bQx7Lm')
    expect(json).not.toContain('access_token=live')
    expect(json).toContain('access_token=[redacted]')
    expect(json).toContain('"title":"ok"')
  })

  it('also strips secret SHAPES a URL carries', () => {
    const e = scrubEvent(ev(4, { href: 'https://api.example/v1?x=1#Bearer abcdefghijklmnop' }))
    expect((e.data as { href: string }).href).not.toContain('abcdefghijklmnop')
  })

  it('is total on events that carry no URL at all', () => {
    expect(() => scrubEvent(ev(3, { source: 2, type: 0, id: 5, x: 1, y: 2 }))).not.toThrow()
    expect(() => scrubEvent(ev(3, undefined))).not.toThrow()
    expect(() => scrubEvent(ev(0, null))).not.toThrow()
  })

  it('does not blow the stack on a tree deeper than the call stack', () => {
    // 20k deep is past what a recursive walk (or JSON.stringify) survives, which
    // is why the walk is iterative — a telemetry path must not be the thing that
    // throws.
    const leaf: Record<string, unknown> = {
      type: 2,
      tagName: 'div',
      attributes: { href: CALLBACK },
      childNodes: [],
    }
    let node: Record<string, unknown> = leaf
    for (let i = 0; i < 20000; i++) {
      node = { type: 2, tagName: 'div', attributes: {}, childNodes: [node] }
    }
    scrubEvent(ev(2, { node }))
    const href = (leaf.attributes as Record<string, string>).href
    expect(href).not.toContain('xyzzy123')
    expect(href).toContain('code=[redacted]')
  })
})
