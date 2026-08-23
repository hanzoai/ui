'use client'

/**
 * LAYOUT — the primitives an app lays a screen out with.
 *
 * These are re-exports of @hanzo/gui, and that is the whole point: this package
 * is declared to be "the canonical component API apps import", but it shipped
 * Button, Card and Dialog while omitting the stacks and the type scale. So no
 * app could actually obey the rule. Measured in hanzo.app: 216 files import
 * @hanzo/gui DIRECTLY — YStack (199), XStack (185), SizableText (185),
 * Paragraph (161), H3 (66), H1 (43), Anchor (41), H2 (39), Image (20), H4 (15),
 * View, Text, GuiElement — because there was nowhere else to get them.
 *
 * An app reaching past its component library is not a style problem. It is the
 * library failing to be the one entry point: the app then pins its own @hanzo/gui
 * version, resolves a second copy of the runtime (which is how "Missing theme."
 * happens), and every primitive it draws sits outside anything this package can
 * restyle, theme or fix centrally.
 *
 * So: ONE import source. `@hanzo/gui` is an implementation detail of
 * `@hanzo/ui`, named in exactly one place — here.
 *
 * Named, never `export *`: this is a client boundary and Next refuses a star
 * across one ("It's currently unsupported to use `export *` in a client
 * boundary"), and a star also defeats tree-shaking, so importing XStack would
 * drag the whole gui surface in. Same rule the root barrel already follows.
 */

export {
  // Stacks — @hanzogui/stacks
  XStack,
  YStack,
  ZStack,

  // Type scale — @hanzogui/text. `SizableText` is the workhorse; the headings
  // carry the scale so a screen never hand-picks a font size.
  SizableText,
  Paragraph,
  Heading,
  H1,
  H2,
  H3,
  H4,
  H5,
  H6,
  Span,
  Strong,
  Em,

  // Leaves — a link, an image, a gap, a scroller.
  Anchor,
  Image,
  Spacer,
  ScrollView,

  // The untyped hosts, for the rare case a component needs a bare box.
  View,
  Text,
} from '@hanzo/gui'

export type { GuiElement } from '@hanzo/gui'
