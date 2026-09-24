'use client'

/**
 * Workspace — the builder's frame: one bar, the chat beside the work, the work,
 * and a dock under it.
 *
 * Ported from build-v2 `components/editor/{index,header}.tsx` (MIT, derived from
 * OSW Studio and DeepSite — see NOTICE). v2's editor owned its project, its
 * pages, its preview frames and its fetches in one 875-line component; this is
 * the SHAPE of that screen with every one of those handed back to the host.
 * The bar is three slots, the chat column is a slot, the view is `children`,
 * and the dock is a slot. Nothing here knows what a project is.
 *
 *   ┌ start ──────────────┬──────── middle ─────────┬──────── end ┐
 *   │ chat (collapsible)  │ children — the chosen view            │
 *   │                     │                                        │
 *   │                     ├────────────────────────────────────────┤
 *   │                     │ dock                                   │
 *   └─────────────────────┴────────────────────────────────────────┘
 *
 * THE CHAT COLUMN COLLAPSES ON AN EXPLICIT TOGGLE. `collapsed` is controlled
 * and the host persists it — the sidebar canon for every Hanzo surface: a
 * column you ask to hide, never one that slides away when the pointer leaves.
 *
 * ONE PANE AT A TIME ON A PHONE. Below `md` there is room for the chat or the
 * work, not both side by side, so `pane` chooses which shows. The host's view
 * tabs carry a Chat entry that is only drawn there (`VIEWS` + `CHAT`), so the
 * same control that switches views switches panes and there is no second
 * switcher to find. Nothing in the frame is wider than the viewport at 390px:
 * the middle of the bar yields and scrolls, and the ends never shrink.
 */
import { SizableText, XStack, YStack } from '@hanzo/gui'
import {
  ChevronsUpDown,
  Code2,
  FileText,
  Globe,
  Layers,
  MessageSquare,
  Monitor,
  Smartphone,
} from '@hanzogui/lucide-icons-2'
import {
  type ComponentProps,
  type ComponentType,
  type KeyboardEvent,
  type ReactNode,
  type Ref,
  useRef,
} from 'react'

import { Button } from '../backends/gui/button'
import { slot } from '../backends/gui/slot'

type Col = Omit<ComponentProps<typeof YStack>, 'children'>

/** The bar's one control height. Every square in the bar measures this. */
export const CONTROL = 32

/** The chat column's width on a wide screen, px — v2's measured 360. */
const WIDTH = 360

export interface WorkspaceProps extends Col {
  /** The bar's left cluster: the mark, the project, history, the chat toggle. */
  start?: ReactNode
  /** The bar's middle: view tabs, device, reload, page, open. Yields first. */
  middle?: ReactNode
  /** The bar's right cluster: Share, Publish. Never shrinks. */
  end?: ReactNode
  /** The chat column — thread, suggestions, composer. */
  chat?: ReactNode
  /** The chosen view: preview, files, code, layers. */
  children?: ReactNode
  /** Under the view: the console. */
  dock?: ReactNode
  /** The chat column is hidden on a wide screen. Controlled; the host persists it. */
  collapsed?: boolean
  /** Below `md`, which pane shows. */
  pane?: 'chat' | 'view'
  /** The chat column's width on a wide screen, px. */
  width?: number
}

export function Workspace({
  start,
  middle,
  end,
  chat,
  children,
  dock,
  collapsed = false,
  pane = 'view',
  width = WIDTH,
  ...rest
}: WorkspaceProps) {
  const chatShown = pane === 'chat'
  return (
    <YStack
      {...slot('workspace')}
      flex={1}
      minW={0}
      minH={0}
      width="100%"
      bg="$background"
      overflow="hidden"
      {...rest}
    >
      <XStack
        {...slot('workspace-bar')}
        render="header"
        items="center"
        gap="$2"
        px="$3"
        minH={52}
        shrink={0}
        minW={0}
        $md={{ px: '$4', gap: '$3' }}
      >
        <XStack items="center" gap="$1.5" minW={0} shrink={1}>
          {start}
        </XStack>
        <XStack
          flex={1}
          minW={0}
          items="center"
          justify="center"
          gap="$2"
          overflow="hidden"
        >
          {/* A scroller of its own, so a narrow bar gives up the middle and
              never the Publish at the end. `minW: 0` is the whole trick — a
              flex item refuses to shrink below its content without it. */}
          <XStack items="center" gap="$2" minW={0} maxW="100%" overflow="scroll">
            {middle}
          </XStack>
        </XStack>
        <XStack items="center" gap="$2" shrink={0}>
          {end}
        </XStack>
      </XStack>

      <XStack flex={1} minH={0} minW={0} gap={0} $md={{ gap: '$3', pr: '$3', pb: '$3' }}>
        <YStack
          {...slot('workspace-chat')}
          render="section"
          aria-label="Chat"
          display={chatShown ? 'flex' : 'none'}
          width="100%"
          minH={0}
          minW={0}
          $md={{ display: collapsed ? 'none' : 'flex', width, shrink: 0 }}
        >
          {chat}
        </YStack>
        <YStack
          {...slot('workspace-main')}
          render="main"
          display={chatShown ? 'none' : 'flex'}
          flex={1}
          minW={0}
          minH={0}
          $md={{ display: 'flex' }}
        >
          <YStack flex={1} minH={0} minW={0}>
            {children}
          </YStack>
          {dock}
        </YStack>
      </XStack>
    </YStack>
  )
}

/** One entry of a segmented control. */
export interface View {
  id: string
  label: string
  icon?: ComponentType<{ size?: number }>
  /** Drawn only below `md` — the phone's Chat entry. */
  narrow?: boolean
}

