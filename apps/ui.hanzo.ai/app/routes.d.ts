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
        | `/blocks`
        | `/docs`
        | `/product`
        | `/ui`
      DynamicRoutes:
        | `/blocks/${OneRouter.SingleRoutePart<T>}`
        | `/docs/${string}`
        | `/product/${OneRouter.SingleRoutePart<T>}`
        | `/ui/${OneRouter.SingleRoutePart<T>}`
      DynamicRouteTemplate:
        | `/blocks/[name]`
        | `/docs/[...slug]`
        | `/product/[name]`
        | `/ui/[name]`
      IsTyped: true
      RouteTypes: {
        '/blocks/[name]': RouteInfo<{ name: string }>
        '/docs/[...slug]': RouteInfo<{ slug: string[] }>
        '/product/[name]': RouteInfo<{ name: string }>
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