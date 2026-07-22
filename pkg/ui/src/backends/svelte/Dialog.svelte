<!--
  Dialog root — owns the open/closed disclosure and shares it with its parts via
  context. `bind:open` gives two-way external control; DialogTrigger/DialogClose
  drive it internally.
-->
<script lang="ts">
  import { createDisclosure, DIALOG } from './internal/context'

  export let open = false

  const disclosure = createDisclosure(DIALOG, 'dialog')
  const { open: openStore } = disclosure

  // Mirror the external prop and the internal store (converges for booleans).
  $: openStore.set(open)
  $: open = $openStore
</script>

<slot />