/** The builder's four views, as v2's pane list named and drew them. */
export const VIEWS: readonly View[] = [
  { id: 'preview', label: 'Preview', icon: Globe },
  { id: 'files', label: 'Files', icon: FileText },
  { id: 'code', label: 'Code', icon: Code2 },
  { id: 'layers', label: 'Layers', icon: Layers },
]

/** The phone's extra view: the chat itself, one pane at a time. */
export const CHAT: View = { id: 'chat', label: 'Chat', icon: MessageSquare, narrow: true }

/** The preview's two widths. */
export const DEVICES: readonly View[] = [
  { id: 'desktop', label: 'Desktop', icon: Monitor },
  { id: 'mobile', label: 'Mobile', icon: Smartphone },
]

export interface ViewsProps extends Omit<ComponentProps<typeof XStack>, 'children' | 'onChange'> {
  views: readonly View[]
  value: string
  onChange: (id: string) => void
  /** The group's accessible name: "Editor view", "Device". */
  label: string
  /** Which segments carry their words: only the chosen one (v2), all, or none. */
  labels?: 'active' | 'all' | 'none'
}

/**
 * A segmented control, as a WAI-ARIA tablist: one tab stop, arrows move the
 * choice, Home/End jump. The chosen segment is the raised one and, by default,
 * the only one wearing its label — v2's bar, where the place you are is the
 * loud thing and every other place is a glyph.
 */
export function Views({ views, value, onChange, label, labels = 'active', ...rest }: ViewsProps) {
  const refs = useRef<(HTMLElement | null)[]>([])
  const move = (e: KeyboardEvent, index: number) => {
    const last = views.length - 1
    const to =
      e.key === 'ArrowRight' ? (index === last ? 0 : index + 1)
      : e.key === 'ArrowLeft' ? (index === 0 ? last : index - 1)
      : e.key === 'Home' ? 0
      : e.key === 'End' ? last
      : -1
    if (to < 0) return
    e.preventDefault()
    onChange(views[to]!.id)
    refs.current[to]?.focus()
  }
  return (
    <XStack
      {...slot('views')}
      role="tablist"
      aria-label={label}
      items="center"
      gap={2}
      p={2}
      rounded="$3"
      bg="$hover"
      shrink={0}
      {...rest}
    >
      {views.map((view, index) => {
        const on = view.id === value
        const Icon = view.icon
        const words = labels === 'all' || (labels === 'active' && on) || !Icon
        return (
          <Button
            key={view.id}
            ref={(el: HTMLElement | null) => {
              refs.current[index] = el
            }}
            type="button"
            variant="ghost"
            size={words ? 'sm' : 'icon-sm'}
            role="tab"
            aria-selected={on}
            aria-label={view.label}
            title={view.label}
            tabIndex={on ? 0 : -1}
            onClick={() => onChange(view.id)}
            onKeyDown={(e: KeyboardEvent) => move(e, index)}
            minHeight={CONTROL - 4}
            minWidth={CONTROL + 8}
            px={words ? '$2.5' : 0}
            bg={on ? '$raised' : 'transparent'}
            color={on ? '$ink' : '$soft'}
            hoverStyle={{ bg: on ? '$raised' : '$hover' }}
            {...(view.narrow ? { $md: { display: 'none' } } : null)}
            {...({ 'data-view': view.id } as object)}
          >
            {Icon ? <Icon size={15} /> : null}
            {words ? (
              <SizableText size="$2" color={on ? '$ink' : '$soft'}>
                {view.label}
              </SizableText>
            ) : null}
          </Button>
        )
      })}
    </XStack>
  )
}

export interface ProjectChipProps extends Omit<ComponentProps<typeof XStack>, 'children'> {
  /** The project's name. */
  name: string
  /** The square before the name; the name's initial when absent. */
  mark?: ReactNode
  onPress?: () => void
  /** The button, for a menu or popover to anchor to. A plain prop (React 19). */
  ref?: Ref<HTMLElement>
}

/**
 * The project switcher's trigger: a square, the name, and the up-down chevron
 * that says "there are others". A real button with a ref, so it can be the
 * trigger of whatever menu or popover the host lists projects in.
 */
export function ProjectChip({ name, mark, onPress, ref, ...rest }: ProjectChipProps) {
  const initial = name.trim().charAt(0).toUpperCase() || '·'
  return (
    <XStack
      ref={ref as never}
      {...slot('project-chip')}
      render="button"
      {...({ type: 'button', 'aria-haspopup': 'menu' } as object)}
      aria-label={`Project: ${name}`}
      onPress={onPress}
      items="center"
      gap="$2"
      height={CONTROL + 4}
      minW={0}
      shrink={1}
      pl="$1.5"
      pr="$2"
      rounded="$3"
      borderWidth={1}
      borderColor="$borderColor"
      bg="$panel"
      cursor="pointer"
      hoverStyle={{ bg: '$hover' }}
      focusVisibleStyle={{ outlineWidth: 2, outlineStyle: 'solid', outlineColor: '$rim' }}
      {...rest}
    >
      {mark ?? (
        <YStack
          width={22}
          height={22}
          rounded="$2"
          bg="$raised"
          items="center"
          justify="center"
          shrink={0}
          aria-hidden
        >
          <SizableText size="$1" fontWeight="600" color="$ink">
            {initial}
          </SizableText>
        </YStack>
      )}
      <SizableText size="$3" fontWeight="600" color="$ink" numberOfLines={1} minW={0} shrink={1}>
        {name}
      </SizableText>
      <ChevronsUpDown size={14} opacity={0.6} />
    </XStack>
  )
}
