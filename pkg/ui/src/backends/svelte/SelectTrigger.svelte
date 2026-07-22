<!--
  SelectTrigger — opens the listbox and shows the current value (usually via
  SelectValue in its slot). Standard-token styling parallels the shadcn backend;
  trailing chevron.
-->
<script lang="ts">
  import { getSelect } from './internal/context'
  import { cn } from '../../core/cn'

  let className: string | undefined = undefined
  export { className as class }
  export let disabled = false

  const { toggle, open, contentId, triggerId } = getSelect('SelectTrigger')
</script>

<button
  type="button"
  id={triggerId}
  role="combobox"
  aria-haspopup="listbox"
  aria-expanded={$open}
  aria-controls={contentId}
  {disabled}
  data-slot="select-trigger"
  data-state={$open ? 'open' : 'closed'}
  class={cn(
    'flex h-9 w-fit items-center justify-between gap-2 whitespace-nowrap rounded-md border border-input bg-transparent px-3 py-2 text-sm text-foreground shadow-xs transition-colors outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50',
    className,
  )}
  on:click={() => !disabled && toggle()}
  {...$$restProps}
>
  <slot />
  <svg
    viewBox="0 0 24 24"
    class="size-4 opacity-50"
    fill="none"
    stroke="currentColor"
    stroke-width="2"
    stroke-linecap="round"
    stroke-linejoin="round"
    aria-hidden="true"
  >
    <path d="m6 9 6 6 6-6" />
  </svg>
</button>
