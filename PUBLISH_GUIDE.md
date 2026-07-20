# Publishing

Two lanes, one trigger each. No changesets, no version-PR bot.

## 1. `pkgs/*` — auto-publish on version bump (`publish.yml`)

Bump a package's `version` in `pkgs/<name>/package.json` and merge to `main`.
`.github/workflows/publish.yml` detects the changed public `@hanzo/*` package,
builds it, and publishes to npm (repo secret `NPM_TOKEN`). Patch bumps only
(`x.y.z` → `x.y.z+1`).

## 2. `pkg/ui` — `@hanzo/ui@8`, the v8 lane (maintainer flow)

`pkg/ui` (with `pkg/data`) is the modern cross-platform library on `@hanzo/gui`.
It publishes from the package directory (`prepack` builds the `types/`):

```bash
cd pkg/ui
pnpm typecheck && pnpm test && pnpm build
# bump "version" in package.json (patch), commit to main, then:
npm publish --access public
```

`@hanzo/ui-shadcn` (`pkgs/ui`) is the legacy v5 kit — existing consumers pin
`@hanzo/ui-shadcn@^5`; it rides lane 1 like any other `pkgs/*` package.

> The old tag-driven flow (`publish-on-tag.yml`, `npm-publish.yml`, the
> `pkg/commerce|brand|react` paths) is gone — do not tag to publish here.

## Prerequisites

- `NPM_TOKEN` repo secret (lane 1) / npm auth as a maintainer (lane 2)
- Every package carries `"publishConfig": { "access": "public" }`

## Checklist

- [ ] `pnpm typecheck` + `pnpm test` green in the package
- [ ] Patch version bump (check the last published patch first)
- [ ] Commit to `main`; lane 1 publishes on merge, lane 2 via `npm publish`
