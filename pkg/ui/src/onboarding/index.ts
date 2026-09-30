/**
 * The onboarding every Hanzo surface shares. IAM holds each person's progress
 * (POST /v1/iam/preferences), commerce takes the payment (/v1/billing), and

 *
 *   <Onboarding/>      how you will use Hanzo → plans | team → seats → checkout
 *   <ChatOnboarding/>  before your first chat → name → role and starter prompts
 *   <Checkout/>        the one checkout, also behind every Upgrade entry
 */
export { Onboarding, type OnboardingProps } from './Onboarding'
export { ChatOnboarding, type ChatOnboardingProps } from './ChatOnboarding'
export { Checkout, type CheckoutProps } from './Checkout'
export { useOnboarded, useSession, type Session, type Track } from './hooks'
export { chatStep, step, type ChatStep, type Progress, type Step, type Use } from './state'
export { adopt, ENTERPRISE_FROM, has, item, lines, MAX_SEATS, MIN_SEATS, offer, OFFERS, period, saving, SLUG, unit, type Interval, type Lines, type Offer, type PlanId, type Row } from './plans'
export { loadCatalog, useCatalog } from './catalog'
export { OWN_TOPIC, ROLES, type Role, type Starter } from './roles'
export { API, preferences } from './api'
