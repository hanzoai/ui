'use client'

/**
 * Dock — a macOS-style icon shelf. `DockItem`s sit in a row (or a column, on
 * `left`/`right`) and grow as the pointer nears them; `DockSeparator` splits
 * them into clusters, the way Finder and Safari sit apart from Mail and
 * Calendar in the real thing.
 *
 * The size ramp is a plain pointer-distance calculation retargeting a CSS
 * `width`/`height` transition on each item — the same visual read as a spring
 * without pulling in an animation library the workspace does not carry. Each
 * item tracks its own pointer offset, so hovering one does not re-render its
 * neighbours.
 */
import { SizableText, XStack, YStack, styled } from '@hanzo/gui'
import {
  createContext,
  useContext,
  useState,
  type ComponentProps,
  type PointerEvent as ReactPointerEvent,
  type ReactNode,
} from 'react'
import { sx } from '../../sx'
import { ink } from './ink'
import { slot, tip } from './slot'
import { touch } from './gesture'

export type DockPosition = 'bottom' | 'left' | 'right'

/** Resting size of an item, in px, before any magnification is applied. */
const BASE_SIZE = 48

type DockConfig = { magnification: number; distance: number; position: DockPosition }

const DockConfigContext = /* @__PURE__ */ createContext<DockConfig>({
  magnification: 60,
  distance: 140,
  position: 'bottom',
})

const Frame = styled(XStack, {
  name: 'Dock',
  items: 'flex-end',
  gap: '$1.5',
  p: '$2',
  rounded: '$6',
  borderWidth: 1,
  borderColor: '$borderColor',
  bg: '$panel',
  shadowColor: '$dim',
  shadowRadius: 24,
  shadowOpacity: 0.25,

  variants: {
    // Named `edge`, not `position`: gui's own `position` prop is the CSS
    // property (`relative`/`absolute`/…), and a variant sharing that name
    // would fight it instead of picking a layout.
    edge: {
      bottom: { flexDirection: 'row', items: 'flex-end' },
      left: { flexDirection: 'column', items: 'flex-end' },
      right: { flexDirection: 'column', items: 'flex-start' },
    },
  } as const,

  defaultVariants: { edge: 'bottom' },
})

export type DockProps = Omit<ComponentProps<typeof Frame>, 'edge' | 'position' | 'className'> & {
  className?: string
  position?: DockPosition
  /** How far, in px, a hovered item grows beyond `BASE_SIZE`. */
  magnification?: number
  /** How far, in px either side of an item's centre, the growth reaches. */
  distance?: number
  children?: ReactNode
}

function Dock({
  className,
  position = 'bottom',
  magnification = 60,
  distance = 140,
  children,
  ...props
}: DockProps) {
  return (
    <DockConfigContext.Provider value={{ magnification, distance, position }}>
      <Frame
        {...slot('dock')}
        data-position={position}
        edge={position}
        {...sx(className)}
        {...(props as object)}
      >
        {children}
      </Frame>
    </DockConfigContext.Provider>
  )
}

const ItemFrame = styled(XStack, {
  name: 'DockItem',
  items: 'center',
  justify: 'center',
  rounded: '$4',
  bg: '$hover',
  cursor: 'pointer',
  hoverStyle: { bg: '$edge' },
})

export type DockItemProps = Omit<ComponentProps<typeof ItemFrame>, 'className' | 'onClick'> & {
  className?: string
  children?: ReactNode
  onClick?: () => void
  tooltip?: string
  /** Overrides the Dock's `magnification` for this one item. */
  magnification?: number
  /** Overrides the Dock's `distance` for this one item. */
  distance?: number
}

function DockItem({
  className,
  children,
  onClick,
  tooltip,
  magnification: itemMagnification,
  distance: itemDistance,
  ...props
}: DockItemProps) {
  const { magnification: contextMagnification, distance: contextDistance } =
    useContext(DockConfigContext)
  const magnification = itemMagnification ?? contextMagnification
  const distance = itemDistance ?? contextDistance

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
    <YStack {...slot('dock-item-wrap')} position="relative" items="center">
      {tooltip && hovered ? (
        <XStack
          {...slot('dock-tooltip')}
          position="absolute"
          b="100%"
          mb="$2"
          self="center"
          px="$2"
          py="$1"
          rounded="$3"
          bg="$ink"
          style={{ whiteSpace: 'nowrap' }}
        >
          <SizableText size="$1" color="$sunken">
            {tooltip}
          </SizableText>
        </XStack>
      ) : null}
      <ItemFrame
        {...slot('dock-item')}
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

const SeparatorFrame = styled(YStack, {
  name: 'DockSeparator',
  self: 'center',
  bg: '$borderColor',
})

export type DockSeparatorProps = ComponentProps<typeof SeparatorFrame>

/** A hairline divider that groups items into clusters, e.g. Finder | Mail. */
function DockSeparator(props: DockSeparatorProps) {
  const { position } = useContext(DockConfigContext)
  const vertical = position !== 'bottom'
  return (
    <SeparatorFrame
      {...slot('dock-separator')}
      width={vertical ? 40 : 1}
      height={vertical ? 1 : 40}
      mx={vertical ? 0 : '$1'}
      my={vertical ? '$1' : 0}
      {...props}
    />
  )
}

export { Dock, DockItem, DockSeparator }
