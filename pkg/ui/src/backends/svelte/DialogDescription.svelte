<!-- DialogDescription — describes the dialog (aria-describedby target). -->
<script lang="ts">
  import { getDisclosure, DIALOG } from './internal/context'
  import { cn } from '../../core/cn'
  let className: string | undefined = undefined
  export { className as class }
  const { descId } = getDisclosure(DIALOG, 'DialogDescription')
</script>

<p
  id={descId}
  data-slot="dialog-description"
  class={cn('text-muted-foreground text-sm', className)}
  {...$$restProps}
>
  <slot />
</p>
