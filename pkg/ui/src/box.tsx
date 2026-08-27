'use client'

/**
 * Box — an element that reads utility classes as gui style props.
 *
 * It exists to make the migration off a utility engine a rename rather than a
 * rewrite: `<div className="flex items-center gap-4">` becomes `<Box …>` with
 * the same classes, and the classes now mean what they meant through gui
 * instead of through a stylesheet the engine generated.
 *
 * What `tw` does not recognise stays a class name on the element, so a page
 * part-way through the move renders the same either way — the converted classes
 * come from gui, the rest from whatever still serves them.
 *
 * A `<div>` is `display: block`; a gui Stack is flex-column. Those disagree, so
 * Box states the div's default and lets a class override it — a `flex` class
 * says flex, and silence says block. Taking the Stack's default instead turned
 * 77 of 225 elements on one page into flex containers that were never asked to
 * be: an inline run became a column, a heading's width collapsed to its text,
 * and a page grew 8% taller.
 *
 * `tag` renders the element Box is standing in for, and it is what makes the
 * migration reach past `<div>`. Divs are about a third of what carries a
 * className in these apps; the rest are `p`, `span`, `li`, `h2`, `section`, `a`.
 * Converting those to a div-only Box would read as a rename and would in fact
 * strip the document of its headings, lists and paragraphs — every one of them a
 * thing a screen reader navigates by.
 *
 * It goes through `asChild` because gui does NOT honour a `tag` prop: asked for
 * one it renders its own element anyway AND passes `tag` through to the DOM,
 * where it is an invalid attribute. `asChild` is the supported way to say "style
 * this element instead of yours", so the semantics come from the element and the
 * styling still comes from gui — one substrate, not a second styling path for
 * everything that is not a div.
 */
import { createElement, forwardRef, type ReactNode } from 'react'
import { YStack } from '@hanzo/gui'
import { tw, type ClassValue } from './tw'
import { config } from './gui-config'

/**
 * The process-global gui config, named as a VALUE so it survives bundling.
 *
 * A rendered gui component resolves `$background` and friends against one
 * config, and it is `gui-config.ts` calling `createGui` at module scope that
 * installs it. `<Hanzo>` names it too — but an app that imports only `Box`
 * never loads `<Hanzo>`, so nothing installed it and the first render throws
 *
 *     Error: Err0
 *
 * which in production is the whole message. A bare `import './gui-config'`
 * does not fix it: Vite 8 ignores a package.json `sideEffects` ARRAY, so the
 * side-effect-only import is shaken out. A value the module references cannot
 * be. Measured on zoo.industries, where 58 files render Box and none mount
 * Hanzo directly.
 */
if (!config) throw new Error('@hanzo/ui: the gui config did not install')

/**
 * The display each element has before any class touches it.
 *
 * Box stated `block` for everything, which is the div's answer and wrong for the
 * inline ones: a converted `<a>` became a full-width block, so two links that had
 * sat side by side in a sentence stacked and the footer grew from 47px to 112px.
 * Anything absent here is `block`, which is right for div, p, section, the
 * headings, the lists and the landmarks.
 *
 * A class still wins — `flex` says flex, and silence says whatever the element
 * already was.
 */
const INLINE = new Set(['a', 'span', 'em', 'strong', 'b', 'i', 'u', 's', 'small',
  'abbr', 'cite', 'code', 'kbd', 'samp', 'var', 'sub', 'sup', 'mark', 'q', 'time',
  'label', 'output', 'bdi', 'bdo', 'ruby', 'wbr'])

/** Properties a frame ignores and a DOM element passes to its children. */
const TEXT_PROPS = ['fontSize', 'lineHeight', 'fontWeight', 'letterSpacing',
  'textTransform', 'fontFamily', 'fontStyle', 'textAlign', 'color',
  'textDecorationLine', 'whiteSpace',
  // `tabular-nums` is the one class on a checkout that MUST survive: it is what
  // makes a column of figures line up. tw converts it to fontVariantNumeric,
  // which a frame drops like the rest of these, and the loss shows as a money
  // column going ragged — a 25px total measuring 27px, which no test asserting
  // on text would notice.
  'fontVariantNumeric'] as const

