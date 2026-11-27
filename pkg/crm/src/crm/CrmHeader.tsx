'use client'

/**
 * Twenty-style responsive top header & mobile navigation for Hanzo CRM.
 *
 * - Desktop (`>=768px`): compact bar with object switcher tabs, View Mode toggle
 *   (Table / Board / Calendar where applicable), `Cmd+K` Search pill, and AI Copilot toggle.
 * - Mobile (`<768px`, e.g. 390px): compact action bar + horizontally scrollable
 *   40px touch-friendly pill navigation bar with zero page-level horizontal overflow.
 */
import type { CSSProperties } from 'react'
import { Button, Text, XStack, YStack } from '@hanzo/gui'
import {
  BarChart3,
  Briefcase,
  Building2,
  Calendar,
  CheckSquare,
  Columns3,
  Database,
  FileText,
  List,
  Mail,
  Search,
  ShoppingBag,
  Sparkles,
  Table,
  TrendingUp,
  UserCheck,
  Users,
} from '@hanzogui/lucide-icons-2'

import { CRM_PAGES, type CrmPage } from '../nav'
import { useRouter, useSession } from '../lib/host'
import { useCrmShell, type CrmViewMode } from './CrmContext'
import { useViewport } from './responsive'

const scrollRowStyle: CSSProperties = {
  display: 'flex',
  flexDirection: 'row',
  alignItems: 'center',
  gap: 6,
  overflowX: 'auto',
  overflowY: 'hidden',
  WebkitOverflowScrolling: 'touch',
  scrollbarWidth: 'none',
  maxWidth: '100%',
  minWidth: 0,
}

function pageIcon(slug: string, active: boolean) {
  const color = active ? '$color12' : '$color10'
  const size = 14
  switch (slug) {
    case '': return <Users size={size} color={color} />
    case 'companies': return <Building2 size={size} color={color} />
    case 'deals': return <Briefcase size={size} color={color} />
    case 'fundraising': return <TrendingUp size={size} color={color} />
    case 'tasks': return <CheckSquare size={size} color={color} />
    case 'notes': return <FileText size={size} color={color} />
    case 'lists': return <List size={size} color={color} />
    case 'sequences': return <Mail size={size} color={color} />
    case 'candidates': return <UserCheck size={size} color={color} />
    case 'sales': return <ShoppingBag size={size} color={color} />
    case 'dashboard': return <BarChart3 size={size} color={color} />
    case 'model': return <Database size={size} color={color} />
    default: return <Sparkles size={size} color={color} />
  }
}

export interface CrmHeaderProps {
  /** Active tab slug ('' for People, 'deals', 'dashboard', etc.). */
  activeSlug: string
  /** Whether a single record detail page is open (hides index view-mode toggle). */
  isRecordDetail?: boolean
}

