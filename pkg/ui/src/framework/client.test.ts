import { describe, it, expect } from 'vitest'
import { createFrameworkClient, listQuery, rows, type FrameworkTransport } from './client'

describe('listQuery — the generic document list querystring', () => {
  it('is empty for no query', () => {
    expect(listQuery()).toBe('')
    expect(listQuery({})).toBe('')
  })

  it('encodes filters as a JSON object (the engine contract)', () => {
    const qs = listQuery({ filters: { status: 'Published' } })
    expect(qs).toContain('filters=')
    expect(decodeURIComponent(qs)).toContain('filters={"status":"Published"}')
  })

  it('joins fields and passes order_by + limit', () => {
    const qs = listQuery({ fields: ['title', 'slug'], orderBy: 'updatedAt desc', limit: 50 })
    const p = new URLSearchParams(qs.replace(/^\?/, ''))
    expect(p.get('fields')).toBe('title,slug')
    expect(p.get('order_by')).toBe('updatedAt desc')
    expect(p.get('limit')).toBe('50')
  })

  it('omits an empty filters object', () => {
    expect(listQuery({ filters: {} })).toBe('')
  })
})

describe('rows — defensive envelope reading', () => {
  it('accepts a bare array, {data}, {items}, {rows}', () => {
    expect(rows([{ a: 1 }])).toEqual([{ a: 1 }])
    expect(rows({ data: [{ a: 1 }] })).toEqual([{ a: 1 }])
    expect(rows({ items: [{ a: 1 }] })).toEqual([{ a: 1 }])
    expect(rows({ rows: [{ a: 1 }] })).toEqual([{ a: 1 }])
  })
  it('degrades a shape drift to an empty list rather than throwing', () => {
    expect(rows(null)).toEqual([])
    expect(rows('nope')).toEqual([])
    expect(rows({ data: 'nope' })).toEqual([])
    expect(rows([1, null, { a: 1 }])).toEqual([{ a: 1 }]) // non-objects dropped
  })
})

/** A transport that records the calls instead of making them. */
function spyTransport() {
  const calls: { verb: string; path: string; body?: unknown }[] = []
  let reply: unknown = {}
  const t: FrameworkTransport = {
    get: async (path) => {
      calls.push({ verb: 'GET', path })
      return reply
    },
    post: async (path, body) => {
      calls.push({ verb: 'POST', path, body })
      return reply
    },
    put: async (path, body) => {
      calls.push({ verb: 'PUT', path, body })
      return reply
    },
    del: async (path) => {
      calls.push({ verb: 'DELETE', path })
    },
  }
  return { t, calls, setReply: (v: unknown) => (reply = v) }
}

describe('createFrameworkClient — paths are relative to the framework root', () => {
  it('builds the documented engine routes and NEVER an absolute or /api path', async () => {
    const { t, calls } = spyTransport()
    const c = createFrameworkClient(t)

    await c.doctypes.list()
    await c.doctypes.get('Page')
    await c.doctypes.create({ name: 'Page', fields: [] })
    await c.doctypes.update('Page', { name: 'Page', fields: [] })
    await c.doctypes.remove('Page')
    await c.records.list('Page', { limit: 2 })
    await c.records.get('Page', 'about-us')
    await c.records.create('Page', { title: 'x' })
    await c.records.update('Page', 'about-us', { title: 'y' })
    await c.records.remove('Page', 'about-us')
    await c.records.submit('Sales Order', 'SO-1')
    await c.records.cancel('Sales Order', 'SO-1')
    await c.modules.list()
    await c.modules.get('cms')
    await c.modules.install('cms')
    await c.roles.list()
    await c.roles.assign('z@hanzo.ai', 'System Manager')
    await c.roles.revoke('z@hanzo.ai', 'System Manager')
    await c.summary()

    expect(calls.map((x) => `${x.verb} ${x.path}`)).toEqual([
      'GET doctypes',
      'GET doctypes/Page',
      'POST doctypes',
      'PUT doctypes/Page',
      'DELETE doctypes/Page',
      'GET Page?limit=2',
      'GET Page/about-us',
      'POST Page',
      'PUT Page/about-us',
      'DELETE Page/about-us',
      'POST Sales%20Order/SO-1/submit',
      'POST Sales%20Order/SO-1/cancel',
      'GET modules',
      'GET modules/cms',
      'POST modules/cms/install',
      'GET roles',
      'POST roles',
      'DELETE roles/z%40hanzo.ai/System%20Manager',
      'GET summary',
    ])
    expect(calls.every((x) => !x.path.startsWith('/') && !x.path.includes('/api/'))).toBe(true)
  })

  it('normalizes a DocType with a missing/!array fields key', async () => {
    const { t, setReply } = spyTransport()
    setReply({ name: 'Broken' })
    const dt = await createFrameworkClient(t).doctypes.get('Broken')
    expect(dt.fields).toEqual([])
    expect(dt.name).toBe('Broken')
  })

  it('reads a module payload defensively', async () => {
    const { t, setReply } = spyTransport()
    setReply({})
    const m = await createFrameworkClient(t).modules.get('erp')
    expect(m).toEqual({ module: 'erp', doctypes: [], installed: [] })
  })
})
