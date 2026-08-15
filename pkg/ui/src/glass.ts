/**
 * The chrome, as values — `@hanzo/ui/glass`.
 *
 *   import { glass, panel, scrim } from '@hanzo/ui/glass'
 *   import '@hanzo/ui/glass.css'   // or '@hanzo/ui/theme.css', which inlines it
 *
 * Ten recipes, because ten things were being spelled out by hand on every page
 * and drifting apart every time: what a floating surface is made of, what a
 * resting one is made of, how high a sheet of the workspace sits and what marks
 * one that opens, what dims the page under a modal, how a set of rows is
 * grouped, what one of those rows looks like, which item in a set is the
 * current one, which control is the loud one, and what it means to fill the
 * screen. Each is ONE value here and nowhere else.
 *
 * They are plain objects, spread onto any `@hanzo/gui` element:
 *
 *   <YStack {...panel}>…</YStack>
 *   <XStack {...glass(2)} borderBottomWidth={1}>…</XStack>
 *
 * A recipe rather than a component or a variant, because a variant only reaches
 * the one component that declares it and half of what wants these is an
 * `XStack`, a `SizableText` or a `Link`. One value that spreads onto any
 * element beats N spellings of it.
 *
 * The material and the ladder live in `glass.css`; these name them. Nothing
 * here restates a colour, a shadow or a blur radius — see that file for where
 * the values come from (`@hanzo/design`).
 */
import { slot } from './backends/gui/slot'

/**
 * The rungs a FLOATING surface may stand on.
 *
 * There is no 1: rung 1 is rest, and a floating thing is never at rest. The
 * type says so, so the mistake cannot be typed.
 */
export type Lift = 2 | 3

/**
 * Glass — the material floating chrome is made of, and only floating chrome.
 *
 * Menus, dialogs, popovers, toasts, sticky bars: things with page under them.
 * Vibrancy is a lens, so a surface covering nothing but the flat canvas has
 * nothing to soften — an in-flow card wearing this is not glass, it is the page
 * with extra steps, one shade off what it sits on and harder to find than
 * `panel`. Over content -> `glass`, in the flow -> `panel`. No third case.
 *
 * The library's own dialogs, popovers, selects, dropdowns and tooltips are
 * already glass BY SLOT — `glass.css` attaches the material to what a thing IS,
 * so they need nothing from a call site and cannot fall out of step. This is
 * for the surfaces no slot names: a hand-rolled bar, a custom menu, a docked
 * toolbar.
 *
 * MATERIAL ONLY, no geometry. What glass is made of does not tell you what
 * shape it was cut into: a menu is rounded on four sides, a sticky bar is
 * full-bleed with one hairline along its bottom. Baking `borderRadius` and
 * `borderWidth` in here would make every bar undo them, so edges stay at the
 * call site — which only ever needs to say WHICH ones (`borderBottomWidth={1}`),
 * never what colour, because the material already knows.
 *
 * The level is the one thing that genuinely varies, so it is the argument
 * (`selected(on)` is shaped the same way). 2 is anchored — a menu, a toast, a
 * bar, lifted off the page but tied to it. 3 is a modal, floating free over
 * everything with a scrim under it.
 *
 * `backgroundColor` is the opaque fallback, and it is load-bearing rather than
 * belt-and-braces: the material lives inside `@supports (backdrop-filter)`, so
 * a browser that cannot blur gets no rule at all — and a menu with no
 * background is a menu you read the page through.
 */
export const glass = (level: Lift = 2) =>
  ({
    className: `glass elevation-${level}`,
    backgroundColor: '$background',
    borderColor: '$borderColor',
  }) as const

/**
 * A sheet of paper, and how high off the workspace it sits.
 *
 *   <YStack {...sheet(0)}>            the workspace itself
 *     <YStack {...sheet(1)}>          a tool you are using
 *       <YStack {...sheet(2)}>        what it opened
 *
 * The rungs are `glass`'s rungs — `sheet(2)` and `glass(2)` stand at the same
 * height, they are just cut from different material — so a screen mixing a
 * transcript, a menu and a dialog still reads as ONE space. What differs is
 * what the surface MEANS: glass is chrome floating over content, paper is the
 * content's own structure, where the level says which thing you are working in.
 *
 * NO BORDER, deliberately, and this is the rule the recipe exists to enforce:
 * if two surfaces need separating, RAISE one. A surface that is already a step
 * above its neighbour and also wears a hairline is drawn twice, and a screen of
 * those is the wireframe look — every pane in its own box, none of them saying
 * which one you are in. Reach for `panel` when the thing genuinely is a card in
 * the flow with a finished edge; reach for this when depth is the hierarchy.
 *
 * The fill is `--sheet-*` from @hanzo/design — an alpha wash, not an opaque
 * step, so sheets STACK: one laid on another lands a shade lighter and the pile
 * converges instead of blowing out. That is also why 0 is worth spelling: the
 * ground is a value, not the absence of one, and a pane that means "workspace"
 * should say so rather than inherit whatever is behind it.
 *
 * Rung 0 carries no `elevation-` class because nothing casts a shadow onto the
 * thing it is lying on.
 */
