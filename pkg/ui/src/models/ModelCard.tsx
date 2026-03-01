'use client'

import { ExternalLink, MessageSquare, Github, FileText } from 'lucide-react'
import type { ZenModelLike } from './types'

function fmtCtx(ctx: number | undefined): string {
  if (!ctx) return ''
  if (ctx >= 1_000_000) return `${(ctx / 1_000_000).toFixed(ctx % 1_000_000 === 0 ? 0 : 1)}M ctx`
  if (ctx >= 1000) return `${Math.round(ctx / 1000)}K ctx`
  return `${ctx} ctx`
}

function statusInfo(status: string): {
  label: string
  className: string
} | null {
  switch (status) {
    case 'preview':
      return {
        label: 'PREVIEW',
        className: 'bg-amber-500/20 text-amber-600 dark:text-amber-400',
      }
    case 'coming-soon':
      return {
        label: 'SOON',
        className: 'bg-muted text-muted-foreground',
      }
    case 'contact-sales':
      return {
        label: 'EARLY ACCESS',
        className: 'bg-purple-500/20 text-purple-600 dark:text-purple-400',
      }
    default:
      return null
  }
}

function isFeaturedModel(id: string, featuredIds?: string[]): boolean {
  if (featuredIds) return featuredIds.includes(id)
  return ['zen4-max', 'zen-max', 'zen5', 'zen4'].includes(id)
}

export interface ModelCardProps {
  model: ZenModelLike
  /**
   * Called when the card is clicked.
   * If not provided, card is not clickable (no cursor-pointer).
   */
  onNavigate?: (id: string) => void
  /** URL prefix for model detail pages. Default: /docs/models/ */
  linkPrefix?: string
  /** Base URL for the "Chat" button. Default: https://hanzo.chat */
  chatBaseUrl?: string
  /** URL for "Request Access" (contact-sales models). Default: https://hanzo.ai/contact */
  requestAccessUrl?: string
  /** Model IDs to highlight as featured. Default: zen4-max, zen-max, zen5, zen4 */
  featuredIds?: string[]
}

/**
 * ModelCard — Rich model card with status badges, spec, and action buttons.
 *
 * Works in any Next.js / React app. Pass `onNavigate` to enable whole-card click.
 */
export function ModelCard({
  model,
  onNavigate,
  linkPrefix = '/docs/models/',
  chatBaseUrl = 'https://hanzo.chat',
  requestAccessUrl = 'https://hanzo.ai/contact',
  featuredIds,
}: ModelCardProps) {
  const status = model.status
  const featured = isFeaturedModel(model.id, featuredIds)
  const badge = statusInfo(status)

  const specParts = [
    model.spec.params && model.spec.params !== 'N/A' && model.spec.params !== 'TBA' && model.spec.params !== 'TBD'
      ? model.spec.params
      : null,
    model.spec.activeParams ? `(${model.spec.activeParams} active)` : null,
    model.spec.arch ?? null,
  ].filter(Boolean)

  const specStr = specParts.join(' ')
  const ctxStr = fmtCtx(model.spec.context)
  const fullSpec = [specStr, ctxStr].filter(Boolean).join(' · ')

  const cardBg =
    featured
      ? 'border-primary/30 bg-primary/5'
      : status === 'coming-soon'
        ? 'border-border bg-muted/30 opacity-75'
        : status === 'contact-sales'
          ? 'border-purple-500/20 bg-purple-500/5'
          : 'border-border bg-background'

  const isClickable = !!onNavigate
  const handleClick = () => onNavigate?.(model.id)
  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') handleClick()
  }

  return (
    <div
      role={isClickable ? 'link' : undefined}
      tabIndex={isClickable ? 0 : undefined}
      onClick={isClickable ? handleClick : undefined}
      onKeyDown={isClickable ? handleKey : undefined}
      className={`rounded-lg border p-4 transition hover:border-primary/40 ${cardBg} ${isClickable ? 'cursor-pointer' : ''}`}
    >
      {/* Header */}
      <div className="flex items-center gap-2 mb-1">
        <span className="font-semibold text-sm">{model.id}</span>
        {badge && (
          <span className={`text-[9px] font-semibold tracking-wider uppercase px-1.5 py-0.5 rounded-full ${badge.className}`}>
            {badge.label}
          </span>
        )}
      </div>

      {/* Spec */}
      {fullSpec && (
        <div className="text-xs font-mono text-muted-foreground mb-2">{fullSpec}</div>
      )}

      {/* Description */}
      <p className="text-xs text-muted-foreground mb-3">{model.description}</p>

      {/* Action buttons */}
      <div className="flex flex-wrap gap-1.5 mt-auto">
        {status === 'contact-sales' && (
          <a
            href={requestAccessUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => { e.stopPropagation() }}
            className="inline-flex items-center gap-1 text-xs bg-purple-500/20 text-purple-400 border border-purple-500/30 px-2 py-0.5 rounded hover:bg-purple-500/30 transition"
          >
            <ExternalLink className="h-2.5 w-2.5" /> Request Access
          </a>
        )}
        {(status === 'available' || status === 'preview' || status === 'cloud-only') && (
          <a
            href={`${chatBaseUrl}?model=${model.id}`}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => { e.stopPropagation() }}
            className="inline-flex items-center gap-1 text-xs bg-primary text-primary-foreground px-2 py-0.5 rounded hover:opacity-90 transition"
          >
            <MessageSquare className="h-2.5 w-2.5" /> Chat
          </a>
        )}
        {model.huggingface && (
          <a
            href={model.huggingface}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => { e.stopPropagation() }}
            className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
          >
            <ExternalLink className="h-2.5 w-2.5" /> Weights
          </a>
        )}
        {model.github && (
          <a
            href={model.github}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => { e.stopPropagation() }}
            className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:underline"
          >
            <Github className="h-2.5 w-2.5" /> Repo
          </a>
        )}
        {model.paper && (
          <a
            href={model.paper}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => { e.stopPropagation() }}
            className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:underline"
          >
            <FileText className="h-2.5 w-2.5" /> Paper
          </a>
        )}
      </div>
    </div>
  )
}

export default ModelCard
