'use client'

/**
 * A CRM object's schema as the table and the record page read it, and the small
 * helpers both use: who may change the org's CRM, many writes at once, a file to
 * save.
 */
import { useEffect, useState } from 'react'
import type { FieldDefinition, SelectOption } from '@hanzo/data'
import { CrmApi } from '../lib/crm'
import { baseCollectionToFields, baseFieldsOf, recordFromBase, type BaseField } from '../lib/base-data/fields'
import type { BaseRecord } from '../lib/base-data/api'
import { currentOrg, useSession } from '../lib/host'
import type { CrmObject } from './objects'

/** What a relation field points at, by its name in module crm. */
export const TARGET: Record<string, string> = {
  company: 'companies',
  companies: 'companies',
  promoted_company: 'companies',
  contact: 'people',
  person: 'people',
  people: 'people',
  promoted_contact: 'people',
  opportunity: 'opportunities',
  opportunities: 'opportunities',
  candidate: 'candidates',
  candidates: 'candidates',
  list: 'lists',
  segment: 'segments',
  note: 'notes',
  task: 'tasks',
}

/** Fields the table never offers: bookkeeping a person does not sort or edit by. */
const QUIET = new Set(['position', 'consent', 'avatar', 'public_ref', 'answers', 'metadata', 'screen', 'events'])

export interface Schema {
  /** Base's own fields, by which values cross (fromBase / toBase) and queries compile. */
  base: BaseField[]
  /** The fields as the table draws them. */
  fields: FieldDefinition[]
  /** The names of every field the org's CRM has. */
  names: Set<string>
}

/** A schema for one object: its pipeline's stages as the stage's lanes, its quiet fields left out. */
export function shape(obj: CrmObject, collection: Parameters<typeof baseFieldsOf>[0]): Schema {
  const base = baseFieldsOf(collection)
  const names = new Set(base.map((f) => f.name))
  const targets = new Map(base.filter((f) => f.collectionId).map((f) => [f.collectionId!, TARGET[f.name] ?? f.name]))
  const fields = baseCollectionToFields(collection, { names: targets })
    .filter((f) => !QUIET.has(f.name) && f.name !== 'id' && !(obj.scope && f.name === 'pipeline'))
    .map((f) => {
      if (!obj.board?.lanes || f.name !== obj.board.field) return f
      const options = ((f.metadata as { options?: SelectOption[] })?.options ?? []).filter((o) => obj.board!.lanes!.includes(o.value))
      options.sort((a, b) => obj.board!.lanes!.indexOf(a.value) - obj.board!.lanes!.indexOf(b.value))
      return { ...f, metadata: { options } } as FieldDefinition
    })
  return { base, fields, names }
}

export type Load<T> = { state: 'loading' } | { state: 'error'; error: unknown } | { state: 'ready'; value: T }

/** An object's schema, read once per page. */
export function useSchema(obj: CrmObject, round = 0): Load<Schema> {
  const [s, setS] = useState<Load<Schema>>({ state: 'loading' })
  useEffect(() => {
    let live = true
    setS({ state: 'loading' })
    CrmApi.schema(obj.collection, round > 0)
      .then((c) => live && setS({ state: 'ready', value: shape(obj, c) }))
      .catch((error) => live && setS({ state: 'error', error }))
    return () => {
      live = false
    }
  }, [obj, round])
  return s
}

/** How a record of a collection reads as one option: a person by name, else their address. */
export function optionOf(collection: string, r: Record<string, unknown>): SelectOption {
  const o = (v: unknown) => (v && typeof v === 'object' ? (v as Record<string, unknown>) : {})
  if (collection === 'people' || collection === 'candidates') {
    const n = o(r.name)
    const name = [n.firstName, n.lastName].filter(Boolean).join(' ')
    return { value: String(r.id), label: name || String(o(r.emails).primaryEmail ?? '') || String(r.id) }
  }
  return { value: String(r.id), label: String(r.name ?? r.title ?? r.id) }
}

const candidates = new Map<string, Promise<SelectOption[]>>()

