import { createStyledContext } from '@hanzo/gui-web'

export const context = createStyledContext({
  color: '',
  active: false,
})

export const useToggleGroupItem = () => {
  return context.useStyledContext()
}
