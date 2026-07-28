// @hanzo/ui/product/social — the ONE Hanzo Social surface, host-agnostic.
//
// `api` is the typed /v1/social contract: the domain types (every component in this
// folder imports them from THERE, so there is one Post, one channel vocabulary),
// defensive normalizers, and `createSocialApi(transport)` — the host injects the
// transport, so this layer never picks an origin or a credential.
//
// `SocialResource` assembles the pieces below into the whole product (compose,
// schedule, list + calendar, publish, connect). Every host renders it — the console's
// Publish product and the dedicated social.hanzo.ai app — so there is no second copy
// to drift. The pieces stay exported for hosts that arrange them themselves.
export * from './api'
export * from './SocialResource'
export * from './ChannelBadge'
export * from './CampaignCard'
export * from './PostCard'
export * from './PostAgenda'
export * from './PostComposer'
export * from './ProviderReadinessList'
export * from './SocialSummaryBar'
export * from './ViewToggle'
export * from './format'
