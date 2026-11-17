'use client'

/**
 * What a person does to many records at once: to the rows they chose (`Bulk`), or
 * to every row the view admits (`Everyone`) — export them, put them on a list,
 * enroll them in a sequence, set a field, opt them out, delete them. Every write
 * is one request per record, six at a time, and the dialog counts what happened:
 * nothing is said to have happened that the server did not answer.
 *
 * Enrolling hands addresses to the cloud's drip (apps/marketing). It sends nothing
 * itself: each step goes through the org's suppression gate when it comes due, so
 * an address that opted out is enrolled and never mailed.
 */
import { useEffect, useState, type ReactNode } from 'react'
import { Button, Input, Text, XStack, YStack } from '@hanzo/gui'
import { Dialog, DialogBody, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@hanzo/ui'
import type { FieldDefinition, SelectOption } from '@hanzo/data'
import { ApiError } from '../lib/host'
import { CrmApi, type Sequence } from '../lib/crm'
import type { BaseRecord } from '../lib/base-data/api'
import type { BaseQuery } from '../lib/base-data/query'
import { cellText, toCsv } from './csv'
import type { CrmObject } from './objects'
import { Import } from './Import'
import { expandOf, pool, rowOf, save, words, type Schema } from './schema'
import { inputStyle } from './studio/style'

/** At most this many rows go into one export or one action over a whole view. */
export const MOST = 50_000

type Act = 'export' | 'list' | 'enroll' | 'set' | 'optout' | 'delete'

const LABEL: Record<Act, string> = {
  export: 'Export CSV',
  list: 'Add to list',
  enroll: 'Enroll in sequence',
  set: 'Set a field',
  optout: 'Opt out',
  delete: 'Delete',
}

/** The actions an object offers on many records. */
function actsFor(obj: CrmObject): Act[] {
  if (obj.collection === 'people') return ['export', 'list', 'enroll', 'set', 'optout', 'delete']
  if (obj.collection === 'views') return ['delete']
  return ['export', 'set', 'delete']
}

/** The selected rows' actions. */
export function Bulk({ obj, schema, ids, raw, onDone }: { obj: CrmObject; schema: Schema; ids: string[]; raw: Map<string, BaseRecord>; onDone: () => void }) {
  const [act, setAct] = useState<Act | null>(null)
  const records = () => Promise.resolve(ids.map((id) => raw.get(id) ?? ({ id } as BaseRecord)))
  return (
    <>
      {actsFor(obj).map((a) => (
        <Button key={a} size="$2" theme={a === 'delete' ? 'red' : undefined} onPress={() => setAct(a)}>
          {LABEL[a]}
        </Button>
      ))}
      {act ? <Run act={act} obj={obj} schema={schema} count={ids.length} records={records} onClose={() => setAct(null)} onDone={onDone} /> : null}
    </>
  )
}

/** Actions over every row the view admits, and the way in for a file. */
export function Everyone({ obj, schema, query, total, onDone }: { obj: CrmObject; schema: Schema; query: () => BaseQuery; total: number; onDone: () => void }) {
  const [act, setAct] = useState<Act | null>(null)
  const [importing, setImporting] = useState(false)
  const records = (fields?: string) => {
    const q = query()
    return CrmApi.each(obj.collection, { filter: q.filter || undefined, sort: q.sort || undefined, expand: fields ? undefined : expandOf(schema) || undefined, fields }, MOST)
  }
  const acts = actsFor(obj).filter((a) => a === 'export' || a === 'list' || a === 'enroll')
  return (
    <>
      {acts.map((a) => (
        <Button key={a} size="$2" disabled={total === 0} onPress={() => setAct(a)}>
          {a === 'export' ? 'Export' : a === 'list' ? 'Add all to list' : 'Enroll all'}
        </Button>
      ))}
      {obj.importable ? (
        <Button size="$2" onPress={() => setImporting(true)}>
          Import
        </Button>
      ) : null}
      {act ? (
        <Run act={act} obj={obj} schema={schema} count={Math.min(total, MOST)} every records={() => records(act === 'export' ? undefined : 'id,emails')} onClose={() => setAct(null)} onDone={onDone} />
      ) : null}
      {importing ? <Import obj={obj} onClose={() => setImporting(false)} onDone={onDone} /> : null}
    </>
  )
}

/** A CRM installed before a field this table reads: an admin grows it in one press. */
export function Grow({ admin, what, quiet, onGrown }: { admin: boolean; what: string; quiet?: boolean; onGrown: () => void }) {
  const [state, setState] = useState<'idle' | 'busy' | string>('idle')
  return (
    <XStack items="center" gap="$3" p={quiet ? '$2' : '$4'} rounded="$4" borderWidth={1} borderColor="$borderColor" flexWrap="wrap" data-slot="crm-grow">
      <Text fontSize="$2" color="$color11" flex={1} minW={200}>
        {what} {admin ? '' : 'An admin of this org can update it.'}
      </Text>
      {admin ? (
        <Button
          size="$2"
          disabled={state === 'busy'}
          onPress={async () => {
            setState('busy')
            try {
              const { grew } = await CrmApi.grow()
              if (!grew) return setState('This cloud does not ship the update yet: nothing was added.')
              setState('idle')
              onGrown()
            } catch (e) {
              setState(e instanceof ApiError && e.status === 404 ? 'This cloud does not ship the update yet.' : words(e, 'The CRM was not updated.'))
            }
          }}
        >
          {state === 'busy' ? 'Updating…' : 'Update the CRM'}
        </Button>
      ) : null}
      {state !== 'idle' && state !== 'busy' ? (
        <Text fontSize="$2" color="$red10" width="100%">
          {state}
        </Text>
      ) : null}
    </XStack>
  )
}

/** The primary address a person record holds. */
const emailOf = (r: BaseRecord): string => {
  const e = r.emails && typeof r.emails === 'object' ? (r.emails as { primaryEmail?: unknown }).primaryEmail : ''
  return typeof e === 'string' ? e.trim().toLowerCase() : ''
}

interface RunProps {
  act: Act
  obj: CrmObject
  schema: Schema
  count: number
  every?: boolean
  records: () => Promise<BaseRecord[]>
  onClose: () => void
  onDone: () => void
}

/** One action, asked for what it needs, run, and counted. */
function Run({ act, obj, schema, count, every, records, onClose, onDone }: RunProps) {
  const [progress, setProgress] = useState<{ n: number; of: number; failed: number } | null>(null)
  const [result, setResult] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  // what the action needs
  const [lists, setLists] = useState<SelectOption[] | null>(null)
  const [listId, setListId] = useState('')
  const [newList, setNewList] = useState('')
  const [sequences, setSequences] = useState<Sequence[] | null>(null)
  const [seqId, setSeqId] = useState('')
  const selects = schema.fields.filter((f) => f.type === 'select' && !f.readOnly) as FieldDefinition<'select'>[]
  const [field, setField] = useState(selects[0]?.name ?? '')
  const [value, setValue] = useState('')

  useEffect(() => {
    if (act === 'list') {
      CrmApi.list('lists', { filter: 'object = "people" || object = ""', sort: '-created', perPage: 200, skipTotal: true })
        .then((r) => setLists(r.items.map((x) => ({ value: String(x.id), label: String(x.name || x.id) }))))
        .catch(() => setLists([]))
    }
    if (act === 'enroll') CrmApi.marketing.listSequences().then(setSequences).catch(() => setSequences([]))
  }, [act])

  const who = every ? `all ${count.toLocaleString()} ${obj.plural.toLowerCase()} in this view` : `${count.toLocaleString()} selected`

  const go = async () => {
    setBusy(true)
    setResult(null)
    try {
      setProgress({ n: 0, of: count, failed: 0 })
      const rs = await records()
      const tick = (n: number, failed: number) => setProgress({ n, of: rs.length, failed })
      switch (act) {
        case 'export': {
          const full = rs.some((r) => !r.created && !r.updated) && !every ? await refetch(obj, schema, rs) : rs
          const header = schema.fields.map((f) => f.label)
          const rows = full.map((r) => {
            const row = rowOf(schema, r)
            return schema.fields.map((f) => cellText(f, row[f.name]))
          })
          save(`${obj.id}-${new Date().toISOString().slice(0, 10)}.csv`, toCsv(['ID', ...header], rows.map((r, i) => [String(full[i].id), ...r])))
          setResult(`Exported ${full.length.toLocaleString()} ${obj.plural.toLowerCase()}.`)
          break
        }
        case 'list': {
          let list = listId
          if (!list) {
            const name = newList.trim()
            if (!name) throw new Error('Choose a list, or name a new one.')
            list = String((await CrmApi.create('lists', { name, object: 'people', purpose: 'outreach' })).id)
          }
          let added = 0
          let already = 0
          const r = await pool(rs, 6, async (p) => {
            try {
              await CrmApi.create('list_members', { list, person: p.id, source: every ? 'segment' : 'manual' })
              added++
            } catch (e) {
              // A person is on a list once: the unique index refuses a second.
              if (e instanceof ApiError && e.status === 400) already++
              else throw e
            }
          }, tick)
          setResult(`Added ${added.toLocaleString()} to the list${already ? `; ${already.toLocaleString()} were on it already` : ''}${r.failed ? `; ${r.failed} failed (${r.errors[0]})` : ''}.`)
          break
        }
        case 'enroll': {
          if (!seqId) throw new Error('Choose an active sequence.')
          let enrolled = 0
          let already = 0
          let none = 0
          const r = await pool(rs, 6, async (p) => {
            const address = emailOf(p)
            if (!address) return void none++
            const res = await CrmApi.marketing.enroll(seqId, { address })
            enrolled += res.enrolled
            already += res.alreadyEnrolled
          }, tick)
          setResult(
            `Enrolled ${enrolled.toLocaleString()}${already ? `; ${already.toLocaleString()} were enrolled already` : ''}${none ? `; ${none.toLocaleString()} have no email` : ''}${r.failed ? `; ${r.failed} failed (${r.errors[0]})` : ''}. Each step is sent when it comes due, never to an address that opted out.`,
          )
          break
        }
        case 'set': {
          if (!field || !value) throw new Error('Choose a field and a value.')
          const r = await pool(rs, 6, (x) => CrmApi.update(obj.collection, String(x.id), { [field]: value }).then(() => undefined), tick)
          setResult(`Set ${schema.fields.find((f) => f.name === field)?.label ?? field} on ${(rs.length - r.failed).toLocaleString()}${r.failed ? `; ${r.failed} failed (${r.errors[0]})` : ''}.`)
          break
        }
        case 'optout': {
          let out = 0
          let none = 0
          const stamp = schema.names.has('outreach')
          const r = await pool(rs, 6, async (p) => {
            const address = emailOf(p)
            if (!address) return void none++
            await CrmApi.marketing.addSuppression(address, 'opted out in the CRM')
            if (stamp) await CrmApi.update('people', String(p.id), { outreach: 'unsubscribed' })
            out++
          }, tick)
          setResult(`Opted out ${out.toLocaleString()}: no rail will mail them${none ? `; ${none} have no email` : ''}${r.failed ? `; ${r.failed} failed (${r.errors[0]})` : ''}.`)
          break
        }
        case 'delete': {
          const r = await pool(rs, 6, (x) => CrmApi.remove(obj.collection, String(x.id)), tick)
          setResult(`Deleted ${(rs.length - r.failed).toLocaleString()}${r.failed ? `; ${r.failed} failed (${r.errors[0]})` : ''}.`)
          break
        }
      }
      onDone()
    } catch (e) {
      setResult(words(e, 'That did not finish.'))
    } finally {
      setBusy(false)
    }
  }

  const body: ReactNode =
    act === 'list' ? (
      <YStack gap="$2">
        <Picker label="List" value={listId} onChange={setListId} options={[{ value: '', label: lists === null ? 'Reading lists…' : 'A new list' }, ...(lists ?? [])]} />
        {listId ? null : <Input size="$3" placeholder="New list name" value={newList} onChangeText={setNewList} aria-label="New list name" />}
      </YStack>
    ) : act === 'enroll' ? (
      <YStack gap="$2">
        <Picker
          label="Sequence"
          value={seqId}
          onChange={setSeqId}
          options={[
            { value: '', label: sequences === null ? 'Reading sequences…' : 'Choose a sequence' },
            ...(sequences ?? []).filter((s) => s.status === 'active').map((s) => ({ value: s.id, label: s.name })),
          ]}
        />
        {sequences && !sequences.some((s) => s.status === 'active') ? (
          <Text fontSize="$2" color="$color10">
            No sequence is active. Make one in Sequences, add its steps, and set it active.
          </Text>
        ) : null}
      </YStack>
    ) : act === 'set' ? (
      <YStack gap="$2">
        <Picker label="Field" value={field} onChange={(f) => { setField(f); setValue('') }} options={selects.map((f) => ({ value: f.name, label: f.label }))} />
        <Picker
          label="Value"
          value={value}
          onChange={setValue}
          options={[{ value: '', label: 'Choose a value' }, ...((selects.find((f) => f.name === field)?.metadata as { options?: SelectOption[] })?.options ?? [])]}
        />
      </YStack>
    ) : act === 'delete' ? (
      <Text fontSize="$3" color="$color11">
        This removes them for everyone in the org. It cannot be undone.
      </Text>
    ) : act === 'optout' ? (
      <Text fontSize="$3" color="$color11">
        Their addresses go on the org's suppression list: no sequence, send or rail will mail them again until an admin re-subscribes them.
      </Text>
    ) : null

  return (
    <Dialog open onOpenChange={(o) => !o && !busy && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{LABEL[act]}</DialogTitle>
          <DialogDescription>{who}</DialogDescription>
        </DialogHeader>
        <DialogBody gap="$3">
          {body}
          {progress ? (
            <Text fontSize="$2" color="$color10" data-slot="crm-progress">
              {`${progress.n.toLocaleString()} of ${progress.of.toLocaleString()}${progress.failed ? ` · ${progress.failed} failed` : ''}`}
            </Text>
          ) : null}
          {result ? (
            <Text fontSize="$3" color="$color12" data-slot="crm-result">
              {result}
            </Text>
          ) : null}
        </DialogBody>
        <DialogFooter>
          <Button size="$3" chromeless disabled={busy} onPress={onClose}>
            {result ? 'Close' : 'Cancel'}
          </Button>
          {result ? null : (
            <Button size="$3" theme={act === 'delete' ? 'red' : 'blue'} disabled={busy} onPress={() => void go()}>
              {busy ? 'Working…' : LABEL[act]}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

/** The selected rows read again whole, with their relations, for an export. */
async function refetch(obj: CrmObject, schema: Schema, rs: BaseRecord[]): Promise<BaseRecord[]> {
  const out: BaseRecord[] = []
  for (let i = 0; i < rs.length; i += 50) {
    const ids = rs.slice(i, i + 50).map((r) => `id = "${String(r.id).replace(/"/g, '')}"`)
    const page = await CrmApi.list(obj.collection, { filter: ids.join(' || '), perPage: 50, expand: expandOf(schema) || undefined, skipTotal: true })
    out.push(...page.items)
  }
  return out
}

/** A native select, labelled: one control a phone and a keyboard both drive. */
export function Picker({ label, value, onChange, options }: { label: string; value: string; onChange: (v: string) => void; options: SelectOption[] }) {
  return (
    <YStack gap="$1">
      <Text fontSize="$2" color="$color10">
        {label}
      </Text>
      <select
        aria-label={label}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        style={{ ...inputStyle, height: 36 }}
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </YStack>
  )
}
