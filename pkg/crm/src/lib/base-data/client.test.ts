import { describe, expect, it } from 'vitest'

import { asListResult, baseClient, baseUrlOf, type BaseSend } from './client'

const refused = (status: number) => Object.assign(new Error(`HTTP ${status}`), { status })

describe('a Base client over a host transport', () => {
  const ROOT = 'https://api.hanzo.ai/v1/base'

  const recording = (answer: unknown | (() => never)) => {
    const sent: { method: string; url: string; body?: Record<string, unknown> }[] = []
    const send: BaseSend = async (method, url, body) => {
      sent.push({ method, url, body })
      return typeof answer === 'function' ? (answer as () => never)() : answer
    }
    return { sent, client: baseClient({ baseUrl: `${ROOT}/`, send }) }
  }

  it('lists records with the query Base reads, each segment encoded', async () => {
    const { sent, client } = recording({ page: 2, perPage: 50, totalItems: 120, totalPages: 3, items: [{ id: 'a' }] })
    const r = await client.listRecords('list members', { page: 2, perPage: 50, filter: 'type = "investor"', sort: '-created', expand: undefined })
    expect(sent[0].method).toBe('GET')
    expect(sent[0].url).toBe(`${ROOT}/collections/list%20members/records?page=2&perPage=50&filter=type+%3D+%22investor%22&sort=-created`)
    expect(r).toEqual({ page: 2, perPage: 50, totalItems: 120, totalPages: 3, items: [{ id: 'a' }] })
  })

  it('writes one record at its own address, with the body', async () => {
    const { sent, client } = recording({ id: 'p/1' })
    await client.createRecord('people', { name: 'Ada' })
    await client.updateRecord('people', 'p/1', { name: 'Ada L.' })
    await client.deleteRecord('people', 'p/1')
    expect(sent.map((s) => `${s.method} ${s.url}`)).toEqual([
      `POST ${ROOT}/collections/people/records`,
      `PATCH ${ROOT}/collections/people/records/p%2F1`,
      `DELETE ${ROOT}/collections/people/records/p%2F1`,
    ])
    expect(sent[0].body).toEqual({ name: 'Ada' })
    expect(sent[2].body).toBeUndefined()
  })

  it('answers no schema for a collection the org does not have, and passes any other refusal on', async () => {
    expect(await recording(() => { throw refused(404) }).client.getCollection('deals')).toBeUndefined()
    expect(await recording({ name: 'other' }).client.getCollection('deals')).toBeUndefined()
    expect(await recording({ name: 'deals', fields: [] }).client.getCollection('deals')).toEqual({ name: 'deals', fields: [] })
    await expect(recording(() => { throw refused(403) }).client.getCollection('deals')).rejects.toMatchObject({ status: 403 })
  })

  it('reads a list that answers as a page or as a bare array', () => {
    expect(asListResult([{ id: 'a' }, { id: 'b' }])).toEqual({ page: 1, perPage: 2, totalItems: 2, totalPages: 1, items: [{ id: 'a' }, { id: 'b' }] })
    expect(asListResult({ items: [{ id: 'a' }] })).toEqual({ page: 1, perPage: 1, totalItems: 1, totalPages: 1, items: [{ id: 'a' }] })
    expect(asListResult(null)).toEqual({ page: 1, perPage: 0, totalItems: 0, totalPages: 1, items: [] })
  })

  it('builds an address with no query when none is set', () => {
    expect(baseUrlOf(ROOT, 'collections/people', {})).toBe(`${ROOT}/collections/people`)
  })
})
