"use client"

import { useState, useCallback, useRef, useEffect } from 'react'
import { useHanzo } from '../components/HanzoProvider'
import type { Message } from '../components/HanzoProvider'

export interface UseStreamingOptions {
  threadId?: string
  onChunk?: (chunk: string) => void
  onComplete?: (message: Message) => void
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
  progress: number // 0-100
}

export function useStreaming(options: UseStreamingOptions = {}): UseStreamingReturn {
  const {
    threadId,
    onChunk,
    onComplete,
    onError,
    bufferSize = 1,
    throttleMs = 0
  } = options
  
  const { streamMessage: streamFromAPI, activeThreadId, isStreaming: globalStreaming } = useHanzo()
  const [isStreaming, setIsStreaming] = useState(false)
  const [currentMessage, setCurrentMessage] = useState('')
  const [error, setError] = useState<Error | null>(null)
  const [progress, setProgress] = useState(0)
  const abortControllerRef = useRef<AbortController | null>(null)
  const bufferRef = useRef<string[]>([])
  const lastUpdateRef = useRef<number>(Date.now())
  
  const streamMessage = useCallback(async (content: string): Promise<void> => {
    setIsStreaming(true)
    setError(null)
    setCurrentMessage('')
    setProgress(0)
    bufferRef.current = []
    
    // Create abort controller
    abortControllerRef.current = new AbortController()
    
    try {
      const targetThread = threadId || activeThreadId
      if (!targetThread) {
        throw new Error('No thread available')
      }
      
      const stream = streamFromAPI(content, targetThread)
      let totalChunks = 0
      let estimatedTotal = 100 // Start with estimate, will adjust
      
      for await (const message of stream) {
        if (abortControllerRef.current?.signal.aborted) {
          break
        }
        
        totalChunks++
        
        // Extract string content from message
        const chunk = typeof message.content === 'string' ? message.content : ''
        
        // Buffer management
        bufferRef.current.push(chunk)
        
        // Throttling
        const now = Date.now()
        const shouldUpdate = (
          bufferRef.current.length >= bufferSize ||
          (throttleMs > 0 && now - lastUpdateRef.current >= throttleMs)
        )
        
        if (shouldUpdate) {
          const bufferedContent = bufferRef.current.join('')
          setCurrentMessage(prev => prev + bufferedContent)
          onChunk?.(bufferedContent)
          bufferRef.current = []
          lastUpdateRef.current = now
        }
        
        // Update progress (estimate based on typical response length)
        const estimatedProgress = Math.min(95, (totalChunks / estimatedTotal) * 100)
        setProgress(estimatedProgress)
        
        // Adjust estimate based on response speed
        if (totalChunks > 10 && totalChunks % 10 === 0) {
          estimatedTotal = Math.max(estimatedTotal, totalChunks * 1.5)
        }
      }
      
      // Flush remaining buffer
      if (bufferRef.current.length > 0) {
        const remainingContent = bufferRef.current.join('')
        setCurrentMessage(prev => prev + remainingContent)
        onChunk?.(remainingContent)
        bufferRef.current = []
      }
      
      setProgress(100)
      
      // Create complete message
      const completeMessage: Message = {
        id: `stream-${Date.now()}`,
        role: 'assistant',
        content: currentMessage,
        timestamp: new Date(),
        threadId: targetThread
      }
      
      onComplete?.(completeMessage)
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Streaming failed')
      setError(error)
      onError?.(error)
    } finally {
      setIsStreaming(false)
      abortControllerRef.current = null
    }
  }, [streamFromAPI, threadId, activeThreadId, onChunk, onComplete, onError, bufferSize, throttleMs, currentMessage])
  
  const stopStreaming = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
      setIsStreaming(false)
    }
  }, [])
  
  const clearMessage = useCallback(() => {
    setCurrentMessage('')
    setProgress(0)
  }, [])
  
  // Sync with global streaming state
  useEffect(() => {
    if (!globalStreaming && isStreaming) {
      setIsStreaming(false)
    }
  }, [globalStreaming, isStreaming])
  
  return {
    streamMessage,
    isStreaming,
    currentMessage,
    error,
    stopStreaming,
    clearMessage,
    progress
  }
}