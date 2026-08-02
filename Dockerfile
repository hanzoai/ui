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

# Publishable ingest key (pk_…), baked in at build because a static export has no
# server to read config at runtime. Write-only and HMAC-verified to one org, so it
# is safe in a public bundle; the deployment that builds decides which org the
# site reports as. Absent, the client stays inert.
ARG NEXT_PUBLIC_HANZO_INGEST_KEY=""
ENV NEXT_PUBLIC_HANZO_INGEST_KEY=$NEXT_PUBLIC_HANZO_INGEST_KEY
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
RUN cd app && pnpm build

# 0.5.1 serves a directory's index.html in place. On 0.4.1 every page 301'd to
# an explicit /index.html, which leaks that filename into the address bar and
# into the URLs Next builds for its route prefetches.
FROM ghcr.io/hanzoai/static:0.5.2-amd64
COPY --from=builder /src/app/out /public
EXPOSE 3000
# No -spa: the export writes a real index.html per route (trailingSlash), so a
# missing path must 404 rather than silently render the home page.
ENTRYPOINT ["/static", "-port", "3000", "-root", "/public"]
