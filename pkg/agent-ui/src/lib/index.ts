// Hanzo Agent Cloud — Shared Utilities
//
// What a status MEANS is not this package's fact. `@hanzo/ui/product/pure`
// exports `tone(status)` over the whole fleet vocabulary — running, failed,
// queued, degraded, paused — and `<StatusTag>` draws it. The table that used to
// live here (`STATUS_TONES`, `getStatusTone`, `getStatusBadgeClasses`) was a
// second copy of that vocabulary spelled in Tailwind class strings, and it could
// not paint anything: this package publishes `dist/`, no consumer's Tailwind
// scans `node_modules/@hanzo/agent-ui`, so `bg-emerald-500/10` reached the DOM
// with no rule behind it.

export { getNextTimeRange, TIME_RANGE_OPTIONS } from './time-ranges'
