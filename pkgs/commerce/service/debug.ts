import type { CategoryNode,  CategoryNodeRole, Family, LineItem } from '../types'

  // Node recursion
export const categoryNodeDump = (node: CategoryNode, level: number = 0): void => {
  const spacers: string[] = []
  for (let i = 0; i < level; i++) {
    spacers.push('----')
  }
  console.log("NODE:" + spacers.join(''), node.skuToken)
  node.subNodes?.forEach((sn: CategoryNode) => {categoryNodeDump(sn, level + 1)})
}

export const selectedFamiliesDump = (result: Family[]): string => {
  const toDisplay = result.map((c) => (c.id))
  return JSON.stringify(toDisplay, null, 2)
}

export const peekDump = (result : {
    role: CategoryNodeRole
    family: Family | undefined
    families: Family[] | undefined
    node: CategoryNode | undefined
    item: LineItem | undefined
} | string): string => {

  if (typeof result === 'string') {
    return result
  }

  const toDisplay = {
    role: result.role,
    item: result.item ? result.item.sku : 'UNDEF',
    family: result.family ? result.family.id : 'UNDEF',
    families: result.families ? result.families.map((f) => (f.id)) : 'UNDEF',
    node: result.node ?
      (result.node.skuToken + (result.node.label ? (': ' + result.node.label) : ''))
      :
      'UNDEF'
  }
  return JSON.stringify(toDisplay, null, 2)
}
