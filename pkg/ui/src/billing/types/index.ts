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
export interface PaymentMethod {
  id: string
  type: "card" | "paypal" | "apple_pay" | "google_pay" | "bank_account" | "sepa_debit"
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
