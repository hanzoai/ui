<!--
  Tooltip root — a relative wrapper that opens its content on hover/focus of the
  trigger and closes on leave/blur. `openDelay` gates the hover-open (focus opens
  immediately, matching accessible-tooltip behaviour).
-->
<script lang="ts">
  import { onDestroy } from 'svelte'
  import { createDisclosure, TOOLTIP } from './internal/context'

  export let openDelay = 200

  const { openIt, close } = createDisclosure(TOOLTIP, 'tooltip')

  let timer: ReturnType<typeof setTimeout> | undefined
  function scheduleOpen() {
    clearTimeout(timer)
    timer = setTimeout(openIt, openDelay)
  }
  function cancel() {
    clearTimeout(timer)
    close()
  }
  onDestroy(() => clearTimeout(timer))
</script>

<div
  class="relative inline-block"
  data-slot="tooltip"
  on:mouseenter={scheduleOpen}
  on:mouseleave={cancel}
  on:focusin={openIt}
  on:focusout={close}
>
  <slot />
</div>
