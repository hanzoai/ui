import type LinkDef from './link-def'

interface SiteDef {
  currentAs?: string
  nav: {
    elements: LinkDef[]
    featuredCTA?: LinkDef
  }
  footer: LinkDef[][]  // columns of links (on desktop)
}

export { type SiteDef as default }