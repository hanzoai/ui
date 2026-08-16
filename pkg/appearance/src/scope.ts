/**
 * Whose appearance wins, when four parties have an opinion.
 *
 * An install ships a default, an org dresses itself, and a person reads at their
 * own size — and a person who works across several orgs needs to say which of
 * those two they mean. So there are four layers, and the whole model is that the
 * NARROWEST one that has an opinion answers:
 *
 *     install  <  org  <  person (everywhere)  <  person (this org)
 *
 * Pure on purpose. Where the layers come from is not one question: an install's
 * default is built in, an org's is a row on a server, and a person's is on the
 * device in front of them. Fetching is the caller's job; deciding is this file's,
 * and it can be decided identically on a server, in a browser and in a test.
 *
 * ## Per AXIS, never per layer
 *
 * The one decision that makes this work. An org that sets an accent and a person
 * who sets a type size must get BOTH — the org's colour at the person's size —
 * because they are not competing, they are describing different things. Choosing
 * a whole winning layer instead would mean the moment someone nudged type size
 * their org's brand colour vanished, which reads as the setting being broken.
 *
 * So the answer is assembled axis by axis, and an axis nobody set stays ABSENT
 * rather than becoming a neutral value — the distinction `state.ts` depends on:
 * a written neutral outranks the stylesheet, an absent one defers to it.
 */
import type { Preference } from '@hanzo/design'

/** Where a preference came from — narrowest last, which is also precedence. */
export const LAYERS = ['install', 'org', 'user', 'userOrg'] as const
export type Layer = (typeof LAYERS)[number]

/**
 * The four opinions. Every one is optional: an unconfigured install, an org with
 * no branding and a person who has never opened the panel are all just absent.
 */
export type Layers = Partial<Record<Layer, Preference>>

/** Which axes exist. Adding one here is all it takes to make it resolvable. */
const AXES = ['type', 'ratio', 'density', 'accent'] as const

/**
 * What a person actually sees — and, for each axis, who decided it.
 *
 * The provenance is not decoration: it is the difference between a control that
 * can say "your org set this" and one that silently shows a value the person did
 * not choose and cannot explain. A panel needs it to label a reset honestly.
 */
export interface Resolved {
  pref: Preference
  from: Partial<Record<keyof Preference, Layer>>
}

export function resolve(layers: Layers): Resolved {
  const pref: Record<string, unknown> = {}
  const from: Record<string, Layer> = {}

  for (const axis of AXES) {
    // Narrowest last, so the last writer wins and records itself.
    for (const layer of LAYERS) {
      const v = layers[layer]?.[axis]
      if (v === undefined || v === null || v === '') continue
      pref[axis] = v
      from[axis] = layer
    }
  }

  return { pref: pref as Preference, from: from as Resolved['from'] }
}

/**
 * What a person is choosing WHEN THEY SAVE — the question the two personal
 * layers exist to answer.
 *
 * `everywhere` follows them across every org; `org` applies here and leaves the
 * rest alone. Kept as a value rather than inferred from whether an org happens
 * to be in scope, because "I am currently in org X" and "I mean this for org X"
 * are different claims and guessing between them loses the person's intent.
 */
export type Scope = 'everywhere' | 'org'

/** The layer a save at this scope lands in. */
export const layerFor = (scope: Scope): Extract<Layer, 'user' | 'userOrg'> =>
  scope === 'org' ? 'userOrg' : 'user'

/**
 * Is this axis being decided somewhere the person cannot reach from here?
 *
 * True when an org or the install set it and the person has not overridden it at
 * this scope — the case a panel should label rather than present as the person's
 * own choice.
 */
export const isInherited = (r: Resolved, axis: keyof Preference, scope: Scope): boolean => {
  const owner = r.from[axis]
  return !!owner && owner !== layerFor(scope) && !(scope === 'everywhere' && owner === 'user')
}
