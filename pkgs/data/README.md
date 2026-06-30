# @hanzo/data

Cross-platform, metadata-driven **data-app components** for any [Hanzo Base](https://github.com/hanzoai/base)-backed app — CRM, CMS, commerce, or a one-off internal tool. One model (typed **fields** → **records** → **views**) renders everywhere, on web, native (iOS), and desktop, because it's built on [`@hanzo/gui`](https://github.com/hanzoai/gui) (Tamagui).

An object is a set of typed fields. A record is values for those fields. Every view — table, board, detail — renders from that one model, dispatched through a registry, so adding a field type is **one registration**, never a `switch` edit.

## Install

```sh
bun add @hanzo/data @hanzo/gui
```

`@hanzo/gui` and `react` are peers.

## Field types

`text · longText · number · percent · currency · boolean · select · multiSelect · date · dateTime · email · url · links · phone · rating · relation · json · uuid · fullName · address · files · richText · position · actor`

Each type has a read **Display** and (where editable) an **Input**, resolved by the registry.

## Use

```tsx
import { DataTable, RecordForm, type FieldDefinition } from '@hanzo/data'

const fields: FieldDefinition[] = [
  { name: 'name',   label: 'Name',   type: 'text' },
  { name: 'email',  label: 'Email',  type: 'email' },
  { name: 'stage',  label: 'Stage',  type: 'select',
    metadata: { options: [
      { value: 'lead', label: 'Lead', color: 'blue' },
      { value: 'won',  label: 'Won',  color: 'green' },
    ] } },
  { name: 'amount', label: 'Amount', type: 'currency', metadata: { currencyCode: 'USD' } },
]

const records = [
  { id: '1', name: 'Acme', email: 'hi@acme.com', stage: 'won', amount: { amount: 4200, currencyCode: 'USD' } },
]

// List view — understands every field type automatically
<DataTable fields={fields} records={records} onRowPress={openDetail} />

// Edit/create form
<RecordForm fields={fields} values={draft} onChange={(name, value) => setDraft({ ...draft, [name]: value })} />
```

`RecordCard` (board/gallery) and `RecordDetail` (read panel) share the same engine.

## Extend

Register a renderer for any type — built-in or custom — and it works in every view:

```tsx
import { registerField } from '@hanzo/data'

registerField('rating', { Display: MyStars, Input: MyStarPicker })
```

## Surface

- **Model** — `FieldDefinition`, `FieldType`, `FieldMetadata`, `SelectOption`, `CurrencyValue`, `LinkValue`
- **Routers** — `FieldDisplay`, `FieldInput`, `isEditable`
- **Registry** — `registerField`, `getFieldRenderers`, `hasField`, `registeredFieldTypes`
- **Views** — `DataTable`, `RecordCard`, `RecordDetail`, `RecordForm`
- **Renderers** — every `*Display` / `*Input` is exported for standalone composition
- **Theme** — `tokens`, `TAG_TONES`, `tagTone`

BSD-3-Clause · Hanzo AI
