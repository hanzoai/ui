import type { Dimensions } from  '../../../types'
import type {TypographySize } from '../../../primitives/index-blocks'
import {
  getSpecifierData, 
  getPrimaryStartingWith, 
  getDim, 
} from '../../../util/specifier'

export const getTypographySize = (s: string): TypographySize => (
  getSpecifierData<TypographySize>(
    s,
    (s: string) => (getPrimaryStartingWith(s, 'typography')),
    (s: string): TypographySize | undefined => {
      const subTokenArray = s.split('-')
      return subTokenArray[subTokenArray.length - 1] as TypographySize
    },
    'responsive'
  ) as TypographySize
)

export const getSmallIconDim = (s: string): Dimensions | undefined => (
  getSpecifierData<Dimensions>(
    s,
    (s: string) => (getPrimaryStartingWith(s, 'small-icon')),
    getDim,
  ) 
)

