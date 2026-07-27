# @hanzo/products

The canonical Hanzo product source of truth. Two orthogonal, React-free concerns in
one tree-shakeable barrel:

1. **Catalog** — the console operational taxonomy (below): ONE typed contract + the
   two code maps that can't live in a database + a commerce-backed client with a
   checked-in snapshot fallback. The single source of truth the console, docs,
   marketing site, and pricing all read, so the product taxonomy / icons / colors
   can never drift across surfaces.
2. **Ecosystem shell** — the "Meet Hanzo" header/footer/menu (see the section at the
   end): the six-product family + the shared chrome every property renders.

## Decomplected design

- **Data** (which products exist, names, categories, order) is EDITABLE and lives in
  `hanzoai/commerce` (a `hanzo-platform` product collection, served at
  `GET /v1/commerce/catalog`). Not hand-maintained here.
- **Maps** (the two things that can't live in a DB) live here, in code:
  - `iconKey` (a string like `"Network"`) → a `@hanzogui/lucide-icons-2` component
    (`@hanzo/products/icons`). Docs resolves the SAME name against `lucide-react`.
  - `brandColor` (a swatch key like `"blue"`) → css hex (`swatchHex`, `./colors`).
- **Contract** (`CatalogEntry`) + **client** (`fetchCatalog`) + **snapshot**
  (`SNAPSHOT`) live here. The client reads live commerce and ALWAYS degrades to the
  snapshot, so a commerce blip never breaks a static site.
- **`brands[]` is derived from `category`** (`brandsForCategory`), never authored —
  duplicating it per row is the exact drift this package kills.

## The 10-category taxonomy (CTO-locked)

`CATEGORY_ORDER` = **AI · Compute · Data · Network · Security · Observe · Platform ·
Web3 · Apps · Commerce**. Prior cuts folded in: **Training → AI** (fine-tuning, ML
pipelines are AI training), **Dev → Platform** (CLI/SDKs/API/IDE/keys are the
platform's developer surface). **Settings is not a product category** — team,
profile, and org settings live in the account/avatar menu, orthogonal to this grid.
Sovereign brands (`lux`/`zoo`/`pars`) scope to Web3 · Network · Security · Platform;
`hanzo` sees all.

## Contract consumed

```
GET <baseUrl>/v1/commerce/catalog  (default baseUrl https://api.hanzo.ai)
  → Array<CatalogEntry>  |  { products: CatalogEntry[] }  (also tolerates {catalog|data|items})

CatalogEntry {
  id, name, category,           // category ∈ the 10 canonical ProductCategory
  brandColor,                   // swatch key  → css by ./colors swatchHex
  iconKey,                      // icon name   → component by ./icons
  slug, route, docsUrl,
  apiPath,                      // always /v1-prefixed
  pricingId,                    // pricing service key (plans/<key>.json) or null
  brands?                       // OPTIONAL — derived from category when absent
}
```

`hanzoai/commerce` owns the source + seed (conform its endpoint to this shape).
The seed = this package's `snapshot/catalog.json` (also at `@hanzo/products/snapshot`).

## Exports

- `@hanzo/products` (React-free): `CatalogEntry`, `ProductCategory`, `BrandId`,
  `CATEGORY_ORDER`, `CATEGORY_SUMMARY`, `CATEGORY_COLORS`, `categorySlug`,
  `categoriesForBrand`, `categoryInBrand`, `brandsForCategory`, node-network scope,
  `COLOR_SWATCHES`/`swatchHex`/`defaultColorKey`/`categoryColor`, `SNAPSHOT`,
  `fetchCatalog`/`normalizeEntry`, catalog accessors (`catalogByCategory`,
  `catalogForBrand`, `resolveEntry`…), `searchCatalog`/`entryMatches`,
  `docsServicesMeta`/`docsCoverage` (docs nav generation).
- `@hanzo/products/icons` (React): `iconComponent`, `iconComponentOr`, `hasIcon`.
- `@hanzo/products/snapshot`: the raw `catalog.json` (commerce seed).

## Consumers

- **docs.hanzo.ai** — `scripts/gen-services-nav.ts` calls `docsServicesMeta` to
  derive `content/docs/services/meta.json` (canonical categories; docs-only pages
  under "More"; no broken links). `docsCoverage` flags products missing a docs page.
- **console2** (later, mid-rebase) — replace its `brand-scope.ts`/`colors.ts` +
  the product metadata in `registry.tsx` with imports from here; keep its React
  routes/components local; resolve icons via `@hanzo/products/icons`.
- **hanzo.ai** marketing grid + **hanzoai/pricing** — read `fetchCatalog` (or the
  snapshot), group by `CATEGORY_ORDER`, render icons/colors via the maps; pricing
  joins each plan file to a product by `pricingId`.

## Build / test

```
pnpm build      # tsup → dist (dual CJS/ESM + d.ts); @hanzogui/lucide-icons-2 stays external
pnpm test       # vitest — 90 tests: taxonomy guard, brand scope, colors, catalog, search, client, docs, snapshot integrity, icon drift guard
pnpm typecheck  # tsc --noEmit (strict)
```

The icon set ships a bundler-only ESM (console2 consumes it via Next
`transpilePackages`; tsup marks it external). The snapshot's icon drift guard
validates every `iconKey` against the set's shipped type declarations — no ESM eval.

## Regenerating the snapshot (bootstrap only)

The snapshot was bootstrapped from the console2 catalog (the richest hand list).
Thereafter commerce is the editable source; the snapshot is the offline fallback +
the commerce seed. Keep it in sync when the seed changes.

## Ecosystem shell ("Meet Hanzo") — the second concern

The shared header / footer / mega-menu every property renders, driven by ONE spec so
the family / domains / actions / destinations never diverge. All React-free data;
each renderer (Next/React, Svelte, Tamagui, Fumadocs) maps a `Link.id` / `Product.id`
/ `Surface.id` to its own glyph — the data stays glyph-free.

Modules:

- `family.ts` — the six flagship products (`FAMILY`) + the `hanzo.ai` `ROOT`. Each
  `Product` = `{ id, name, short, domain, url, job, verb?, action }`. The six verbs
  (one each): Chat **Use** · App **Build** · Team **Work** · Studio **Create AI** ·
  Bot **Deploy** · Cloud **Operate**. `findProduct(id)`.
- `destinations.ts` — `ORIGIN` (the only place a host string lives) + `DESTINATIONS`
  (the 13 canonical shared links: products, apps, models, cloudProducts, downloads,
  browserExtension, desktop, cli, sdks, docs, apiReference, console, status).
- `menu.ts` — `MEET_HANZO_MENU` = eyebrow + all-products link + the six-product grid
  (`= FAMILY`) + a utility row (Models · Enso · Managed Agents · Hanzo Dev · MCP
  Tools · Documentation) + an install row (Desktop · Browser · CLI · SDKs · All
  downloads).
- `footer.ts` — `FOOTER` = 6 columns (Products · AI Platform · Install · Developers ·
  Resources · Company) + the legal bottom bar.
- `header.ts` — `HEADERS: Record<SiteId, SiteHeader>` — per-property local nav +
  primary action, `productId` tying each site to a `Product`. `findHeader(site)`.
- `surfaces.ts` — `SURFACES`, the collapsed launcher registry (below) +
  `surfaceById` / `otherSurfaces`.
- `addresses.ts` — `addresses()`, every address the spec claims, each tagged with the
  surface that claims it. The ONE enumeration the link checks run over.
- `link.ts` — the `Link` / `Action` atoms.

### De-dupe: the collapsed launcher registry

`surfaces.ts` is the ONE launcher list, collapsing the two that used to drift:

- **`SURFACES`** (this repo, `pkg/ui/src/product/surfaces.data.ts`) — now a
  re-export shim: it sources the DATA from `@hanzo/products` (`surfaceById`) and
  preserves the legacy `Surface { id, label, href, hint }` / 7-literal `SurfaceId` /
  order byte-for-byte, so `AppHeader` needs no change. WIRED + verified in-repo.
- **`HANZO_APPS`** (`@hanzogui/shell`, a separate repo) — the shim is ready but
  **gated on publishing** `@hanzo/products` (cross-repo; a workspace link is not
  possible). Until then that list stays local. When published, map each canonical
  surface `id` → the shell's inline SVG icon; keep `zach` (personal portal) and
  `world` local unless confirmed canonical.

The six product surfaces derive from `FAMILY` (single source); the root surface keeps
the legacy launcher id `"ai"` (not the product id `"hanzo"`); the platform surfaces
(Console · Billing · Account · Admin · Gateway · Platform) are launcher-only real
properties, not flagship products.

### Href provenance — every address is live-verified

Addresses the spec pins go through `DESTINATIONS`; the rest are built from `ORIGIN` on
the `hanzo.ai/<slug>` and `docs.hanzo.ai/docs/<slug>` conventions. Every address the
spec exposes has been fetched against the live properties and returns 200, and each
one agrees with the independent `U` table in `@hanzogui/shell`'s `hanzo-registry.ts`
(two witnesses per address).

`addresses.ts` is the ONE enumeration of every address the spec claims (site-relative
header nav resolved against its own property). `shell.test.ts` runs the offline guards
over it; `addresses.live.test.ts` fetches all of them:

```
HANZO_LIVE_LINKS=1 pnpm vitest run addresses.live
```

Host-only assertions cannot catch a fabricated PATH — that is exactly how an earlier
draft shipped 23 addresses that 404'd. The live check is the guard that pins paths.

Corrections this replaced (draft convention guess → live address):

| was | is |
| --- | --- |
| `hanzo.app/download{,/browser,/desktop,/cli}` | `hanzo.ai/{download,extension,desktop,cli}` |
| `docs.hanzo.ai/developers/sdks` | `hanzo.ai/sdks` |
| `docs.hanzo.ai/{cli,quickstarts}` | `docs.hanzo.ai/docs/{cli,getting-started}` |
| `docs.hanzo.ai/learn` | `hanzo.ai/learn` |
| `hanzo.ai/apps` | `docs.hanzo.ai/docs/apps` |
| `hanzo.ai/community` | `hanzo.app/community` (the builder owns the feed) |
| `hanzo.ai/legal/{privacy,terms,cookies}` | `hanzo.ai/{privacy,terms,cookies}` |
| `hanzo.ai/{showcase,changelog}` | dropped — no such pages; `support` took the slot |
| `hanzo.app/download/vscode` | dropped — no VS Code install page exists yet |

Two properties whose top-level nav the draft guessed are corrected to what they serve:
`hanzo.app` (Features · Templates · Gallery), `hanzo.bot` (Docs · Channels · Pricing,
CTA `/get-started`). `hanzo.ai`'s "Developers" resolves to `docs.hanzo.ai`.

Unverifiable by status code: `hanzo.chat`, `hanzo.team`, `studio.hanzo.ai`,
`cloud.hanzo.ai`, `console.hanzo.ai`, `billing.hanzo.ai`, `admin.hanzo.ai`,
`api.hanzo.ai` and `hanzo.id` answer 200 for ANY path, so their in-site nav and action
paths (`/new`, `/`, `/features`, …) are reachable but not proven to exist. Those need a
rendered check (Playwright), not a fetch.

Known divergence from `@hanzogui/shell` still to reconcile: that registry uses
`hanzo.ai/api` for API Platform and `docs.hanzo.ai/docs/api` for the API reference;
this spec uses `api.hanzo.ai` and `docs.hanzo.ai/reference` because the house rule
forbids an `/api` path prefix (a test enforces it). One of the two must move.
