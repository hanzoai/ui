import type LinkDef from './link-def'

interface SiteDef {
  currentAs?: string
  mainNav: {
    short?: LinkDef[]
    aux?: LinkDef[]
    full: LinkDef[]
  }
  footer: LinkDef[][]  // columns of links (on desktop)
}

export { type SiteDef as default }