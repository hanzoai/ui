<!-- SelectSeparator — divides option groups. -->
<script lang="ts">
  import { cn } from '../../core/cn'
  let className: string | undefined = undefined
  export { className as class }
</script>

<div
  role="separator"
  data-slot="select-separator"
  class={cn('-mx-1 my-1 h-px bg-border', className)}
  {...$$restProps}
></div>
