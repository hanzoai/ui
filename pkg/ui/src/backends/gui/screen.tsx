'use client'

/**
 * Screen — an app shell, once, so nobody re-derives it.
 *
 * The shape is always the same: something pinned at the top, something pinned at
 * the bottom, and a middle that takes whatever is left and scrolls. Chat writes
 * it, the console writes it, every workbench pane writes it. Written by hand it
 * is two declarations, and BOTH have to be right or the failure is silent:
 *
 *   `flex: 1`  alone gives the middle the slack…
 *   `minHeight: 0`  is what lets it actually shrink to take it.
 *
 * Without the second, a flex item's automatic minimum is its CONTENT, so the
 * middle refuses to go below its natural height, grows the shell instead, and —
 * because a scroll container that never overflows never scrolls — paints its
 * content straight over whatever follows. Measured in this package: `Thread`
 * rendered 976px of turns in a 332px box and drew every one of them across the
 * composer. 37 files here set `flex={1}`; exactly one had ever written the
 * second declaration, and only after that bug was found.
 *
 * So the rule stops being a rule. `Fill` IS the middle, with both halves and the
 * clip built in, and a caller cannot forget a thing it does not have to write.
 *
 * WHY NOT CSS GRID, which expresses this as one line — `grid-template-rows: auto
 * 1fr auto` — with no escape hatch at all: because React Native lays out through
 * Yoga, and Yoga ships flexbox only. That is a gap a fork CAN close — Yoga is
 * open-source C++, and an experimental patch adds a real `YGDisplayGrid`
 * (GridLayout.cpp, AutoPlacement.h, TrackSizing.h) with working iOS and Android
 * builds, native layout rather than a webview. It is not closed here yet: the
 * patch wants React Native 0.83-rc and an Expo canary, and taking it means this
 * fork carries a C++ layout-engine patch rebased on every upgrade.
 *
 * So the reason is a pin, not a law, and `Screen` is what the shell looks like
 * either way — a caller writes the same two components whether the inside is
 * flexbox today or grid later. `Grid` already exists for web-only surfaces.
 */
import { YStack, type YStackProps } from '@hanzo/gui'
import { slot } from './slot'

export interface ScreenProps extends YStackProps {}

/**
 * The frame. A column that fills its parent and CLIPS — clipping is half the
 * contract, because a shell whose content escapes is the same defect one level
 * out, and `overflow: visible` is what let the thread paint over the composer.
 */
const Screen = ({ children, ...props }: ScreenProps) => (
  <YStack
    {...slot('screen')}
    // `flexBasis: auto`, not the 0 that `flex={1}` alone implies. A shell is
    // usually the only thing in its parent, where either spelling fills it — but
    // put one in a ROW beside siblings and a zero basis makes it share the line
    // rather than take it, so a 720px shell rendered 276px wide. Basis auto
    // starts from its own size and grows into whatever is left, which is what
    // "fills its parent" has to mean in both directions. Same trap as the thread.
    flex={1}
    flexBasis="auto"
    minH={0}
    width="100%"
    overflow="hidden"
    {...props}
  >
    {children}
  </YStack>
)

export interface FillProps extends YStackProps {
  /** Scroll the overflow. `false` clips it instead — for a pane that pages. */
  scroll?: boolean
}

/**
 * The middle. Takes the slack, and can give it back.
 *
 * `flexBasis: 0` with `minHeight: 0` is the pair that makes "takes the slack"
 * true in both directions: grow into a bigger shell, shrink inside a smaller
 * one. Siblings need nothing — a bar keeps its natural height because it never
 * asked for slack.
 */
const Fill = ({ children, scroll = true, ...props }: FillProps) => (
  <YStack
    {...slot('fill')}
    flex={1}
    flexBasis={0}
    minH={0}
    width="100%"
    overflowY={scroll ? 'auto' : 'hidden'}
    {...props}
  >
    {children}
  </YStack>
)

export { Screen, Fill }
