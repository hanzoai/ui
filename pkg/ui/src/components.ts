// @hanzo/ui/components — alias of the component API (the shadcn backend surface).
//
// Some hosts re-export the library through this subpath (e.g. a
// `declare module '@hanzo/ui' { export * from '@hanzo/ui/components' }` shim).
// It resolves to the same canonical surface as the root barrel.
export * from './backends/shadcn'
