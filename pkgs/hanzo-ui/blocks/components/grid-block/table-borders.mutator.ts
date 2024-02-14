import type GridBlockMutator from './grid-block-mutator'

const getCellClx = (
  cellIndex: number, 
  cellCount: number, 
  colCount: number
): string => {

  const isFirstRow = (): boolean  => (cellIndex < colCount)
  const isFirstColumn = (): boolean  => (cellIndex % colCount === 0)
  const isTLCorner = (): boolean  => (cellIndex === 0)
  const isTRCorner = (): boolean  => (cellIndex === colCount -1 )
  const isBLCorner = (): boolean  => (cellIndex === cellCount - colCount)
  const isBRCorner = (): boolean  => (cellIndex === cellCount - 1)

    // all get a right and bottom border and padding, 
    // other borders are a special base
  let clx = 'border-b md:border-r p-4 md:p-8 lg:p-12 '
  if (isFirstRow()) {
    clx += 'border-t '
  }
  if (isFirstColumn()) {
    clx += 'md:border-l '
  }
    // on mobile this will be the first (top) cell
  if (isTLCorner()) {
    clx += 'border-t md:rounded-tl-lg '
  }
  else if (isTRCorner()) {
    clx += 'md:rounded-tr-lg '
  }
  else if (isBLCorner()) {
    clx += 'md:rounded-bl-lg '
  }
  else if (isBRCorner()) {
    clx += 'md:rounded-br-lg '
  }

  return clx
} 

const gapClx = 'gap-0 md:gap-0 xl:gap-9'

export default {
  getCellClx,
  gapClx
} as GridBlockMutator
