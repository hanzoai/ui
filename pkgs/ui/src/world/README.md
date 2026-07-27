# @hanzo/ui/world

Embeddable, OSS data-stream components ported from **hanzoai/world**
(world.hanzo.ai). Drop a live news feed, market ticker, instability gauge, or
prediction-market widget into any Hanzo site or customer app.

Self-contained React + TypeScript, MIT, no external runtime deps beyond the
`@hanzo/ui` peers (`react`, `react-dom`). Default look = the world.hanzo.ai
Geist/black-monochrome Vercel aesthetic; re-skins to any host theme by
overriding CSS custom properties.

```bash
npm i @hanzo/ui   # published to npm as @hanzo/ui (public)
```

```tsx
import '@hanzo/ui/world/tokens.css'          // once, at app root
import { NewsStream, MarketTicker } from '@hanzo/ui/world'

<NewsStream title="Live intel" items={items} maxHeight="480px" />
<MarketTicker title="Markets" items={quotes} />
```

Sub-path imports keep bundles small:
`@hanzo/ui/world/news-stream`, `/market-ticker`, `/instability-score`,
`/prediction-market`, `/hooks`, `/format`, `/types`.

## Components

| Component | Data prop | Archetype |
|---|---|---|
| `<NewsStream>` | `items: NewsStreamItem[]` | scrolling feed with severity rails |
| `<MarketTicker>` | `items: MarketQuote[]`, `variant: 'list' \| 'strip'` | numeric ticker + inline sparkline |
| `<InstabilityScore>` | `data: InstabilityScoreData` | 0–100 gauge card, level + trend + drivers |
| `<PredictionMarket>` | `items: PredictionMarketItem[]` | yes/no probability bars |

Every component is **pure props** and accepts `loading` / `error` /
`emptyMessage` / `className`. Numeric fields keep `| null` as the missing-data
sentinel (components render `N/A`, never a fake `0`).

### Data: props OR the /v1/world hooks

Feed data yourself, or pull it from the Hanzo World API with the built-in hooks
(native `fetch`, polling, abort-on-unmount, no extra deps):

```tsx
import { NewsStream, useNewsStream } from '@hanzo/ui/world'

function Feed() {
  const { data, loading, error } = useNewsStream({ baseUrl: 'https://api.hanzo.ai' })
  return <NewsStream title="Live intel" items={data ?? []} loading={loading} error={error} />
}
```

`useWorldData<T>(path, opts)` is the generic primitive; `useNewsStream`,
`useMarketTicker`, `usePredictionMarkets`, `useInstabilityScores` are typed
wrappers over `GET {baseUrl}/v1/world/<path>`. Each unwraps `[]`,
`{ items }`, or `{ data, unavailable }` envelopes.

## Theming — default Vercel/Geist, or inherit the host

Every visible style reads a `--world-*` custom property. `tokens.css` ships the
Geist/black default and a `[data-theme="light"]` / `.light` override. To re-skin
onto a host design system, point the tokens at the host's own variables — no
component or prop changes:

```css
:root {
  --world-bg:        var(--background);
  --world-surface:   var(--card);
  --world-text:      var(--foreground);
  --world-accent:    var(--primary);
  --world-font-sans: var(--font-sans);
  --world-radius:    0.9rem;
}
```

Geist fonts are **not** bundled — host apps self-host `'Geist'` / `'Geist Mono'`
(the tokens fall back to `system-ui` / `SF Mono` when absent).

Proven three ways (default black / light / host brand) by the render scripts in
`scripts/world-proof.mjs` and `scripts/world-theme-proof.mjs` — they SSR the
compiled `dist` bundle, compile the real Tailwind, and screenshot it.

## Adding the next panel (mechanical fan-out)

The 4 flagship components establish the pattern. To port another world panel:

1. Add the prop type to `types.ts` (mirror the world `services/*` return shape).
2. Write `src/world/<name>.tsx` — pure props, Tailwind classes reading
   `var(--world-*)`, `cn()` from `../../utils`, a `className` passthrough,
   `loading`/`error`/empty states. Numerics use `[font-family:var(--world-font-mono)]`.
3. Re-export from `index.ts`; register the entry in
   `tsup.config.minimal.ts` and the `./world/*` export already covers package.json.
4. Optional: add a typed hook in `hooks.ts`.

**High-value next ports** (from the upstream survey, all map-free and
single-source): FRED econ indicators (`EconomicPanel` → `services/fred.ts`),
the self-fetching finance trio (macro-signals / ETF-flows / stablecoin
peg-health — endpoint+component pairs), an AI-insight card, and a research feed
(arXiv / HackerNews / GitHub-trending). Reimplement independently against the
public data source — never copy AGPL upstream.
