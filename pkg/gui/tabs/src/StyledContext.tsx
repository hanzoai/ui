import type { SizeTokens } from '@hanzo/gui-core'
import { createStyledContext } from '@hanzo/gui-core'
import type { TabsProps } from './createTabs'

export type TabsContextValue = {
  baseId: string
  value?: string
  onChange: (value: string) => void
  orientation?: TabsProps['orientation']
  dir?: TabsProps['dir']
  activationMode?: TabsProps['activationMode']
  size: SizeTokens
  registerTrigger: () => void
  unregisterTrigger: () => void
  triggersCount: number
}

export const { Provider: TabsProvider, useStyledContext: useTabsContext } =
  createStyledContext<TabsContextValue>()
