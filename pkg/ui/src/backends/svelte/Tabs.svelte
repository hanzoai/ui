<!--
  Tabs root — owns the selected value and shares it with the list/triggers/panels
  via context. `bind:value` gives two-way external control (mirrors the shadcn
  backend's controlled `value`).
-->
<script lang="ts">
  import { createSelection, TABS } from './internal/context'
  import { cn } from '../../core/cn'

  let className: string | undefined = undefined
  export { className as class }
  export let value = ''

  const { value: valueStore } = createSelection(TABS, value)
  // Converge the external prop and the shared store (booleans/strings settle).
  $: valueStore.set(value)
  $: value = $valueStore
</script>

<div data-slot="tabs" class={cn('flex flex-col gap-2', className)} {...$$restProps}>
  <slot />
</div>
