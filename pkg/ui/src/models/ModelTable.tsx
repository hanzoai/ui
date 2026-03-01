'use client'

import type { ZenModelLike } from './types'

function fmtCtx(ctx: number | undefined): string {
  if (!ctx) return '—'
  if (ctx >= 1_000_000) return `${(ctx / 1_000_000).toFixed(ctx % 1_000_000 === 0 ? 0 : 1)}M`
  if (ctx >= 1000) return `${Math.round(ctx / 1000)}K`
  return `${ctx}`
}

function fmtPrice(p: number | null | undefined): string {
  if (p == null) return '—'
  return `$${p.toFixed(2)}`
}

function StatusBadge({ status }: { status: string }) {
  if (status === 'preview' || status === 'coming-soon') {
    return (
      <span className="ml-1 text-[9px] font-semibold tracking-wider uppercase bg-amber-500/20 text-amber-600 dark:text-amber-400 px-1.5 py-0.5 rounded-full align-middle">
        {status === 'preview' ? 'PREVIEW' : 'SOON'}
      </span>
    )
  }
  if (status === 'contact-sales') {
    return (
      <span className="ml-1 text-[9px] font-semibold tracking-wider uppercase bg-purple-500/20 text-purple-600 dark:text-purple-400 px-1.5 py-0.5 rounded-full align-middle">
        EARLY ACCESS
      </span>
    )
  }
  return null
}

export interface ModelTableProps {
  models: ZenModelLike[]
  /** URL prefix for model links. Default: /docs/models/ */
  linkPrefix?: string
  showParams?: boolean
  showArch?: boolean
  showContext?: boolean
  showPricing?: boolean
}

/**
 * ModelTable — Static table view of models with clickable links.
 * Works in docs, marketing pages, dashboards.
 */
export function ModelTable({
  models,
  linkPrefix = '/docs/models/',
  showParams = true,
  showArch = false,
  showContext = true,
  showPricing = true,
}: ModelTableProps) {
  return (
    <div className="overflow-x-auto my-4">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border text-left">
            <th className="pb-2 pr-4 font-medium">Model</th>
            {showParams && <th className="pb-2 pr-4 font-medium">Parameters</th>}
            {showArch && <th className="pb-2 pr-4 font-medium">Architecture</th>}
            {showContext && <th className="pb-2 pr-4 font-medium">Context</th>}
            {showPricing && <th className="pb-2 pr-4 font-medium text-right">Input $/1M</th>}
            {showPricing && <th className="pb-2 font-medium text-right">Output $/1M</th>}
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {models.map((m) => (
            <tr key={m.id}>
              <td className="py-2 pr-4">
                <a
                  href={`${linkPrefix}${m.id}`}
                  className="font-mono text-primary hover:underline text-sm"
                >
                  {m.id}
                </a>
                <StatusBadge status={m.status} />
              </td>
              {showParams && (
                <td className="py-2 pr-4 text-sm text-muted-foreground">
                  {m.spec.params && !['N/A', 'TBA', 'TBD'].includes(m.spec.params)
                    ? m.spec.params
                    : '—'}
                  {m.spec.activeParams ? ` (${m.spec.activeParams} active)` : ''}
                </td>
              )}
              {showArch && (
                <td className="py-2 pr-4 text-sm text-muted-foreground">
                  {m.spec.arch ?? '—'}
                </td>
              )}
              {showContext && (
                <td className="py-2 pr-4 text-sm text-muted-foreground">
                  {fmtCtx(m.spec.context)}
                </td>
              )}
              {showPricing && (
                <td className="py-2 pr-4 text-sm text-right font-mono">
                  {fmtPrice(m.pricing?.input)}
                </td>
              )}
              {showPricing && (
                <td className="py-2 text-sm text-right font-mono">
                  {fmtPrice(m.pricing?.output)}
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export default ModelTable
