<!-- CardTitle — mirrors the shadcn backend. -->
<script lang="ts">
  import { cn } from '../../core/cn'
  let className: string | undefined = undefined
  export { className as class }
</script>

<div data-slot="card-title" class={cn('leading-none font-semibold', className)} {...$$restProps}>
  <slot />
</div>
