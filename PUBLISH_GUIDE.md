# Publishing

One lane, one trigger. No changesets, no version-PR bot.

Bump a package's `version` in `pkg/<name>/package.json` or `pkgs/<name>/package.json`
and merge to `main`. `.hanzo/workflows/publish.yml` builds and publishes it to npm
(`NPM_TOKEN`, read from KMS on the forge runner). Patch bumps only (`x.y.z` → `x.y.z+1`).

Both roots, not just `pkgs/*`: `@hanzo/ui` and `@hanzo/data` live under `pkg/`
(singular) and were invisible to a `pkgs/*` glob, so no bump of either could reach
npm. Nothing publishes by hand — a local `npm publish` skips the gate that proves
the tarball builds.

## What decides a publish

The workflow asks npm, not the diff: for every non-private `@hanzo/*` package it
compares the local `version` against `dist-tags.latest` from the registry and
publishes only when the local one is strictly greater. So it is idempotent — it
runs on every push to `main` and does nothing when nothing is ahead.

Forward only. A package sitting BEHIND npm is never published, because that walks
the registry backwards. It also means a package whose tree is behind npm cannot be
published again until its version passes what the registry serves.

`@hanzo/ui-shadcn` (`pkgs/ui`) is the legacy v5 kit — existing consumers pin
`@hanzo/ui-shadcn@^5`; it rides the same lane as any other package.

> The old tag-driven flow (`publish-on-tag.yml`, `npm-publish.yml`, the
> `pkg/commerce|brand|react` paths) is gone — do not tag to publish here.

## Prerequisites

- `NPM_TOKEN` available to the forge runner
- Every package carries `"publishConfig": { "access": "public" }`

## Checklist

- [ ] `pnpm typecheck` + `pnpm test` green in the package
- [ ] Patch version bump (check the last published patch first)
- [ ] Commit to `main`; the push publishes
