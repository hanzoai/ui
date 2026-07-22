<!-- DropdownMenuSeparator — mirrors the shadcn backend. -->
<script lang="ts">
  import { cn } from '../../core/cn'
  let className: string | undefined = undefined
  export { className as class }
</script>

<div
  role="separator"
  aria-orientation="horizontal"
  data-slot="dropdown-menu-separator"
  class={cn('-mx-1 my-1 h-px bg-border', className)}
  {...$$restProps}
></div>
