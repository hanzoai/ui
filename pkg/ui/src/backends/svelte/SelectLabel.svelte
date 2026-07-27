<!-- SelectLabel — a group heading. -->
<script lang="ts">
  import { cn } from '../../core/cn'
  let className: string | undefined = undefined
  export { className as class }
</script>

<div
  data-slot="select-label"
  class={cn('px-2 py-1.5 text-xs text-muted-foreground', className)}
  {...$$restProps}
>
  <slot />
</div>
