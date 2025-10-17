// Re-export all types from hooks
export * from '../hooks/types'

// Additional common types
export interface Suggestion {
  id: string
  text: string
  metadata?: Record<string, any>
}

export interface Model {
  id: string
  name: string
  description: string
  parameters?: Record<string, any>
}

export interface Attachment {
  id: string
  name: string
  size: number
  type: string
  url?: string
  file?: File
}