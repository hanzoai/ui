import type { SelectedPaths } from '../types'
import sep from './sep'

export const getSelectedPaths = (
  skuPath: string
): { paths: SelectedPaths; level: number } => {
  
  const toks = skuPath.split(sep.tok)
  const level = toks.length - 1
  const paths: SelectedPaths = {}
  for (let l = 1; l <= level; l++ ) {
    paths[l] = [toks[l]]   
  } 
  return {
    paths,
    level
  }
}

export const getParentPath = (skuPath: string): string => (
  skuPath.split(sep.tok).slice(0, -1).join(sep.tok)
)

export const lastToken = (skuPath: string): string => (
  skuPath.split(sep.tok).pop()!
)