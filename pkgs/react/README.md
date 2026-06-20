# @hanzo/react

React package for building AI-powered applications with generative UI, where users interact through natural language.

## Features

- 🤖 **Generative UI** - Dynamically render React components in AI responses
- 🔄 **Real-time Streaming** - Stream AI responses with progress tracking
- 💬 **Message Threads** - Manage conversation history and context
- 🛠️ **Tool Calling** - Let AI execute functions during conversations
- 🔌 **Model Context Protocol** - MCP integration for enhanced AI capabilities
- 🎨 **Component Registry** - Register custom components for AI to use
- 🔐 **Authentication** - Built-in auth support for user management
- 📎 **File Attachments** - Handle images, documents, and other files
- 💡 **Smart Suggestions** - Provide contextual suggestions to users
- ⚡ **TypeScript Support** - Full type safety and IntelliSense

## Installation

```bash
npm install @hanzo/react
# or
pnpm add @hanzo/react
# or
yarn add @hanzo/react
```

## Quick Start

```tsx
import { HanzoProvider, useMessage } from '@hanzo/react'

function App() {
  return (
    <HanzoProvider apiKey={process.env.HANZO_API_KEY}>
      <ChatInterface />
    </HanzoProvider>
  )
}

function ChatInterface() {
  const { sendMessage, isLoading, lastMessage } = useMessage()
  
  const handleSubmit = async (text: string) => {
    const response = await sendMessage(text)
    console.log('AI Response:', response)
  }
  
  return (
    <div>
      <input onKeyDown={(e) => {
        if (e.key === 'Enter') {
          handleSubmit(e.currentTarget.value)
        }
      }} />
      {isLoading && <p>Loading...</p>}
      {lastMessage && <div>{lastMessage.content}</div>}
    </div>
  )
}
```

## Core Concepts

### HanzoProvider

The root component that provides Hanzo context to your app:

```tsx
<HanzoProvider
  apiKey="your-api-key"
  apiUrl="https://api.hanzo.ai/v1"
  model="gpt-4-turbo-preview"
  components={[/* your components */]}
  tools={[/* your tools */]}
  enableStreaming={true}
  enableMCP={true}
  onMessage={(message) => console.log('New message:', message)}
  onError={(error) => console.error('Error:', error)}
>
  <YourApp />
</HanzoProvider>
```

### Generative UI Components

Register components that AI can dynamically render:

```tsx
const components = [
  {
    name: 'weather-card',
    component: WeatherCard,
    description: 'Display weather information',
    parameters: z.object({
      city: z.string(),
      temperature: z.number(),
      conditions: z.string()
    })
  }
]

<HanzoProvider components={components}>
  {/* AI can now render WeatherCard in responses */}
</HanzoProvider>
```

### Message Hooks

Send messages and handle responses:

```tsx
// Basic messaging
const { sendMessage, isLoading, error } = useMessage()

// Streaming responses
const { streamMessage, currentMessage, progress } = useStreaming()

// Thread management
const { threads, activeThread, createThread, switchThread } = useThread()
```

### Tool Calling

Add tools that AI can execute:

```tsx
const tools = [
  {
    name: 'calculator',
    description: 'Perform calculations',
    parameters: z.object({
      expression: z.string()
    }),
    execute: async ({ expression }) => {
      return { result: eval(expression) }
    }
  }
]

<HanzoProvider tools={tools}>
  {/* AI can now use the calculator tool */}
</HanzoProvider>
```

## Available Hooks

### Core Hooks
- `useHanzo()` - Access complete Hanzo context
- `useMessage()` - Send messages and manage state
- `useStreaming()` - Stream AI responses in real-time
- `useThread()` - Manage conversation threads

### Component & Tool Hooks
- `useComponent()` - Dynamically register/render components
- `useTool()` - Execute and manage AI tools
- `useGenerativeUI()` - Generate UI components on the fly

### Utility Hooks
- `useSuggestions()` - Provide intelligent suggestions
- `useModelConfig()` - Configure and switch AI models
- `useAttachments()` - Handle file attachments
- `useAuth()` - Manage user authentication
- `useMCP()` - Model Context Protocol integration

## Examples

### Chat Application

