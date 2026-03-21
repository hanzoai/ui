import '@hanzo/gui-polyfill-dev'

import { isServer } from '@hanzo/gui-constants'
import { TamaguiRoot, useDidFinishSSR, useThemeName } from '@hanzo/gui-web'
import { useStackedZIndex, ZIndexHardcodedContext } from '@hanzo/gui-z-index-stack'
import * as React from 'react'
import { createPortal } from 'react-dom'
import { getStackedZIndexProps } from './helpers'
import type { PortalProps } from './PortalProps'

export const Portal = React.memo((propsIn: PortalProps) => {
  const { children, passThrough, style, open } = propsIn

  const themeName = useThemeName()
  const didHydrate = useDidFinishSSR()
  const zIndex = useStackedZIndex(getStackedZIndexProps(propsIn))

  if (passThrough) {
    return children
  }

  if (!didHydrate) {
    return null
  }

  return createPortal(
    <TamaguiRoot
      theme={themeName}
      style={{
        zIndex,
        position: 'fixed',
        inset: 0,
        contain: 'strict',
        pointerEvents: open ? 'auto' : 'none',
        // prevent mobile browser from scrolling/moving this fixed element
        touchAction: 'none',
        display: 'flex',
        ...style,
      }}
    >
      {/* provide computed z-index to children so nested portals can stack above */}
      <ZIndexHardcodedContext.Provider value={zIndex}>
        {children}
      </ZIndexHardcodedContext.Provider>
    </TamaguiRoot>,
    globalThis.document?.body
  )
})
