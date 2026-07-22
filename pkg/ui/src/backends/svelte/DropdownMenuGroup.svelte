<!-- DropdownMenuGroup — mirrors the shadcn backend. -->
<script lang="ts">
  let className: string | undefined = undefined
  export { className as class }
</script>

<div role="group" data-slot="dropdown-menu-group" class={className} {...$$restProps}>
  <slot />
</div>
