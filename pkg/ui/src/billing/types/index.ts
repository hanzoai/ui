// Subscription types
export interface SubscriptionPlan {
  id: string
  name: string
  description: string
  price: number
  billingPeriod: 'monthly' | 'yearly'
  features: string[]
  limits?: Record<string, number | string>
  highlighted?: boolean
  badge?: string
}

export interface Subscription {
  id: string
  customerId: string
  planId: string
  status: 'active' | 'canceled' | 'past_due' | 'trialing'
  currentPeriodStart: Date
  currentPeriodEnd: Date
  usage?: Record<string, number>
}

export interface RetentionOffer {
  id: string
  title: string
  description: string
  discount: number
  durationMonths: number
}

export interface SubscriptionHistory {
  id: string
  date: Date
  action: 'created' | 'upgraded' | 'downgraded' | 'canceled' | 'renewed'
  fromPlan?: string
  toPlan?: string
  details: string
}

// Payment types
export interface PaymentMethod {
  id: string
  type: 'card' | 'paypal' | 'apple_pay' | 'google_pay'
  is_default: boolean
  created_at: string
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

export interface BillingAddress {
  line1: string
  line2?: string
  city: string
  state: string
  zip: string
  country: string
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
  status: 'paid' | 'unpaid' | 'failed' | 'pending' | 'refunded'
  pdfUrl?: string
  items?: InvoiceItem[]
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