/**
 * Properties gui has no style prop for, which must reach the DOM as plain CSS.
 *
 * An unrecognised prop is not dropped — it is FORWARDED, so it lands on the
 * element as an attribute: `scrollSnapType="x mandatory"` sitting in the markup
 * where `scroll-snap-type` was meant. The element renders, the attribute is
 * inert, and a carousel scrolls freely past its slides with nothing to say why.
 * Same shape as the text properties above, different reason: those are dropped
 * by the frame, these were never known to it.
 *
 * Exactly the properties `tw` emits that gui's tables do not name. gui DOES
 * carry `backgroundClip` and `backgroundOrigin`, so those stay with it; it does
 * not carry the `-webkit-` half of the pair, which is the one Safari reads for
 * clipping a gradient to text.
 */
const CSS_PROPS = ['scrollSnapType', 'scrollSnapAlign', 'scrollSnapStop',
  'WebkitBackgroundClip'] as const

/**
 * The props of the element being stood in for, ALONGSIDE gui's.
 *
 * A `<button>` carries `type` and `disabled`, a `<form>` carries `onSubmit`, a
 * `<select>` carries `value` and `onChange`. None of those are gui props, so a
 * Box typed only as a Stack rejects the very markup it exists to replace — and
 * an app converting a form finds fifteen type errors that read as a broken
 * component rather than as a missing generic. `style` and `ref` come from each
 * side and are taken from gui's, which is the one that reaches the DOM.
 */
export type BoxProps<T extends keyof React.JSX.IntrinsicElements = 'div'> =
  // The ELEMENT wins every name they share. Both sides declare `onChange`, and a
  // union of the two types the event target as
  // `HTMLDivElement | HTMLSelectElement` — so reading `e.target.value` off a
  // converted <select> is an error on the one element that has it. A component
  // whose whole job is to BE that element should answer with the element's.
  //
  // The overlap is NAMED rather than computed. `keyof IntrinsicElements[T]` reads
  // like the same statement and does nothing: with T still generic TypeScript
  // does not resolve the key set, so the Omit removes nothing and the union comes
  // back. Written out, it is checked.
  // Every ARIA state goes to the element's side, not gui's. In markup they are
  // strings — `aria-modal="false"` — which React types as `Booleanish` and gui
  // types as `boolean`, so spreading `ComponentPropsWithoutRef<'a'>` into a Box
  // failed on whichever aria the caller happened to use. Naming them one at a
  // time only moves the failure to the next one; `keyof AriaAttributes` is the
  // whole set.
  // `AllHTMLAttributes` IS that overlap, computed. The enumeration this replaces
  // was correct for the names it listed and silent about the rest, and the rest
  // kept arriving: `aria-modal` typed boolean where markup writes a string,
  // `onClickCapture` typed as a react-native event whose target is a native
  // view, `content` typed as align-content where HTML has an attribute of that
  // name. Each was one line and the next one was always waiting.
  Omit<React.ComponentProps<typeof YStack>,
    keyof React.AllHTMLAttributes<never> | 'ref' | 'onLayout'> &
  Omit<React.JSX.IntrinsicElements[T], 'style' | 'ref' | 'children' | 'className' | 'color'> & {
    className?: ClassValue
    children?: ReactNode
    ref?: React.Ref<any>
    /**
     * Plain CSS, because that is where it lands: Box hands `style` to the DOM
     * element, not to a native view. gui types it as a react-native style and a
     * caller passing `CSSProperties` — which every converted app does — was an
     * error on a prop that works.
     */
    style?: React.CSSProperties
    /**
     * The element to render. Omitted, Box is the `<div>` it has always been.
     */
    tag?: T
    /**
     * ARIA states are strings in markup and gui types this one as a boolean, so
     * both spellings are taken and normalised. Rejecting `"true"` would make a
     * correct attribute a type error.
     */
    'aria-hidden'?: boolean | 'true' | 'false'
  }

