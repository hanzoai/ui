# @hanzo/rooms

The workspace rooms — Home, Chat, Inbox, Contacts, Meet, Cal, Drive, Board,
Work, Bots, Guide, Settings and the frame that holds them (Room, Shell, Orgs) —
once, for every surface. hanzo.ai and hanzo.team import them; neither keeps a
copy.

## Why its own package

`@hanzo/ui` is presentational: data in, events out, no fetch. The rooms are
connected — they hold an IAM session, an `@hanzo/ai` client, billing and plan
reads — and they bring `@hanzo/ai`, `@hanzo/voice`, `@hanzo/build`,
`@hanzo/usage`, `@hanzo/personas` and `marked`. On `@hanzo/ui` those would be
peers of every app that only wants a Button. Beside it, in this monorepo, they
share the gui train, the catalog and the publish lane, the way `@hanzo/composer`
and `@hanzo/appearance` do. `@hanzo/build` (hanzoai/build) is the same shape for
the builder.

Peers: `@hanzo/ui`, `@hanzo/gui`, `@hanzo/appearance`, `@hanzo/ai`,
`@hanzo/iam`, `@hanzo/plans`, `@hanzo/usage`, `@hanzo/voice`, `@hanzo/build`,
`@hanzogui/lucide-icons-2`, `react`. No `next`, no `next-themes`.

## What a host passes

One provider, configured once at the layout. Everything else the rooms used to
reach into the app for moves INTO this package, because both apps carried a copy
of it: the IAM session reader (`bearer`, `scope`, `org`, `orgs`, `pick`,
`superAdmin`, `assumed`, `support`), `useAi`, `useTier`/`useLimits`/
`useSubscription`, plan reads, invitations, shares, coding runs, durable/todo,
`mix`, `useHydrated`, the persona strings.

```tsx
import { Rooms, Room } from '@hanzo/rooms'

<Rooms
  api="https://api.hanzo.ai"          // gateway origin; every /v1 call
  iam="https://hanzo.id"              // IAM origin; the session's issuer
  brand={hanzo}                       // @hanzo/brand: name, mark, hosts
  routes={routes}                     // where things live on THIS host
  navigate={navigate}                 // { push, replace, back, forward }
  Link={Link}                         // next/link, or an <a> on Vite/Tauri
  search={useSearchParams()}          // the address's query
  track={track}                       // analytics sink, (event, props) => void
  slots={{ ProviderMark, Landing, Gate, Signup }}
>
  <Room mode="cal" />
</Rooms>
```

- `routes` is the only thing that differs between the two sites today:
  `home` (`/home` on hanzo.ai, `/` on hanzo.team), `signIn`/`signUp` (`/login`,
  `/signup` vs `/start`), `site(path)` (relative on hanzo.ai, absolute
  `https://hanzo.ai/...` on hanzo.team), `dev(ref)`, `chat(id)`, `pay(...)`,
  `invite`.
- `navigate` + `Link` + `search` replace `next/navigation` and `next/link`.
  `Room` is already the only router binding; `Workspace` already takes
  `navigate`/`back`/`forward`.
- The session is read through `@hanzo/iam/react`; the host mounts
  `IamProvider` as it does now. No session object is passed.
- Theme and accent come from `@hanzo/appearance` (`useScheme`, `useAppearance`);
  the rooms import no theme library. The theme row in Settings is the
  Appearance panel's.
- `slots` are the host's own: `ProviderMark` (pulls simple-icons and logo
  data), `Landing`, `Gate` and `Signup` (hanzo.team's front door), the
  integrations list.
- Colour: one accent (`$accentBackground` / `var(--primary)` family), neutral
  tags (`$panel`/`$edge`, `$ink`/`$soft`), status-only hue (`$bad`, `$good`).
  No literal colour in a room; a data hue (an avatar tint, a brand logo) is
  content and says so.

## Moving the rooms (phase B)

1. hanzo.ai `components/workspace/*` is the source of truth. Port what only
   hanzo.team has: the Orgs front door (`front`/`forward`/`signup`, `Start`
   naming + invites, the per-seat `Plan` screen, `Forward`), `Room front`,
   `open.ts` project state, and Account's balance block where the room still
   wants it.
2. Each `@/…` import becomes a package module or a `Rooms` prop, per the list
   above. `team.ts` persona markdown is turned into strings at build time.
3. Both apps mount `<Rooms>` in `app/(app)/layout.tsx`, routes render
   `<Room mode=…>`, and `components/workspace/*` is deleted in both.
4. Gates: `pnpm --filter @hanzo/rooms... build`, `tsc --noEmit`, vitest, and
   `hanzo-design-lint` on the package; each app's typecheck, lint:design, gates.
