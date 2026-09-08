'use client'

/**
 * MacosDock — the floating icon shelf from macOS itself: real frosted glass
 * (the same `glass()` material every menu and dialog in this library wears),
 * a gradient sheen across the top, and items that grow as the pointer nears
 * them, with a glass tooltip rising above the one you are on.
 *
 * `Dock`/`DockItem` in `./dock` already cover a plain icon shelf on any edge
 * of the screen; this is the specific, always-bottom, always-glass macOS
 * read, so the two live under different names rather than one file growing a
 * `glass` toggle nobody asked for.
 *
 * Magnification is a pointer-distance calculation retargeting a CSS
 * `width`/`height` transition per item — the same visual read as a spring
 * without pulling in an animation library the workspace does not carry. Each
 * item tracks its own pointer offset, so hovering one does not re-render its
 * neighbours.
 */
import { XStack, YStack, styled } from '@hanzo/gui'
import {
  createContext,
  useContext,
  useState,
  type ComponentProps,
  type PointerEvent as ReactPointerEvent,
  type ReactNode,
} from 'react'
import { sx } from '../../sx'
import { glass } from '../../glass'
import { ink } from './ink'
import { slot, tip } from './slot'
import { touch } from './gesture'

/** Resting size of an item, in px, before any magnification is applied. */
const BASE_SIZE = 48

type MacosDockConfig = { magnification: number; distance: number }

const MacosDockConfigContext = /* @__PURE__ */ createContext<MacosDockConfig>({
  magnification: 60,
  distance: 140,
})

const Frame = styled(XStack, {
  name: 'MacosDock',
  self: 'center',
  items: 'flex-end',
  gap: '$2',
  px: '$3',
  pb: '$2',
  minH: 64,
  rounded: '$6',
  borderWidth: 1,
  shadowColor: '$dim',
  shadowRadius: 24,
  shadowOpacity: 0.2,
})

export type MacosDockProps = Omit<ComponentProps<typeof Frame>, 'className'> & {
  className?: string
  /** Maximum magnification amount in pixels. */
  magnification?: number
  /** Distance from the pointer, in pixels, where magnification starts. */
  distance?: number
  children?: ReactNode
}

/** The main container component for the macOS dock. */
function MacosDock({ className, magnification = 60, distance = 140, children, ...props }: MacosDockProps) {
  return (
    <MacosDockConfigContext.Provider value={{ magnification, distance }}>
      <Frame {...slot('macos-dock')} {...glass(2)} {...sx(className)} {...(props as object)}>
        {children}
      </Frame>
    </MacosDockConfigContext.Provider>
  )
}

const ItemFrame = styled(XStack, {
  name: 'MacosDockItem',
  items: 'center',
  justify: 'center',
  rounded: '$4',
  bg: '$hover',
  cursor: 'pointer',
  overflow: 'hidden',
  hoverStyle: { bg: '$edge' },
  focusStyle: { outlineColor: '$outlineColor', outlineWidth: 2, outlineStyle: 'solid' },
})

export type MacosDockItemProps = Omit<ComponentProps<typeof ItemFrame>, 'className' | 'onClick'> & {
  className?: string
  children?: ReactNode
  onClick?: () => void
  /** Tooltip text to show on hover. */
  tooltip?: string
}

/** Individual dock item component: an icon that magnifies and can carry a tooltip. */
function MacosDockItem({ className, children, onClick, tooltip, ...props }: MacosDockItemProps) {
  const { magnification, distance } = useContext(MacosDockConfigContext)
  const [size, setSize] = useState(BASE_SIZE)
  const [hovered, setHovered] = useState(false)

  const handleMove = (e: ReactPointerEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect()
    if (distance <= 0) return
    const centerX = rect.left + rect.width / 2
    const offset = Math.min(Math.abs(e.clientX - centerX), distance)
    setSize(BASE_SIZE + magnification * (1 - offset / distance))
  }

  const handleLeave = () => {
    setSize(BASE_SIZE)
    setHovered(false)
  }

  return (
    <YStack {...slot('macos-dock-item-wrap')} position="relative" items="center">
      {tooltip && hovered ? (
        <XStack
          {...slot('macos-dock-tooltip')}
          position="absolute"
          b="100%"
          mb="$2"
          self="center"
          px="$2"
          py="$1"
          rounded="$3"
          {...glass(3)}
          style={{ whiteSpace: 'nowrap' }}
        >
          {ink(tooltip)}
        </XStack>
      ) : null}
      <ItemFrame
        {...slot('macos-dock-item')}
        render="button"
        {...({ type: 'button' } as object)}
        onClick={onClick}
        onPointerEnter={() => setHovered(true)}
        onPointerMove={handleMove}
        onPointerLeave={handleLeave}
        {...(tooltip ? tip(tooltip) : null)}
        {...touch(BASE_SIZE, 44)}
        style={{ width: size, height: size, transition: 'width 150ms ease-out, height 150ms ease-out' }}
        {...sx(className)}
        {...(props as object)}
      >
        {ink(children)}
      </ItemFrame>
    </YStack>
  )
}

export { MacosDock, MacosDockItem }
