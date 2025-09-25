/**
 * @hanzo/ui CORE - Ultra-minimal essentials only
 * Target: < 30KB bundle
 * 
 * Only includes:
 * - Button (the most essential component)
 * - Card (basic container)
 * - Input (form essential) 
 * - Label (form essential)
 * - cn utility (styling essential)
 * 
 * Everything else should be imported separately!
 */

// The absolute essentials only
export { default as Button, buttonVariants, type ButtonProps } from './button'
export { Card, CardHeader, CardContent, CardFooter } from './card'
export { Input, type InputProps } from './input'
export { Label } from './label'

// Essential utilities
export { cn } from '../src/utils'

/**
 * That's it! Only 5 components + cn utility.
 * 
 * For more components, import them individually:
 * 
 * import { Dialog } from '@hanzo/ui/dialog'
 * import { Select } from '@hanzo/ui/select'
 * import { Badge } from '@hanzo/ui/badge'
 * etc.
 */