```tsx
import { HanzoProvider, useMessage, useStreaming } from '@hanzo/react'

function ChatApp() {
  const [messages, setMessages] = useState([])
  const { sendMessage } = useMessage()
  const { streamMessage, currentMessage, isStreaming } = useStreaming()
  
  const handleSend = async (text: string) => {
    // Add user message
    setMessages(prev => [...prev, { role: 'user', content: text }])
    
    // Stream AI response
    await streamMessage(text)
    
    // Add AI message when complete
    setMessages(prev => [...prev, { 
      role: 'assistant', 
      content: currentMessage 
    }])
  }
  
  return (
    <div>
      {messages.map((msg, i) => (
        <div key={i} className={msg.role}>
          {msg.content}
        </div>
      ))}
      {isStreaming && <div>{currentMessage}</div>}
    </div>
  )
}
```

### Custom Components

```tsx
// Define a custom visualization component
function DataChart({ data, type }) {
  return <Chart data={data} type={type} />
}

// Register it with Hanzo
const components = [
  {
    name: 'data-chart',
    component: DataChart,
    description: 'Visualize data in a chart',
    parameters: z.object({
      data: z.array(z.number()),
      type: z.enum(['bar', 'line', 'pie'])
    })
  }
]

// Use in your app
<HanzoProvider components={components}>
  <ChatInterface />
</HanzoProvider>
```

### Tool Integration

```tsx
const tools = [
  {
    name: 'fetchData',
    description: 'Fetch data from API',
    parameters: z.object({
      endpoint: z.string().url()
    }),
    execute: async ({ endpoint }) => {
      const response = await fetch(endpoint)
      return response.json()
    }
  },
  {
    name: 'saveToDatabase',
    description: 'Save data to database',
    parameters: z.object({
      collection: z.string(),
      data: z.any()
    }),
    execute: async ({ collection, data }) => {
      await db.collection(collection).insert(data)
      return { success: true }
    }
  }
]

<HanzoProvider tools={tools}>
  {/* AI can now fetch data and save to database */}
</HanzoProvider>
```

## TypeScript

Full TypeScript support with type definitions:

```tsx
import type { 
  HanzoComponent, 
  HanzoTool, 
  Message, 
  Thread 
} from '@hanzo/react'

const component: HanzoComponent = {
  name: 'my-component',
  component: MyComponent,
  description: 'A typed component',
  parameters: z.object({
    title: z.string(),
    count: z.number()
  })
}

const tool: HanzoTool = {
  name: 'my-tool',
  description: 'A typed tool',
  parameters: z.object({
    input: z.string()
  }),
  execute: async ({ input }) => {
    return { processed: input.toUpperCase() }
  }
}
```

## API Reference

### HanzoProvider Props

| Prop | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| `apiKey` | `string` | Yes | - | Your Hanzo API key |
| `apiUrl` | `string` | No | `https://api.hanzo.ai/v1` | API endpoint URL |
| `model` | `string` | No | `gpt-4-turbo-preview` | AI model to use |
| `components` | `HanzoComponent[]` | No | `[]` | Registered components |
| `tools` | `HanzoTool[]` | No | `[]` | Available tools |
| `initialMessages` | `Message[]` | No | `[]` | Initial conversation |
| `enableStreaming` | `boolean` | No | `true` | Enable streaming |
| `enableMCP` | `boolean` | No | `false` | Enable MCP |
| `onMessage` | `(message: Message) => void` | No | - | Message callback |
| `onError` | `(error: Error) => void` | No | - | Error callback |

### Hook Options

Most hooks accept configuration options:

```tsx
const { sendMessage } = useMessage({
  threadId: 'custom-thread',
  onSuccess: (message) => console.log('Sent:', message),
  onError: (error) => console.error('Error:', error),
  autoRetry: true,
  maxRetries: 3,
  retryDelay: 1000
})

const { streamMessage } = useStreaming({
  onChunk: (chunk) => console.log('Chunk:', chunk),
  onComplete: (message) => console.log('Complete:', message),
  bufferSize: 5,
  throttleMs: 100
})
```

## License

BSD-3-Clause © Hanzo AI, Inc.

## Support

- Documentation: [https://ui.hanzo.ai/docs/hanzo-react](https://ui.hanzo.ai/docs/hanzo-react)
- GitHub: [https://github.com/hanzoai/ui](https://github.com/hanzoai/ui)
- Discord: [https://discord.gg/hanzo](https://discord.gg/hanzo)