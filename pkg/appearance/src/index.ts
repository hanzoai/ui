/**
 * @hanzo/appearance — a person's own reading of the Hanzo design system.
 *
 *   import { Appearance } from '@hanzo/appearance'          // the settings panel
 *   import { bootScript } from '@hanzo/appearance/state'    // no-flash, in <head>
 *
 * The knobs it writes are published by @hanzo/design and multiplied into every
 * ramp, so a change reaches the whole product — including @hanzo/gui's `$n`
 * ladder, which resolves through `var(--text-*)` since @hanzo/ui 8.0.69.
 *
 * Four parties get an opinion, and the narrowest one that HAS an opinion wins,
 * axis by axis:
 *
 *     install  <  org  <  person (everywhere)  <  person (this org)
 *
 * The install's and the org's layers are ARGUMENTS, because they are not the
 * browser's to know — an org's branding is a row on a server. The two personal
 * layers are on the device, under `hanzo.appearance` and `hanzo.appearance@<org>`.
 *
 *   <Appearance org="acme" orgName="Acme" orgPref={fromServer} />
 *   current({ install, org: fromServer, orgId: 'acme' })   // outside React
 */
export { Appearance, useAppearance, TYPE_STEPS, RATIO_STEPS } from './Appearance'
export { read, readLayers, write, apply, current, style, bootScript, keyFor, DEFAULT, KEY, type Preference, type At } from './state'
export { resolve, layerFor, isInherited, LAYERS, type Layer, type Layers, type Resolved, type Scope } from './scope'