const BoxInner = forwardRef<any, BoxProps<keyof React.JSX.IntrinsicElements>>(function Box(
  { className, children, 'aria-hidden': hidden, tag, ...rest },
  ref,
) {
  const { props, rest: unread } = tw(className)
  // A View pins `min-height: 0`; a div's is `auto`, and auto is what gives a
  // flex or grid child its automatic minimum size. Pinned, a converted child of
  // a row of indefinite height measured 0px and its content vanished.
  if (!('minHeight' in props)) props.minHeight = 'auto'
  // The same fact on the other axis. A View pins `min-width: 0`, a div's is
  // auto, and auto is what stops a flex child shrinking below its content.
  if (!('minWidth' in props)) props.minWidth = 'auto'
  // gui drops a text property set on a frame — `fontSize` is not a frame style
  // prop, so it silently rendered at the inherited size and a page carrying
  // `text-xs` on a box came out three pixels larger everywhere. A div DOES pass
  // these to its children, so they ride as a plain style, which is what the
  // browser inherits from.
  const text: Record<string, unknown> = {}
  for (const k of TEXT_PROPS) if (k in props) { text[k] = props[k]; delete props[k] }
  for (const k of CSS_PROPS) if (k in props) { text[k] = props[k]; delete props[k] }
  // A div's line-height comes from the cascade; gui's Stack stamps its own, so
  // a converted box grew a few pixels per line of text. Stated only when no
  // class said otherwise, so `leading-relaxed` still wins.
  if (!('lineHeight' in text)) text.lineHeight = 'inherit'
  // A list item needs `display: list-item` or it loses its marker, and gui's
  // display prop has no such value — its set is block/contents/flex/inline/…
  // So it rides as a plain style, where it also outranks the class gui emits.
  if (tag === 'li' && !('display' in props)) text.display = 'list-item'
  const style = Object.keys(text).length
    ? { ...text, ...(rest as any).style }
    : (rest as any).style
  // Explicit props win: a caller who states a value directly means it, and the
  // classes are what they are migrating away from.
  const frame = (
    <YStack
      ref={tag ? undefined : ref}
      asChild={tag ? true : undefined}
      display={tag && INLINE.has(tag) ? 'inline' : 'block'}
      // A View does not shrink; a div does. Left at the View's default, every
      // converted flex child held its full basis and overflowed its row instead
      // of sharing it — two half-width columns came out 608px each in a 1216px
      // row with a 32px gap, where the divs they replaced sat at 592.
      // `shrink`, not `flexShrink`: gui types the shorthand and compiles both to
      // the same `_shrink-1`, and the DOM spelling is the one it does not carry.
      shrink={1}
      aria-hidden={hidden === undefined ? undefined : hidden !== 'false' && hidden !== false}
      {...(props as object)}
      // With a tag, everything the caller passed belongs to the ELEMENT, not to
      // the frame: `href`, `type` and `onSubmit` are the element's and gui has no
      // use for them. Without one, this IS the element and they ride here.
      {...(tag ? {} : (rest as object))}
      className={tag ? undefined : unread || undefined}
      style={tag ? undefined : style}
    >
      {/* Under `asChild` gui styles THIS element and renders no frame of its own,
          so the class it could not read and the text styles a frame would drop
          both belong here — on the element that survives. */}
      {tag
        ? createElement(
            tag,
            { ...(rest as object), ref, className: unread || undefined, style },
            children,
          )
        : children}
    </YStack>
  )

  return frame
})

/**
 * `forwardRef` cannot carry a generic through, so the props of every element
 * collapse into a UNION — and a union demands a prop be valid for ALL of them,
 * which makes `href`, `type` and `onSubmit` errors on the very elements that
 * own them. The cast is what restores inference from `tag`, and it is the
 * standard shape for a polymorphic component: the implementation stays checked
 * against the union, the CALLER gets the one element it named.
 */
export const Box = BoxInner as <T extends keyof React.JSX.IntrinsicElements = 'div'>(
  props: BoxProps<T> & { ref?: React.Ref<any> },
) => React.ReactElement | null

export default Box
