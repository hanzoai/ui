import type { VariantProps } from 'class-variance-authority'
import type { buttonVariants } from '../primitives/button'


  /**
   * A Conf object for the LinkElement primitive.
   */
interface LinkDef extends VariantProps<typeof buttonVariants> {
    /**
     * If the LinkElement is rendered directly and has children, 
     * the title, icon, iconAfter fields in the supplied LinkDef 
     * will be ignored. 
     */ 
  title?: string  

    /**
     * If the LinkElement is rendered directly and has children, 
     * the title, icon, iconAfter fields in the supplied LinkDef 
     * will be ignored. 
     */ 
  icon?: React.ReactNode

    /**
     * If the LinkElement is rendered directly and has children, 
     * the title, icon, iconAfter fields in the supplied LinkDef 
     * will be ignored. 
     */ 
  iconAfter?: boolean

  href: string

    /**
     * External links will open in a new tab (via target='_blank') by default, 
     * while internal ones will open in the same tab.
     * @field newTab overrides these defaults in both cases.
     * ('external' means the url starts with 'http') 
     */
  newTab?: boolean  
  
    /**
     * rendered as a disabled link, shows default cursor, and eats pointer events.
     */
  disabled?: boolean
    /**
     *contents for description link.
     */
  contents?: string

  childMenu?: LinkDef[]
  groupName?: string
}


export {
  type LinkDef as default
}
