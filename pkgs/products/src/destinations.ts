/**
 * The canonical destinations map — the shared, cross-property links the shell uses
 * everywhere (all-products, all-apps, all-models, the installs, docs, console,
 * status). Every menu / footer / header link that points at one of these resolves
 * it FROM here, so a shared destination has exactly ONE address.
 *
 * `ORIGIN` is the one place the real hosts live; `DESTINATIONS` composes the named
 * links from them. A convention link elsewhere (a marketing sub-page not pinned by
 * the spec, e.g. `hanzo.ai/about`) is built from `ORIGIN` too, so no host string is
 * ever repeated. Pure data, React-free.
 */

/** The real Hanzo hosts every shell link is built on. The ONLY place a host lives. */
export const ORIGIN = {
  /** The marketing root + umbrella brand. */
  root: "https://hanzo.ai",
  /** The one documentation site. */
  docs: "https://docs.hanzo.ai",
  /** The AI cloud property — also the developer console's front door. */
  cloud: "https://cloud.hanzo.ai",
  /** The launcher's console surface. */
  console: "https://console.hanzo.ai",
  /** Subscriptions, usage, and invoices. */
  billing: "https://billing.hanzo.ai",
  /** Identity — profile, organizations, security. */
  id: "https://hanzo.id",
  /** Platform administration. */
  admin: "https://admin.hanzo.ai",
  /** Deploy and scale services. */
  platform: "https://platform.hanzo.ai",
  /** The LLM gateway / API platform host (`api.*`, never an `/api` path). */
  api: "https://api.hanzo.ai",
  /** The status page. */
  status: "https://status.hanzo.ai",
  /** The org's GitHub. */
  github: "https://github.com/hanzoai",
} as const

/**
 * The canonical shared destinations. These addresses are pinned by the ecosystem
 * spec — change one here and every surface that links to it moves together.
 */
export const DESTINATIONS = {
  /** Meet Hanzo / All products. */
  products: `${ORIGIN.root}/products`,
  /** All apps. */
  apps: `${ORIGIN.docs}/docs/apps`,
  /** All models. */
  models: `${ORIGIN.root}/models`,
  /** All cloud products. */
  cloudProducts: `${ORIGIN.cloud}/products`,
  /** All downloads (OS-detecting). */
  downloads: `${ORIGIN.root}/download`,
  /** The browser extension download. */
  browserExtension: `${ORIGIN.root}/extension`,
  /** The desktop app download. */
  desktop: `${ORIGIN.root}/desktop`,
  /** The CLI download. */
  cli: `${ORIGIN.root}/cli`,
  /** The SDKs index. */
  sdks: `${ORIGIN.root}/sdks`,
  /** The documentation home. */
  docs: ORIGIN.docs,
  /** The API reference. */
  apiReference: `${ORIGIN.docs}/reference`,
  /** The developer console — Cloud's front door (see `family.test.ts`). */
  console: ORIGIN.cloud,
  /** The status page. */
  status: ORIGIN.status,
  /** The community hub — reached from both a property's nav and the footer. */
  community: `${ORIGIN.root}/community`,
} as const

/** A key of the canonical destinations map. */
export type Destination = keyof typeof DESTINATIONS
