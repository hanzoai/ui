<!-- Separator — standard-token rule; mirrors the shadcn backend. -->
<script lang="ts">
  import { cn } from '../../core/cn'

  let className: string | undefined = undefined
  export { className as class }
  export let orientation: 'horizontal' | 'vertical' = 'horizontal'
  /** A purely-decorative separator is hidden from assistive tech. */
  export let decorative = true
</script>

<div
  role={decorative ? 'none' : 'separator'}
  aria-orientation={decorative ? undefined : orientation}
  data-slot="separator"
  data-orientation={orientation}
  class={cn(
    'bg-border shrink-0 data-[orientation=horizontal]:h-px data-[orientation=horizontal]:w-full data-[orientation=vertical]:h-full data-[orientation=vertical]:w-px',
    className,
  )}
  {...$$restProps}
></div>
