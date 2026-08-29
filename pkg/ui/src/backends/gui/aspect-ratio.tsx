
/**
 * AspectRatio — a box that holds a width-to-height ratio.
 *
 * `aspectRatio` is a first-class layout property of the gui/Yoga box model, so
 * there is nothing to compute and no padding-bottom trick: the ratio is the
 * style. That is why this is the whole component on web, native and desktop.
 *
 * The reason to reach for it is that the box has an intrinsic height BEFORE its
 * content loads. An `<img>` with no ratio is 0px tall until the bytes arrive,
 * which is both the "media box rendered at zero height" defect and the layout
 * shift when it finally does. Ratio first, content second — the box is never
 * zero-height, so nothing below it ever moves.
 *
 * `overflow: hidden` is not decoration: the child is sized to FILL this box (see
 * the `[data-slot='aspect-ratio'] > img` rule in styles/motion.css), and a
 * cover-fitted image is by definition larger than its frame on one axis.
 * `position: relative` makes this the containing block, so an absolutely
 * positioned overlay — a play button, a scrim, a badge — lands on the media
 * instead of on the page.
 */
import { YStack, type YStackProps } from '@hanzo/gui'

export interface AspectRatioProps extends YStackProps {
  /** Width divided by height. Square by default. */
  ratio?: number
}

const AspectRatio = ({ ratio = 1, ...props }: AspectRatioProps) => (
  <YStack
    data-slot="aspect-ratio"
    width="100%"
    aspectRatio={ratio}
    overflow="hidden"
    position="relative"
    {...props}
    // AFTER the spread, deliberately. `data-slot` is the caller-facing name and
    // a wrapper may rename it — CardMedia does — but the fill rule in
    // styles/motion.css keys off THIS attribute, so the contract survives being
    // wrapped. Targeting data-slot instead is how the rule silently stopped
    // matching the moment Card.Media renamed the slot.
    data-ratio=""
  />
)

export { AspectRatio }
