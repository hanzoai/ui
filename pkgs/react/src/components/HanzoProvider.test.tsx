import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import React from 'react'
import { HanzoProvider, useHanzo } from './HanzoProvider'
import { z } from 'zod'

// Mock fetch
global.fetch = vi.fn()

describe('HanzoProvider', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })
  
  it('should provide context to children', () => {
    const TestComponent = () => {
      const context = useHanzo()
      return <div>Context: {context ? 'Available' : 'Not Available'}</div>
    }
    
    render(
      <HanzoProvider apiKey="test-key">
        <TestComponent />
      </HanzoProvider>
    )
    
    expect(screen.getByText('Context: Available')).toBeInTheDocument()
  })
  
  it('should throw error when useHanzo is used outside provider', () => {
    const TestComponent = () => {
      const context = useHanzo()
      return <div>{context}</div>
    }
    
    // Suppress console.error for this test
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {})
    
    expect(() => render(<TestComponent />)).toThrow(
      'useHanzo must be used within HanzoProvider'
    )
    
    spy.mockRestore()
  })
  
  it('should initialize with default thread', async () => {
    const TestComponent = () => {
      const { threads, activeThreadId } = useHanzo()
      return (
        <div>
          <div>Threads: {threads.size}</div>
          <div>Active: {activeThreadId || 'none'}</div>
        </div>
      )
    }
    
    render(
      <HanzoProvider apiKey="test-key">
        <TestComponent />
      </HanzoProvider>
    )
    
    await waitFor(() => {
      expect(screen.getByText(/Threads: 1/)).toBeInTheDocument()
      expect(screen.getByText(/Active: /)).toBeInTheDocument()
    })
  })
  
  it('should register components', () => {
    const TestComponent = () => <div>Test Component</div>
    const components = [
      {
        name: 'test',
        component: TestComponent,
        description: 'Test component'
      }
    ]
    
    const ConsumerComponent = () => {
      const { components: registeredComponents } = useHanzo()
      return <div>Components: {registeredComponents.size}</div>
    }
    
    render(
      <HanzoProvider apiKey="test-key" components={components}>
        <ConsumerComponent />
      </HanzoProvider>
    )
    
    expect(screen.getByText('Components: 1')).toBeInTheDocument()
  })
  
  it('should register tools', () => {
    const tools = [
      {
        name: 'calculator',
        description: 'Calculate math',
        parameters: z.object({ expression: z.string() }),
        execute: async ({ expression }: any) => ({ result: eval(expression) })
      }
    ]
    
    const ConsumerComponent = () => {
      const { tools: registeredTools } = useHanzo()
      return <div>Tools: {registeredTools.size}</div>
    }
    
    render(
      <HanzoProvider apiKey="test-key" tools={tools}>
        <ConsumerComponent />
      </HanzoProvider>
    )
    
    expect(screen.getByText('Tools: 1')).toBeInTheDocument()
  })
  
  it('should send message to API', async () => {
    const mockResponse = {
      choices: [{
        message: {
          content: 'AI response'
        }
      }]
    }
    
    ;(global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse
    })
    
    const TestComponent = () => {
      const { sendMessage } = useHanzo()
      const [response, setResponse] = React.useState<any>(null)
      
      const handleSend = async () => {
        const msg = await sendMessage('Hello')
        setResponse(msg)
      }
      
      return (
        <div>
          <button onClick={handleSend}>Send</button>
          {response && <div>Response: {response.content}</div>}
        </div>
      )
    }
    
    render(
      <HanzoProvider apiKey="test-key">
        <TestComponent />
      </HanzoProvider>
    )
    
    const button = screen.getByText('Send')
    await userEvent.click(button)
    
    await waitFor(() => {
      expect(screen.getByText('Response: AI response')).toBeInTheDocument()
    })
    
    expect(global.fetch).toHaveBeenCalledWith(
      'https://api.hanzo.ai/v1/chat/completions',
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({
          'Content-Type': 'application/json',
          'Authorization': 'Bearer test-key'
        })
      })
    )
  })
  
  it('should handle API errors', async () => {
    ;(global.fetch as any).mockRejectedValueOnce(new Error('Network error'))
    
    const onError = vi.fn()
    
    const TestComponent = () => {
      const { sendMessage } = useHanzo()
      const [error, setError] = React.useState<any>(null)
      
      const handleSend = async () => {
        try {
          await sendMessage('Hello')
        } catch (err) {
          setError(err)
        }
      }
      
      return (
        <div>
          <button onClick={handleSend}>Send</button>
          {error && <div>Error: {error.message}</div>}
        </div>
      )
    }
    
    render(
      <HanzoProvider apiKey="test-key" onError={onError}>
        <TestComponent />
      </HanzoProvider>
    )
    
    const button = screen.getByText('Send')
    await userEvent.click(button)
    
    await waitFor(() => {
      expect(screen.getByText('Error: Network error')).toBeInTheDocument()
    })
    
    expect(onError).toHaveBeenCalledWith(expect.any(Error))
  })
  
  it('should execute tools', async () => {
    const mockExecute = vi.fn().mockResolvedValue({ result: 42 })
    
    const tools = [
      {
        name: 'calculator',
        description: 'Calculate',
        parameters: z.object({ expression: z.string() }),
        execute: mockExecute
      }
    ]
    
    const TestComponent = () => {
      const { executeTool } = useHanzo()
      const [result, setResult] = React.useState<any>(null)
      
      const handleExecute = async () => {
        const res = await executeTool('calculator', { expression: '2+2' })
        setResult(res)
      }
      
      return (
        <div>
          <button onClick={handleExecute}>Execute</button>
          {result && <div>Result: {result.result}</div>}
        </div>
      )
    }
    
    render(
      <HanzoProvider apiKey="test-key" tools={tools}>
        <TestComponent />
      </HanzoProvider>
    )
    
    const button = screen.getByText('Execute')
    await userEvent.click(button)
    
    await waitFor(() => {
      expect(screen.getByText('Result: 42')).toBeInTheDocument()
    })
    
    expect(mockExecute).toHaveBeenCalledWith({ expression: '2+2' })
  })
  
  it('should render components dynamically', () => {
    const CustomComponent = ({ text }: { text: string }) => (
      <div>Custom: {text}</div>
    )
    
    const components = [
      {
        name: 'custom',
        component: CustomComponent,
        description: 'Custom component'
      }
    ]
    
    const TestComponent = () => {
      const { renderComponent } = useHanzo()
      const rendered = renderComponent('custom', { text: 'Hello' })
      
      return <div>{rendered}</div>
    }
    
    render(
      <HanzoProvider apiKey="test-key" components={components}>
        <TestComponent />
      </HanzoProvider>
    )
    
    expect(screen.getByText('Custom: Hello')).toBeInTheDocument()
  })
  
  it('should manage thread operations', async () => {
    const TestComponent = () => {
      const { 
        threads, 
        createThread, 
        switchThread, 
        deleteThread,
        activeThreadId 
      } = useHanzo()
      
      const handleCreate = () => {
        const thread = createThread({ name: 'New Thread' })
        switchThread(thread.id)
      }
      
      const handleDelete = () => {
        if (activeThreadId) {
          deleteThread(activeThreadId)
        }
      }
      
      return (
        <div>
          <div>Thread Count: {threads.size}</div>
          <button onClick={handleCreate}>Create Thread</button>
          <button onClick={handleDelete}>Delete Thread</button>
        </div>
      )
    }
    
    render(
      <HanzoProvider apiKey="test-key">
        <TestComponent />
      </HanzoProvider>
    )
    
    // Initially should have 1 thread
    await waitFor(() => {
      expect(screen.getByText('Thread Count: 1')).toBeInTheDocument()
    })
    
    // Create a new thread
    const createButton = screen.getByText('Create Thread')
    await userEvent.click(createButton)
    
    await waitFor(() => {
      expect(screen.getByText('Thread Count: 2')).toBeInTheDocument()
    })
    
    // Delete current thread
    const deleteButton = screen.getByText('Delete Thread')
    await userEvent.click(deleteButton)
    
    await waitFor(() => {
      expect(screen.getByText('Thread Count: 1')).toBeInTheDocument()
    })
  })
})