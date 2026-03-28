/**
 * Hanzo Cloud search configuration for ui.hanzo.ai
 *
 * Uses the same infrastructure as docs.hanzo.ai:
 * - Meilisearch for fulltext search
 * - Qdrant for vector/semantic search
 * - Hanzo Cloud API for RAG chat
 */

export const searchBackend =
  (process.env.NEXT_PUBLIC_HANZO_SEARCH_BACKEND as 'cloud' | 'meilisearch' | undefined) ??
  'cloud'

export const searchEndpoint =
  process.env.NEXT_PUBLIC_HANZO_SEARCH_ENDPOINT ??
  'https://cloud-api.hanzo.ai/api/search-docs'

export const searchIndex =
  process.env.NEXT_PUBLIC_HANZO_SEARCH_INDEX ?? 'app-ui-hanzo-ai'

export const indexEndpoint =
  process.env.HANZO_SEARCH_INDEX_ENDPOINT ??
  'https://cloud-api.hanzo.ai/api/index-docs'

export const chatEndpoint =
  process.env.NEXT_PUBLIC_HANZO_CHAT_ENDPOINT ??
  'https://cloud-api.hanzo.ai/api/chat-docs'

export const publishableKey =
  process.env.NEXT_PUBLIC_HANZO_SEARCH_KEY ?? 'pk-hanzo-ui-search-2026'

export const adminKey =
  process.env.HANZO_SEARCH_ADMIN_KEY ?? ''
