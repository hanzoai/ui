// deno-lint-ignore-file: no-empty
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
        '/agents/[name]': RouteInfo
