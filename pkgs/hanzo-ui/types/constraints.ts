import type { Breakpoint } from './breakpoints'

type Constraint = {
  w: number | `${number}%` | 'auto'
  h: number | `${number}%` | 'auto'
} 

/** 
 * All values are in tw spacing units
 * 
 * 
 * NOTE: If applying in one dimension because other 
 * is auto in style, ImageBlockComp applies this with style={} 
 * so it has higher precidence than tw classes. Otherwise,
 * tw classes will be used.
 */

type ResponsiveConstraints = {
  [key in (Breakpoint)]?: Constraint
}

type Constraints = Constraint | ResponsiveConstraints

export {
  type Constraint,
  type ResponsiveConstraints,
  type Constraints
}