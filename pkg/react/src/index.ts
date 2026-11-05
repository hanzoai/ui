// @hanzo/react - React package for building AI-powered applications
// with generative UI and natural language interactions

// Core Provider and Context
export { 
  HanzoProvider, 
  useHanzo,
  type HanzoProviderProps,
  type HanzoContextValue,
  type HanzoComponent,
  type HanzoTool,
  type Message,
  type Thread,
  type ToolCall
} from './components/HanzoProvider'

// Hooks
export { useMessage, type UseMessageOptions, type UseMessageReturn } from './hooks/useMessage'
export { useStreaming, type UseStreamingOptions, type UseStreamingReturn } from './hooks/useStreaming'

// Utilities
//
// `cn` was here, as `twMerge(clsx(...))`. Two things were wrong with that: this
// package renders nothing that needs a class name, and Tailwind conflict
// resolution is not a fact an AI-hooks package gets to hold. There is one `cn`,
// in `@hanzo/ui` — and it is clsx alone, because @hanzo/gui style props carry
// the styling and there are no utilities left to resolve.
export { generateId } from './utils/id'
export { parseStream } from './utils/stream'

// Types
export * from './types'

// Version
import { version } from '../package.json'
export const VERSION: string = version