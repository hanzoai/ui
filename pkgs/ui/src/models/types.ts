/**
 * @hanzo/ui — Model component types
 *
 * These types are structurally compatible with @hanzo/zen-models ZenModel / ModelFamily,
 * so ZenModel objects can be passed directly to these components without casting.
 */

export interface ModelSpecLike {
  params: string
  activeParams?: string | null
  context?: number
  arch?: string
}

export interface ModelPricingLike {
  input: number | null
  output: number | null
  cacheRead?: number | null
  cacheWrite?: number | null
}

export interface ZenModelLike {
  id: string
  name: string
  description: string
  spec: ModelSpecLike
  pricing: ModelPricingLike | null
  /** 'available' | 'preview' | 'coming-soon' | 'contact-sales' | 'cloud-only' */
  status: string
  huggingface?: string | null
  github?: string | null
  paper?: string | null
}

export interface ModelFamilyLike {
  id: string
  name: string
  description: string
  /** lucide-react icon name */
  icon?: string
  /** ordered list of model IDs */
  models: string[]
}
