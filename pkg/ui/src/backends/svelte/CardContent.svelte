<!-- CardContent — mirrors the shadcn backend. -->
<script lang="ts">
  import { cn } from '../../core/cn'
  let className: string | undefined = undefined
  export { className as class }
</script>

<div data-slot="card-content" class={cn('px-6', className)} {...$$restProps}>
  <slot />
</div>
