"use client"

import React, { useState, useRef, useEffect } from 'react'
import { z } from 'zod'
import { 
  HanzoProvider, 
  useMessage, 
  useStreaming, 
  useThread,
  useComponent,
  useTool,
  useSuggestions,
  useAuth,
  type HanzoComponent,
  type HanzoTool
} from '@hanzo/react'

// Example custom components for generative UI
function WeatherCard({ city, temperature, conditions, icon }: {
  city: string
  temperature: number
  conditions: string
  icon: string
}) {
  return (
    <div className="p-4 bg-blue-50 dark:bg-blue-950 rounded-lg border border-blue-200 dark:border-blue-800">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">{city}</h3>
          <p className="text-2xl font-bold">{temperature}°F</p>
          <p className="text-gray-600 dark:text-gray-400">{conditions}</p>
        </div>
        <div className="text-4xl">{icon}</div>
      </div>
    </div>
  )
}

function ChartComponent({ data, type, title }: {
  data: number[]
  type: 'bar' | 'line' | 'pie'
  title: string
}) {
  return (
    <div className="p-4 bg-gray-50 dark:bg-gray-950 rounded-lg border">
      <h3 className="text-lg font-semibold mb-2">{title}</h3>
      <div className="h-48 bg-white dark:bg-black rounded flex items-center justify-center">
        <p className="text-gray-500">
          {type} chart with {data.length} data points
        </p>
      </div>
      <div className="mt-2 text-sm text-gray-600">
        Data: {data.join(', ')}
      </div>
    </div>
  )
}

// Define generative UI components
const hanzoComponents: HanzoComponent[] = [
  {
    name: 'weather-card',
    component: WeatherCard,
    description: 'Display weather information for a city',
    parameters: z.object({
      city: z.string(),
      temperature: z.number(),
      conditions: z.string(),
      icon: z.string()
    })
  },
  {
    name: 'chart',
    component: ChartComponent,
    description: 'Display data in a chart',
    parameters: z.object({
      data: z.array(z.number()),
      type: z.enum(['bar', 'line', 'pie']),
      title: z.string()
    })
  }
]

// Define tools
const hanzoTools: HanzoTool[] = [
  {
    name: 'calculator',
    description: 'Perform mathematical calculations',
    parameters: z.object({
      expression: z.string().describe('Mathematical expression to evaluate')
    }),
    execute: async ({ expression }) => {
      try {
        // In production, use a safe math library
        const result = Function('"use strict"; return (' + expression + ')')()
        return { result, expression }
      } catch (error) {
        return { error: 'Invalid expression', expression }
      }
    }
  },
  {
    name: 'getWeather',
    description: 'Get current weather for a city',
    parameters: z.object({
      city: z.string().describe('City name')
    }),
    execute: async ({ city }) => {
      // Mock weather data - in production, use a real weather API
      const mockWeather = {
        city,
        temperature: Math.floor(Math.random() * 30) + 50,
        conditions: ['Sunny', 'Cloudy', 'Rainy', 'Partly Cloudy'][Math.floor(Math.random() * 4)],
        icon: ['☀️', '☁️', '🌧️', '⛅'][Math.floor(Math.random() * 4)]
      }
      return mockWeather
    }
  },
  {
    name: 'generateData',
    description: 'Generate sample data for charts',
    parameters: z.object({
      count: z.number().min(1).max(20).describe('Number of data points'),
      min: z.number().describe('Minimum value'),
      max: z.number().describe('Maximum value')
    }),
    execute: async ({ count, min, max }) => {
      const data = Array.from({ length: count }, () => 
        Math.floor(Math.random() * (max - min + 1)) + min
      )
      return { data }
    }
  }
]

