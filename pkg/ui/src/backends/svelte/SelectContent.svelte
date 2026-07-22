<!--
  SelectContent — the listbox surface. Standard popover tokens; roving
  ArrowUp/Down/Home/End focus over its options. Shown while open; positioned
  in-flow under the trigger (dismissal owned by the Select root wrapper).
-->
<script lang="ts">
  import { getSelect } from './internal/context'
  import { rovingFocus } from './internal/actions'
  import { cn } from '../../core/cn'

  let className: string | undefined = undefined
  export { className as class }

  const { open, contentId, triggerId } = getSelect('SelectContent')
</script>

{#if $open}
  <div
    role="listbox"
    id={contentId}
    aria-labelledby={triggerId}
    tabindex="-1"
    use:rovingFocus={{ selector: '[role="option"]' }}
    data-slot="select-content"
    data-state="open"
    class={cn(
      'absolute z-50 mt-1 max-h-60 min-w-[8rem] overflow-y-auto rounded-md border bg-popover p-1 text-popover-foreground shadow-md',
      className,
    )}
  >
    <slot />
  </div>
{/if}
