/**
 * @hanzo/ui Components
 * 
 * Core components with minimal dependencies are exported directly.
 * Components requiring heavy dependencies are available via the lazy module.
 */

// Core components (always available - only require Radix UI primitives)
export * from './accordion'
export * from './alert'
export * from './alert-dialog'
export * from './aspect-ratio'
export * from './avatar'
export * from './badge'
export * from './button'
export * from './card'
export * from './checkbox'
export * from './collapsible'
export * from './context-menu'
export * from './dialog'
export * from './dropdown-menu'
export * from './hover-card'
export * from './input'
export * from './label'
export * from './menubar'
export * from './navigation-menu'
export * from './pagination'
export * from './popover'
export * from './progress'
export * from './radio-group'
export * from './scroll-area'
export * from './select'
export * from './separator'
export * from './sheet'
export * from './skeleton'
export * from './slider'
export * from './switch'
export * from './table'
export * from './tabs'
export * from './textarea'
export * from './toggle'
export * from './toggle-group'
export * from './tooltip'
export * from './breadcrumb'

// Theme provider (if it exists)
// export * from './theme-provider'

// Heavy components are available through lazy loading
// Import them from '@hanzo/ui/components/lazy' or install their dependencies
import * as LazyComponents from './lazy'
export { LazyComponents }

// Export types that don't require dependencies
// These are conditionally exported if the component files exist
// export type { CalendarProps } from './calendar'
// export type { CommandProps, CommandDialogProps } from './command'
// export type { CarouselProps, CarouselApi } from './carousel'
// export type { ToasterProps } from './sonner'
// export type { DrawerProps } from './drawer'

// Helper to check if optional dependencies are available
export { isDependencyAvailable } from './with-deps'