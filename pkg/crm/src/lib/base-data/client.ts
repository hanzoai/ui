/**
 * A `BaseClient` over any JSON transport — for a host with no Base client of its own.
 *
 * The host's transport signs the request (its bearer, its org) and parses the
 * reply; this builds Base's addresses and reads its answers. It is the console's
 * Base client (`BaseDataApi`) with the transport taken out: the same record paths,
 * each segment encoded, the same list query, and the same reading of a list that
 * answers as a page or as a bare array.
 */
import type { BaseClient, BaseListResult, BaseRecord, ListRecordsParams } from './api'
import type { BaseCollection } from './fields'

export type { BaseClient, BaseListResult, BaseRecord, ListRecordsParams } from './api'
export type { BaseCollection } from './fields'

/**
 * One request: the method, the full URL, and a JSON body when there is one. It
 * resolves to the parsed JSON (null or undefined for an empty reply) and rejects
 * with an Error carrying the HTTP `status` on a refusal.
 */
export type BaseSend = (method: 'GET' | 'POST' | 'PATCH' | 'DELETE', url: string, body?: Record<string, unknown>) => Promise<unknown>

export interface BaseClientOptions {
  /** The Base API root, such as `https://api.hanzo.ai/v1/base`. */
  baseUrl: string
  send: BaseSend
}

/** Pull a list out of `{ items }` (paginated) or a bare array. */
function asItems<T>(body: unknown): T[] {
  if (Array.isArray(body)) return body as T[]
  if (body && typeof body === 'object' && Array.isArray((body as { items?: unknown }).items)) {
    return (body as { items: T[] }).items
  }
  return []
}

/** A records answer as a `BaseListResult`, whether it came paginated or as a bare array. */
export function asListResult<T>(body: unknown): BaseListResult<T> {
  if (body && typeof body === 'object' && !Array.isArray(body)) {
    const o = body as Partial<BaseListResult<T>>
    if (Array.isArray(o.items)) {
      return {
        page: o.page ?? 1,
        perPage: o.perPage ?? o.items.length,
        totalItems: o.totalItems ?? o.items.length,
        totalPages: o.totalPages ?? 1,
        items: o.items,
      }
    }
  }
  const items = asItems<T>(body)
  return { page: 1, perPage: items.length, totalItems: items.length, totalPages: 1, items }
}

/** The address of `path` under `root`, with the query's set values. */
export function baseUrlOf(root: string, path: string, query?: ListRecordsParams): string {
  const qs = new URLSearchParams()
  for (const [k, v] of Object.entries(query ?? {})) {
    if (v !== undefined && v !== null) qs.set(k, String(v))
  }
  const q = qs.toString()
  return `${root.replace(/\/+$/, '')}/${path}${q ? `?${q}` : ''}`
}

const statusOf = (e: unknown): number | undefined => {
  const s = (e as { status?: unknown } | null)?.status
  return typeof s === 'number' ? s : undefined
}

export function baseClient({ baseUrl, send }: BaseClientOptions): BaseClient {
  const records = (collection: string, id?: string): string => {
    const at = `collections/${encodeURIComponent(collection)}/records`
    return id === undefined ? at : `${at}/${encodeURIComponent(id)}`
  }
  const url = (path: string, query?: ListRecordsParams): string => baseUrlOf(baseUrl, path, query)
  return {
    async getCollection(name: string): Promise<BaseCollection | undefined> {
      try {
        const c = (await send('GET', url(`collections/${encodeURIComponent(name)}`))) as BaseCollection | null
        return c && c.name === name ? c : undefined
      } catch (e) {
        if (statusOf(e) === 404) return undefined
        throw e
      }
    },
    async listRecords(collection: string, params?: ListRecordsParams): Promise<BaseListResult<BaseRecord>> {
      return asListResult<BaseRecord>(await send('GET', url(records(collection), params)))
    },
    async getRecord(collection: string, id: string): Promise<BaseRecord> {
      return (await send('GET', url(records(collection, id)))) as BaseRecord
    },
    async createRecord(collection: string, body: Record<string, unknown>): Promise<BaseRecord> {
      return (await send('POST', url(records(collection)), body)) as BaseRecord
    },
    async updateRecord(collection: string, id: string, body: Record<string, unknown>): Promise<BaseRecord> {
      return (await send('PATCH', url(records(collection, id)), body)) as BaseRecord
    },
    async deleteRecord(collection: string, id: string): Promise<void> {
      await send('DELETE', url(records(collection, id)))
    },
  }
}
