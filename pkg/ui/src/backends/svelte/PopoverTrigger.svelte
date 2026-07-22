<!-- PopoverTrigger — button toggling the popover. -->
<script lang="ts">
  import { getDisclosure, POPOVER } from './internal/context'

  let className: string | undefined = undefined
  export { className as class }

  const { toggle, open, contentId, triggerId } = getDisclosure(POPOVER, 'PopoverTrigger')
</script>

<button
  type="button"
  id={triggerId}
  aria-haspopup="dialog"
  aria-expanded={$open}
  aria-controls={contentId}
  data-state={$open ? 'open' : 'closed'}
  data-slot="popover-trigger"
  class={className}
  on:click={toggle}
  {...$$restProps}
>
  <slot />
</button>
