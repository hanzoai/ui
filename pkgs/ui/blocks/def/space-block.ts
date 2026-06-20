import type { Breakpoint } from '../../types'

import type Block from './block'

type TWSpaceUnit = number // TODO, pull from tw conf 
type HeadingLevel = 0 | 1 | 2 | 3 | 4 | 5 | 6

const SPACE_DEFAULTS = {
  xs: 2,
  sm: 4,
  md: 5,
  lg: 6,
  xl: 8
} satisfies {
  [key in (Breakpoint)]?: TWSpaceUnit
}


interface SpaceBlock extends Block {
  blockType: 'space'

  /**
   * TW units of vertical space, applied at Breakpoints
   * or
   * if just a number, that number at all Breakpoints
   * 
   * default {
   *  xs: 2,
   *  sm: 4,
   *  md: 5,
   *  lg: 6,
   *  xl: 8
   * }
   * 
   * Any provided values will be merge w the defaults
   * And applied as if they were tw classes in ascending
   * order. 
   * 
   * impl: <div className='invisible w-[1px] xs:h-<xsval> sm:h-<smval> etc...' />
   */
  sizes?: {
    [key in (Breakpoint)]?: TWSpaceUnit
  } | TWSpaceUnit

  /**
   * Heading levels.  Gives the vertical space that the corresponding
   * h tag would give. 
   * default: 3 (height of <h3>) 
   * 0 = 1rem (plus any gaps), 
   * For example, 1 = <h1 style={visibility: hidden}>&nbsp;</h1> 
   *   As <ApplyTypography> would render it, plus any gap.
   */
  level?: HeadingLevel

  test?: boolean

}

export {
  type SpaceBlock as default,
  type TWSpaceUnit,
  type HeadingLevel,
  SPACE_DEFAULTS
}
