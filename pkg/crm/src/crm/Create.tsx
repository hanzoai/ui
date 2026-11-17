'use client'

/**
 * A new record, asked for the few fields that make it one. A person with an address
 * is given the id the cloud gives that address, so the mail the org later sends
 * them and the forms they file land on this record, not a second one; an address
 * the CRM already holds opens the person who has it.
 */
import { useState } from 'react'
import { Button, Text } from '@hanzo/gui'
import { Dialog, DialogBody, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@hanzo/ui'
import { RecordForm, type FieldDefinition, type SelectOption } from '@hanzo/data'
import { ApiError } from '../lib/host'
import { CrmApi } from '../lib/crm'
import { toBase } from '../lib/base-data/fields'
import { personId } from './csv'
import type { CrmObject } from './objects'
import { words, type Schema } from './schema'

export interface CreateProps {
  obj: CrmObject
  schema: Schema
  fieldOptions: (f: FieldDefinition) => SelectOption[] | undefined
  defaults?: Record<string, unknown>
  onClose: () => void
  onCreated: (id: string) => void
}

export function CreateRecord({ obj, schema, fieldOptions, defaults, onClose, onCreated }: CreateProps) {
  const fields = obj.create.map((n) => schema.fields.find((f) => f.name === n)).filter((f): f is FieldDefinition => Boolean(f))
  const byBase = new Map(schema.base.map((f) => [f.name, f]))
  const [values, setValues] = useState<Record<string, unknown>>({})
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const create = async () => {
    setBusy(true)
    setError(null)
    try {
      const body: Record<string, unknown> = {}
      for (const [k, v] of Object.entries({ ...defaults })) if (schema.names.has(k)) body[k] = v
      for (const f of fields) {
        const b = byBase.get(f.name)
        if (!b || values[f.name] == null || values[f.name] === '') continue
        body[f.name] = toBase(b.type, values[f.name])
      }
      const title = body[obj.title]
      if (title == null || title === '') {
        // A person may be named by their address alone.
        if (!(obj.collection === 'people' && body.emails)) throw new Error(`Give the ${obj.label.toLowerCase()} a ${schema.fields.find((f) => f.name === obj.title)?.label.toLowerCase() ?? 'name'}.`)
      }
      const email = obj.collection === 'people' ? ((body.emails as { primaryEmail?: string } | undefined)?.primaryEmail ?? '') : ''
      if (email) {
        const id = await personId(email)
        const held = await CrmApi.list('people', { filter: `id = "${id}" || emails.primaryEmail = "${email.replace(/"/g, '')}"`, perPage: 1, skipTotal: true })
        if (held.items[0]) return onCreated(String(held.items[0].id))
        body.id = id
      }
      const r = await CrmApi.create(obj.collection, body)
      onCreated(String(r.id))
    } catch (e) {
      setError(e instanceof ApiError && e.status === 400 ? `The CRM refused it: ${e.message}` : words(e, `The ${obj.label.toLowerCase()} was not created.`))
    } finally {
      setBusy(false)
    }
  }

  return (
    <Dialog open onOpenChange={(o) => !o && !busy && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{`New ${obj.label.toLowerCase()}`}</DialogTitle>
        </DialogHeader>
        <DialogBody gap="$3">
          <RecordForm fields={fields} values={values} onChange={(name, v) => setValues((x) => ({ ...x, [name]: v }))} fieldOptions={fieldOptions} />
          {error ? (
            <Text fontSize="$2" color="$red10" role="alert">
              {error}
            </Text>
          ) : null}
        </DialogBody>
        <DialogFooter>
          <Button size="$3" chromeless disabled={busy} onPress={onClose}>
            Cancel
          </Button>
          <Button size="$3" theme="blue" disabled={busy} onPress={() => void create()}>
            {busy ? 'Creating…' : 'Create'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
