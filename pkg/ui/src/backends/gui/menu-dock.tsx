'use client'

/**
 * MenuDock — a pill of icon buttons, laid out as a row or a column, each one
 * showing its label as a tooltip on hover and a filled treatment when active.
 *
 * Unlike `Dock`, there is no pointer-distance magnification: an item is either
 * `active` or not, and the whole thing is one `items` array rather than a set
 * of composed children — the shape a navigation rail or a bottom tab bar wants.
 */
import { SizableText, XStack, YStack, styled } from '@hanzo/gui'
import { Fragment, type ComponentProps, type ReactNode, useState } from 'react'
import { sx } from '../../sx'
import { ink } from './ink'
import { slot, tip } from './slot'
import { touch } from './gesture'

export type MenuDockOrientation = 'horizontal' | 'vertical'

export type MenuDockItem = {
  icon: ReactNode
  label: string
  onClick?: () => void
  active?: boolean
}

const ITEM_SIZE = 44

const Frame = styled(XStack, {
  name: 'MenuDock',
  gap: '$2',
  p: '$2',
  rounded: '$10',
  borderWidth: 1,
  borderColor: '$borderColor',
  bg: '$panel',
  shadowColor: '$dim',
  shadowRadius: 24,
  shadowOpacity: 0.25,

  variants: {
    orientation: {
      horizontal: { flexDirection: 'row' },
      vertical: { flexDirection: 'column' },
    },
  } as const,

  defaultVariants: { orientation: 'horizontal' },
})

export type MenuDockProps = Omit<ComponentProps<typeof Frame>, 'orientation' | 'className' | 'items'> & {
  className?: string
  items: MenuDockItem[]
  orientation?: MenuDockOrientation
}

const ItemFrame = styled(XStack, {
  name: 'MenuDockItem',
  items: 'center',
  justify: 'center',
  width: ITEM_SIZE,
  height: ITEM_SIZE,
  rounded: '$10',
  bg: 'transparent',
  cursor: 'pointer',
  hoverStyle: { bg: '$hover' },

  variants: {
    active: {
      true: { bg: '$ink', hoverStyle: { bg: '$ink' } },
    },
  } as const,
})

function MenuDockButton({
  item,
  orientation,
}: {
  item: MenuDockItem
  orientation: MenuDockOrientation
}) {
  const [hovered, setHovered] = useState(false)
  return (
    <YStack {...slot('menu-dock-item-wrap')} position="relative" items="center">
      {hovered ? (
        <XStack
          {...slot('menu-dock-tooltip')}
          position="absolute"
          {...(orientation === 'vertical'
            ? { l: '100%', ml: '$2', t: '50%', style: { transform: 'translateY(-50%)' } }
            : { b: '100%', mb: '$2', self: 'center' as const })}
          px="$2"
          py="$1"
          rounded="$3"
          bg="$ink"
          style={{ ...(orientation === 'vertical' ? { transform: 'translateY(-50%)' } : {}), whiteSpace: 'nowrap' }}
        >
          <SizableText size="$1" color="$sunken">
            {item.label}
          </SizableText>
        </XStack>
      ) : null}
      <ItemFrame
        {...slot('menu-dock-item')}
        data-active={item.active ? 'true' : 'false'}
        render="button"
        {...({ type: 'button' } as object)}
        active={item.active}
        onClick={item.onClick}
        onPointerEnter={() => setHovered(true)}
        onPointerLeave={() => setHovered(false)}
        {...tip(item.label)}
        {...touch(ITEM_SIZE, 44)}
      >
        {ink(item.icon)}
        <SizableText {...slot('menu-dock-item-label')} size="$1" style={{ position: 'absolute', width: 1, height: 1, overflow: 'hidden', clip: 'rect(0 0 0 0)' }}>
          {item.label}
        </SizableText>
      </ItemFrame>
    </YStack>
  )
}

export function MenuDock({ className, items, orientation = 'horizontal', ...props }: MenuDockProps) {
  return (
    <Frame
      {...slot('menu-dock')}
      data-orientation={orientation}
      orientation={orientation}
      {...sx(className)}
      {...(props as object)}
    >
      {items.map((item, index) => (
        <Fragment key={index}>
          <MenuDockButton item={item} orientation={orientation} />
        </Fragment>
      ))}
    </Frame>
  )
}