/**
 * A Base record as the table draws it: each value in @hanzo/data's shape, and each
 * relation as the record it names, a person by their name and a company by its own.
 * A relation to many reads as their names together.
 */
export function rowOf(schema: Schema, r: BaseRecord): Record<string, unknown> {
  const out = recordFromBase(schema.base, r)
  const expand = (r.expand ?? {}) as Record<string, unknown>
  for (const f of schema.base) {
    if (f.type !== 'relation') continue
    const target = TARGET[f.name] ?? f.name
    const v = out[f.name]
    if (Array.isArray(v)) {
      const recs = Array.isArray(expand[f.name]) ? (expand[f.name] as Record<string, unknown>[]) : []
      out[f.name] = recs.length ? { id: recs.map((x) => x.id).join(','), name: recs.map((x) => optionOf(target, x).label).join(', ') } : ''
    } else if (v && typeof v === 'object') {
      const o = optionOf(target, v as Record<string, unknown>)
      out[f.name] = { id: o.value, name: o.label }
    }
  }
  return out
}

/** The relations a schema's visible fields name, for `expand`. */
export const expandOf = (schema: Schema): string =>
  schema.base.filter((f) => f.type === 'relation' && schema.fields.some((d) => d.name === f.name)).map((f) => f.name).join(',')

/** The first records of a collection, by name, as the options a relation's editor and filter offer. */
export function relationOptions(collection: string): Promise<SelectOption[]> {
  const held = candidates.get(collection)
  if (held) return held
  const sort = collection === 'people' || collection === 'candidates' ? 'name.firstName' : collection === 'tasks' ? 'title' : 'name'
  const p = CrmApi.list(collection, { perPage: 300, sort, skipTotal: true })
    .then((r) => r.items.map((x) => optionOf(collection, x)))
    .catch(() => [] as SelectOption[])
  candidates.set(collection, p)
  return p
}

/** Forget what a relation offers, after a record of it was made or removed. */
export const forgetOptions = (collection: string): void => {
  candidates.delete(collection)
}

/** The options of every relation a schema has, keyed by field name. */
export function useRelationOptions(schema: Schema | null): Map<string, SelectOption[]> {
  const [opts, setOpts] = useState<Map<string, SelectOption[]>>(new Map())
  useEffect(() => {
    if (!schema) return
    let live = true
    const rels = schema.fields.filter((f) => f.type === 'relation')
    Promise.all(rels.map((f) => relationOptions((f.metadata as { objectName?: string })?.objectName ?? TARGET[f.name] ?? f.name).then((o) => [f.name, o] as const))).then(
      (pairs) => live && setOpts(new Map(pairs)),
    )
    return () => {
      live = false
    }
  }, [schema])
  return opts
}

/** Whether this account administers the org it is working in (or is a SuperAdmin). */
export function useAdmin(): boolean {
  const { account } = useSession()
  const org = currentOrg()
  return account?.superAdmin === true || (account?.adminOrgs ?? []).includes(org)
}

/**
 * Run `fn` over `items`, `width` at a time, reporting each one done. One that
 * fails is counted, never retried, and the rest go on.
 */
export async function pool<T>(items: T[], width: number, fn: (item: T) => Promise<void>, done?: (n: number, failed: number) => void): Promise<{ failed: number; errors: string[] }> {
  let next = 0
  let n = 0
  let failed = 0
  const errors: string[] = []
  const worker = async () => {
    while (next < items.length) {
      const item = items[next++]
      try {
        await fn(item)
      } catch (e) {
        failed++
        if (errors.length < 5) errors.push(e instanceof Error ? e.message : String(e))
      }
      done?.(++n, failed)
    }
  }
  await Promise.all(Array.from({ length: Math.min(width, items.length) }, worker))
  return { failed, errors }
}

/** Hand the browser a file to save. */
export function save(name: string, text: string, type = 'text/csv;charset=utf-8'): void {
  const url = URL.createObjectURL(new Blob([text], { type }))
  const a = document.createElement('a')
  a.href = url
  a.download = name
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

/** A thrown error's words. */
export const words = (e: unknown, fallback: string): string => (e instanceof Error && e.message ? e.message : fallback)
