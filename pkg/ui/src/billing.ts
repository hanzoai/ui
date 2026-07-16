// @hanzo/ui/billing — the shared billing surface, re-exported from its home
// module @hanzo/ui-shadcn/billing. `CreditModal` presents trial + prepaid credit
// buckets with an injected top-up handler (no payment logic in the component).
// Thin subpath so every console shows the same credit UI:
//
//   import { CreditModal } from '@hanzo/ui/billing'
//
// Optional peer — only pulled when the subpath is used.
export * from '@hanzo/ui-shadcn/billing'
