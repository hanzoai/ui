<!--
  Popover root — a relative wrapper holding the trigger and content; owns the
  disclosure and dismisses on Escape / outside press while open. `bind:open`
  gives two-way external control.
-->
<script lang="ts">
  import { createDisclosure, POPOVER } from './internal/context'
  import { dismiss } from './internal/actions'

  export let open = false

  const { open: openStore, close } = createDisclosure(POPOVER, 'popover')
  $: openStore.set(open)
  $: open = $openStore
</script>

<div
  class="relative inline-block"
  data-slot="popover"
  use:dismiss={{ onDismiss: close, enabled: $openStore }}
>
  <slot />
</div>
