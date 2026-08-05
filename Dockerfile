# ui.hanzo.ai — the @hanzo/ui docs + component registry, served by the house
# static server (ghcr.io/hanzoai/static, a Go binary), same as every other Hanzo
# static site. Built on our own runners, never on a laptop and never by a
# third-party builder.
#
# The app is a Next.js static export: `pnpm build` in app/ writes app/out, which
# is the entire site — docs, the registry JSON the CLI reads, and the static
# /api/registry/*.json index.
FROM node:22 AS builder
WORKDIR /src

ENV NEXT_TELEMETRY_DISABLED=1

# Publishable ingest key (pk-…), baked in at build because a static export has no
# server to read config at runtime. Write-only and HMAC-verified to one org, so it
# is safe in a public bundle; the deployment that builds decides which org the
# site reports as.
#
# ONE name, end to end: KMS holds `deploy/EVENT_INGEST_KEY`, hanzo.yml declares it
# as this image's build_secret, and the KMS name IS the build-arg name. NEXT_PUBLIC_
# is added HERE because that prefix is what makes Next inline it — the app reads
# process.env.NEXT_PUBLIC_EVENT_INGEST_KEY.
#
# Do NOT re-declare `ARG NEXT_PUBLIC_EVENT_INGEST_KEY` after the ENV below. A later
# ARG of the same name shadows the ENV with its own (empty) default, and the build
# stays green while the bundle ships blank — which is exactly how hanzo.chat 1.0.58
# shipped a keyless site from a fully green run.
#
# Fail CLOSED, on BOTH ways this goes wrong.
#
#   empty   — builds, serves and looks correct while cloud answers
#             `401 ingest_key_required` for every anonymous pageview. The previous
#             `ARG …=""` default made that the normal outcome of an unattended
#             build, which is why no automated lane could ever publish a working
#             image.
#   `pk_…`  — the OLDER key format. v5.7.6 shipped one, passed by hand on a local
#             `docker build`, and it is now dead: api.hanzo.ai 401s it on both the
#             fetch and beacon transports. A hand-passed key goes stale in silence,
#             so requiring the current `pk-` shape refuses the stale one outright.
#
# Neither failure is visible from outside the artifact, so refuse the artifact.
ARG EVENT_INGEST_KEY
ENV NEXT_PUBLIC_EVENT_INGEST_KEY=$EVENT_INGEST_KEY
RUN case "$EVENT_INGEST_KEY" in \
      pk-*) : ;; \
      '')   echo "EVENT_INGEST_KEY is empty - pass --build-arg EVENT_INGEST_KEY=<pk-...> (KMS deploy/EVENT_INGEST_KEY, env prod)" >&2; exit 1 ;; \
      *)    echo "EVENT_INGEST_KEY is not a publishable key (expected a pk- prefix)" >&2; exit 1 ;; \
    esac
# 300+ prerendered pages; the default heap is not enough.
ENV NODE_OPTIONS=--max-old-space-size=8192

RUN corepack enable

COPY . .

# The lockfile is committed, so the build resolves exactly what was reviewed.
RUN pnpm install --frozen-lockfile

# Workspace packages the app imports must be built first: their package.json
# exports point at dist/. Only @hanzo/event qualifies -- .npmrc sets
# link-workspace-packages=true and the lockfile resolves it to link:../pkgs/event.
#
# There used to be a `cd pkgs/ui` line here. pkgs/ui was @hanzo/ui-shadcn, deleted
# in 5dbdb2943 when shadcn was consolidated to one home, and that commit did not
# touch this file -- so every build since has run `cd` into a directory that does
# not exist and died with exit code 2 before compiling anything. The app takes
# @hanzo/ui from the registry now (npm:@hanzo/ui-shadcn@^5), not the workspace.
RUN cd pkgs/event && pnpm build

# Builds the component registry, then the site (app/package.json build script).
#
# ...and then PROVES the key reached the client bundle. The gate above proves a
# key was PASSED; only this proves it was INLINED. Those are different failures:
# a rename on either side of `process.env.NEXT_PUBLIC_EVENT_INGEST_KEY` leaves the
# build-arg intact and the bundle keyless, and a static export cannot report that
# at runtime because there is no runtime.
#
# `&&`, never `;` — a `;` chain returns the LAST command's status, so a failed
# build followed by a passing grep exits 0 and the image is published.
RUN cd app && pnpm build && \
    if [ -z "${NEXT_PUBLIC_EVENT_INGEST_KEY}" ]; then \
      echo "ERROR: NEXT_PUBLIC_EVENT_INGEST_KEY is empty after a successful build." >&2; exit 1; \
    elif grep -rqF "${NEXT_PUBLIC_EVENT_INGEST_KEY}" out; then \
      echo "Build OK - ingest key inlined into app/out, verified"; \
    else \
      echo "ERROR: key supplied but NOT present in app/out - ui would ship unattributed" >&2; exit 1; \
    fi

# 0.5.1 serves a directory's index.html in place. On 0.4.1 every page 301'd to
# an explicit /index.html, which leaks that filename into the address bar and
# into the URLs Next builds for its route prefetches.
FROM ghcr.io/hanzoai/static:0.5.2-amd64
COPY --from=builder /src/app/out /public
EXPOSE 3000
# No -spa: the export writes a real index.html per route (trailingSlash), so a
# missing path must 404 rather than silently render the home page.
ENTRYPOINT ["/static", "-port", "3000", "-root", "/public"]
