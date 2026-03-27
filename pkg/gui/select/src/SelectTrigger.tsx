import { useComposedRefs } from '@hanzogui/compose-refs'
import type { GuiElement } from '@hanzogui/core'
import type { ListItemProps } from '@hanzogui/list-item'
import { ListItem } from '@hanzogui/list-item'
import * as React from 'react'

import { useSelectContext, useSelectItemParentContext } from './context'
import type { SelectScopedProps } from './types'

/* -------------------------------------------------------------------------------------------------
 * SelectTrigger
 * -----------------------------------------------------------------------------------------------*/
const TRIGGER_NAME = 'SelectTrigger'

export type SelectTriggerProps = SelectScopedProps<ListItemProps>

const isPointerCoarse =
  typeof window !== 'undefined' && process.env.HANZO_GUI_TARGET === 'web'
    ? window.matchMedia('(pointer:coarse)').matches
    : true

export const SelectTrigger = React.forwardRef<GuiElement, SelectTriggerProps>(
  function SelectTrigger(props: SelectTriggerProps, forwardedRef) {
    const { scope, disabled = false, unstyled = false, ...triggerProps } = props

    const context = useSelectContext(scope)
    const itemParentContext = useSelectItemParentContext(scope)
    const composedRefs = useComposedRefs(
      forwardedRef,
      context.floatingContext?.refs.setReference as any
    )
    // const getItems = useCollection(__scopeSelect)
    // const labelId = useLabelContext(context.trigger)
    // const labelledBy = ariaLabelledby || labelId
    if (itemParentContext.shouldRenderWebNative) {
      return null
    }

    return (
      <ListItem
        componentName={TRIGGER_NAME}
        unstyled={unstyled}
        render="button"
        type="button"
        id={itemParentContext.id}
        {...(!unstyled && {
          focusVisibleStyle: {
            outlineStyle: 'solid',
            outlineWidth: 2,
            outlineColor: '$outlineColor',
          },
          borderWidth: 1,
          size: itemParentContext.size,
        })}
        role="combobox"
        aria-haspopup="listbox"
        aria-expanded={context.open}
        aria-autocomplete="none"
        dir={context.dir}
        disabled={disabled}
        data-disabled={disabled ? '' : undefined}
        {...triggerProps}
        ref={composedRefs}
        {...(process.env.HANZO_GUI_TARGET === 'web' && itemParentContext.interactions
          ? {
              ...itemParentContext.interactions.getReferenceProps(),
              ...(isPointerCoarse
                ? {
                    onPress() {
                      itemParentContext.setOpen(!context.open)
                    },
                  }
                : {
                    onMouseDown() {
                      context.floatingContext?.update?.()
                      itemParentContext.setOpen(!context.open)
                    },
                  }),
            }
          : {
              onPress() {
                itemParentContext.setOpen(!context.open)
              },
            })}
      />
    )
  }
)
