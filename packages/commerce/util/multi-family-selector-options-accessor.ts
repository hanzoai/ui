import type { MultiFamilySelectorOptions } from '../types'

export default (options: MultiFamilySelectorOptions | undefined = {}): Required<MultiFamilySelectorOptions> => {

  const showParentTitle = 'showParentTitle' in options ? options.showParentTitle! : true
  const showItemSwatches = 'showItemSwatches' in options ? options.showItemSwatches! : true

  const parentByline = 'parentByline' in options ? options.parentByline! : 'none'

  return {
    showParentTitle,
    showItemSwatches,
    parentByline,
  }
}