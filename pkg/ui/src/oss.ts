// @hanzo/ui/oss — the OSS App Store domain: the catalog client and the blueprint
// reader shared by every surface that shows the same 1000+-app open-source catalog
// (the console App Store, platform.hanzo.ai, and the public gallery at oss.hanzo.ai).
//
// It lives here because it was written three times before it lived anywhere: three
// copies of one catalog's shape, normalizer, URL builders and compose reader, free to
// drift until two surfaces disagreed about what a deploy would start.
//
// Pure and framework-free — no React, no config import — so it is usable from a React
// console, a Next app, and a plain static page alike, and testable without a DOM.
export * from './oss/catalog'
export * from './oss/blueprint'