export const sheet = (level: 0 | 1 | 2 = 1) =>
  ({
    backgroundColor: SHEET_FILL[level],
    ...(level === 0 ? {} : { className: `elevation-${level}` as const }),
  }) as const

const SHEET_FILL = {
  0: 'var(--sheet-0, #0a0a0a)',
  1: 'var(--sheet-1, rgb(38 38 38 / .5))',
  2: 'var(--sheet-2, rgb(38 38 38 / .75))',
} as const

/**
 * The fold — a corner turned back, and the ONE mark that says an item opens.
 *
 *   <YStack {...sheet(1)} {...fold}>
 *
 * Spend it only where the thing expands. A fold on a surface that does nothing
 * is the same lie as a chevron that does not turn: it is an affordance, and an
 * affordance that leads nowhere costs more than no mark at all.
 *
 * A `background-image` on the sheet itself, so it needs no extra element and no
 * pseudo-element from the call site, and it squares that one corner — a folded
 * corner is not round. `--fold-face` flips with the theme underneath.
 */
export const fold = { className: 'fold' } as const

/**
 * The scrim under anything modal — the dim that makes a floating panel read as
 * floating rather than as more page.
 *
 * Hand-rolled modals reach for `backgroundColor="black"`, with no alpha. That
 * does not dim the page behind them, it DELETES it — and a glass panel over a
 * solid black wall has nothing left to be translucent about, so the scrim
 * cancels the very material it exists to make read.
 *
 * The value is a design token, not a literal, because both languages need it
 * and only one of them can hold the copy: `[data-slot="dialog-overlay"]` reads
 * `--surface-scrim` in `glass.css` and this reads the same token, so the dim
 * behind a library dialog and the dim behind a hand-rolled one are the same dim
 * by construction rather than by two people remembering a number.
 */
export const scrim = { backgroundColor: 'var(--surface-scrim, rgb(0 0 0 / .8))' } as const

/**
 * A panel: the quiet surface content in the FLOW sits on.
 *
 * `$color2` is a step off the page, so the fill alone separates the panel from
 * the page and the hairline only finishes the edge. Panels are otherwise
 * variously `$background` (a border with nothing behind it), `$color3` (which
 * is the ACTIVE-item fill — a state, not a surface) and as many radii as there
 * are authors.
 *
 * Rung 1 on the ladder, which is NOT the same claim as "this floats". A cast
 * shadow does say "above the page", and that stays false for a panel in the
 * flow — so rung 1 spends almost nothing on shadow and buys its depth from the
 * lit top edge instead. On a near-black canvas that is the only half that reads
 * at all.
 */
export const panel = {
  backgroundColor: '$color2',
  borderWidth: 1,
  borderColor: '$borderColor',
  borderRadius: '$6',
  className: 'elevation-1',
} as const

/**
 * A group of rows — the settings card, and the reason a settings page ends up
 * with four cards where it wanted one.
 *
 * Four toggles as four separate panels reads as four unrelated decisions, each
 * with its own four edges; the same four inside one card, parted by hairlines,
 * reads as one set and drops twelve edges of noise. That is the macOS settings
 * group, and it is the shape every settings surface reaches for by hand.
 *
 * `overflow: hidden` is not decoration — the separators are drawn by the card
 * (`[data-slot="rows"] > * + *`), and without the clip the topmost one runs
 * straight through the rounded corner and out the side.
 *
 * It spreads `panel` WHOLE, so moving the panel up or down the ladder moves its
 * groups with it. The separator hangs off a slot rather than a second class
 * name for the same reason: there is no string to keep in step.
 */
export const rows = {
  ...panel,
  ...slot('rows'),
  overflow: 'hidden',
} as const

/**
 * One line inside a `rows` card: name on the left, control hard right.
 *
 * The rhythm, so it stops being re-decided per file. Pair it with a label at
 * `fontSize="$3"` in `$color` and any explanation under it at `$1` in
 * `$color11` — both halves matter, because a row whose label is written at
 * `$color11` (the SECONDARY colour) gives the name of the setting and the
 * footnote about it the same weight of grey, and the row has no first thing to
 * read.
 *
 * No border here. A row that draws its own top hairline is a row that has to
 * know whether it is first, and the card already knows — see `rows`.
 */
export const row = {
  flexDirection: 'row',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: '$4',
  paddingHorizontal: '$4',
  paddingVertical: '$3',
} as const

