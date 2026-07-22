<!-- DialogTrigger — a button that opens the dialog. -->
<script lang="ts">
  import { getDisclosure, DIALOG } from './internal/context'

  let className: string | undefined = undefined
  export { className as class }

  const { openIt, open, contentId, triggerId } = getDisclosure(DIALOG, 'DialogTrigger')
</script>

<button
  type="button"
  id={triggerId}
  aria-haspopup="dialog"
  aria-expanded={$open}
  aria-controls={contentId}
  data-slot="dialog-trigger"
  class={className}
  on:click={openIt}
  {...$$restProps}
>
  <slot />
</button>
