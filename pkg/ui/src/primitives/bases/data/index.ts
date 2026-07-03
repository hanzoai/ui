// @hanzo/ui/primitives/bases/data — the Hanzo Base data-app layer.
//
// Source of truth: the `@hanzo/data` workspace package (~/work/hanzo/hanzoai/ui/
// pkg/data). This file is a passthrough re-export so consumers of @hanzo/ui can
// pull the metadata-driven record views (RecordsView, DataTable, BoardView,
// RecordDetail, field editors) without depending on @hanzo/data directly — the
// same convention the `gui` base uses for `hanzogui`. Subpath resolution makes
// `@hanzo/ui/primitives/bases/data` equivalent to `@hanzo/data`.
//
// Do NOT re-implement components here. Add them upstream in pkg/data and let them
// flow through this re-export.

export * from '@hanzo/data'
