/**
 * Landing — PURE link helpers (no UI, no I/O), unit-testable. Builds the real docs
 * / API / support links a landing rail and code samples point at, derived from the
 * brand docs host so a Lux/Zoo console links to ITS OWN surfaces (never hardcoded).
 */

/** Apex domain from a docs URL (https://docs.hanzo.ai → hanzo.ai). */
export function apexFromDocs(docsUrl: string): string {
  return docsUrl
    .replace(/^https?:\/\//, '')
    .replace(/\/.*$/, '')
    .replace(/^docs\./, '')
    .trim()
}

/** The brand API base for code samples, e.g. https://api.hanzo.ai/v1. */
export function apiBaseFromDocs(docsUrl: string): string {
  return `https://api.${apexFromDocs(docsUrl)}/v1`
}

/** A docs URL for a product, with an optional sub-path. */
export function landingDocsUrl(docsUrl: string, product: string, sub?: string): string {
  const base = `${docsUrl.replace(/\/+$/, '')}/${product}`
  return sub ? `${base}/${sub}` : base
}

/** The brand support mailbox derived from the docs host (docs.hanzo.ai → support@hanzo.ai). */
export function supportMailto(docsUrl: string): string {
  return `mailto:support@${apexFromDocs(docsUrl)}`
}

/** The standard doc links every product's resource rail shows. */
export interface StandardResources {
  docs: string
  quickstart: string
  examples: string
  api: string
}

export function standardResources(docsUrl: string, product: string): StandardResources {
  return {
    docs: landingDocsUrl(docsUrl, product),
    quickstart: landingDocsUrl(docsUrl, product, 'quickstart'),
    examples: landingDocsUrl(docsUrl, product, 'examples'),
    api: landingDocsUrl(docsUrl, product, 'api-reference'),
  }
}
