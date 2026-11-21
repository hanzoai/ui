import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { configureCrm, type CrmHost } from './host'
import { watch } from './live'

class Source {
  static all: Source[] = []
  closed = false
  onerror: (() => void) | null = null
  private heard = new Map<string, (e: { data: string }) => void>()
  constructor(readonly url: string) {
    Source.all.push(this)
  }
  addEventListener(name: string, f: (e: { data: string }) => void) {
    this.heard.set(name, f)
  }
  close() {
    this.closed = true
  }
  send(name: string, data: unknown = {}) {
    this.heard.get(name)?.({ data: JSON.stringify(data) })
  }
}

const posts: { url: string; body?: unknown }[] = []
let grants = 0

beforeEach(() => {
  vi.useFakeTimers()
  Source.all = []
  posts.length = 0
  grants = 0
  vi.stubGlobal('EventSource', Source)
  configureCrm({
    v1Url: (path: string) => `https://api.test/v1/${path}`,
    post: async (url: string, body?: unknown) => {
      posts.push({ url, body })
      return url.endsWith('/token') ? { token: `grant-${++grants}` } : undefined
    },
  } as unknown as CrmHost)
})

afterEach(() => {
  vi.useRealTimers()
  vi.unstubAllGlobals()
})

const settle = () => vi.advanceTimersByTimeAsync(0)

describe('watch', () => {
  it('opens the stream on a grant, names its collections, and reports a write by collection', async () => {
    const changed = vi.fn()
    watch(['people', 'activities'], changed)
    await settle()
    expect(posts[0].url).toBe('https://api.test/v1/base/realtime/token')
    expect(Source.all[0].url).toBe('https://api.test/v1/base/realtime?token=grant-1')

    Source.all[0].send('CONNECT', { clientId: 'c1' })
    await settle()
    expect(posts[1]).toEqual({ url: 'https://api.test/v1/base/realtime', body: { clientId: 'c1', subscriptions: ['people/*', 'activities/*'] } })

    Source.all[0].send('people/*', { action: 'create', record: { id: 'p1' } })
    expect(changed).toHaveBeenCalledExactlyOnceWith('people')
  })

  it('opens a dropped stream again on a new grant and reports what it missed once it is subscribed', async () => {
    const changed = vi.fn()
    watch(['people'], changed)
    await settle()
    Source.all[0].send('CONNECT', { clientId: 'c1' })
    await settle()
    expect(changed).not.toHaveBeenCalled()

    Source.all[0].onerror?.()
    expect(Source.all[0].closed).toBe(true)
    await vi.advanceTimersByTimeAsync(10_000)
    expect(Source.all[1].url).toBe('https://api.test/v1/base/realtime?token=grant-2')
    expect(changed).not.toHaveBeenCalled()

    Source.all[1].send('CONNECT', { clientId: 'c2' })
    await settle()
    expect(changed).toHaveBeenCalledExactlyOnceWith('people')
  })

  it('stops for good: the stream is closed and a pending reopen does nothing', async () => {
    const stop = watch(['people'], vi.fn())
    await settle()
    Source.all[0].onerror?.()
    stop()
    await vi.advanceTimersByTimeAsync(10_000)
    expect(Source.all).toHaveLength(1)
    expect(Source.all[0].closed).toBe(true)
  })
})
