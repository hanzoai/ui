<!-- DialogTitle — labels the dialog for assistive tech (aria-labelledby target). -->
<script lang="ts">
  import { getDisclosure, DIALOG } from './internal/context'
  import { cn } from '../../core/cn'
  let className: string | undefined = undefined
  export { className as class }
  const { labelId } = getDisclosure(DIALOG, 'DialogTitle')
</script>

<h2
  id={labelId}
  data-slot="dialog-title"
  class={cn('text-lg font-semibold leading-none', className)}
  {...$$restProps}
>
  <slot />
</h2>
