<!-- CardHeader — mirrors the shadcn backend's grid header. -->
<script lang="ts">
  import { cn } from '../../core/cn'
  let className: string | undefined = undefined
  export { className as class }
</script>

<div
  data-slot="card-header"
  class={cn(
    '@container/card-header grid auto-rows-min grid-rows-[auto_auto] items-start gap-2 px-6 has-data-[slot=card-action]:grid-cols-[1fr_auto] [.border-b]:pb-6',
    className,
  )}
  {...$$restProps}
>
  <slot />
</div>
