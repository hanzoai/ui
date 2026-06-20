// Hook type definitions

export interface UseMessageOptions {
  threadId?: string
  onSuccess?: (message: any) => void
  onError?: (error: Error) => void
  autoRetry?: boolean
  maxRetries?: number
  retryDelay?: number
}

export interface UseMessageReturn {
  sendMessage: (content: string) => Promise<any>
  sendMessageWithAttachments: (content: string, attachments: File[]) => Promise<any>
  isLoading: boolean
  error: Error | null
  lastMessage: any | null
  clearError: () => void
  retry: () => Promise<void>
}

export interface UseStreamingOptions {
  threadId?: string
  onChunk?: (chunk: string) => void
  onComplete?: (message: any) => void
  onError?: (error: Error) => void
  bufferSize?: number
  throttleMs?: number
}

export interface UseStreamingReturn {
  streamMessage: (content: string) => Promise<void>
  isStreaming: boolean
  currentMessage: string
  error: Error | null
  stopStreaming: () => void
  clearMessage: () => void
  progress: number
}

export interface UseThreadOptions {
  maxThreads?: number
  autoArchive?: boolean
}

export interface UseThreadReturn {
  threads: Map<string, any>
  activeThread: any | undefined
  createThread: (metadata?: Record<string, any>) => any
  switchThread: (threadId: string) => void
  deleteThread: (threadId: string) => void
  updateThreadMetadata: (threadId: string, metadata: Record<string, any>) => void
  getThreadMessages: (threadId: string) => any[]
  clearThread: (threadId: string) => void
}

export interface UseComponentOptions {
  lazy?: boolean
}

export interface UseComponentReturn {
  registerComponent: (component: any) => void
  unregisterComponent: (name: string) => void
  renderComponent: (name: string, props: any) => React.ReactElement | null
  getComponent: (name: string) => any | undefined
  hasComponent: (name: string) => boolean
  listComponents: () => string[]
}

export interface UseToolOptions {
  timeout?: number
}

export interface UseToolReturn {
  executeTool: (name: string, params: any) => Promise<any>
  registerTool: (tool: any) => void
  unregisterTool: (name: string) => void
  isExecuting: boolean
  lastResult: any | null
  error: Error | null
}

export interface UseSuggestionsOptions {
  maxSuggestions?: number
  autoRefresh?: boolean
  refreshInterval?: number
}

export interface UseSuggestionsReturn {
  suggestions: any[]
  getSuggestions: (options?: any) => Promise<void>
  acceptSuggestion: (suggestion: any) => void
  dismissSuggestion: (id: string) => void
  isLoading: boolean
}

export interface UseModelConfigOptions {
  defaultModel?: string
}

export interface UseModelConfigReturn {
  currentModel: string
  availableModels: any[]
  switchModel: (modelId: string) => void
  updateParameters: (params: any) => void
  resetToDefaults: () => void
}

export interface UseMCPOptions {
  autoConnect?: boolean
}

export interface UseMCPReturn {
  connectServer: (config: any) => Promise<void>
  disconnectServer: (id: string) => void
  connectedServers: any[]
  executeServerTool: (serverId: string, tool: string, params: any) => Promise<any>
  getServerResources: (serverId: string) => any[]
  isConnected: (serverId: string) => boolean
}

export interface UseGenerativeUIOptions {
  cacheResults?: boolean
}

export interface UseGenerativeUIReturn {
  generateUI: (options: any) => Promise<React.ReactElement>
  isGenerating: boolean
  generatedComponents: React.ReactElement[]
  clearComponents: () => void
  saveComponent: (name: string, component: React.ReactElement) => void
}

export interface UseAuthOptions {
  provider?: string
}

export interface UseAuthReturn {
  user: any | null
  isAuthenticated: boolean
  isLoading: boolean
  signIn: (options?: any) => Promise<void>
  signOut: () => Promise<void>
  getToken: () => Promise<string | null>
  refreshToken: () => Promise<void>
}

export interface UseAttachmentsOptions {
  maxSize?: number
  allowedTypes?: string[]
  autoUpload?: boolean
}

export interface UseAttachmentsReturn {
  attachments: any[]
  addAttachment: (file: File) => Promise<any>
  removeAttachment: (id: string) => void
  clearAttachments: () => void
  uploadAttachment: (attachment: any) => Promise<void>
  isUploading: boolean
  uploadProgress: number
}