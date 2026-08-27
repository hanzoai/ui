'use client'

/**
 * The channel's furniture: the header, the artifact card, the system line, the
 * right-hand pane, and the org rail the whole shell hangs off.
 *
 * Each is presentational and takes its content. Together they are the working
 * view: a channel names the work and counts what came out of it, the thread
 * carries the conversation and the things produced, and the pane is where a
 * produced thing is actually looked at.
 */
import { ScrollView, SizableText, XStack, YStack } from '@hanzo/gui'
import { Code2, Eye, FileText, Plus, X } from '@hanzogui/lucide-icons-2'
import { useState, type ComponentProps, type ReactNode } from 'react'

import { slot, tip } from '../backends/gui/slot'

type Col = Omit<ComponentProps<typeof YStack>, 'children'>
type Row = Omit<ComponentProps<typeof XStack>, 'children'>

/* ------------------------------------------------------------------ header */

export interface ChannelHeaderProps extends Row {
  name: string
  /** How many work products this channel has produced. Absent draws no badge —
   *  zero is a fact worth showing, absent is "not counted yet". */
  artifacts?: number
  onArtifacts?: () => void
  /** Trailing controls. */
  children?: ReactNode
}

export function ChannelHeader({
  name,
  artifacts,
  onArtifacts,
  children,
  ...rest
}: ChannelHeaderProps) {
  return (
    <XStack
      {...slot('channel-header')}
      items="center"
      gap="$2"
      px="$4"
      py="$3"
      borderBottomWidth={1}
      borderColor="$borderColor"
      {...rest}
    >
      <XStack
        width={26}
        height={26}
        rounded="$3"
        items="center"
        justify="center"
        bg="$raised"
        shrink={0}
      >
        <Code2 size={13} opacity={0.8} />
      </XStack>
      <SizableText size="$5" fontWeight="600" numberOfLines={1} shrink={1}>
        {name}
      </SizableText>
      <XStack flex={1} />
      {artifacts === undefined ? null : (
        <XStack
          items="center"
          gap="$2"
          px="$2.5"
          py="$1"
          rounded="$4"
          borderWidth={1}
          borderColor="$borderColor"
          cursor={onArtifacts ? 'pointer' : 'default'}
          role={onArtifacts ? 'button' : undefined}
          tabIndex={onArtifacts ? 0 : undefined}
          hoverStyle={onArtifacts ? { bg: '$hover' } : undefined}
          onPress={onArtifacts}
        >
          <SizableText size="$2" color="$quiet">
            Artifacts
          </SizableText>
          <XStack
            minW={18}
            height={18}
            px="$1"
            rounded={9999}
            items="center"
            justify="center"
            bg="$edge"
          >
            <SizableText size="$1" fontWeight="600">
              {artifacts}
            </SizableText>
          </XStack>
        </XStack>
      )}
      {children}
    </XStack>
  )
}

/* ---------------------------------------------------------------- artifact */

/** What a produced thing is. Names the icon and the card's second line. */
export type ArtifactKind = 'canvas' | 'code' | 'view'

const ART: Record<ArtifactKind, { icon: typeof Code2; says: string }> = {
  canvas: { icon: FileText, says: 'Canvas' },
  code: { icon: Code2, says: 'Code' },
  view: { icon: Eye, says: 'View' },
}

export interface ArtifactCardProps extends Row {
  title: string
  kind: ArtifactKind
  onOpen?: () => void
}

/** A thing the agent made, offered in the thread. Opening it fills the pane. */
export function ArtifactCard({ title, kind, onOpen, ...rest }: ArtifactCardProps) {
  const { icon: Icon, says } = ART[kind]
  return (
    <XStack
      {...slot('artifact-card')}
      items="center"
      gap="$3"
      p="$3"
      rounded="$4"
      borderWidth={1}
      borderColor="$borderColor"
      bg="$panel"
      maxW={420}
      cursor={onOpen ? 'pointer' : 'default'}
      role={onOpen ? 'button' : undefined}
      tabIndex={onOpen ? 0 : undefined}
      hoverStyle={onOpen ? { bg: '$hover' } : undefined}
      onPress={onOpen}
      {...rest}
    >
      <XStack
        width={34}
        height={34}
        rounded="$3"
        items="center"
        justify="center"
        bg="$edge"
        shrink={0}
      >
        <Icon size={16} />
      </XStack>
      <YStack flex={1} shrink={1}>
        <SizableText size="$3" fontWeight="600" numberOfLines={1}>
          {title}
        </SizableText>
        <SizableText size="$2" color="$soft">
          {says}
        </SizableText>
      </YStack>
    </XStack>
  )
}

/* -------------------------------------------------------------- system line */

export interface SystemLineProps extends Row {
  /** The whole sentence, already written by the caller — "Zoe was added by
   *  Harry". Composing it here would need a grammar this component cannot have. */
  children: ReactNode
  avatar?: ReactNode
}

/** Something that happened TO the channel, not something anyone said. */
export function SystemLine({ children, avatar, ...rest }: SystemLineProps) {
  return (
    <XStack {...slot('system-line')} items="flex-start" gap="$3" {...rest}>
      {avatar ?? <YStack width={28} shrink={0} />}
      <SizableText size="$2" color="$soft" flex={1}>
        {children}
      </SizableText>
    </XStack>
  )
}

