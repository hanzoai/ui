'use client'

// A self-contained example exercising the public API end-to-end: a small object
// schema (the kind a CRM/CMS/commerce app declares), a few records, and the
// flagship RecordsView (table ⇆ board, filter, sort, group, inline edit, detail).
// Doubles as a render smoke — if it composes, the surface is coherent.
import { useState } from 'react'
import { YStack, Text } from '@hanzo/gui'
import { RecordsView } from './view/RecordsView'
import { RecordDetail } from './record/RecordDetail'
import type { FieldDefinition } from './field/types'
import { tokens } from './theme'

const fields: FieldDefinition[] = [
  { name: 'name', label: 'Name', type: 'text', width: 180 },
  { name: 'email', label: 'Email', type: 'email' },
  {
    name: 'stage',
    label: 'Stage',
    type: 'select',
    width: 130,
    metadata: {
      options: [
        { value: 'lead', label: 'Lead', color: 'blue' },
        { value: 'won', label: 'Won', color: 'green' },
        { value: 'lost', label: 'Lost', color: 'red' },
      ],
    },
  },
  { name: 'amount', label: 'Amount', type: 'currency', width: 130, metadata: { currencyCode: 'USD' } },
  { name: 'rating', label: 'Rating', type: 'rating', width: 120, metadata: { max: 5 } },
  { name: 'active', label: 'Active', type: 'boolean', width: 100 },
]

const seed: Array<Record<string, unknown>> = [
  { id: '1', name: 'Acme Inc', email: 'hi@acme.com', stage: 'won', amount: { amount: 4200, currencyCode: 'USD' }, rating: 5, active: true },
  { id: '2', name: 'Globex', email: 'sales@globex.io', stage: 'lead', amount: { amount: 900, currencyCode: 'USD' }, rating: 3, active: false },
  { id: '3', name: 'Initech', email: 'ap@initech.com', stage: 'lost', amount: { amount: 0, currencyCode: 'USD' }, rating: 2, active: false },
]

export function DataAppDemo() {
  const [records, setRecords] = useState(seed)
  const [open, setOpen] = useState<Record<string, unknown> | null>(null)

  const editCommit = (record: Record<string, unknown>, field: FieldDefinition, value: unknown) =>
    setRecords((rs) => rs.map((r) => (r.id === record.id ? { ...r, [field.name]: value } : r)))

  return (
    <YStack gap={24} p={24} style={{ backgroundColor: tokens.surfaceRaised, minHeight: '100vh' }}>
      <RecordsView
        title="Companies"
        fields={fields}
        records={records}
        onOpen={setOpen}
        onEditCommit={editCommit}
        onCreate={() => {}}
        createLabel="New company"
      />
      {open ? (
        <YStack maxW={560} p={20} rounded={12} borderWidth={1} style={{ borderColor: tokens.border, backgroundColor: tokens.surface }}>
          <RecordDetail
            title={String(open.name ?? 'Record')}
            fields={fields}
            record={open}
            editable
            onEditCommit={(field, value) => { editCommit(open, field, value); setOpen({ ...open, [field.name]: value }) }}
          />
        </YStack>
      ) : (
        <Text fontSize={13} style={{ color: tokens.textFaint }}>Open a record to see the detail panel.</Text>
      )}
    </YStack>
  )
}
