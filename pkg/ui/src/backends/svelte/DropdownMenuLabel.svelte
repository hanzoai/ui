<!-- DropdownMenuLabel — mirrors the shadcn backend. -->
<script lang="ts">
  import { cn } from '../../core/cn'
  let className: string | undefined = undefined
  export { className as class }
  export let inset = false
</script>

<div
  data-slot="dropdown-menu-label"
  class={cn('px-2 py-1.5 text-sm font-semibold', inset && 'pl-8', className)}
  {...$$restProps}
>
  <slot />
</div>
