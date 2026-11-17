'use client'

/**
 * People or companies from a CSV file. Each column is matched to a field by its
 * header (and can be changed); the rows are grouped by address (people) or domain
 * (companies) before anything is written, so a file that names someone twice, or
 * names someone the CRM holds, makes one record. What it will do is said first and
 * counted after.
 */
import { useEffect, useMemo, useState } from 'react'
import { Button, Text, XStack, YStack } from '@hanzo/gui'
import { Dialog, DialogBody, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@hanzo/ui'
import type { SelectOption } from '@hanzo/data'
import { CrmApi } from '../lib/crm'
import { guessTarget, parseCsv, plan, readRow, TARGETS, type Target } from './csv'
import { importCompanies, importPeople, type Tally } from './importer'
import type { CrmObject } from './objects'
import { Picker } from './Actions'
import { forgetOptions, words } from './schema'

/** The most rows one import reads. */
const MOST_ROWS = 100_000

export function Import({ obj, onClose, onDone }: { obj: CrmObject; onClose: () => void; onDone: () => void }) {
  const object = obj.collection === 'companies' ? 'companies' : 'people'
  const [rows, setRows] = useState<string[][] | null>(null)
  const [fileName, setFileName] = useState('')
  const [mapping, setMapping] = useState<Target[]>([])
  const [type, setType] = useState('')
  const [list, setList] = useState('')
  const [lists, setLists] = useState<SelectOption[]>([])
  const [busy, setBusy] = useState(false)
  const [done, setDone] = useState(0)
  const [tally, setTally] = useState<Tally | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (object !== 'people') return
    CrmApi.list('lists', { filter: 'object = "people" || object = ""', sort: '-created', perPage: 200, skipTotal: true })
      .then((r) => setLists(r.items.map((x) => ({ value: String(x.id), label: String(x.name || x.id) }))))
      .catch(() => setLists([]))
  }, [object])

  const read = async (file: File) => {
    setError(null)
    setTally(null)
    const all = parseCsv(await file.text())
    if (all.length < 2) return setError('That file has no rows under its header.')
    if (all.length - 1 > MOST_ROWS) return setError(`That file has ${(all.length - 1).toLocaleString()} rows; import at most ${MOST_ROWS.toLocaleString()} at a time.`)
    setFileName(file.name)
    setRows(all)
    setMapping(all[0].map((h) => guessTarget(h, object)))
  }

  const planned = useMemo(() => (rows ? plan(rows.slice(1).map((r) => readRow(r, mapping)), object) : null), [rows, mapping, object])
  const keyed = object === 'people' ? mapping.includes('email') : mapping.includes('name') || mapping.includes('domain')

  const run = async () => {
    if (!planned) return
    setBusy(true)
    setError(null)
    setDone(0)
    try {
      const store = {
        list: (c: string, q: { filter: string; perPage: number; skipTotal: true }) => CrmApi.list(c, q),
        create: (c: string, b: Record<string, unknown>) => CrmApi.create(c, b),
        update: (c: string, id: string, b: Record<string, unknown>) => CrmApi.update(c, id, b),
      }
      const opts = { type: type || undefined, list: list || undefined }
      const t = object === 'people' ? await importPeople(store, planned, opts, setDone) : await importCompanies(store, planned, opts, setDone)
      setTally(t)
      forgetOptions(obj.collection)
      forgetOptions('companies')
      onDone()
    } catch (e) {
      setError(words(e, 'The import stopped.'))
    } finally {
      setBusy(false)
    }
  }

  const header = rows?.[0] ?? []
  const sample = rows?.slice(1, 4) ?? []
  const targets = TARGETS.filter((t) => t.for.includes(object)).map((t) => ({ value: t.value, label: t.label }))

  return (
    <Dialog open onOpenChange={(o) => !o && !busy && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{`Import ${obj.plural.toLowerCase()}`}</DialogTitle>
          <DialogDescription>
            {object === 'people'
              ? 'A CSV with a header row. People are matched by email: someone the CRM already holds is given only what they lack.'
              : 'A CSV with a header row. Companies are matched by domain, or by name when there is none.'}
          </DialogDescription>
        </DialogHeader>
        <DialogBody gap="$3">
          <input
            type="file"
            accept=".csv,text/csv"
            aria-label="CSV file"
            disabled={busy}
            onChange={(e) => {
              const f = e.target.files?.[0]
              if (f) void read(f)
            }}
          />
          {rows ? (
            <YStack gap="$2" maxH={320} overflow="scroll">
              <Text fontSize="$2" color="$color10">{`${fileName}: ${(rows.length - 1).toLocaleString()} rows. Match each column:`}</Text>
              {header.map((h, i) => (
                <XStack key={i} gap="$3" items="center" flexWrap="wrap">
                  <YStack width={180} minW={140}>
                    <Text fontSize="$2" fontWeight="600" color="$color12" numberOfLines={1}>
                      {h || `Column ${i + 1}`}
                    </Text>
                    <Text fontSize="$1" color="$color9" numberOfLines={1}>
                      {sample.map((r) => r[i]).filter(Boolean).join(' · ')}
                    </Text>
                  </YStack>
                  <YStack flex={1} minW={160}>
                    <Picker label={`Column ${h || i + 1} becomes`} value={mapping[i] ?? 'skip'} onChange={(v) => setMapping((m) => m.map((x, j) => (j === i ? (v as Target) : x)))} options={targets} />
                  </YStack>
                </XStack>
              ))}
            </YStack>
          ) : null}
          {rows ? (
            <XStack gap="$3" flexWrap="wrap">
              <YStack flex={1} minW={160}>
                <Picker
                  label="Type, where a row names none"
                  value={type}
                  onChange={setType}
                  options={[{ value: '', label: 'None' }, { value: 'prospect', label: 'Prospect' }, { value: 'investor', label: 'Investor' }, { value: 'customer', label: 'Customer' }, { value: 'partner', label: 'Partner' }]}
                />
              </YStack>
              {object === 'people' ? (
                <YStack flex={1} minW={160}>
                  <Picker label="Add them to a list" value={list} onChange={setList} options={[{ value: '', label: 'No list' }, ...lists]} />
                </YStack>
              ) : null}
            </XStack>
          ) : null}
          {planned ? (
            <Text fontSize="$3" color="$color12" data-slot="crm-import-plan">
              {keyed
                ? `${planned.rows.length.toLocaleString()} ${object} to import${planned.merged ? `; ${planned.merged.toLocaleString()} repeated rows merged` : ''}${planned.invalid.length ? `; ${planned.invalid.length.toLocaleString()} rows skipped (${planned.invalid[0].why}, line ${planned.invalid[0].line})` : ''}.`
                : object === 'people'
                  ? 'Match a column to Email: a person is known by their address.'
                  : 'Match a column to Name or Domain.'}
            </Text>
          ) : null}
          {busy || tally ? (
            <Text fontSize="$2" color="$color10" data-slot="crm-progress">{`${done.toLocaleString()} of ${(planned?.rows.length ?? 0).toLocaleString()}`}</Text>
          ) : null}
          {tally ? (
            <Text fontSize="$3" color="$color12" data-slot="crm-result">
              {`Created ${tally.created.toLocaleString()}, updated ${tally.updated.toLocaleString()}, already complete ${tally.unchanged.toLocaleString()}${tally.companies ? `; ${tally.companies.toLocaleString()} companies made` : ''}${tally.listed ? `; ${tally.listed.toLocaleString()} added to the list` : ''}${tally.failed ? `; ${tally.failed} failed (${tally.errors[0]})` : ''}.`}
            </Text>
          ) : null}
          {error ? (
            <Text fontSize="$2" color="$red10" role="alert">
              {error}
            </Text>
          ) : null}
        </DialogBody>
        <DialogFooter>
          <Button size="$3" chromeless disabled={busy} onPress={onClose}>
            {tally ? 'Close' : 'Cancel'}
          </Button>
          {tally ? null : (
            <Button size="$3" theme="blue" disabled={busy || !planned || !keyed || planned.rows.length === 0} onPress={() => void run()}>
              {busy ? 'Importing…' : 'Import'}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
