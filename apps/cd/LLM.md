# Hanzo CD — the dedicated deploy dashboard (cd.hanzo.ai)

A focused, mobile-first CD dashboard served at **cd.hanzo.ai**. It replaces the
ArgoCD React fork (`~/work/hanzo/deploy/ui`, webpack/`argo-cd-ui`) with the shared
Hanzo component packages over the native cloud CD plane. Its whole job: **see every
service deployed as an operator App CR — stats · sync · health · resource tree ·
logs · sync/rollback.**

## Stack + why

- **Vite + React 19 static SPA** → `dist/` (a static bundle, no runtime server).
- **`@hanzo/gitops`** (workspace) is the ArgoCD-replacement UI — a clean-room,
  framework-free port (plain React + scoped CSS, no Tamagui/Tailwind). We mount
  `GitopsAppList` (the fleet), and compose `GitopsSyncPanel` + `GitopsAppTree` +
  `GitopsNodeInfo` + `GitopsRollbackDialog` for the app detail (lazy per-node
  `/resource` + `/logs` fetch).
- **`@hanzo/canvas/pure`** (workspace) for the pure helpers.
- The workspace packages are resolved by **Vite path alias** (`vite.config.ts`),
  so the app builds off `@hanzo/gitops/dist` + `@hanzo/canvas/src` **without a full
  monorepo install** (the shared pnpm store lacks the registry deps of the heavier
  packages). Run `pnpm --filter @hanzo/gitops build` once if its `dist` is stale.

## Backend + auth (the contract this preserves)

- **API = the cloud binary at `/v1/deploy`** (SuperAdmin-gated, clean paths —
  `applications`, `:name/tree`, `:name/resource/:ref`, `:name/logs`, `sync`,
  `rollback`). The cd.hanzo.ai ingress peels `/v1/deploy/*` off to `cloud:8000`;
  the SPA calls it **same-origin** with `credentials: 'include'`.
- **Auth = the `admin-console` PKCE gate** (`public/login.html`, ported verbatim
  from the ArgoCD fork — self-contained, proven): `hanzo.id` → sets the non-httpOnly
  `hanzo_iam_token` cookie the cloud binary validates (`SanitizeIdentity` →
  `c.IsAdmin()`). The SPA reads that cookie for its gate; a missing/expired session
  (or an API 401/403) lands on the sign-in screen — never a fabricated row.
- `src/lib/adapt.ts` maps the `/v1/deploy` DTOs INTO the shared `@hanzo/gitops`
  view-models (reusing the package's own `foldHealth`/`foldSync`). Note: the cloud
  wire uses the hyphenated `out-of-sync`, which `foldSync` (whitespace-only strip)
  reads as Unknown — the adapter strips `[-_]` before folding.

## Build + serve

```bash
pnpm --filter cd build      # tsc -b && vite build → dist/ (index.html + login.html + CNAME + assets)
pnpm --filter cd preview    # serve dist locally
pnpm --filter cd dev        # vite dev (proxies /v1 → CD_API, default https://cd.hanzo.ai)
```

Serving: the built `dist/` is a static bundle published to **`s3://cdn/cd`** — the
existing static plane cd.hanzo.ai already serves (ingress `staticFiles` +
`spaMode`, zero pods; see `universe/infra/k8s/operator/crs/static-sites.yaml`). No
ingress or backend change: publish the bundle, retire the old ArgoCD `ui/` + the
`deploy/dashboard.go` embed.

## Verify

- `tsc --noEmit -p tsconfig.app.json` — clean.
- `npx vitest run src/lib/adapt.test.ts` — the `/v1/deploy` → `@hanzo/gitops`
  mapping (incl. the `out-of-sync` fold fix, `parentRefs` tree linking, clean-semver
  rollback).
- `npx playwright test` — builds + serves + proves the fleet renders, a row opens
  the ArgoCD-grade detail (sync panel + resource topology), and **no horizontal body
  scroll at 390px**. Screenshots in `e2e-shots/`.

## Follow-ons (registry-install / routing gated — flagged, not fabricated)

- **`@hanzo/canvas` fleet MAP** (the Railway board) needs `@hanzo/gui` (Tamagui),
  which is an external npm dep not in the offline store here — so the map is a
  registry-install follow-on. It already ships green in the console
  (`hanzoai/console` `feat/cd-canvas-map`); lifting it in is an import once
  `@hanzo/gui` installs.
- **`@hanzo/ui-shadcn` shared shell** (`HanzoHeader` + org/project switcher + ⌘K)
  needs a full monorepo install (its Tailwind deps aren't in the offline store).
  This app ships a lean self-contained topbar (Geist, small mark, env scope) in the
  interim; swap to the shared shell once installed. The **org/project↔IAM switcher**
  additionally needs `/v1/iam` routed on cd.hanzo.ai (today the SuperAdmin cookie
  sees the whole fleet; env is the scope control).
- **Rollback targets** come from the app's `revisions` (forward-compat — the plane
  doesn't expose prior tags yet; empty → the dialog's honest "no history"). Cloud
  re-validates the clean semver.
