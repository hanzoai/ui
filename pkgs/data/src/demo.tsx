// A self-contained example that exercises the public API end-to-end: a small
// object schema (the kind a CRM/CMS/commerce app declares), a few records, and
// the three views (table, board card, form). Doubles as a render smoke — if it
// composes, the surface is coherent.
import { useState } from 'react'
import { YStack, XStack, Text } from '@hanzo/gui'
import { DataTable } from './table/DataTable'
import { RecordCard } from './table/RecordCard'
import { RecordForm } from './record/RecordDetail'
import type { FieldDefinition } from './field/types'
import { tokens } from './theme'

const fields: FieldDefinition[] = [
  { name: 'name', label: 'Name', type: 'text', width: 160 },
  { name: 'email', label: 'Email', type: 'email' },
  {
    name: 'stage',
    label: 'Stage',
    type: 'select',
    width: 120,
    metadata: {
      options: [
        { value: 'lead', label: 'Lead', color: 'blue' },
        { value: 'won', label: 'Won', color: 'green' },
        { value: 'lost', label: 'Lost', color: 'red' },
      ],
    },
  },
  { name: 'amount', label: 'Amount', type: 'currency', width: 120, metadata: { currencyCode: 'USD' } },
  { name: 'rating', label: 'Rating', type: 'rating', width: 110, metadata: { max: 5 } },
  { name: 'active', label: 'Active', type: 'boolean', width: 90 },
]

const records: Array<Record<string, unknown>> = [
  { id: '1', name: 'Acme Inc', email: 'hi@acme.com', stage: 'won', amount: { amount: 4200, currencyCode: 'USD' }, rating: 5, active: true },
  { id: '2', name: 'Globex', email: 'sales@globex.io', stage: 'lead', amount: { amount: 900, currencyCode: 'USD' }, rating: 3, active: false },
]

export function DataAppDemo() {
  const [draft, setDraft] = useState<Record<string, unknown>>({ ...records[0] })

  return (
    <YStack gap={24} p={24} style={{ backgroundColor: tokens.surfaceRaised }}>
      <Text fontSize={20} fontWeight="800" style={{ color: tokens.text }}>Records</Text>
      <DataTable fields={fields} records={records} onRowPress={() => {}} />

      <Text fontSize={20} fontWeight="800" style={{ color: tokens.text }}>Board</Text>
      <XStack gap={12}>
        {records.map((r) => (
          <YStack key={String(r.id)} width={240}>
            <RecordCard fields={fields} record={r} onPress={() => {}} />
          </YStack>
        ))}
      </XStack>

      <Text fontSize={20} fontWeight="800" style={{ color: tokens.text }}>Edit</Text>
      <YStack maxW={520}>
        <RecordForm fields={fields} values={draft} onChange={(name, value) => setDraft((d) => ({ ...d, [name]: value }))} />
      </YStack>
    </YStack>
  )
}
