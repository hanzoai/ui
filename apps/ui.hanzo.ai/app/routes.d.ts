// deno-lint-ignore-file
/* eslint-disable */
// biome-ignore: needed import
import type { OneRouter } from 'one'

declare module 'one' {
  export namespace OneRouter {
    export interface __routes<T extends string = string> extends Record<string, unknown> {
      StaticRoutes:
        | `/`
        | `/_sitemap`
        | `/agents`
        | `/blocks`
        | `/catalog`
        | `/chat`
        | `/docs`
        | `/product`
        | `/settings`
        | `/ui`
      DynamicRoutes:
        | `/agents/${OneRouter.SingleRoutePart<T>}`
        | `/blocks/${OneRouter.SingleRoutePart<T>}`
        | `/catalog/${OneRouter.SingleRoutePart<T>}`
        | `/chat/${OneRouter.SingleRoutePart<T>}`
        | `/docs/${string}`
        | `/product/${OneRouter.SingleRoutePart<T>}`
        | `/settings/${OneRouter.SingleRoutePart<T>}`
        | `/ui/${OneRouter.SingleRoutePart<T>}`
      DynamicRouteTemplate:
        | `/agents/[name]`
        | `/blocks/[name]`
        | `/catalog/[name]`
        | `/chat/[name]`
        | `/docs/[...slug]`
        | `/product/[name]`
        | `/settings/[name]`
        | `/ui/[name]`
      IsTyped: true
      RouteTypes: {
        '/agents/[name]': RouteInfo<{ name: string }>
        '/blocks/[name]': RouteInfo<{ name: string }>
        '/catalog/[name]': RouteInfo<{ name: string }>
        '/chat/[name]': RouteInfo<{ name: string }>
        '/docs/[...slug]': RouteInfo<{ slug: string[] }>
        '/product/[name]': RouteInfo<{ name: string }>
        '/settings/[name]': RouteInfo<{ name: string }>
        '/ui/[name]': RouteInfo<{ name: string }>
      }
    }
  }
}

/**
 * Helper type for route information
 */
type RouteInfo<Params = Record<string, never>> = {
  Params: Params
  LoaderProps: { path: string; search?: string; subdomain?: string; params: Params; request?: Request }
}