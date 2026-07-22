<!-- DropdownMenuItem — a menu item (native button → free Enter/Space activation). -->
<script lang="ts">
  import { getDisclosure, DROPDOWN } from './internal/context'
  import { cn } from '../../core/cn'

  let className: string | undefined = undefined
  export { className as class }
  export let disabled = false
  export let inset = false

  const { close } = getDisclosure(DROPDOWN, 'DropdownMenuItem')

  function onClick() {
    if (disabled) return
    close()
  }
</script>

<button
  type="button"
  role="menuitem"
  tabindex="-1"
  {disabled}
  data-disabled={disabled ? '' : undefined}
  data-slot="dropdown-menu-item"
  class={cn(
    'relative flex w-full cursor-default select-none items-center gap-2 rounded-sm px-2 py-1.5 text-left text-sm outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50',
    inset && 'pl-8',
    className,
  )}
  on:click={onClick}
  {...$$restProps}
>
  <slot />
</button>
