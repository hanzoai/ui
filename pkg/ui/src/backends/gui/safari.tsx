'use client'

/**
 * Safari — a browser-window frame for showing a screenshot, a demo or a live
 * preview inside: a traffic-light title bar, back/forward controls, a URL
 * pill with a lock and a reload button, three trailing actions, an optional
 * secondary toolbar (Favorites / Reading List / History), and the content
 * area itself.
 *
 * The chrome is decorative by default, the same way the real browser's own
 * controls only matter once something is listening — so every button takes
 * an optional handler and renders whether or not one is given.
 */
import {
  Bookmark,
  ChevronLeft,
  ChevronRight,
  Clock,
  Lock,
  Menu,
  Plus,
  RotateCw,
  Share2,
  Star,
} from '@hanzogui/lucide-icons-2'
import { SizableText, XStack, YStack, styled } from '@hanzo/gui'
import type { ReactNode } from 'react'
import { slot } from './slot'
import { touch } from './gesture'

const CONTROL = 12
const ICON = 16

/** One traffic-light dot: close (red), minimize (yellow) or maximize (green). Decorative — the real controls live on the window this frame sits in. */
const Light = styled(XStack, {
  name: 'SafariLight',
  width: CONTROL,
  height: CONTROL,
  rounded: 999,

  variants: {
    tone: {
      close: { bg: '$red9' },
      minimize: { bg: '$yellow9' },
      maximize: { bg: '$green9' },
    },
  } as const,
})

const IconButton = styled(XStack, {
  name: 'SafariIconButton',
  items: 'center',
  justify: 'center',
  width: 24,
  height: 24,
  rounded: '$2',
  cursor: 'pointer',
  hoverStyle: { bg: '$hover' },
})

const ToolbarButton = styled(XStack, {
  name: 'SafariToolbarButton',
  items: 'center',
  gap: '$1.5',
  cursor: 'pointer',
  hoverStyle: { opacity: 0.75 },
})

export type SafariToolbarItem = 'favorites' | 'reading-list' | 'history'

const TOOLBAR_ITEMS: { item: SafariToolbarItem; label: string; icon: typeof Star }[] = [
  { item: 'favorites', label: 'Favorites', icon: Star },
  { item: 'reading-list', label: 'Reading List', icon: Bookmark },
  { item: 'history', label: 'History', icon: Clock },
]

export type SafariProps = {
  children?: ReactNode
  /** Shown in the URL pill. */
  url?: string
  /** The Favorites / Reading List / History row under the address bar. */
  showToolbar?: boolean
  onBack?: () => void
  onForward?: () => void
  onReload?: () => void
  onShare?: () => void
  onNewTab?: () => void
  onMenu?: () => void
  /** Fires with which secondary-toolbar item was pressed. */
  onToolbarItemPress?: (item: SafariToolbarItem) => void
}

/**
 * A macOS Safari window as a frame around `children` — drop a screenshot, an
 * iframe or a live component in and it reads as a captured browser tab.
 */
export function Safari({
  children,
  url = 'https://ui.hanzo.ai',
  showToolbar = true,
  onBack,
  onForward,
  onReload,
  onShare,
  onNewTab,
  onMenu,
  onToolbarItemPress,
}: SafariProps) {
  return (
    <YStack
      {...slot('safari')}
      width="100%"
      maxW={960}
      self="center"
      rounded="$5"
      borderWidth={1}
      borderColor="$borderColor"
      overflow="hidden"
      shadowColor="$shadowColor"
      shadowRadius={24}
    >
      <XStack
        {...slot('safari-chrome')}
        items="center"
        gap="$2"
        px="$3"
        py="$2"
        bg="$panel"
        borderBottomWidth={1}
        borderColor="$borderColor"
      >
        <XStack {...slot('safari-traffic-lights')} gap="$2">
          <Light tone="close" />
          <Light tone="minimize" />
          <Light tone="maximize" />
        </XStack>

        <XStack {...slot('safari-nav')} ml="$2" items="center" gap="$1">
          <IconButton
            {...slot('safari-back')}
            onPress={onBack}
            {...touch(24, 44, 'both')}
            aria-label="Go back"
            role="button"
          >
            <ChevronLeft size={ICON} color="$quiet" />
          </IconButton>
          <IconButton
            {...slot('safari-forward')}
            onPress={onForward}
            {...touch(24, 44, 'both')}
            aria-label="Go forward"
            role="button"
          >
            <ChevronRight size={ICON} color="$quiet" />
          </IconButton>
        </XStack>

        <XStack
          {...slot('safari-url-bar')}
          mx="$3"
          flex={1}
          items="center"
          gap="$2"
          rounded="$4"
          bg="$background"
          px="$3"
          py="$1.5"
        >
          <Lock size={14} color="$quiet" />
          <SizableText {...slot('safari-url-text')} flex={1} size="$2" color="$quiet" numberOfLines={1}>
            {url}
          </SizableText>
          <IconButton
            {...slot('safari-reload')}
            width={22}
            height={22}
            onPress={onReload}
            {...touch(22, 44, 'both')}
            aria-label="Reload page"
            role="button"
          >
            <RotateCw size={14} color="$quiet" />
          </IconButton>
        </XStack>

        <XStack {...slot('safari-actions')} items="center" gap="$1">
          <IconButton
            {...slot('safari-share')}
            onPress={onShare}
            {...touch(24, 44, 'both')}
            aria-label="Share"
            role="button"
          >
            <Share2 size={ICON} color="$quiet" />
          </IconButton>
          <IconButton
            {...slot('safari-new-tab')}
            onPress={onNewTab}
            {...touch(24, 44, 'both')}
            aria-label="New tab"
            role="button"
          >
            <Plus size={ICON} color="$quiet" />
          </IconButton>
          <IconButton
            {...slot('safari-menu')}
            onPress={onMenu}
            {...touch(24, 44, 'both')}
            aria-label="Menu"
            role="button"
          >
            <Menu size={ICON} color="$quiet" />
          </IconButton>
        </XStack>
      </XStack>

      {showToolbar ? (
        <XStack
          {...slot('safari-secondary-toolbar')}
          items="center"
          gap="$4"
          px="$4"
          py="$2"
          bg="$panel"
          borderBottomWidth={1}
          borderColor="$borderColor"
        >
          {TOOLBAR_ITEMS.map(({ item, label, icon: Icon }) => (
            <ToolbarButton
              key={item}
              {...slot(`safari-toolbar-${item}`)}
              onPress={() => onToolbarItemPress?.(item)}
              {...touch(20, 44, 'y')}
              aria-label={label}
              role="button"
            >
              <Icon size={14} color="$quiet" />
              <SizableText size="$2" color="$quiet">
                {label}
              </SizableText>
            </ToolbarButton>
          ))}
        </XStack>
      ) : null}

      <YStack {...slot('safari-content')} bg="$background">
        {children}
      </YStack>
    </YStack>
  )
}
