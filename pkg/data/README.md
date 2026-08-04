# @hanzo/data

Cross-platform, metadata-driven **data-app components** for any [Hanzo Base](https://github.com/hanzoai/base)-backed app — CRM, CMS, commerce, or a one-off internal tool. One model (typed **fields** → **records** → **views**) renders everywhere, on web, native (iOS), and desktop, because it's built on [`@hanzo/gui`](https://github.com/hanzoai/gui) (Tamagui). **Airtable/Twenty-class polish** — table ⇆ board, filter, sort, group, inline edit, saved views — all clean-room and original.

An object is a set of typed fields. A record is values for those fields. Every view — table, board, detail — renders from that one model, dispatched through a registry, so adding a field type is **one registration**, never a `switch` edit. A business app (CRM/CMS/ERP) is just a curated set of views over these components.

## Install

```sh
bun add @hanzo/data @hanzo/gui
```

`@hanzo/gui` and `react` are peers.

## The flagship: `RecordsView`

One shell turns any collection into a Twenty-class surface — a toolbar (view switch, search, filter builder, sort builder, board group-by) over a **DataTable** or a **BoardView**, driven by a single `ViewConfig`. Presentational + data-injected: the host supplies raw records and the persistence callbacks; the view owns interaction state.

```tsx
import { RecordsView, type FieldDefinition } from '@hanzo/data'

<RecordsView
  fields={fields}
  records={records}                              // raw rows; the view applies search + filter + sort
  onOpen={openDetail}                            // expand a record
  onEditCommit={(rec, field, value) => save(rec, field, value)}  // inline cell / board edit
  onCreate={createRecord}
  savedViews={{ views, activeId, onSelect, onSave, onDelete }}    // optional named views
/>
```

- **DataTable** — click-to-sort headers, drag-resize + drag-reorder columns, row selection with a header select-all, inline cell editing (the field's own editor), pagination, hover-reveal open, honest empty/loading.
- **BoardView** — kanban grouped by a select/status/boolean/relation field; drag a card to another lane and the record patch is emitted (optimistic, reverts on failure).
- **RecordDetail** — a titled panel of fields, optionally inline-editable, with a `related` slot. **RecordForm** — the create/edit form.

## Field types

`text · longText · number · percent · currency · boolean · select · multiSelect · date · dateTime · email · url · links · phone · rating · relation · json · uuid · fullName · address · files · richText · position · actor`

Each type has a read **Display** and (where editable) an **Input**, resolved by the registry. Editors are polished: searchable **select** dropdowns with color chips, a month-grid **calendar**, a **relation** record-picker (over injected candidates), a **file** upload, a validated **JSON** editor, a sliding **boolean** toggle.

## Extend

Register a renderer for any type — built-in or custom — and it works in every view:

```tsx
import { registerField } from '@hanzo/data'

registerField('rating', { Display: MyStars, Input: MyStarPicker })
```

## Pure logic (host-usable, tested)

The sort / filter / search / group / view helpers are pure and exported (also on subpaths `@hanzo/data/{table,board,view}/logic` so a Node host can import them with no gui runtime):

```ts
import { applyView, sortRecords, filterRecords, boardColumns } from '@hanzo/data'
```

## Surface

- **Model** — `FieldDefinition`, `FieldType`, `FieldMetadata`, `SelectOption`, `CurrencyValue`, `LinkValue`
- **Views** — `RecordsView`, `DataTable`, `BoardView`, `RecordDetail`, `RecordForm`, `RecordCard`, `RecordsToolbar`
- **Primitives** — `Menu`, `MenuItem`, `CheckBox`, `Toggle`, `Calendar`
- **Routers / Registry** — `FieldDisplay`, `FieldInput`, `isEditable`, `registerField`, `getFieldRenderers`
- **Logic** — `applyView`, `sortRecords`, `filterRecords`, `searchRecords`, `paginate`, `boardColumns`, `movePatch`, `operatorsForType`, `emptyView`, `describeView`, …
- **Theme** — `tokens`, `TAG_TONES`, `tagTone`

MIT · Hanzo AI — see [LICENSE.md](../../LICENSE.md). HIP-0137 (`hanzoai/hips`).
