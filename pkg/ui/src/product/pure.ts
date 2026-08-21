// @hanzo/ui/product/pure — the product layer's rules, without the layer.
//
// Every module here is a value or a function over values: no @hanzo/gui, no
// React, no DOM, no side effects. It loads under `node --eval "require(...)"`,
// under jest with no transform and no jsdom, and inside a React Server
// Component — none of which can load `@hanzo/ui/product`, because that barrel
// mounts the whole gui runtime to give you one component.
//
// That gap is why this exists. A consumer that wanted to check the rule its
// pager pages by, or that its own field really masks, had to stand up a browser
// environment to reach a function that never touches one. The components import
// these same modules, so what a test asserts here is what the component does —
// there is one definition, not a testable copy of a shipped one.
//
//   import { pages, masked, tone } from '@hanzo/ui/product/pure'
//
// A component belongs in `@hanzo/ui/product`. A rule belongs here.

// Paging — the fixed-width page run, and the ellipsis standing in for the rest.
export { GAP, pages } from './pages'

// Masking — the props that hide a value on web AND native, since neither
// spelling covers both.
export { masked } from '../backends/gui/mask'

// Naming — what to call a person given a name, an email, or neither.
export { displayName } from './name'

// Status — what a lifecycle string means, and the monochrome register it reports
// in. The one vocabulary; every list that renders a status reads this.
export { TONE, tone, type Tone } from './tone'

// Org scope — the current org, the ones a person can switch to, and the search
// over them.
export { orgScope, filterOrgs, type Org, type OrgScope, type OrgScopeConfig } from './scope'

// Typeahead — the ReDoS-safe literal-substring filter behind ComboBox.
export { filterOptions, isKnownOption, type ComboOption } from './combobox/filter'

// Brand — the identities the shared chrome renders under (hanzo, lux, zoo, pars).
export { BRANDS, HANZO, LUX, ZOO, PARS, resolveBrand, type BrandIdentity } from './brand'

// Wordmark motion — the geometry the animated logo interpolates over, as
// numbers, so the timing can be checked without a frame.
export {
  DEFAULT_DURATION_MS,
  DEFAULT_GAP,
  DEFAULT_INTRO_MS,
  HOUSE_EASE,
  isExpanded,
  wordmarkStyle,
  wordmarkText,
  type WordmarkStyle,
  type WordmarkStyleInput,
} from './animatedLogo.logic'

// Committing a field with the keyboard, and staying at the bottom of a
// scroller. Neither is a chat rule — a SQL editor, a file explorer and a
// command palette all ask the first one — so the general door is here.
export { ready, sends, type Mods } from '../chat/send'
export { pinned, SLACK, type Track } from '../chat/stick'
