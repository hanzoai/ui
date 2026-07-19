/**
 * @hanzo/ui/account — unified self-service account surfaces.
 *
 * ONE set of composable, data-agnostic components for billing, usage,
 * payments, plans, org identity, team, and settings — so hanzo.app,
 * hanzo.chat, and console render the same account UX from the same library.
 *
 * Every component is props-driven: it accepts data + callbacks and renders.
 * No fetching, no store, no app coupling. Monochrome-neutral by default;
 * semantic color appears only on invoice status and danger settings.
 *
 * @example
 * ```tsx
 * import { CreditsMeter, PlansGrid, InvoiceTable } from '@hanzo/ui/account'
 * import type { Plan, Invoice } from '@hanzo/ui/account'
 * ```
 */

export { CreditsMeter } from './credits-meter'
export type { CreditsMeterProps } from './credits-meter'

export { UsagePanel } from './usage-panel'
export type { UsagePanelProps, UsagePeriodOption } from './usage-panel'

export { PlanCard, PlansGrid } from './plan-card'
export type { PlanCardProps, PlansGridProps } from './plan-card'

export { PaymentMethodRow, PaymentMethodsList } from './payment-methods'
export type {
  PaymentMethodRowProps,
  PaymentMethodsListProps,
} from './payment-methods'

export { InvoiceTable } from './invoice-table'
export type { InvoiceTableProps } from './invoice-table'

export { OrgIdentityRow } from './org-identity'
export type { OrgIdentityRowProps } from './org-identity'

export { TeamMembersTable } from './team-members'
export type { TeamMembersTableProps, RoleOption } from './team-members'

export { SettingsSection } from './settings-section'
export type { SettingsSectionProps } from './settings-section'

// Shared identity/formatting helpers (composable, dependency-free).
export { AccountAvatar, initialsOf } from './account-avatar'
export type { AccountAvatarProps } from './account-avatar'

export {
  formatCurrency,
  formatQuantity,
  formatDate,
  clampPct,
} from './format'

// Shared domain types.
export type {
  CurrencyCode,
  MeterUnit,
  CardBrand,
  InvoiceStatus,
  MemberRole,
  Plan,
  UsageRow,
  PaymentMethod,
  Invoice,
  Member,
  OrgIdentity,
} from './types'
