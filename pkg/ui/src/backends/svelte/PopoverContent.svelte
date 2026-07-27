<!--
  PopoverContent — the floating surface (arbitrary content). Standard popover
  tokens; positioned under the trigger, `align` picks the edge. Non-modal, so
  focus is not trapped; dismissal is owned by the Popover root wrapper.
-->
<script lang="ts">
  import { getDisclosure, POPOVER } from './internal/context'
  import { cn } from '../../core/cn'

  let className: string | undefined = undefined
  export { className as class }
  export let align: 'start' | 'center' | 'end' = 'center'

  const { open, contentId, triggerId } = getDisclosure(POPOVER, 'PopoverContent')

  const alignClass: Record<typeof align, string> = {
    start: 'left-0',
    center: 'left-1/2 -translate-x-1/2',
    end: 'right-0',
  }
</script>

{#if $open}
  <div
    role="dialog"
    id={contentId}
    aria-labelledby={triggerId}
    tabindex="-1"
    data-slot="popover-content"
    data-state="open"
    data-align={align}
    class={cn(
      'absolute z-50 mt-1 w-72 rounded-md border bg-popover p-4 text-popover-foreground shadow-md outline-none',
      alignClass[align],
      className,
    )}
  >
    <slot />
  </div>
{/if}
