'use client'

import { useChat, type Message } from 'ai/react'
import * as React from 'react'

import { cn } from '../lib/utils'
import { ChatList } from './chat-list'
import { ChatPanel } from './chat-panel'
import { EmptyScreen } from './empty-screen'
import { ChatScrollAnchor } from './chat-scroll-anchor'
import { useLocalStorage } from '../lib/hooks/use-local-storage'
import {ScrollArea} from '@hanzo/ui/primitives'

import { useState, useEffect } from 'react'
import { toast } from 'react-hot-toast'

const IS_PREVIEW = process.env.VERCEL_ENV === 'preview'
export interface ChatProps extends React.ComponentProps<'div'> {
  initialMessages?: Message[]
  id?: string
}

export function Chat({ id, initialMessages, className }: ChatProps) {
  const [previewToken, setPreviewToken] = useLocalStorage<string | null>(
    'ai-token',
    null
  )
  const { messages, append, reload, stop, isLoading, input, setInput, setMessages } =
    useChat({
      initialMessages,
      id,
      body: {
        id,
        previewToken
      },
      onResponse(response) {
        if (response.status === 401) {
          toast.error(response.statusText)
        }
      }
    })

  useEffect(() => {
    if (messages.length) {
      console.log(messages);
    }
    setMessages(messages)

  }, [messages])



  return (
    <div className="relative bg-background w-full border rounded-lg flex flex-col justify-between">
      <div
        className={cn(
          'pt-4 md:pt-10 overflow-y-auto h-full',
          className
        )}
      >
        {messages.length ? (
          <div className="min-h-[60px] mx-auto max-w-2xl overflow-hidden h-full" >
            <ScrollArea className="border bg-[#18181a] p-8 h-full">
              <ChatList messages={messages} setMessages={setMessages} />
            </ScrollArea>
            <ChatScrollAnchor trackVisibility={isLoading} />
          </div>
        ) : (
          <EmptyScreen setInput={setInput} />
        )}
      </div>
      <ChatPanel
        id={id}
        isLoading={isLoading}
        stop={stop}
        append={append}
        reload={reload}
        messages={messages}
        input={input}
        setInput={setInput}
      />
    </div>
  )
}

export default Chat