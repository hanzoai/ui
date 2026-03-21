import { useAdaptIsActive } from '@hanzo/gui-adapt'
import type { SelectContextValue } from './types'

export const useShowSelectSheet = (context: SelectContextValue) => {
  const breakpointActive = useAdaptIsActive(context.adaptScope)
  return context.open === false ? false : breakpointActive
}
