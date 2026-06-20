'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  Atom, Code, Zap, Cpu, Eye, Shield, Search, Network,
  Mic, Video, Box, Sparkles, Brain, Rocket, Filter, Image,
} from 'lucide-react'
import { ModelCard } from './ModelCard'
import type { ZenModelLike, ModelFamilyLike } from './types'

const ICON_MAP: Record<string, React.ReactNode> = {
  Sparkles: <Sparkles className="h-5 w-5" />,
  Rocket: <Rocket className="h-5 w-5" />,
  Eye: <Eye className="h-5 w-5" />,
  Code: <Code className="h-5 w-5" />,
  Search: <Search className="h-5 w-5" />,
  Image: <Image className="h-5 w-5" />,
  Mic: <Mic className="h-5 w-5" />,
  Brain: <Brain className="h-5 w-5" />,
  Shield: <Shield className="h-5 w-5" />,
  Network: <Network className="h-5 w-5" />,
  Box: <Box className="h-5 w-5" />,
  Video: <Video className="h-5 w-5" />,
  Atom: <Atom className="h-5 w-5" />,
  Cpu: <Cpu className="h-5 w-5" />,
  Zap: <Zap className="h-5 w-5" />,
}

function isActiveStatus(status: string): boolean {
  return status === 'available' || status === 'contact-sales' || status === 'cloud-only'
}

export interface ModelFamilySectionProps {
  family: ModelFamilyLike
  models: ZenModelLike[]
  onNavigate?: (id: string) => void
  chatBaseUrl?: string
  requestAccessUrl?: string
  featuredIds?: string[]
}

export function ModelFamilySection({
  family,
  models,
  onNavigate,
  chatBaseUrl,
  requestAccessUrl,
  featuredIds,
}: ModelFamilySectionProps) {
  const icon = (family.icon && ICON_MAP[family.icon]) ?? <Atom className="h-5 w-5" />

  return (
    <div className="mb-12">
      <div className="flex items-center gap-3 mb-2">
        <div className="rounded-lg bg-muted p-2 text-primary">{icon}</div>
        <div>
          <h3 className="text-xl font-semibold">{family.name}</h3>
          <p className="text-sm text-muted-foreground">{family.description}</p>
        </div>
        <span className="ml-auto text-xs text-muted-foreground bg-muted px-2 py-1 rounded-full">
          {models.length} model{models.length !== 1 ? 's' : ''}
        </span>
      </div>
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3 mt-4">
        {models.map((m) => (
          <ModelCard
            key={m.id}
            model={m}
            onNavigate={onNavigate}
            chatBaseUrl={chatBaseUrl}
            requestAccessUrl={requestAccessUrl}
            featuredIds={featuredIds}
          />
        ))}
      </div>
    </div>
  )
}

export interface ModelLibraryProps {
  families: ModelFamilyLike[]
  allModels: ZenModelLike[]
  /** URL prefix for model detail navigation. Default: /docs/models/ */
  linkPrefix?: string
  /** Base URL for Chat buttons. Default: https://hanzo.chat */
  chatBaseUrl?: string
  /** URL for Request Access buttons. Default: https://hanzo.ai/contact */
  requestAccessUrl?: string
  /** Model IDs to highlight as featured */
  featuredIds?: string[]
  /** Label override for "show all" toggle button */
  showAllLabel?: string
  /** Label override for "show current" toggle button */
  showCurrentLabel?: string
  /**
   * Custom navigation handler. If provided, cards are clickable and call this.
   * Next.js callers: pass `(id) => router.push(linkPrefix + id)`.
   * Default: navigate using window.location.href.
   */
  onNavigate?: (id: string) => void
}

/**
 * ModelLibrary — Full browsable model catalog with family sections and filter toggle.
 *
 * Data-agnostic: accepts any ZenModelLike[] + ModelFamilyLike[] data.
 * Works identically on zen-docs, hanzo.ai, and any other site.
 */
export function ModelLibrary({
  families,
  allModels,
  linkPrefix = '/docs/models/',
  chatBaseUrl = 'https://hanzo.chat',
  requestAccessUrl = 'https://hanzo.ai/contact',
  featuredIds,
  showAllLabel = 'Show All Models',
  showCurrentLabel = 'Show Current Only',
  onNavigate,
}: ModelLibraryProps) {
  const [showAll, setShowAll] = useState(false)
  const router = useRouter()

  const modelById = new Map(allModels.map((m) => [m.id, m]))

  const handleNavigate = (id: string) => {
    if (onNavigate) {
      onNavigate(id)
    } else {
      router.push(`${linkPrefix}${id}`)
    }
  }

  const visibleFamilies = families
    .map((f) => {
      const models = f.models
        .map((id) => modelById.get(id))
        .filter((m): m is ZenModelLike => m !== undefined)
        .filter((m) => showAll || isActiveStatus(m.status))
      return { ...f, resolvedModels: models }
    })
    .filter((f) => f.resolvedModels.length > 0)

  const totalActive = allModels.filter((m) => isActiveStatus(m.status)).length
  const totalAll = allModels.length
  const totalHidden = totalAll - totalActive

  return (
    <>
      {/* Toggle header */}
      <div className="flex items-center justify-between mb-8">
        <p className="text-sm text-muted-foreground">
          Showing <strong>{showAll ? totalAll : totalActive}</strong> models
          {!showAll && totalHidden > 0 && (
            <> &middot; {totalHidden} legacy/upcoming hidden</>
          )}
        </p>
        <button
          onClick={() => setShowAll(!showAll)}
          className="inline-flex items-center gap-2 rounded-lg border border-border bg-background px-3 py-1.5 text-sm font-medium hover:bg-muted transition"
        >
          <Filter className="h-3.5 w-3.5" />
          {showAll ? showCurrentLabel : showAllLabel}
        </button>
      </div>

      {/* Family sections */}
      {visibleFamilies.map((family) => (
        <ModelFamilySection
          key={family.id}
          family={family}
          models={family.resolvedModels}
          onNavigate={handleNavigate}
          chatBaseUrl={chatBaseUrl}
          requestAccessUrl={requestAccessUrl}
          featuredIds={featuredIds}
        />
      ))}
    </>
  )
}

export default ModelLibrary
