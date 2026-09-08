import { Accordion, H4, Input, Paragraph, SizableText, Text, View, XStack, YStack } from '@hanzo/gui'
import { ChevronDown } from '@hanzogui/lucide-icons-2'
import type { Href } from 'one'
import { Link, usePathname } from 'one'
import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'

export type Item = { name: string; title: string; href: string }
export type Section = { title: string; items: Item[] }
export type Heading = { id: string; title: string; level: 2 | 3 }

/** The bar every Hanzo surface wears, and the measure the frame shares with it. */
export const HEADER = 60
export const WIDTH = 1280

/** A heading's anchor: lowercased, one dash per run of anything else. */
export const slug = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')

/** The filter's element id: the header, ⌘K and the sidebar all name the one input. */
const FILTER = 'filter'

type Menu = {
  open: boolean
  setOpen: (open: boolean) => void
  query: string
  setQuery: (query: string) => void
  /** Show the sidebar where it is hidden, and put the cursor in its filter. */
  focus: () => void
}

const Context = createContext<Menu>({ open: false, setOpen: () => {}, query: '', setQuery: () => {}, focus: () => {} })

export const useMenu = () => useContext(Context)

/** The menu and the filter, shared by the header that drives them and the
 *  sidebar that shows them. ⌘K is the filter's key everywhere on the page. */
export function Docs({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const value = useMemo<Menu>(() => {
    const focus = () => {
      setOpen(true)
      setTimeout(() => document.getElementById(FILTER)?.focus(), 0)
    }
    return { open, setOpen, query, setQuery, focus }
  }, [open, query])
  useEffect(() => {
    const key = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        value.focus()
      }
    }
    window.addEventListener('keydown', key)
    return () => window.removeEventListener('keydown', key)
  }, [value])
  return <Context.Provider value={value}>{children}</Context.Provider>
}

/**
 * The docs frame: sidebar, page, quick nav — three grid columns from 1280,
 * two from 1024, and below that the page alone, the sidebar folded behind the
 * header's menu button.
 */
export function Frame({ sections, headings = [], children }: { sections: Section[]; headings?: Heading[]; children: ReactNode }) {
  return (
    <View
      display="grid"
      gridTemplateColumns="minmax(0, 1fr)"
      $lg={{ gridTemplateColumns: '280px minmax(0, 1fr)' }}
      $xl={{ gridTemplateColumns: '280px minmax(0, 1fr) 220px' }}
      width="100%"
      maxW={WIDTH}
      self="center"
      grow={1}
    >
      <Sidebar sections={sections} />
      <YStack render="main" minW={0} px="$4" py="$6" $lg={{ px: '$6', py: '$8' }}>
        <YStack render="article" width="100%" maxW="var(--container-wide)" gap="$7">
          {children}
        </YStack>
      </YStack>
      <QuickNav headings={headings} />
    </View>
  )
}

function Sidebar({ sections }: { sections: Section[] }) {
  const { open, setOpen, query, setQuery } = useMenu()
  const path = usePathname()
  const q = query.trim().toLowerCase()
  const shown = q
    ? sections
        .map((s) => ({ ...s, items: s.items.filter((i) => i.title.toLowerCase().includes(q) || i.name.includes(q)) }))
        .filter((s) => s.items.length)
    : sections
  const current = sections.find((s) => s.items.some((i) => i.href === path))?.title
  const [opened, setOpened] = useState<string[]>(current ? [current] : sections.slice(0, 1).map((s) => s.title))
  useEffect(() => {
    if (current) setOpened((v) => (v.includes(current) ? v : [...v, current]))
  }, [current])
  // A route change closes the menu that led to it.
  useEffect(() => setOpen(false), [path, setOpen])
  return (
    <YStack
      render="aside"
      className="rail"
      display={open ? 'flex' : 'none'}
      position="fixed"
      t={HEADER}
      l={0}
      r={0}
      b={0}
      z={90}
      bg="$background"
      px="$4"
      pt="$4"
      pb="$10"
      gap="$3"
      $lg={{
        display: 'flex',
        position: 'sticky',
        l: 'auto',
        r: 'auto',
        b: 'auto',
        self: 'flex-start',
        height: `calc(100vh - ${HEADER}px)`,
        width: '100%',
        bg: 'transparent',
        pl: 0,
        pr: '$3',
      }}
    >
      <Input
        id={FILTER}
        value={query}
        onChangeText={setQuery}
        placeholder="Filter"
        aria-label="Filter the catalog"
        size="$3"
        ml="$3"
        fontFamily="$mono"
      />
      <Accordion type="multiple" value={q ? shown.map((s) => s.title) : opened} onValueChange={setOpened}>
        {shown.map((s) => (
          <Accordion.Item key={s.title} value={s.title}>
            <Accordion.Trigger
              unstyled
              bg="transparent"
              borderWidth={0}
              rounded="$3"
              ml="$2"
              hoverStyle={{ bg: '$color2' }}
              pressStyle={{ bg: '$color1' }}
            >
              {({ open }: { open: boolean }) => (
                <XStack py="$2" px="$3" justify="space-between" items="center" width="100%">
                  <Text fontSize={13} fontWeight="600" color="$color12">
                    {s.title}
                  </Text>
                  <YStack rotate={open ? '180deg' : '0deg'} animateOnly={['transform']}>
                    <ChevronDown color="$color8" size={14} />
                  </YStack>
                </XStack>
              )}
            </Accordion.Trigger>
            <Accordion.HeightAnimator overflow="hidden">
              <Accordion.Content unstyled bg="transparent" exitStyle={{ opacity: 0 }}>
                <YStack py="$1">
                  {s.items.map((i) => (
                    <NavItem key={i.href} item={i} active={i.href === path} />
                  ))}
                </YStack>
              </Accordion.Content>
            </Accordion.HeightAnimator>
          </Accordion.Item>
        ))}
      </Accordion>
      {q && shown.length === 0 ? (
        <Paragraph size="$2" color="$color10" px="$3">
          Nothing named {query}.
        </Paragraph>
      ) : null}
    </YStack>
  )
}

