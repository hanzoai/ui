interface GridBlockMutator {
  gapClx?: string 
  getCellClx?: (
    cellIndex: number, 
    cellCount: number, 
    colCount: number
  ) => string
}

export {
  type GridBlockMutator as default
}