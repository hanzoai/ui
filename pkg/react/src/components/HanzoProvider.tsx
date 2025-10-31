"use client"

import React, { createContext, useContext, useCallback, useEffect, useMemo, useState } from 'react'
import { nanoid } from 'nanoid'
import { z } from 'zod'

// Types
export interface HanzoComponent {
  name: string
  component: React.ComponentType<any>
  description?: string
  parameters?: z.ZodType<any>
  generateUI?: (params: any) => React.ReactElement
}

export interface HanzoTool {
  name: string
  description: string
  parameters: z.ZodType<any>
  execute: (params: any) => Promise<any>
}

export interface Message {
  id: string
  role: 'user' | 'assistant' | 'system' | 'tool'
  content: string | React.ReactElement
  timestamp: Date
  threadId: string
  toolCalls?: ToolCall[]
  metadata?: Record<string, any>
}

export interface ToolCall {
  id: string
  name: string
  arguments: any
  result?: any
  status: 'pending' | 'running' | 'completed' | 'failed'
}

export interface Thread {
  id: string
  messages: Message[]
  createdAt: Date
  updatedAt: Date
  metadata?: Record<string, any>
}

export interface HanzoContextValue {
  // Configuration
  apiKey?: string
  apiUrl?: string
  model?: string
  
  // Components & Tools
  components: Map<string, HanzoComponent>
  tools: Map<string, HanzoTool>
  
  // Thread Management
  threads: Map<string, Thread>
  activeThreadId?: string
  
  // Message Operations
  sendMessage: (content: string, threadId?: string) => Promise<Message>
  streamMessage: (content: string, threadId?: string) => AsyncGenerator<Message>
  
  // Thread Operations
  createThread: (metadata?: Record<string, any>) => Thread
  switchThread: (threadId: string) => void
  deleteThread: (threadId: string) => void
  
  // Component Operations
  registerComponent: (component: HanzoComponent) => void
  unregisterComponent: (name: string) => void
  renderComponent: (name: string, props: any) => React.ReactElement | null
  
  // Tool Operations
  registerTool: (tool: HanzoTool) => void
  unregisterTool: (name: string) => void
  executeTool: (name: string, params: any) => Promise<any>
  
  // State Management
  isStreaming: boolean
  responseStage?: 'thinking' | 'generating' | 'tool-calling' | 'completed'
  error?: Error
}

const HanzoContext = createContext<HanzoContextValue | undefined>(undefined)

export interface HanzoProviderProps {
  children: React.ReactNode
  apiKey?: string
  apiUrl?: string
  model?: string
  components?: HanzoComponent[]
  tools?: HanzoTool[]
  initialMessages?: Message[]
  onMessage?: (message: Message) => void
  onError?: (error: Error) => void
  enableStreaming?: boolean
  enableMCP?: boolean
  mcpServers?: string[]
}

