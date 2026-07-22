<!-- CardDescription — mirrors the shadcn backend. -->
<script lang="ts">
  import { cn } from '../../core/cn'
  let className: string | undefined = undefined
  export { className as class }
</script>

<div data-slot="card-description" class={cn('text-muted-foreground text-sm', className)} {...$$restProps}>
  <slot />
</div>
