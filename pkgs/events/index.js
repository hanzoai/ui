/**
 * @hanzo/events — the plural spelling.
 *
 * The package is @hanzo/event, singular, because one call sends one event. This
 * exists so the other spelling resolves to it rather than to nothing, and so
 * both names belong to us.
 *
 * It re-exports the real package unchanged. Nothing is defined here — a second
 * definition of an event, its name or its shape is exactly what this must not
 * become.
 */
export * from '@hanzo/event'
