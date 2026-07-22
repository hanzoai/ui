<!-- TabsContent — the panel shown for its `value` (role=tabpanel). -->
<script lang="ts">
  import { getSelection, TABS } from './internal/context'
  import { cn } from '../../core/cn'

  let className: string | undefined = undefined
  export { className as class }
  export let value: string

  const { value: current } = getSelection(TABS, 'TabsContent')
</script>

{#if $current === value}
  <div
    role="tabpanel"
    data-slot="tabs-content"
    class={cn('flex-1 outline-none', className)}
    {...$$restProps}
  >
    <slot />
  </div>
{/if}
