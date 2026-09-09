"use client"

/**
 * The service detail drawer — a right-side overlay with a service header and a
 * tab bar. The tab bodies are injected by the host (`tabs[].content`), so the
 * drawer shell is reusable while the host owns each panel's data (Deployments,
 * Variables, Metrics, Logs, Domains, SBOM). Self-contained: backdrop, slide-in,
 * Escape-to-close, and a body-scroll lock — no external drawer dependency.
 */
import { useEffect, useState } from "react"
import type { ReactNode } from "react"
import { Text, XStack, YStack } from "@hanzo/gui"

import { kindLabel } from "./color"
import { kindGlyph } from "./glyphs"
import { ServiceStatusBadge } from "./ServiceStatusBadge"
import { CanvasStyles } from "./styles"
import type { ServiceNodeData, ServiceStatus, StatusPalette } from "./types"

const MONO = "ui-monospace, SFMono-Regular, Menlo, monospace"

export interface DrawerTab {
  id: string
  label: string
  content: ReactNode
  badge?: number | string
}

export interface ServiceDetailDrawerProps {
  open: boolean
  onClose: () => void
  service: ServiceNodeData | null
  tabs: DrawerTab[]
  /** Controlled active tab; omit for internal (uncontrolled) tab state. */
  activeTab?: string
  onTabChange?: (id: string) => void
  width?: number
  reducedMotion?: boolean
  statusPalette?: Partial<Record<ServiceStatus, StatusPalette>>
  renderIcon?: (d: ServiceNodeData) => ReactNode
  /** Extra controls in the header (e.g. a Deploy button). */
  headerActions?: ReactNode
  zIndex?: number
}

function CloseGlyph() {
  return (
    <svg
      width={16}
      height={16}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      aria-hidden
    >
      <path d="M6 6l12 12M18 6 6 18" />
    </svg>
  )
}

export function ServiceDetailDrawer({
  open,
  onClose,
  service,
  tabs,
  activeTab,
  onTabChange,
  width = 480,
  reducedMotion,
  statusPalette,
  renderIcon,
  headerActions,
  zIndex = 1000,
}: ServiceDetailDrawerProps) {
  const [internal, setInternal] = useState<string | undefined>(tabs[0]?.id)

  // Reset the uncontrolled tab when the drawer opens for a different service.
  useEffect(() => {
    if (open) setInternal(tabs[0]?.id)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, service?.id])

  // Escape-to-close + body-scroll lock while open.
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose()
    }
    document.addEventListener("keydown", onKey)
    const prev = document.body.style.overflow
    document.body.style.overflow = "hidden"
    return () => {
      document.removeEventListener("keydown", onKey)
      document.body.style.overflow = prev
    }
  }, [open, onClose])

  if (!open || !service) return null

  const active = activeTab ?? internal ?? tabs[0]?.id
  const activePanel = tabs.find((t) => t.id === active) ?? tabs[0]
  const Glyph = kindGlyph(service.kind)
  const icon = renderIcon ? renderIcon(service) : <Glyph size={18} />

  const selectTab = (id: string) => {
    onTabChange?.(id)
    setInternal(id)
  }

  return (
    <div style={{ position: "fixed", inset: 0, zIndex }}>
      {/* Backdrop */}
      <div
        className={reducedMotion ? undefined : "hz-canvas-backdrop"}
        onClick={onClose}
        style={{
          position: "absolute",
          inset: 0,
          background: "rgba(0,0,0,0.42)",
        }}
      />
      {/* Panel */}
      <YStack
        className={reducedMotion ? undefined : "hz-canvas-drawer"}
        role="dialog"
        aria-modal
        aria-label={`${service.name} details`}
        bg="$color1"
        borderLeftWidth={1}
        borderColor="$borderColor"
        style={{
          position: "absolute",
          top: 0,
          right: 0,
          height: "100%",
          width: `min(100vw, ${width}px)`,
          boxShadow: "-16px 0 48px rgba(0,0,0,0.28)",
        }}
      >
        {/* Header */}
        <YStack
          p="$4"
          gap="$3"
          borderBottomWidth={1}
          borderColor="$borderColor"
        >
          <XStack items="flex-start" gap="$3" minW={0}>
            <YStack
              width={38}
              height={38}
              rounded="$3"
              items="center"
              justify="center"
              bg="$color3"
              style={{ flexShrink: 0, color: "#8b949e" }}
            >
              <span style={{ display: "inline-flex" }}>{icon}</span>
            </YStack>
            <YStack flex={1} minW={0} gap="$1">
              <Text
                fontSize="$6"
                fontWeight="800"
                color="$color12"
                numberOfLines={1}
              >
                {service.name}
              </Text>
              <XStack items="center" gap="$2" minW={0} flexWrap="wrap">
                <Text fontSize="$2" color="$color10">
                  {service.typeLabel ?? kindLabel(service.kind)}
                </Text>
                {service.capability ? (
                  <XStack bg="$color2" px="$2" py="$0.5" rounded="$2">
                    <Text
                      fontSize="$1"
                      color="$color10"
                      style={{ fontFamily: MONO }}
                    >
                      {service.capability.path ??
                        `/v1/${service.capability.id}`}
                    </Text>
                  </XStack>
                ) : null}
              </XStack>
            </YStack>
            <XStack
              items="center"
              justify="center"
              width={30}
              height={30}
              rounded="$3"
              hoverStyle={{ bg: "$color3" }}
              onPress={onClose}
              style={{ cursor: "pointer", color: "#8b949e", flexShrink: 0 }}
            >
              <span style={{ display: "inline-flex" }}>
                <CloseGlyph />
              </span>
            </XStack>
          </XStack>

          <XStack items="center" gap="$2" flexWrap="wrap">
            <ServiceStatusBadge
              status={service.status}
              label={service.statusLabel}
              palette={statusPalette}
              reducedMotion={reducedMotion}
            />
            {headerActions}
          </XStack>
        </YStack>

        {/* Tab bar */}
        <XStack
          borderBottomWidth={1}
          borderColor="$borderColor"
          px="$3"
          gap="$1"
          style={{ overflowX: "auto", flexShrink: 0 }}
        >
          {tabs.map((t) => {
            const on = t.id === active
            return (
              <XStack
                key={t.id}
                items="center"
                gap="$1.5"
                px="$2.5"
                py="$2.5"
                onPress={() => selectTab(t.id)}
                style={{
                  cursor: "pointer",
                  borderBottom: `2px solid ${on ? "#8b949e" : "transparent"}`,
                  marginBottom: -1,
                }}
              >
                <Text
                  fontSize="$2"
                  fontWeight={on ? "700" : "500"}
                  color={on ? "$color12" : "$color10"}
                >
                  {t.label}
                </Text>
                {t.badge != null ? (
                  <XStack bg="$color3" px="$1.5" rounded={999} items="center">
                    <Text fontSize="$1" color="$color11" fontWeight="600">
                      {t.badge}
                    </Text>
                  </XStack>
                ) : null}
              </XStack>
            )
          })}
        </XStack>

        {/* Active panel */}
        <YStack flex={1} p="$4" gap="$3" style={{ overflowY: "auto" }}>
          <CanvasStyles />
          {activePanel?.content}
        </YStack>
      </YStack>
    </div>
  )
}
