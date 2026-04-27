// @hanzo/ui/primitives/bases/admin — admin chrome + primitives.
//
// Source of truth: `@hanzogui/admin` (in ~/work/hanzo/gui/code/ui-admin).
// Re-export the shared admin shell (Sidebar, TopBar, AdminApp,
// PageShell, NamespaceSwitcher), primitives (Badge, Empty, Loading,
// Alert, CopyField, DataTable, SummaryCard, etc.), data hooks
// (useFetch, useEvents), and the IAM admin pages once Bucket A-F port
// lands.
//
// Do NOT re-implement. Upstream lands new components in
// ~/work/hanzo/gui/code/ui-admin/ and they appear here through this
// re-export.

export * from '@hanzogui/admin'
