<!-- DropdownMenuTrigger — button toggling the menu. -->
<script lang="ts">
  import { getDisclosure, DROPDOWN } from './internal/context'

  let className: string | undefined = undefined
  export { className as class }

  const { toggle, open, contentId, triggerId } = getDisclosure(DROPDOWN, 'DropdownMenuTrigger')
</script>

<button
  type="button"
  id={triggerId}
  aria-haspopup="menu"
  aria-expanded={$open}
  aria-controls={contentId}
  data-state={$open ? 'open' : 'closed'}
  data-slot="dropdown-menu-trigger"
  class={className}
  on:click={toggle}
  {...$$restProps}
>
  <slot />
</button>
