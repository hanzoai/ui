# @hanzo/products

The canonical Hanzo product catalog — ONE typed contract + the two code maps that
can't live in a database + a commerce-backed client with a checked-in snapshot
fallback. The single source of truth the console, docs, marketing site, and pricing
all read, so the product taxonomy / icons / colors can never drift across surfaces.

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
