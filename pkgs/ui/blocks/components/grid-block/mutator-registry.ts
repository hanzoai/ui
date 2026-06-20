import type GridBlockMutator from './grid-block-mutator'

import tableBorders from './table-borders.mutator'

const map = new Map<string, GridBlockMutator>()
map.set('style-table-borders', tableBorders)

  // get 
export default (key: string): GridBlockMutator | undefined => (map.get(key))

