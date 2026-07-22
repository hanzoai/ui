<!--
  Select root — owns the open listbox, the selected value, and a value→label
  registry shared with its parts via context. `bind:value` gives two-way control;
  dismisses on Escape / outside press while open.
-->
<script lang="ts">
  import { createSelect } from './internal/context'
  import { dismiss } from './internal/actions'

  export let value = ''

  const { value: valueStore, open, close } = createSelect(value)
  $: valueStore.set(value)
  $: value = $valueStore
</script>

<div
  class="relative inline-block"
  data-slot="select"
  use:dismiss={{ onDismiss: close, enabled: $open }}
>
  <slot />
</div>
