import type { ButtonVariants, ButtonSizes } from '../primitives/button'
import type { Icon }  from '.'

/**
 * A Conf object for the LinkElement primitive.
 * 
 * 
 */
interface LinkDef {
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
  icon?: Icon

    /**
     * If the LinkElement is rendered directly and has children, 
     * the title, icon, iconAfter fields in the supplied LinkDef 
     * will be ignored. 
     */ 
  iconAfter?: boolean

  href: string

    /**
     * @deprecated This field no longer has an effect as
     * the related logic just checks for the presence of 'http' 
     * at the start of the URL string
     */
  external?: boolean 

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

  variant?: ButtonVariants
  size?: ButtonSizes
}

export {
  type LinkDef as default
}
