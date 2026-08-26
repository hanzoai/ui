// @hanzo/ui/blocks — content as data, and the renderers that draw it.
//
//   import { Content, type Block } from '@hanzo/ui/blocks'
//   <Content blocks={page} agent={agent} />
//
// A page is a `Block[]`. Each block names its type, the type picks a renderer,
// and the renderer reads the rest of the fields. So the content can be authored
// in a CMS, checked into a repo or produced by a server, and typed either way.
//
// The types and the components are both exported from here because the 5.x line
// exported them from here, and every consuming site imports both. `Block` is the
// type, `BlocksComponent` draws a list of them — the `…Component` suffix is what
// tells the two apart at a call site where both are in scope.

export * from './def'
export type { BlockComponentProps } from './spec'
export { has, fit } from './spec'

export { Content, Content as BlocksComponent, Content as ContentComponent, registerBlockType } from './content'

export { AccordianBlockComponent } from './accordian'
export { BulletCardsBlockComponent } from './bullet-cards'
export { CardBlockComponent } from './card'
export { CarteBlancheBlockComponent } from './carte-blanche'
export { CTABlockComponent } from './cta'
export { EnhHeadingBlockComponent } from './enh-heading'
export { GridBlockComponent } from './grid'
export { GroupBlockComponent } from './group'
export { HeadingBlockComponent } from './heading'
export { ImageBlockComponent } from './image'
export { ScreenfulBlockComponent } from './screenful'
export { SpaceBlockComponent } from './space'
export { VideoBlockComponent } from './video'
