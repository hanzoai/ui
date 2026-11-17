/**
 * The org's Base, as the CRM reads and writes it: the record shapes Base answers
 * (hanzoai/base, plain JSON REST, not the cloud's `{status,msg,data}` envelope)
 * and the one client the CRM asks of its host.
 *
 * The CRM never builds a Base request itself. The host hands it a `BaseClient`
 * already bound to the org's Base and the signed-in account's credential, because
 * only the host knows how it signs a request (console: the PKCE access token and
 * `X-Org-Id`; another app: its own IAM client). A refusal is an Error carrying the
 * HTTP `status`, which is all the CRM reads of it.
 */
import type { BaseCollection } from './fields'

/** A Base record — a flat map of field name → value (`id` always present). */
export type BaseRecord = Record<string, unknown> & { id?: string }

/** Base's paginated list result. */
export interface BaseListResult<T> {
  page: number
  perPage: number
  totalItems: number
  totalPages: number
  items: T[]
}

/** Record-list query params (a subset of Base's list API). */
export interface ListRecordsParams {
  page?: number
  perPage?: number
  sort?: string
  filter?: string
  expand?: string
  fields?: string
  skipTotal?: boolean
}

/**
 * What the CRM asks of the org's Base: `GET /v1/base/collections/:name` and the
 * record routes under it.
 */
export interface BaseClient {
  /** A collection's schema, or undefined when the org's Base has no such collection. */
  getCollection(name: string): Promise<BaseCollection | undefined>
  listRecords(collection: string, params?: ListRecordsParams): Promise<BaseListResult<BaseRecord>>
  getRecord(collection: string, id: string): Promise<BaseRecord>
  createRecord(collection: string, body: Record<string, unknown>): Promise<BaseRecord>
  updateRecord(collection: string, id: string, body: Record<string, unknown>): Promise<BaseRecord>
  deleteRecord(collection: string, id: string): Promise<void>
}
