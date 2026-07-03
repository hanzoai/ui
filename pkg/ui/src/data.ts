// @hanzo/ui/data — the metadata-driven record layer.
//
// RecordsView, DataTable, BoardView, RecordDetail/RecordForm, the typed field
// editors (select/relation/calendar/file/JSON/boolean…), the field registry, the
// pure sort/filter/search/group/view logic, and the tokens. The source of truth
// is @hanzo/data (pkg/data) — this is the canonical @hanzo/ui entry point for it,
// so an app depends on ONE package (@hanzo/ui) for both the product layer and the
// record layer. Do NOT re-implement anything here; add it upstream in @hanzo/data
// and it flows through.
//
//   import { RecordsView, DataTable, registerField } from '@hanzo/ui/data'
export * from '@hanzo/data'
