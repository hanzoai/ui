/**
 * An import's writes, against any store that answers like the org's Base: people
 * by their address and companies by their domain, each made once whatever the
 * file and whatever the CRM held. A record the CRM already holds is given only what
 * it lacked; a person's company is the company their row names, made if missing.
 *
 * Kept apart from the dialog, with the store passed in, so a test runs it against a
 * fake and counts every request.
 */
import { companyId, companyKey, companyRecord, fillEmpty, personId, personRecord, type Plan } from './csv'

export interface Store {
  list(collection: string, q: { filter: string; perPage: number; skipTotal: true }): Promise<{ items: Record<string, unknown>[] }>
  create(collection: string, body: Record<string, unknown>): Promise<Record<string, unknown>>
  update(collection: string, id: string, body: Record<string, unknown>): Promise<Record<string, unknown>>
}

export interface Tally {
  created: number
  updated: number
  unchanged: number
  companies: number
  listed: number
  failed: number
  errors: string[]
}

export interface ImportOptions {
  /** Every record imported takes this type, unless its row names one. */
  type?: string
  /** People imported join this list. */
  list?: string
}

const q = (v: string) => `"${v.replace(/\\/g, '\\\\').replace(/"/g, '\\"')}"`

/** Run `fn` over `items`, six at a time. */
async function each<T>(items: T[], fn: (t: T) => Promise<void>): Promise<void> {
  let next = 0
  await Promise.all(
    Array.from({ length: Math.min(6, items.length) }, async () => {
      while (next < items.length) await fn(items[next++])
    }),
  )
}

/** The records a collection holds among the ones a filter names, fifty at a time. */
async function held(store: Store, collection: string, clauses: string[]): Promise<Record<string, unknown>[]> {
  const out: Record<string, unknown>[] = []
  for (let i = 0; i < clauses.length; i += 50) {
    const r = await store.list(collection, { filter: clauses.slice(i, i + 50).join(' || '), perPage: 200, skipTotal: true })
    out.push(...r.items)
  }
  return out
}

/** The companies a set of people's rows name, found or made: key (domain or name) → id. */
async function companies(store: Store, keys: { domain: string; name: string }[], t: Tally, type?: string): Promise<Map<string, string>> {
  const want = new Map<string, { domain: string; name: string; id: string }>()
  for (const k of keys) {
    const key = k.domain || k.name.toLowerCase()
    if (!want.has(key)) want.set(key, { ...k, id: await companyId(key) })
  }
  const all = [...want.values()]
  const found = await held(store, 'companies', all.flatMap((c) => [`id = ${q(c.id)}`, `name = ${q(c.name)}`]))
  const out = new Map<string, string>()
  for (const c of all) {
    const hit = found.find((f) => f.id === c.id) ?? found.find((f) => String(f.name ?? '').toLowerCase() === c.name.toLowerCase())
    if (hit) out.set(c.domain || c.name.toLowerCase(), String(hit.id))
  }
  await each(all.filter((c) => !out.has(c.domain || c.name.toLowerCase())), async (c) => {
    try {
      const body = { id: c.id, ...companyRecord({ name: c.name, domain: c.domain }), ...(type === 'investor' ? { type } : {}) }
      const r = await store.create('companies', body)
      out.set(c.domain || c.name.toLowerCase(), String(r.id))
      t.companies++
    } catch (e) {
      t.failed++
      if (t.errors.length < 5) t.errors.push(`company ${c.name}: ${e instanceof Error ? e.message : String(e)}`)
    }
  })
  return out
}

export async function importPeople(store: Store, plan: Plan, opts: ImportOptions, progress: (done: number) => void): Promise<Tally> {
  const t: Tally = { created: 0, updated: 0, unchanged: 0, companies: 0, listed: 0, failed: 0, errors: [] }
  const firms = await companies(store, plan.rows.map((r) => companyKey(r.row)).filter((k): k is { domain: string; name: string } => k !== null), t, opts.type)
  let done = 0
  for (let i = 0; i < plan.rows.length; i += 50) {
    const chunk = plan.rows.slice(i, i + 50)
    const ids = await Promise.all(chunk.map((r) => personId(r.key)))
    const found = await held(store, 'people', chunk.flatMap((r, j) => [`id = ${q(ids[j])}`, `emails.primaryEmail = ${q(r.key)}`]))
    const persons: string[] = []
    await each(chunk.map((r, j) => ({ ...r, id: ids[j] })), async (r) => {
      const k = companyKey(r.row)
      const company = k ? firms.get(k.domain || k.name.toLowerCase()) : undefined
      const incoming = personRecord({ ...r.row, type: r.row.type ?? opts.type }, company)
      const hit = found.find((f) => f.id === r.id) ?? found.find((f) => String((f.emails as { primaryEmail?: unknown } | undefined)?.primaryEmail ?? '').toLowerCase() === r.key)
      try {
        if (hit) {
          const patch = fillEmpty(hit, incoming)
          if (Object.keys(patch).length) {
            await store.update('people', String(hit.id), patch)
            t.updated++
          } else t.unchanged++
          persons.push(String(hit.id))
        } else {
          await store.create('people', { id: r.id, lifecycle: 'lead', source: 'import', ...incoming })
          t.created++
          persons.push(r.id)
        }
      } catch (e) {
        t.failed++
        if (t.errors.length < 5) t.errors.push(`${r.key}: ${e instanceof Error ? e.message : String(e)}`)
      }
      progress(++done)
    })
    if (opts.list) {
      await each(persons, async (person) => {
        try {
          await store.create('list_members', { list: opts.list, person, source: 'import' })
          t.listed++
        } catch {
          // already on the list: the unique index refuses a second membership
        }
      })
    }
  }
  return t
}

export async function importCompanies(store: Store, plan: Plan, opts: ImportOptions, progress: (done: number) => void): Promise<Tally> {
  const t: Tally = { created: 0, updated: 0, unchanged: 0, companies: 0, listed: 0, failed: 0, errors: [] }
  let done = 0
  for (let i = 0; i < plan.rows.length; i += 50) {
    const chunk = plan.rows.slice(i, i + 50)
    const ids = await Promise.all(chunk.map((r) => companyId(r.key)))
    const found = await held(store, 'companies', chunk.flatMap((r, j) => [`id = ${q(ids[j])}`, ...(r.row.name ? [`name = ${q(r.row.name)}`] : [])]))
    await each(chunk.map((r, j) => ({ ...r, id: ids[j] })), async (r) => {
      const incoming = companyRecord({ ...r.row, type: r.row.type ?? opts.type })
      const hit = found.find((f) => f.id === r.id) ?? found.find((f) => String(f.name ?? '').toLowerCase() === String(incoming.name ?? '').toLowerCase())
      try {
        if (hit) {
          const patch = fillEmpty(hit, incoming)
          if (Object.keys(patch).length) {
            await store.update('companies', String(hit.id), patch)
            t.updated++
          } else t.unchanged++
        } else {
          await store.create('companies', { id: r.id, ...incoming })
          t.created++
        }
      } catch (e) {
        t.failed++
        if (t.errors.length < 5) t.errors.push(`${r.key}: ${e instanceof Error ? e.message : String(e)}`)
      }
      progress(++done)
    })
  }
  return t
}