/* --------------------------------------------------------------------- pane */

export interface PaneTab {
  id: string
  label: string
  kind: ArtifactKind
  content: ReactNode
}

export interface PaneProps extends Col {
  tabs: PaneTab[]
  active?: string
  onActive?: (id: string) => void
  onClose?: () => void
}

/**
 * The right-hand pane — Code, View, Canvas.
 *
 * Uncontrolled until `active` is supplied, so the common case needs no state
 * while a surface that routes to a tab can drive it.
 */
export function Pane({ tabs, active, onActive, onClose, ...rest }: PaneProps) {
  const [own, setOwn] = useState(tabs[0]?.id)
  const current = active ?? own
  const shown = tabs.find((t) => t.id === current) ?? tabs[0]

  return (
    <YStack
      {...slot('pane')}
      flex={1}
      minH={0}
      bg="$panel"
      rounded="$4"
      borderWidth={1}
      borderColor="$borderColor"
      overflow="hidden"
      {...rest}
    >
      <XStack items="center" gap="$1" px="$2" py="$2" borderBottomWidth={1} borderColor="$borderColor">
        {tabs.map((tab) => {
          const on = tab.id === shown?.id
          const Icon = ART[tab.kind].icon
          return (
            <XStack
              key={tab.id}
              items="center"
              gap="$1.5"
              px="$2.5"
              py="$1.5"
              rounded="$3"
              cursor="pointer"
              role="tab"
              tabIndex={0}
              aria-selected={on}
              opacity={on ? 1 : 0.6}
              bg={on ? '$edge' : undefined}
              hoverStyle={{ bg: on ? '$edge' : '$hover', opacity: 1 }}
              onPress={() => {
                setOwn(tab.id)
                onActive?.(tab.id)
              }}
            >
              <Icon size={13} />
              <SizableText size="$2">{tab.label}</SizableText>
            </XStack>
          )
        })}
        <XStack flex={1} />
        {onClose ? (
          <XStack
            width={26}
            height={26}
            items="center"
            justify="center"
            rounded="$3"
            cursor="pointer"
            opacity={0.7}
            role="button"
            tabIndex={0}
            aria-label="Close panel"
            {...tip('Close panel')}
            hoverStyle={{ bg: '$hover', opacity: 1 }}
            onPress={onClose}
          >
            <X size={15} />
          </XStack>
        ) : null}
      </XStack>

      <ScrollView flex={1} showsVerticalScrollIndicator={false}>
        <YStack p="$5">{shown?.content}</YStack>
      </ScrollView>
    </YStack>
  )
}

/* ----------------------------------------------------------------- org rail */

export interface Org {
  id: string
  name: string
  /** A mark. Falls back to the first letter of `name`. */
  avatar?: ReactNode
}

export interface OrgRailProps extends Col {
  orgs: Org[]
  active?: string
  onSwitch?: (id: string) => void
  onAdd?: () => void
}

/**
 * The outermost column: which organization you are in.
 *
 * A person belongs to several and can always start another, so this is a
 * SWITCHER and not a logo — everything to the right of it (channels, DMs,
 * activity, files) belongs to whichever org is lit here. It is its own column
 * rather than a menu in the rail because the rail's contents change when this
 * changes, and a control that reorganises the page beside it should not be
 * hidden inside that page.
 */
export function OrgRail({ orgs, active, onSwitch, onAdd, ...rest }: OrgRailProps) {
  return (
    <YStack
      {...slot('org-rail')}
      width={56}
      shrink={0}
      height="100%"
      items="center"
      gap="$2"
      py="$3"
      bg="$background"
      borderRightWidth={1}
      borderColor="$borderColor"
      {...rest}
    >
      {orgs.map((org) => {
        const on = org.id === active
        return (
          <XStack
            key={org.id}
            width={36}
            height={36}
            rounded="$4"
            items="center"
            justify="center"
            overflow="hidden"
            cursor="pointer"
            role="button"
            tabIndex={0}
            aria-current={on ? 'true' : undefined}
            aria-label={org.name}
            {...tip(org.name)}
            bg={on ? '$edge' : '$raised'}
            borderWidth={1}
            borderColor={on ? '$color8' : 'transparent'}
            opacity={on ? 1 : 0.7}
            hoverStyle={{ opacity: 1 }}
            onPress={() => onSwitch?.(org.id)}
          >
            {org.avatar ?? (
              <SizableText size="$3" fontWeight="600">
                {org.name.charAt(0).toUpperCase()}
              </SizableText>
            )}
          </XStack>
        )
      })}

      {onAdd ? (
        <XStack
          width={36}
          height={36}
          rounded="$4"
          items="center"
          justify="center"
          cursor="pointer"
          role="button"
          tabIndex={0}
          aria-label="Add an organization"
          {...tip('Add an organization')}
          borderWidth={1}
          borderColor="$borderColor"
          opacity={0.6}
          hoverStyle={{ bg: '$hover', opacity: 1 }}
          onPress={onAdd}
        >
          <Plus size={16} />
        </XStack>
      ) : null}
    </YStack>
  )
}
