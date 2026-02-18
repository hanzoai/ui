/**
 * @hanzo/commerce/billing
 *
 * @deprecated Use @hanzo/commerce/client instead.
 * Re-exports CommerceClient as BillingClient for backwards compatibility.
 */

export {
  CommerceClient as BillingClient,
  CommerceClient,
  CommerceApiError,
  type CommerceClientConfig,
  type CommerceClientConfig as CommerceConfig,
  type Balance,
  type Transaction,
  type Subscription,
  type Plan,
  type Payment,
  type UsageRecord,
} from './client'