// Chat Message Component
function ChatMessage({ message }: { message: any }) {
  return (
    <div className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'} mb-4`}>
      <div className={`
        max-w-[80%] p-3 rounded-lg
        ${message.role === 'user' 
          ? 'bg-blue-500 text-white' 
          : 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100'}
      `}>
        {typeof message.content === 'string' ? (
          <p className="whitespace-pre-wrap">{message.content}</p>
        ) : (
          message.content
        )}
        {message.toolCalls && message.toolCalls.length > 0 && (
          <div className="mt-2 pt-2 border-t border-gray-200 dark:border-gray-700">
            <p className="text-xs opacity-70 mb-1">Tool calls:</p>
            {message.toolCalls.map((call: any) => (
              <div key={call.id} className="text-xs">
                <span className="font-mono">{call.name}</span>
                {call.status === 'completed' && call.result && (
                  <pre className="mt-1 p-1 bg-black/10 rounded text-xs">
                    {JSON.stringify(call.result, null, 2)}
                  </pre>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

// Thread Sidebar Component
function ThreadSidebar() {
  const { 
    threads, 
    activeThread, 
    createThread, 
    switchThread, 
    deleteThread 
  } = useThread()
  
  return (
    <div className="w-64 bg-gray-50 dark:bg-gray-900 p-4 border-r">
      <button
        onClick={() => {
          const thread = createThread({ name: `Chat ${Date.now()}` })
          switchThread(thread.id)
        }}
        className="w-full mb-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
      >
        New Chat
      </button>
      
      <div className="space-y-2">
        {Array.from(threads.values()).map(thread => (
          <div
            key={thread.id}
            className={`
              p-2 rounded cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-800
              ${activeThread?.id === thread.id ? 'bg-gray-200 dark:bg-gray-800' : ''}
            `}
            onClick={() => switchThread(thread.id)}
          >
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium truncate">
                {thread.metadata?.name || 'Untitled'}
              </span>
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  deleteThread(thread.id)
                }}
                className="text-red-500 hover:text-red-700"
              >
                ×
              </button>
            </div>
            <p className="text-xs text-gray-500">
              {thread.messages.length} messages
            </p>
          </div>
        ))}
      </div>
    </div>
  )
}

// Suggestions Component
function SuggestionsBar() {
  const { suggestions, acceptSuggestion } = useSuggestions({
    maxSuggestions: 4,
    autoRefresh: true
  })
  
  if (suggestions.length === 0) return null
  
  return (
    <div className="flex gap-2 mb-4 flex-wrap">
      {suggestions.map(suggestion => (
        <button
          key={suggestion.id}
          onClick={() => acceptSuggestion(suggestion)}
          className="px-3 py-1 text-sm bg-gray-100 dark:bg-gray-800 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700"
        >
          {suggestion.text}
        </button>
      ))}
    </div>
  )
}

// Main Chat Interface Component
function ChatInterface() {
  const [input, setInput] = useState('')
  const [streamingMode, setStreamingMode] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  
  const { activeThread } = useThread()
  const { sendMessage, isLoading: isSending } = useMessage()
  const { streamMessage, currentMessage, isStreaming, progress } = useStreaming()
  
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }
  
  useEffect(() => {
    scrollToBottom()
  }, [activeThread?.messages, currentMessage])
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || isSending || isStreaming) return
    
    const message = input
    setInput('')
    
    if (streamingMode) {
      await streamMessage(message)
    } else {
      await sendMessage(message)
    }
  }
  
  return (
    <div className="flex-1 flex flex-col">
      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4">
        {activeThread?.messages.map(message => (
          <ChatMessage key={message.id} message={message} />
        ))}
        
        {/* Streaming message */}
        {isStreaming && currentMessage && (
          <div className="flex justify-start mb-4">
            <div className="max-w-[80%] p-3 rounded-lg bg-gray-100 dark:bg-gray-800">
              <p className="whitespace-pre-wrap">{currentMessage}</p>
              <div className="mt-2">
                <progress 
                  value={progress} 
                  max={100} 
                  className="w-full h-1"
                />
              </div>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>
      
      {/* Input Area */}
      <div className="border-t p-4">
        <SuggestionsBar />
        
        <form onSubmit={handleSubmit} className="flex gap-2">
          <div className="flex items-center gap-2">
            <label className="flex items-center gap-1">
              <input
                type="checkbox"
                checked={streamingMode}
                onChange={(e) => setStreamingMode(e.target.checked)}
                className="rounded"
              />
              <span className="text-sm">Stream</span>
            </label>
          </div>
          
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type your message..."
            disabled={isSending || isStreaming}
            className="flex-1 px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800"
          />
          
          <button
            type="submit"
            disabled={!input.trim() || isSending || isStreaming}
            className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSending || isStreaming ? 'Sending...' : 'Send'}
          </button>
        </form>
        
        <p className="text-xs text-gray-500 mt-2">
          Try: "What's the weather?", "Calculate 2+2", or "Show me a chart"
        </p>
      </div>
    </div>
  )
}

// Auth Wrapper Component
function AuthWrapper({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, signIn, user } = useAuth()
  
  // For demo purposes, we'll skip auth
  const isDemoMode = true
  
  if (isDemoMode || isAuthenticated) {
    return (
      <>
        {user && (
          <div className="bg-green-50 dark:bg-green-950 p-2 text-center text-sm">
            Signed in as {user.name}
          </div>
        )}
        {children}
      </>
    )
  }
  
  return (
    <div className="flex items-center justify-center h-screen">
      <div className="text-center">
        <h1 className="text-2xl font-bold mb-4">Sign in to Hanzo Chat</h1>
        <button
          onClick={() => signIn({ provider: 'google' })}
          className="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
        >
          Sign in with Google
        </button>
      </div>
    </div>
  )
}

// Main App Component
export default function HanzoChatApp() {
  return (
    <HanzoProvider
      apiKey={process.env.NEXT_PUBLIC_HANZO_API_KEY || 'demo-key'}
      apiUrl={process.env.NEXT_PUBLIC_HANZO_API_URL || 'https://api.hanzo.ai/v1'}
      model="gpt-4-turbo-preview"
      components={hanzoComponents}
      tools={hanzoTools}
      enableStreaming={true}
      enableMCP={true}
      initialMessages={[
        {
          id: 'welcome',
          role: 'assistant',
          content: 'Welcome to Hanzo Chat! I can help you with weather, calculations, and data visualization. Try asking me about the weather or to create a chart!',
          timestamp: new Date(),
          threadId: 'default'
        }
      ]}
      onError={(error) => {
        console.error('Hanzo Error:', error)
      }}
    >
      <AuthWrapper>
        <div className="h-screen flex">
          <ThreadSidebar />
          <ChatInterface />
        </div>
      </AuthWrapper>
    </HanzoProvider>
  )
}