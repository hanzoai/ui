<!--
  DropdownMenuContent — the menu surface. Standard-token popover styling; roving
  ArrowUp/Down/Home/End focus over its items. Positioned in-flow (absolute) under
  the trigger; `align` picks the edge.
-->
<script lang="ts">
  import { getDisclosure, DROPDOWN } from './internal/context'
  import { rovingFocus } from './internal/actions'
  import { cn } from '../../core/cn'

  let className: string | undefined = undefined
  export { className as class }
  export let align: 'start' | 'end' = 'start'

  const { open, contentId, triggerId } = getDisclosure(DROPDOWN, 'DropdownMenuContent')
</script>

{#if $open}
  <div
    role="menu"
    id={contentId}
    aria-labelledby={triggerId}
    tabindex="-1"
    use:rovingFocus
    data-slot="dropdown-menu-content"
    data-state="open"
    class={cn(
      'absolute z-50 mt-1 min-w-[8rem] overflow-hidden rounded-md border bg-popover p-1 text-popover-foreground shadow-md',
      align === 'end' ? 'right-0' : 'left-0',
      className,
    )}
  >
    <slot />
  </div>
{/if}