/**
 * Selected — the ONE "you are here" look, wherever a set offers a choice: nav
 * rows, tabs, a filter chip.
 *
 * `$color3` fill with a full-strength label, one step above the panel it sits
 * on. The alternatives in the wild are a pure-white lozenge, and — far more
 * often — no answer at all: an unstyled `TabsTrigger` paints a selected tab
 * exactly like its neighbours, so the page simply does not say which one you
 * are on. Nothing in the markup looks wrong; the state has no picture.
 *
 * The label is `$color12`, not `$color`, and that is a measured distinction
 * rather than a preference. Themes NEST: at the page scope `--color` is
 * hsl(0 0% 100%), but inside a sidebar's scope it is re-based to hsl(0 0% 80%)
 * — the SAME value as `--color11`. So a selected row asking for `$color` gets
 * exactly its neighbours' colour, and had been doing so all along; the markup
 * said "highlight this" and the token quietly collapsed underneath. `$color12`
 * is the theme's full-strength foreground in every scope, so the state survives
 * nesting.
 */
export const selected = (on: boolean) =>
  on
    ? ({ backgroundColor: '$color3', color: '$color12' } as const)
    : ({ backgroundColor: 'transparent', color: '$color11' } as const)

/**
 * The primary control — the ONE loud thing a page is allowed.
 *
 * `$color5` on `$color6` is a raised pushbutton: legible, quiet, monochrome.
 *
 * Under-emphasis is the failure mode, and it leaves no mark on a screenshot,
 * which is exactly why it needs a rule rather than an eye. `Button`'s `default`
 * variant is a QUIET control on the surface ladder (`$color2`, the same fill
 * `panel` uses), so a dialog whose only action is an unnamed `<Button>` paints
 * its single ask as another surface. Name a variant on every control, and when
 * one is the primary action, spread this. Never `variant="default"`.
 *
 * Not `variant="primary"` either, even though it paints the same pixels — a
 * variant only reaches a `Button`, and half the loud controls in a real app are
 * an `XStack`, a `SizableText` or a `Link`.
 */
export const accent = {
  backgroundColor: '$color5',
  borderWidth: 1,
  borderColor: '$color6',
  /**
   * The foreground is part of the recipe, not an afterthought.
   *
   * Spell the fill by hand and you own the label too, and that half is the one
   * people drop: a hand-spelled `color="$color1"` (4% grey) on a fill that has
   * since moved to `$color2` (8%) paints a label at 1.07:1 — measured in the
   * browser, not guessed. The sign-in modal's only button was invisible.
   *
   * And it only reaches a label the BUTTON paints. This is the half that is
   * easy to miss: `<Button {...accent}><SizableText>…</SizableText></Button>`
   * puts a second component between the recipe and the text, and that component
   * resolves its own colour from the theme scope the Button just mounted —
   * where `--color` is re-based to 80%. Measured: fill rgb(51,51,51) and border
   * rgb(69,69,69), correct, with the label at rgb(204,204,204) — `$color11`,
   * the QUIET foreground, on the loudest control in the dialog.
   *
   * Two guesses about the cure are both WRONG, and each was measured:
   *
   *   - "Just don't name a colour." A bare `<SizableText>` inside the Button
   *     still measures rgb(204,204,204). Silence is not neutral here; the
   *     nested scope answers for you. The rule is to SAY `$color12`, not to say
   *     nothing.
   *   - "Hoist the size to the Button and drop the wrapper." `fontSize="$1"` on
   *     the Button does not reach the label — still the `size` default. So a
   *     control that genuinely wants a smaller label keeps its wrapper.
   *
   * Which leaves two honest shapes. No size of your own -> hand the string
   * straight to the Button and let its text host paint it. A deliberate size or
   * `numberOfLines` -> keep the wrapper and give it `color="$color12"`.
   *
   * BUTTON ONLY. A plain `XStack` mounts no theme scope, so a label inside one
   * that asks for `$color` measures rgb(255,255,255) — correct, and not to be
   * "fixed". The ban is exactly as wide as the re-basing.
   */
  color: '$color12',
  hoverStyle: { backgroundColor: '$color6', color: '$color12' },
} as const

/**
 * A state that owns the whole screen: a loading gate, a 404, a crash screen, an
 * OAuth callback, a receipt. It stands alone — no shell above it — so it must
 * MEASURE the screen itself.
 *
 * `minHeight="100%"` does not measure it, and that is the bug this value ends.
 * A percentage resolves against the parent's computed height; every ancestor up
 * to `<body>` is `height: auto`, and `@hanzo/gui`'s provider span is
 * `display: contents`, so there is no box in between either. The percentage
 * resolves to auto, the stack shrink-wraps its content, and `justifyContent:
 * center` then centres inside THAT — perfectly, and invisibly, in a box the
 * height of the content. Measured: a brand mark at y=0 of a 903px viewport with
 * 860px of black under it, across ten states carrying the identical line.
 *
 * `dvh`, not `vh`: on a phone the URL bar collapses and `100vh` overflows by
 * its height.
 *
 * The centring travels WITH the measure because the two are one decision — a
 * state that fills the screen holds a paragraph of content — and half of this
 * recipe is what produced the defect in the first place.
 */
export const screen = {
  minHeight: '100dvh',
  alignItems: 'center',
  justifyContent: 'center',
} as const
