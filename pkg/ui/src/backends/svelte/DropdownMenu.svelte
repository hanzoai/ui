<!--
  DropdownMenu root — a relative wrapper holding the trigger and menu; owns the
  disclosure and dismisses on Escape / outside press while open.
-->
<script lang="ts">
  import { createDisclosure, DROPDOWN } from './internal/context'
  import { dismiss } from './internal/actions'

  const { open, close } = createDisclosure(DROPDOWN, 'dropdown')
</script>

<div
  class="relative inline-block text-left"
  data-slot="dropdown-menu"
  use:dismiss={{ onDismiss: close, enabled: $open }}
>
  <slot />
</div>
