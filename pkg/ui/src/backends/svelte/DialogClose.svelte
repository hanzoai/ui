<!-- DialogClose — a button that closes the dialog. -->
<script lang="ts">
  import { getDisclosure, DIALOG } from './internal/context'
  let className: string | undefined = undefined
  export { className as class }
  const { close } = getDisclosure(DIALOG, 'DialogClose')
</script>

<button type="button" data-slot="dialog-close" class={className} on:click={close} {...$$restProps}>
  <slot />
</button>
