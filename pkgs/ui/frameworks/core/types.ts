/**
 * Core framework types
 *
 * @note Framework implementations are opt-in. Install the specific framework
 * components you need via:
 * - React: Default export from @hanzo/ui
 * - Vue: @hanzo/ui/vue
 * - Svelte: @hanzo/ui/svelte
 * - React Native: @hanzo/ui/react-native
 */

export interface FrameworkConfig {
  name: string
  version: string
}

export type ComponentVariant = 'default' | 'outline' | 'ghost' | 'destructive'
export type ComponentSize = 'sm' | 'default' | 'lg'
