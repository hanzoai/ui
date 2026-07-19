import { fileURLToPath, URL } from "node:url"

import react from "@vitejs/plugin-react"
import { defineConfig } from "vite"

/**
 * Hanzo CD — a static SPA served at cd.hanzo.ai from the shared static plane
 * (s3://cdn/cd, ingress staticFiles/spaMode). `/v1/deploy/*` is peeled off to the
 * cloud binary by the ingress, so in prod the SPA calls same-origin `/v1/deploy`
 * with the `hanzo_iam_token` cookie (cloud validates → SuperAdmin gate).
 *
 * The @hanzo/gitops (built dist) + @hanzo/canvas/pure (pure TS source) workspace
 * packages are resolved by path alias so the app builds without a full monorepo
 * install (the shared store lacks the registry deps of the heavier packages). A
 * dev proxy forwards `/v1` to CD_API (default the live cluster) for local dev.
 */
const r = (p: string) => fileURLToPath(new URL(p, import.meta.url))
const CD_API = process.env.CD_API ?? "https://cd.hanzo.ai"

export default defineConfig({
  plugins: [react()],
  resolve: {
    dedupe: ["react", "react-dom"],
    alias: {
      "@hanzo/gitops": r("../../pkgs/gitops/dist/index.mjs"),
      "@hanzo/canvas/pure": r("../../pkgs/canvas/src/pure.ts"),
    },
  },
  // Plain CSS only — override the monorepo-root PostCSS/Tailwind config discovery
  // (this app has no Tailwind; the @hanzo/gitops components ship their own scoped CSS).
  css: { postcss: { plugins: [] } },
  build: { outDir: "dist", target: "es2022", sourcemap: false },
  server: {
    port: 4200,
    proxy: { "/v1": { target: CD_API, changeOrigin: true, secure: false } },
  },
})
