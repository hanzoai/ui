'use client'

import { useEffect, useRef, type CSSProperties } from "react"
import {
  mountAgentSidebar,
  type AgentSidebarController,
  type MountedAgentSidebar,
} from "./agent-sidebar"

export interface AgentSidebarProps extends AgentSidebarController {
  readonly className?: string
  readonly style?: CSSProperties
}

/**
 * Canonical React `<AgentSidebar />` component for `Hanzo Dev`, `Hanzo Desktop`,
 * `Hanzo Studio`, `Hanzo Bot`, and `Hanzo Team`.
 *
 * Wraps `mountAgentSidebar` so React apps and non-React/Monaco hosts (`Hanzo IDE`)
 * render the exact same `New thread` header, 7-path `@hanzo/logo` empty state,
 * streaming message blocks, tool approval cards, inline code diffs, and 16px `#141414` composer.
 */
export function AgentSidebar(props: AgentSidebarProps) {
  const containerRef = useRef<HTMLDivElement | null>(null)
  const mountedRef = useRef<MountedAgentSidebar | null>(null)
  const latestPropsRef = useRef<AgentSidebarProps>(props)
  latestPropsRef.current = props

  useEffect(() => {
    const el = containerRef.current
    if (!el) return

    const instance = mountAgentSidebar(el, {
      ...latestPropsRef.current,
      onSend: (prompt, meta) => latestPropsRef.current.onSend?.(prompt, meta),
      onNewThread: () => latestPropsRef.current.onNewThread?.(),
      onSelectThread: (threadId) => latestPropsRef.current.onSelectThread?.(threadId),
      onClose: () => latestPropsRef.current.onClose?.(),
      onAttach: () => latestPropsRef.current.onAttach?.(),
      onModelChange: (model) => latestPropsRef.current.onModelChange?.(model),
      onEffortChange: (effort) => latestPropsRef.current.onEffortChange?.(effort),
      onModeChange: (mode) => latestPropsRef.current.onModeChange?.(mode),
      onApproveToolCall: (id) => latestPropsRef.current.onApproveToolCall?.(id),
      onDenyToolCall: (id) => latestPropsRef.current.onDenyToolCall?.(id),
      onApplyDiff: (id, filePath) => latestPropsRef.current.onApplyDiff?.(id, filePath),
    })
    mountedRef.current = instance

    return () => {
      instance.destroy()
      mountedRef.current = null
    }
  }, [])

  useEffect(() => {
    mountedRef.current?.update({
      title: props.title,
      activeThreadId: props.activeThreadId,
      threads: props.threads,
      messages: props.messages,
      suggestions: props.suggestions,
      emptyHeadline: props.emptyHeadline,
      emptySubtitle: props.emptySubtitle,
      composerPlaceholder: props.composerPlaceholder,
      draft: props.draft,
      model: props.model,
      modelOptions: props.modelOptions,
      effort: props.effort,
      effortOptions: props.effortOptions,
      mode: props.mode,
      modeOptions: props.modeOptions,
      busy: props.busy,
    })
  }, [
    props.title,
    props.activeThreadId,
    props.threads,
    props.messages,
    props.suggestions,
    props.emptyHeadline,
    props.emptySubtitle,
    props.composerPlaceholder,
    props.draft,
    props.model,
    props.modelOptions,
    props.effort,
    props.effortOptions,
    props.mode,
    props.modeOptions,
    props.busy,
  ])

  return (
    <div
      ref={containerRef}
      className={props.className}
      style={{ height: "100%", minHeight: 0, display: "flex", flexDirection: "column", ...props.style }}
      data-slot="agent-sidebar-react-root"
    />
  )
}