function NavItem({ item, active }: { item: Item; active: boolean }) {
  return (
    <Link href={item.href as Href} style={{ textDecorationLine: 'none' }}>
      <XStack
        items="center"
        px="$4"
        py={6}
        position="relative"
        rounded="$3"
        hoverStyle={{ bg: '$color2' }}
        pressStyle={{ bg: '$color3' }}
      >
        <YStack position="absolute" t={4} b={4} l={0} width={3} rounded="$2" bg="$color12" opacity={active ? 1 : 0} />
        <SizableText
          fontFamily="$mono"
          size="$3"
          letterSpacing={-0.25}
          opacity={active ? 1 : 0.65}
          hoverStyle={{ opacity: 0.85 }}
          {...(active && { fontWeight: '700' })}
        >
          {item.title}
        </SizableText>
      </XStack>
    </Link>
  )
}

/** The page's own headings, the one the reader is at marked, kept by an observer
 *  whose reading line sits 70% down the screen. */
function QuickNav({ headings }: { headings: Heading[] }) {
  const [active, setActive] = useState(0)
  const path = usePathname()
  useEffect(() => setActive(0), [path])
  useEffect(() => {
    if (!headings.length) return
    const seen = new Set<string>()
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) e.isIntersecting ? seen.add(e.target.id) : seen.delete(e.target.id)
        if (seen.size) {
          let last = -1
          seen.forEach((id) => (last = Math.max(last, headings.findIndex((h) => h.id === id))))
          if (last !== -1) setActive(last)
        } else if (window.scrollY < 100) setActive(0)
      },
      { rootMargin: '100% 0px -30% 0px', threshold: 0 },
    )
    for (const h of headings) {
      const el = document.getElementById(h.id)
      if (el) io.observe(el)
    }
    return () => io.disconnect()
  }, [headings])
  return (
    <YStack
      render="aside"
      display="none"
      $xl={{ display: 'flex' }}
      position="sticky"
      t={HEADER}
      self="flex-start"
      pt="$8"
      pb="$10"
      pl="$4"
    >
      {headings.length > 0 ? (
        <YStack render="nav" aria-labelledby="quick-nav" gap="$3">
          <H4 id="quick-nav" fontFamily="$mono" size="$2" letterSpacing={1} color="$color10">
            On this page
          </H4>
          <YStack borderLeftWidth={1} borderColor="$borderColor">
            {headings.map((h, i) => (
              <a key={h.id} href={`#${h.id}`} onClick={() => setActive(i)} style={{ textDecoration: 'none' }}>
                <Paragraph
                  render="span"
                  size={h.level === 2 ? '$3' : '$2'}
                  ml={-1}
                  pl={h.level === 2 ? 12 : 24}
                  py="$1"
                  borderLeftWidth={2}
                  borderColor={i === active ? '$color12' : 'transparent'}
                  color={i === active ? '$color12' : h.level === 2 ? '$color11' : '$color10'}
                  fontWeight={h.level === 2 ? '500' : '400'}
                  cursor="pointer"
                  hoverStyle={{ color: '$color12' }}
                >
                  {h.title}
                </Paragraph>
              </a>
            ))}
          </YStack>
        </YStack>
      ) : null}
    </YStack>
  )
}