export function HanzoProvider({
  children,
  apiKey,
  apiUrl = 'https://api.hanzo.ai/v1',
  model = 'gpt-4-turbo-preview',
  components: initialComponents = [],
  tools: initialTools = [],
  initialMessages = [],
  onMessage,
  onError,
  enableStreaming = true,
  // @ts-expect-error - MCP integration coming soon
  enableMCP = false, // eslint-disable-line @typescript-eslint/no-unused-vars
  // @ts-expect-error - MCP server support coming soon
  mcpServers = [] // eslint-disable-line @typescript-eslint/no-unused-vars
}: HanzoProviderProps) {
  // State
  const [components] = useState(() => new Map(initialComponents.map(c => [c.name, c])))
  const [tools] = useState(() => new Map(initialTools.map(t => [t.name, t])))
  const [threads, setThreads] = useState<Map<string, Thread>>(new Map())
  const [activeThreadId, setActiveThreadId] = useState<string>()
  const [isStreaming, setIsStreaming] = useState(false)
  const [responseStage, setResponseStage] = useState<HanzoContextValue['responseStage']>()
  const [error, setError] = useState<Error>()
  
  // Initialize default thread
  useEffect(() => {
    const defaultThread = createThread({ name: 'default' })
    if (initialMessages.length > 0) {
      defaultThread.messages = initialMessages
    }
    setActiveThreadId(defaultThread.id)
  }, [])
  
  // Thread Operations
  const createThread = useCallback((metadata?: Record<string, any>): Thread => {
    const thread: Thread = {
      id: nanoid(),
      messages: [],
      createdAt: new Date(),
      updatedAt: new Date(),
      metadata
    }
    setThreads(prev => new Map(prev).set(thread.id, thread))
    return thread
  }, [])
  
  const switchThread = useCallback((threadId: string) => {
    if (threads.has(threadId)) {
      setActiveThreadId(threadId)
    } else {
      throw new Error(`Thread ${threadId} not found`)
    }
  }, [threads])
  
  const deleteThread = useCallback((threadId: string) => {
    setThreads(prev => {
      const next = new Map(prev)
      next.delete(threadId)
      return next
    })
    if (activeThreadId === threadId) {
      const remainingThreads = Array.from(threads.keys()).filter(id => id !== threadId)
      setActiveThreadId(remainingThreads[0])
    }
  }, [activeThreadId, threads])
  
  // Message Operations
  const sendMessage = useCallback(async (content: string, threadId?: string): Promise<Message> => {
    const targetThreadId = threadId || activeThreadId
    if (!targetThreadId) {
      throw new Error('No active thread')
    }
    
    const thread = threads.get(targetThreadId)
    if (!thread) {
      throw new Error(`Thread ${targetThreadId} not found`)
    }
    
    // Create user message
    const userMessage: Message = {
      id: nanoid(),
      role: 'user',
      content,
      timestamp: new Date(),
      threadId: targetThreadId
    }
    
    // Add to thread
    thread.messages.push(userMessage)
    thread.updatedAt = new Date()
    setThreads(new Map(threads))
    
    // Notify callback
    onMessage?.(userMessage)
    
    // Send to API
    setIsStreaming(true)
    setResponseStage('thinking')
    
    try {
      const response = await fetch(`${apiUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model,
          messages: thread.messages.map(m => ({
            role: m.role,
            content: typeof m.content === 'string' ? m.content : 'Component rendered'
          })),
          tools: Array.from(tools.values()).map(t => ({
            type: 'function',
            function: {
              name: t.name,
              description: t.description,
              parameters: t.parameters
            }
          })),
          stream: enableStreaming
        })
      })
      
      if (!response.ok) {
        throw new Error(`API error: ${response.statusText}`)
      }
      
      setResponseStage('generating')
      
      // Handle response
      const data = await response.json()
      const assistantMessage: Message = {
        id: nanoid(),
        role: 'assistant',
        content: data.choices[0].message.content,
        timestamp: new Date(),
        threadId: targetThreadId
      }
      
      // Handle tool calls
      if (data.choices[0].message.tool_calls) {
        setResponseStage('tool-calling')
        assistantMessage.toolCalls = await Promise.all(
          data.choices[0].message.tool_calls.map(async (call: any) => {
            const tool = tools.get(call.function.name)
            if (!tool) {
              return {
                id: call.id,
                name: call.function.name,
                arguments: call.function.arguments,
                status: 'failed',
                result: `Tool ${call.function.name} not found`
              }
            }
            
            try {
              const result = await tool.execute(JSON.parse(call.function.arguments))
              return {
                id: call.id,
                name: call.function.name,
                arguments: call.function.arguments,
                status: 'completed',
                result
              }
            } catch (error) {
              return {
                id: call.id,
                name: call.function.name,
                arguments: call.function.arguments,
                status: 'failed',
                result: error instanceof Error ? error.message : 'Unknown error'
              }
            }
          })
        )
      }
      
      // Add assistant message
      thread.messages.push(assistantMessage)
      thread.updatedAt = new Date()
      setThreads(new Map(threads))
      
      // Notify callback
      onMessage?.(assistantMessage)
      
      setResponseStage('completed')
      return assistantMessage
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Unknown error')
      setError(error)
      onError?.(error)
      throw error
    } finally {
      setIsStreaming(false)
      setResponseStage(undefined)
    }
  }, [apiKey, apiUrl, model, activeThreadId, threads, tools, onMessage, onError, enableStreaming])
  
  // Streaming Message Operation
  const streamMessage = useCallback(async function* (
    content: string, 
    threadId?: string
  ): AsyncGenerator<Message> {
    const targetThreadId = threadId || activeThreadId
    if (!targetThreadId) {
      throw new Error('No active thread')
    }
    
    const thread = threads.get(targetThreadId)
    if (!thread) {
      throw new Error(`Thread ${targetThreadId} not found`)
    }
    
    // Create user message
    const userMessage: Message = {
      id: nanoid(),
      role: 'user',
      content,
      timestamp: new Date(),
      threadId: targetThreadId
    }
    
    thread.messages.push(userMessage)
    yield userMessage
    
    // Stream from API
    setIsStreaming(true)
    setResponseStage('thinking')
    
    try {
      const response = await fetch(`${apiUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model,
          messages: thread.messages.map(m => ({
            role: m.role,
            content: typeof m.content === 'string' ? m.content : 'Component rendered'
          })),
          stream: true
        })
      })
      
      if (!response.ok) {
        throw new Error(`API error: ${response.statusText}`)
      }
      
      setResponseStage('generating')
      
      const reader = response.body?.getReader()
      if (!reader) {
        throw new Error('No response body')
      }
      
      const decoder = new TextDecoder()
      let assistantMessage: Message = {
        id: nanoid(),
        role: 'assistant',
        content: '',
        timestamp: new Date(),
        threadId: targetThreadId
      }
      
      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        
        const chunk = decoder.decode(value)
        const lines = chunk.split('\n').filter(line => line.trim() !== '')
        
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6)
            if (data === '[DONE]') continue
            
            try {
              const parsed = JSON.parse(data)
              if (parsed.choices?.[0]?.delta?.content) {
                assistantMessage.content += parsed.choices[0].delta.content
                yield { ...assistantMessage }
              }
            } catch (e) {
              console.error('Error parsing SSE data:', e)
            }
          }
        }
      }
      
      thread.messages.push(assistantMessage)
      thread.updatedAt = new Date()
      setThreads(new Map(threads))
      
      setResponseStage('completed')
    } finally {
      setIsStreaming(false)
      setResponseStage(undefined)
    }
  }, [apiKey, apiUrl, model, activeThreadId, threads])
  
  // Component Operations
  const registerComponent = useCallback((component: HanzoComponent) => {
    components.set(component.name, component)
  }, [components])
  
  const unregisterComponent = useCallback((name: string) => {
    components.delete(name)
  }, [components])
  
  const renderComponent = useCallback((name: string, props: any): React.ReactElement | null => {
    const component = components.get(name)
    if (!component) return null
    
    if (component.generateUI) {
      return component.generateUI(props)
    }
    
    const Component = component.component
    return <Component {...props} />
  }, [components])
  
  // Tool Operations
  const registerTool = useCallback((tool: HanzoTool) => {
    tools.set(tool.name, tool)
  }, [tools])
  
  const unregisterTool = useCallback((name: string) => {
    tools.delete(name)
  }, [tools])
  
  const executeTool = useCallback(async (name: string, params: any): Promise<any> => {
    const tool = tools.get(name)
    if (!tool) {
      throw new Error(`Tool ${name} not found`)
    }
    return tool.execute(params)
  }, [tools])
  
  // Context value
  const contextValue = useMemo<HanzoContextValue>(() => ({
    apiKey,
    apiUrl,
    model,
    components,
    tools,
    threads,
    activeThreadId,
    sendMessage,
    streamMessage,
    createThread,
    switchThread,
    deleteThread,
    registerComponent,
    unregisterComponent,
    renderComponent,
    registerTool,
    unregisterTool,
    executeTool,
    isStreaming,
    responseStage,
    error
  }), [
    apiKey,
    apiUrl,
    model,
    components,
    tools,
    threads,
    activeThreadId,
    sendMessage,
    streamMessage,
    createThread,
    switchThread,
    deleteThread,
    registerComponent,
    unregisterComponent,
    renderComponent,
    registerTool,
    unregisterTool,
    executeTool,
    isStreaming,
    responseStage,
    error
  ])
  
  return (
    <HanzoContext.Provider value={contextValue}>
      {children}
    </HanzoContext.Provider>
  )
}

// Hook to use Hanzo context
export function useHanzo() {
  const context = useContext(HanzoContext)
  if (!context) {
    throw new Error('useHanzo must be used within HanzoProvider')
  }
  return context
}