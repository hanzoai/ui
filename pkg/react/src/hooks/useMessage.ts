"use client"

import { useState, useCallback, useRef } from 'react'
import { useHanzo } from '../components/HanzoProvider'
import type { Message } from '../components/HanzoProvider'

export interface UseMessageOptions {
  threadId?: string
  onSuccess?: (message: Message) => void
  onError?: (error: Error) => void
  autoRetry?: boolean
  maxRetries?: number
  retryDelay?: number
}

export interface UseMessageReturn {
  sendMessage: (content: string) => Promise<Message>
  sendMessageWithAttachments: (content: string, attachments: File[]) => Promise<Message>
  isLoading: boolean
  error: Error | null
  lastMessage: Message | null
  clearError: () => void
  retry: () => Promise<void>
}

export function useMessage(options: UseMessageOptions = {}): UseMessageReturn {
  const {
    threadId,
    onSuccess,
    onError,
    autoRetry = false,
    maxRetries = 3,
    retryDelay = 1000
  } = options
  
  const { sendMessage: sendToAPI, activeThreadId } = useHanzo()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)
  const [lastMessage, setLastMessage] = useState<Message | null>(null)
  const lastContentRef = useRef<string>('')
  const retryCountRef = useRef(0)
  
  const sendMessage = useCallback(async (content: string): Promise<Message> => {
    setIsLoading(true)
    setError(null)
    lastContentRef.current = content
    retryCountRef.current = 0
    
    try {
      const targetThread = threadId || activeThreadId
      if (!targetThread) {
        throw new Error('No thread available')
      }
      
      const message = await sendToAPI(content, targetThread)
      setLastMessage(message)
      onSuccess?.(message)
      return message
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to send message')
      setError(error)
      onError?.(error)
      
      if (autoRetry && retryCountRef.current < maxRetries) {
        retryCountRef.current++
        setTimeout(() => retry(), retryDelay * retryCountRef.current)
      }
      
      throw error
    } finally {
      setIsLoading(false)
    }
  }, [sendToAPI, threadId, activeThreadId, onSuccess, onError, autoRetry, maxRetries, retryDelay])
  
  const sendMessageWithAttachments = useCallback(async (
    content: string, 
    attachments: File[]
  ): Promise<Message> => {
    // TODO: Implement file upload and attachment handling
    // For now, we'll just append file names to the content
    const attachmentInfo = attachments.map(f => `[Attached: ${f.name}]`).join(' ')
    const enrichedContent = `${content}\n${attachmentInfo}`
    return sendMessage(enrichedContent)
  }, [sendMessage])
  
  const clearError = useCallback(() => {
    setError(null)
  }, [])
  
  const retry = useCallback(async () => {
    if (lastContentRef.current) {
      await sendMessage(lastContentRef.current)
    }
  }, [sendMessage])
  
  return {
    sendMessage,
    sendMessageWithAttachments,
    isLoading,
    error,
    lastMessage,
    clearError,
    retry
  }
}