<!--
  TooltipContent — the tip surface (role=tooltip, non-interactive). Standard
  popover tokens; positioned relative to the trigger via `side` (default top).
-->
<script lang="ts">
  import { getDisclosure, TOOLTIP } from './internal/context'
  import { cn } from '../../core/cn'

  let className: string | undefined = undefined
  export { className as class }
  export let side: 'top' | 'bottom' | 'left' | 'right' = 'top'

  const { open, contentId } = getDisclosure(TOOLTIP, 'TooltipContent')

  const sideClass: Record<typeof side, string> = {
    top: 'bottom-full left-1/2 -translate-x-1/2 mb-1',
    bottom: 'top-full left-1/2 -translate-x-1/2 mt-1',
    left: 'right-full top-1/2 -translate-y-1/2 mr-1',
    right: 'left-full top-1/2 -translate-y-1/2 ml-1',
  }
</script>

{#if $open}
  <div
    role="tooltip"
    id={contentId}
    data-slot="tooltip-content"
    data-state="open"
    data-side={side}
    class={cn(
      'absolute z-50 w-fit whitespace-nowrap rounded-md border bg-popover px-3 py-1.5 text-xs text-popover-foreground shadow-md',
      sideClass[side],
      className,
    )}
  >
    <slot />
  </div>
{/if}
