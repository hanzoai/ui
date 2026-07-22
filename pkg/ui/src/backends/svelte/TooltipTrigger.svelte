<!-- TooltipTrigger — the hover/focus target; describes itself with the tip. -->
<script lang="ts">
  import { getDisclosure, TOOLTIP } from './internal/context'

  let className: string | undefined = undefined
  export { className as class }

  const { open, contentId } = getDisclosure(TOOLTIP, 'TooltipTrigger')
</script>

<button
  type="button"
  aria-describedby={$open ? contentId : undefined}
  data-slot="tooltip-trigger"
  class={className}
  on:click
  {...$$restProps}
>
  <slot />
</button>
