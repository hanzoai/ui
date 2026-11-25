'use client'

import { useEffect, useRef, type CSSProperties } from "react"
import {
  mountDesktopToolbar,
  type DesktopToolbarController,
  type MountedDesktopToolbar,
} from "./toolbar-dom"

export interface DesktopToolbarProps extends DesktopToolbarController {
  readonly className?: string
  readonly style?: CSSProperties
}

/**
 * Canonical React `<DesktopToolbar />` component for `Hanzo Dev`, `Hanzo Desktop`,
 * `Hanzo Studio`, `Hanzo Bot`, and `Hanzo Team`.
 *
 * Delegates to `mountDesktopToolbar` so React and non-React/Monaco hosts (`Hanzo IDE`)
 * render the exact byte-identical DOM, CSS custom properties, SVG paths, active indicators,
 * tooltips, and keyboard shortcuts.
 */
export function DesktopToolbar(props: DesktopToolbarProps) {
  const containerRef = useRef<HTMLDivElement | null>(null)
  const mountedRef = useRef<MountedDesktopToolbar | null>(null)
  const latestPropsRef = useRef<DesktopToolbarProps>(props)
  latestPropsRef.current = props

  useEffect(() => {
    const el = containerRef.current
    if (!el) return

    const instance = mountDesktopToolbar(el, {
      ...latestPropsRef.current,
      onTogglePanel: (panel, nextOpen) => latestPropsRef.current.onTogglePanel?.(panel, nextOpen),
      onNavigateBack: () => latestPropsRef.current.onNavigateBack?.(),
      onNavigateForward: () => latestPropsRef.current.onNavigateForward?.(),
      onOpenFolder: () => latestPropsRef.current.onOpenFolder?.(),
      onOpenCommandPalette: () => latestPropsRef.current.onOpenCommandPalette?.(),
      onMenuAction: (id) => latestPropsRef.current.onMenuAction?.(id),
      onWindowMinimize: () => latestPropsRef.current.onWindowMinimize?.(),
      onWindowToggleMaximize: () => latestPropsRef.current.onWindowToggleMaximize?.(),
      onWindowClose: () => latestPropsRef.current.onWindowClose?.(),
    })
    mountedRef.current = instance

    return () => {
      instance.destroy()
      mountedRef.current = null
    }
  }, [])

  useEffect(() => {
    mountedRef.current?.update({
      projectName: props.projectName,
      projectPlaceholder: props.projectPlaceholder,
      searchPlaceholder: props.searchPlaceholder,
      searchShortcutLabel: props.searchShortcutLabel,
      canGoBack: props.canGoBack,
      canGoForward: props.canGoForward,
      leftSidebarOpen: props.leftSidebarOpen,
      browserOpen: props.browserOpen,
      bottomPanelOpen: props.bottomPanelOpen,
      integrationsOpen: props.integrationsOpen,
      rightSidebarOpen: props.rightSidebarOpen,
      windowMaximized: props.windowMaximized,
      showWindowControls: props.showWindowControls,
      isMac: props.isMac,
    })
  }, [
    props.projectName,
    props.projectPlaceholder,
    props.searchPlaceholder,
    props.searchShortcutLabel,
    props.canGoBack,
    props.canGoForward,
    props.leftSidebarOpen,
    props.browserOpen,
    props.bottomPanelOpen,
    props.integrationsOpen,
    props.rightSidebarOpen,
    props.windowMaximized,
    props.showWindowControls,
    props.isMac,
  ])

  return (
    <div
      ref={containerRef}
      className={props.className}
      style={props.style}
      data-slot="desktop-toolbar-react-root"
    />
  )
}
