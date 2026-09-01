# @hanzo/tokens

The single source of truth for the Hanzo design tokens — colours, radius, type,
spacing — for **every** surface. React reads the TypeScript; non-React surfaces (a
Gitea fork, a Go dashboard, an Argo CD fork) embed the generated CSS. One edit
propagates everywhere.

Hanzo is monochrome: one hue through an opacity ladder, dark by default. The only
permitted non-mono values are the three status hues (`--state-error`,
`--state-online`, `--state-success`). Type is Geist + Geist Mono, self-hosted.

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
  - `dist/tokens.css` — colours + radius + type + spacing (`@hanzo/tokens/css`);
    what `@hanzo/brand` re-emits for Go surfaces.
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
