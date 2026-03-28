/**
 * POST /api/chat — AI chat about UI components.
 *
 * Uses Hanzo AI (zen-coder-flash) to answer questions about
 * Hanzo UI components, props, patterns, and composition.
 * Compatible with Vercel AI SDK useChat hook.
 */

import { createOpenAICompatible } from '@ai-sdk/openai-compatible'
import { streamText } from 'ai'

const SYSTEM_PROMPT = `You are the Hanzo UI assistant — an expert on the Hanzo UI component library.

Hanzo UI is a React component library built on Radix UI primitives and Tailwind CSS.
It includes 90+ components (buttons, dialogs, forms, charts, navigation, etc.) plus
higher-level blocks for AI apps, commerce, dashboards, and more.

When answering:
- Reference specific component names and their props
- Show code examples with proper imports from @hanzo/ui
- Explain composition patterns (how components work together)
- Mention dependencies (Radix, Tailwind variants) when relevant
- Be concise and practical — developers want working code`

export async function POST(req: Request) {
  const apiKey = process.env.HANZO_API_KEY ?? process.env.LLM_API_KEY
  if (!apiKey) {
    return new Response(
      JSON.stringify({ error: 'AI chat is not configured. Set HANZO_API_KEY.' }),
      { status: 503, headers: { 'Content-Type': 'application/json' } },
    )
  }

  const { messages } = await req.json()

  const provider = createOpenAICompatible({
    name: 'hanzo',
    baseURL: 'https://api.hanzo.ai/v1',
    apiKey,
  })

  const result = streamText({
    model: provider.chatModel('zen-coder-flash'),
    system: SYSTEM_PROMPT,
    messages,
  })

  return result.toUIMessageStreamResponse()
}
