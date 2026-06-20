export type BillingInterval = "monthly" | "yearly" | "quarterly" | "custom"

// Subscription types
export interface SubscriptionPlan {
  id: string
  name: string
  description: string
  price: number
  billingPeriod: BillingInterval
  features: string[]
  limits?: Record<string, number | string>
  highlighted?: boolean
  badge?: string
  priceId?: string
  currency?: string
  trialDays?: number
  trialCreditCents?: number
  /** If true, clicking this plan opens an external URL instead of subscribing */
  contactSales?: boolean
  /** External URL to redirect to (for agency/enterprise contact flows) */
  externalUrl?: string
  /** Annual price alternative shown on the card */
  annualPrice?: number
}

export interface Subscription {
  id: string
  customerId: string
  planId: string
  status: "active" | "canceled" | "past_due" | "trialing" | "unpaid" | "incomplete"
  currentPeriodStart: Date
  currentPeriodEnd: Date
  usage?: Record<string, number>
  cancelAt?: Date
  cancelAtPeriodEnd?: boolean
  nextPlanId?: string | null
  discount?: SubscriptionDiscount | null
}

export interface SubscriptionDiscount {
  id: string
  code: string | null
  name: string | null
  kind: "percent" | "amount"
  value: number
  currency: string | null
  duration: "forever" | "once" | "repeating" | null
  durationInMonths: number | null
}

export interface RetentionOffer {
  id: string
  title: string
  description: string
  discount: number
  durationMonths: number
  ctaLabel?: string
}

export interface SubscriptionHistory {
  id: string
  date: Date
  action: "created" | "upgraded" | "downgraded" | "canceled" | "renewed" | "payment_failed"
  fromPlan?: string
  toPlan?: string
  details: string
}

export interface BillingMetric {
  id: string
  label: string
  current: number
  limit?: number
  unit?: string
  trendPercent?: number
}

// Business profile
export interface BusinessAddress {
  line1: string
  line2?: string
  city: string
  state?: string
  zip: string
  country: string
}

export interface BusinessContact {
  id: string
  role: "billing" | "finance" | "legal" | "support" | "operations"
  name: string
  email: string
  phone?: string
}

export interface BusinessProfile {
  legalName: string
  displayName: string
  website?: string
  supportEmail?: string
  supportPhone?: string
  statementDescriptor?: string
  taxId?: string
  incorporationCountry?: string
  industry?: string
  registeredAddress: BusinessAddress
  contacts?: BusinessContact[]
}

// Tax and compliance
export interface TaxRegistration {
  id: string
  region: string
  type: "vat" | "gst" | "sales_tax" | "ein" | "abn" | "other"
  registrationId: string
  status: "active" | "pending" | "expired"
  filingFrequency?: "monthly" | "quarterly" | "yearly"
  effectiveFrom?: Date | string
  expiresAt?: Date | string
}

export interface TaxSettings {
  automaticCollection: boolean
  reverseChargeEnabled?: boolean
  nexusRegions?: string[]
  registrations: TaxRegistration[]
}

export interface ComplianceItem {
  id: string
  title: string
  description: string
  category: "kyb" | "aml" | "tax" | "security" | "reporting"
  status: "complete" | "required" | "review" | "blocked"
  lastUpdated?: Date | string
  owner?: string
  actionLabel?: string
}

// Payment types
export type PaymentMethodType = "card" | "paypal" | "apple_pay" | "google_pay" | "bank_account" | "sepa_debit" | "crypto" | "wire"

export type CryptoNetwork = "bitcoin" | "ethereum" | "solana" | "usdc"

export interface PaymentMethod {
  id: string
  type: PaymentMethodType
  is_default: boolean
  created_at: string
  isDefault?: boolean
  card?: {
    brand: string
    last4: string
    exp_month: number
    exp_year: number
    funding: string
  }
  paypal?: {
    email: string
  }
  bank_account?: {
    bankName?: string
    last4?: string
    country?: string
    currency?: string
  }
  crypto?: {
    network: CryptoNetwork
    walletAddress: string
    label?: string
  }
  wire?: {
    bankName: string
    accountHolder: string
    routingNumber?: string
    accountLast4?: string
    swift?: string
    iban?: string
    country?: string
  }
  billing_details?: {
    name?: string
    email?: string
    phone?: string
    address?: {
      line1?: string
      line2?: string
      city?: string
      state?: string
      postal_code?: string
      country?: string
    }
  }
  // Transient fields for card tokenization (not persisted, used in onAdd flow)
  _sourceToken?: string
  _verificationToken?: string
}

// Invoice types
export interface Invoice {
  id: string
  invoiceNumber: string
  date: Date
  dueDate?: Date
  amount: number
  tax?: number
  total: number
  status: "paid" | "unpaid" | "failed" | "pending" | "refunded" | "void"
  pdfUrl?: string
  items?: InvoiceItem[]

  // Stripe-friendly aliases for easier integration
  number?: string | null
  currency?: string
  created?: number
  invoicePdfUrl?: string | null
  breakdown?: {
    subtotalCents?: number
    taxCents?: number
    totalCents: number
  }
}

export interface InvoiceItem {
  id: string
  description: string
  quantity: number
  unitPrice: number
  total: number
}

export interface InvoiceFilters {
  status?: string
  dateFrom?: Date
  dateTo?: Date
  minAmount?: number
  maxAmount?: number
  search?: string
}

// Spend alert types
export interface SpendAlert {
  id: string
  title: string
  threshold: number
  currency: string
  triggeredAt?: string | null
  createdAt: string
  updatedAt: string
}

// Usage tracking types
export type UsageMeterType = "ai" | "storage" | "network" | "network_egress" | "gpu" | "api_calls"

export interface UsageRecord {
  meterId: UsageMeterType
  label: string
  current: number
  limit: number | null
  unit: string
  cost: number
  periodStart: string
  periodEnd: string
}

export interface UsageSummary {
  totalCost: number
  currency: string
  period: {
    start: string
    end: string
  }
  records: UsageRecord[]
}

// Credit grant types
export interface CreditGrant {
  id: string
  userId?: string
  name: string
  amountCents: number
  remainingCents: number
  currency: string
  expiresAt?: string
  priority?: number
  eligibility?: string[]
  voided?: boolean
  active: boolean
  createdAt?: string
}

// Transaction record types
export type TransactionType = 'hold' | 'hold-removed' | 'transfer' | 'deposit' | 'withdraw'

export interface TransactionRecord {
  id: string
  type: TransactionType
  amountCents: number
  currency: string
  description?: string
  balanceAfter?: number
  tags?: string[]
  createdAt: string
}

// Support tier types
export interface SupportTier {
  id: string
  name: string
  price: number
  billingPeriod: 'monthly' | 'yearly'
  features: string[]
  highlighted?: boolean
}

// Discount / promotion code
export interface DiscountCode {
  id: string
  code: string
  name: string | null
  kind: "percent" | "amount"
  value: number
  currency: string | null
  duration: "forever" | "once" | "repeating" | null
  durationInMonths: number | null
  valid: boolean
}

// Multi-billing-account types
export type BillingRole = 'owner' | 'admin' | 'viewer'

export interface BillingAccount {
  id: string
  name: string
  orgId: string
  orgName: string
  balance: number
  currency: string
  plan: string
  role: BillingRole
  createdAt: string
}

export interface BillingAccountMember {
  id: string
  userId: string
  email: string
  name: string
  role: BillingRole
  addedAt: string
}

// Balance type (used by overview dashboard)
export interface Balance {
  available: number
  pending?: number
  currency?: string
}
