// General-purpose content components
// Import from @hanzo/ui/content for high-level content blocks
// These are NOT docs-specific - use them anywhere you need cards, tabs, steps, callouts, etc.

// Card grid for navigation/features
export { Card, Cards } from '../docs/components/card'
export type { CardProps } from '../docs/components/card'

// Enhanced tabs with items prop for simple usage
export { Tab, Tabs, TabsList, TabsTrigger, TabsContent } from '../docs/components/tabs'
export type { TabProps, TabsProps } from '../docs/components/tabs'

// Step-by-step guides
export { Step, Steps } from '../docs/components/steps'

// Info/warning/error callouts
export {
  Callout,
  CalloutContainer,
  CalloutTitle,
  CalloutDescription,
} from '../docs/components/callout'
export type { CalloutType, CalloutContainerProps } from '../docs/components/callout'

// Enhanced accordions with URL hash integration
export { Accordion, Accordions } from '../docs/components/accordion'