export function CrmHeader({ activeSlug, isRecordDetail }: CrmHeaderProps) {
  const router = useRouter()
  const { account } = useSession()
  const { mobile } = useViewport()
  const {
    openCommandMenu,
    copilotOpen,
    toggleCopilot,
    viewMode,
    setViewMode,
    availableViews,
  } = useCrmShell()

  const pages: readonly CrmPage[] = CRM_PAGES.filter((p) => !p.superAdmin || account?.superAdmin)
  const current = pages.find((p) => p.slug === activeSlug) ?? pages[0]
  const showViews = !isRecordDetail && availableViews.length > 1

  const navigate = (slug: string) => {
    router.push(slug ? `/crm/${slug}` : '/crm')
  }

  const viewToggle = showViews ? (
    <XStack
      items="center"
      bg="$color2"
      borderWidth={1}
      borderColor="$borderColor"
      rounded="$3"
      p={2}
      gap={2}
      data-slot="crm-view-toggle"
      role="tablist"
      aria-label="View mode"
    >
      {availableViews.map((mode) => (
        <ViewModeButton
          key={mode}
          mode={mode}
          active={viewMode === mode}
          compact={mobile}
          onPress={() => setViewMode(mode)}
        />
      ))}
    </XStack>
  ) : null

  if (mobile) {
    return (
      <YStack
        gap="$2"
        pb="$2"
        borderBottomWidth={1}
        borderColor="$borderColor"
        width="100%"
        maxW="100%"
        overflow="hidden"
        data-slot="crm-header"
        data-mobile="true"
      >
        <XStack items="center" justify="space-between" gap="$2" minH={40} width="100%" minW={0}>
          <XStack items="center" gap="$1.5" flex={1} minW={0}>
            {pageIcon(current?.slug ?? '', true)}
            <Text fontSize="$3" fontWeight="600" color="$color11" numberOfLines={1}>
              {`CRM · ${current?.label ?? 'People'}`}
            </Text>
          </XStack>
          <XStack items="center" gap="$1.5" shrink={0}>
            <Button
              size="$3"
              minW={40}
              minH={40}
              px="$2"
              bg="$color2"
              borderWidth={1}
              borderColor="$borderColor"
              aria-label="Search CRM"
              data-slot="crm-cmdk-trigger"
              onPress={openCommandMenu}
            >
              <Search size={16} color="$color11" />
            </Button>
            <Button
              size="$3"
              minW={40}
              minH={40}
              px="$2"
              theme={copilotOpen ? 'blue' : undefined}
              bg={copilotOpen ? undefined : '$color2'}
              borderWidth={1}
              borderColor="$borderColor"
              aria-label="AI Copilot"
              aria-pressed={copilotOpen}
              data-slot="crm-copilot-trigger"
              onPress={toggleCopilot}
            >
              <Sparkles size={16} color={copilotOpen ? '$color12' : '$color11'} />
            </Button>
          </XStack>
        </XStack>

        <div style={scrollRowStyle} role="navigation" aria-label="CRM sections" data-slot="crm-mobile-nav">
          {pages.map((p) => {
            const active = p.slug === activeSlug
            return (
              <Button
                key={p.slug || 'people'}
                size="$3"
                minH={40}
                px="$3"
                rounded="$6"
                shrink={0}
                bg={active ? '$color4' : '$color2'}
                borderWidth={1}
                borderColor={active ? '$color8' : '$borderColor'}
                onPress={() => navigate(p.slug)}
                aria-current={active ? 'page' : undefined}
                data-slot="crm-nav-pill"
                data-slug={p.slug || 'people'}
              >
                <XStack items="center" gap="$1.5">
                  {pageIcon(p.slug, active)}
                  <Text fontSize="$2" fontWeight={active ? '700' : '500'} color={active ? '$color12' : '$color10'}>
                    {p.label}
                  </Text>
                </XStack>
              </Button>
            )
          })}
        </div>

        {viewToggle ? <XStack items="center">{viewToggle}</XStack> : null}
      </YStack>
    )
  }

  return (
    <XStack
      items="center"
      justify="space-between"
      gap="$3"
      pb="$2.5"
      borderBottomWidth={1}
      borderColor="$borderColor"
      width="100%"
      maxW="100%"
      minW={0}
      data-slot="crm-header"
    >
      <div
        style={{
          ...scrollRowStyle,
          flex: 1,
          paddingRight: 20,
          maskImage: 'linear-gradient(to right, black calc(100% - 24px), transparent 100%)',
          WebkitMaskImage: 'linear-gradient(to right, black calc(100% - 24px), transparent 100%)',
        }}
        role="navigation"
        aria-label="CRM sections"
        data-slot="crm-desktop-nav"
      >
        {pages.map((p) => {
          const active = p.slug === activeSlug
          return (
            <Button
              key={p.slug || 'people'}
              size="$2"
              minH={32}
              px="$2.5"
              rounded="$2"
              shrink={0}
              chromeless={!active}
              bg={active ? '$color3' : 'transparent'}
              borderWidth={1}
              borderColor={active ? '$borderColor' : 'transparent'}
              onPress={() => navigate(p.slug)}
              aria-current={active ? 'page' : undefined}
              data-slot="crm-nav-tab"
              data-slug={p.slug || 'people'}
            >
              <XStack items="center" gap="$1.5">
                {pageIcon(p.slug, active)}
                <Text fontSize="$2" fontWeight={active ? '700' : '500'} color={active ? '$color12' : '$color10'}>
                  {p.label}
                </Text>
              </XStack>
            </Button>
          )
        })}
      </div>

      <XStack items="center" gap="$2" shrink={0}>
        {viewToggle}
        <Button
          size="$2"
          minH={32}
          px="$2.5"
          bg="$color2"
          borderWidth={1}
          borderColor="$borderColor"
          rounded="$3"
          onPress={openCommandMenu}
          aria-label="Open command menu (Cmd+K)"
          data-slot="crm-cmdk-trigger"
        >
          <XStack items="center" gap="$2">
            <Search size={13} color="$color10" />
            <Text fontSize="$2" color="$color10">
              Search
            </Text>
            <Text
              fontSize="$1"
              color="$color9"
              px="$1.5"
              py={1}
              bg="$color3"
              rounded="$1"
              fontFamily="$mono"
            >
              ⌘K
            </Text>
          </XStack>
        </Button>
        <Button
          size="$2"
          minH={32}
          px="$2.5"
          rounded="$3"
          theme={copilotOpen ? 'blue' : undefined}
          bg={copilotOpen ? undefined : '$color2'}
          borderWidth={1}
          borderColor="$borderColor"
          onPress={toggleCopilot}
          aria-pressed={copilotOpen}
          data-slot="crm-copilot-trigger"
        >
          <XStack items="center" gap="$1.5">
            <Sparkles size={13} color={copilotOpen ? '$color12' : '$color11'} />
            <Text fontSize="$2" fontWeight="600" color="$color12">
              AI Copilot
            </Text>
          </XStack>
        </Button>
      </XStack>
    </XStack>
  )
}

function ViewModeButton({
  mode,
  active,
  compact,
  onPress,
}: {
  mode: CrmViewMode
  active: boolean
  compact: boolean
  onPress: () => void
}) {
  const icon =
    mode === 'table' ? (
      <Table size={13} color={active ? '$color12' : '$color10'} />
    ) : mode === 'board' ? (
      <Columns3 size={13} color={active ? '$color12' : '$color10'} />
    ) : (
      <Calendar size={13} color={active ? '$color12' : '$color10'} />
    )
  const label = mode === 'table' ? 'Table' : mode === 'board' ? 'Board' : 'Calendar'
  return (
    <Button
      size="$2"
      minH={compact ? 34 : 26}
      px="$2"
      rounded="$2"
      chromeless={!active}
      bg={active ? '$color4' : 'transparent'}
      role="tab"
      aria-selected={active}
      data-slot="crm-view-mode"
      data-mode={mode}
      onPress={onPress}
    >
      <XStack items="center" gap="$1">
        {icon}
        <Text fontSize="$2" fontWeight={active ? '600' : '500'} color={active ? '$color12' : '$color10'}>
          {label}
        </Text>
      </XStack>
    </Button>
  )
}
