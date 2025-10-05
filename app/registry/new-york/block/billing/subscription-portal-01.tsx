"use client"

import {
  SubscriptionPortal,
  type RetentionOffer,
  type Subscription,
  type SubscriptionHistory,
  type SubscriptionPlan,
} from "@hanzo/ui/billing"

export const description =
  "A comprehensive subscription management portal with plan upgrades, usage tracking, and subscription history."

export const iframeHeight = "1000px"

export const containerClassName = "w-full"

// Demo subscription plans
const demoPlans: SubscriptionPlan[] = [
  {
    id: "free",
    name: "Free",
    description: "Perfect for getting started",
    price: 0,
    billingPeriod: "monthly",
    features: [
      "Up to 3 projects",
      "Basic analytics",
      "Community support",
      "5 team members",
    ],
    limits: {
      projects: 3,
      storage: 1, // GB
      apiCalls: 1000,
    },
  },
  {
    id: "pro",
    name: "Pro",
    description: "For professional developers",
    price: 29,
    billingPeriod: "monthly",
    features: [
      "Unlimited projects",
      "Advanced analytics",
      "Priority support",
      "Unlimited team members",
      "Custom integrations",
      "Advanced security",
    ],
    limits: {
      projects: "unlimited",
      storage: 100, // GB
      apiCalls: "unlimited",
    },
    highlighted: true,
    badge: "Popular",
  },
  {
    id: "enterprise",
    name: "Enterprise",
    description: "For large teams and organizations",
    price: 99,
    billingPeriod: "monthly",
    features: [
      "Everything in Pro",
      "Dedicated support",
      "SLA guarantee",
      "Custom integrations",
      "On-premise deployment",
      "Training & onboarding",
      "Advanced compliance",
    ],
    limits: {
      projects: "unlimited",
      storage: "unlimited",
      apiCalls: "unlimited",
    },
  },
]

// Demo current subscription
const demoSubscription: Subscription = {
  id: "sub_1",
  customerId: "cus_1",
  planId: "pro",
  plan: demoPlans[1], // Pro plan
  status: "active",
  currentPeriodStart: new Date("2024-10-01"),
  currentPeriodEnd: new Date("2024-11-01"),
  cancelAtPeriodEnd: false,
  usage: [
    {
      name: "Projects",
      current: 12,
      limit: "unlimited",
    },
    {
      name: "Storage",
      current: 45,
      limit: 100,
      unit: "GB",
    },
    {
      name: "API Calls",
      current: 45000,
      limit: "unlimited",
      unit: "calls",
    },
  ],
  upcomingInvoice: {
    amount: 29,
    date: new Date("2024-11-01"),
  },
}

// Demo retention offers
const demoRetentionOffers: RetentionOffer[] = [
  {
    id: "offer_1",
    title: "3 Months at 50% Off",
    description: "Stay with us and get 50% off for the next 3 months",
    discount: 50,
    features: [
      "Keep all Pro features",
      "No contract required",
      "Cancel anytime",
    ],
  },
  {
    id: "offer_2",
    title: "Free Extra Storage",
    description: "Get an additional 50GB storage for free for 6 months",
    features: [
      "150GB total storage",
      "All Pro features included",
      "Priority support",
    ],
  },
]

// Demo subscription history
const demoHistory: SubscriptionHistory[] = [
  {
    id: "hist_1",
    subscriptionId: "sub_1",
    event: "upgraded",
    fromPlan: "Free",
    toPlan: "Pro",
    timestamp: new Date("2024-10-01"),
    amount: 29,
  },
  {
    id: "hist_2",
    subscriptionId: "sub_1",
    event: "created",
    toPlan: "Free",
    timestamp: new Date("2024-09-15"),
    amount: 0,
  },
]

export default function SubscriptionPortal01() {
  // Demo handlers
  const handleUpgrade = async (planId: string) => {
    console.log("Upgrading to plan:", planId)
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1000))
  }

  const handleDowngrade = async (planId: string) => {
    console.log("Downgrading to plan:", planId)
    await new Promise((resolve) => setTimeout(resolve, 1000))
  }

  const handleCancel = async (reason: string, feedback?: string) => {
    console.log("Canceling subscription:", { reason, feedback })
    await new Promise((resolve) => setTimeout(resolve, 1000))
  }

  const handleAcceptOffer = async (offerId: string) => {
    console.log("Accepting retention offer:", offerId)
    await new Promise((resolve) => setTimeout(resolve, 1000))
  }

  return (
    <div className="mx-auto max-w-7xl p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">
          Subscription Management
        </h1>
        <p className="text-muted-foreground mt-2">
          Manage your subscription, view usage, and explore available plans
        </p>
      </div>

      <SubscriptionPortal
        subscription={demoSubscription}
        availablePlans={demoPlans}
        retentionOffers={demoRetentionOffers}
        subscriptionHistory={demoHistory}
        onUpgrade={handleUpgrade}
        onDowngrade={handleDowngrade}
        onCancel={handleCancel}
        onAcceptOffer={handleAcceptOffer}
        showHistory={true}
        defaultView="overview"
      />
    </div>
  )
}
