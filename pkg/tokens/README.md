# @hanzo/tokens

The single source of truth for the Hanzo design tokens — colours, radius, type,
spacing — for **every** surface. React reads the TypeScript; non-React surfaces (a
Gitea fork, a Go dashboard, an Argo CD fork) embed the generated CSS. One edit
propagates everywhere.

Hanzo's chrome is monochrome: one hue through an opacity ladder, dark by default.
The only hues in chrome are the states (`--state-error`, `--state-warning`,
`--state-online`, `--state-success`). Type is Zen + Zen Mono, from @hanzo/font.

Data is the one exception, and it is scoped: `src/data.ts` is a palette of thirty
12-step hues (`--data-<hue>-<step>`) for what a PERSON colours — a select option's
tag, a kanban column, an object's icon tile, an avatar's initial, a chart series.
Never a button, a border or a focus ring. Twenty-four of the twenty-five pickable
hues and all five neutrals are Radix Colors scales (NOTICE); `hueOf(seed)` picks
a record's hue from a stable string hash, so a record keeps its colour wherever
it is drawn or imported.

## The pipeline

```
src/theme.ts   ──gen-css──▶  dist/colors.css   ──▶  @hanzo/design/tokens/colors.css ──▶ styles.css
 (the source)                dist/tokens.css    ──▶  @hanzo/brand/styles/variables.css ──▶ git/ci/cd
```

- **`src/theme.ts`** holds every colour token (`dark` → `:root`, `light` →
  `.light`) plus the radius/type/spacing `scale`. Values are raw CSS strings, so a
  `var()` reference stays a reference and the emitted bundle is what consumers
  already ship. This is the ONE place to edit a value.
- **`scripts/gen-css.mjs`** reads the built `dist/theme.mjs` and emits:
  - `dist/colors.css` — the colour tokens only (`@hanzo/tokens/css/colors`); the
    contract `@hanzo/design` republishes.
  - `dist/tokens.css` — colours + radius + type + spacing + the data palette
    (`@hanzo/tokens/css`); what `@hanzo/brand` re-emits for Go surfaces.
  - `dist/data.css` — the data palette alone (`@hanzo/tokens/css/data`). Not in
    colors.css, which design republishes as the chrome contract.
- `@hanzo/ui` composes `data.css` into its theme.css, and also every token this
  package declares that @hanzo/design's sheet does not ship yet — so a token added
  here reaches the components before design's next build copies it.
- `themes.ts` / `colors.ts` are the resolved, flat views for JavaScript consumers
  that cannot dereference `var()`. They mirror `theme.ts`.

## Regenerate

```bash
pnpm --filter @hanzo/tokens gen-css
```

Flow: edit `src/theme.ts` → `gen-css` → `@hanzo/design` and `@hanzo/brand` pull
the generated CSS on their next `gen`/`build` → git / ci / cd pick it up. `gen-css`
runs as part of `build` (and `prepublish`), so a published package always ships
current CSS.
