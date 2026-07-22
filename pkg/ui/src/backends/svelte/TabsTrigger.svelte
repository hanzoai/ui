<!--
  TabsTrigger — selects its `value`. role=tab with the shadcn backend's
  data-state active styling; only the active tab is in the tab order (roving).
-->
<script lang="ts">
  import { getSelection, TABS } from './internal/context'
  import { cn } from '../../core/cn'

  let className: string | undefined = undefined
  export { className as class }
  export let value: string
  export let disabled = false

  const { value: current, select } = getSelection(TABS, 'TabsTrigger')
  $: active = $current === value
</script>

<button
  type="button"
  role="tab"
  aria-selected={active}
  tabindex={active ? 0 : -1}
  {disabled}
  data-slot="tabs-trigger"
  data-state={active ? 'active' : 'inactive'}
  class={cn(
    'inline-flex h-[calc(100%-1px)] flex-1 items-center justify-center gap-1.5 whitespace-nowrap rounded-md border border-transparent px-2 py-1 text-sm font-medium transition-colors outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm',
    className,
  )}
  on:click={() => !disabled && select(value)}
  {...$$restProps}
>
  <slot />
</button>
