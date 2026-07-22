<!-- PopoverAnchor — positioning anchor; API parity with the shadcn backend. -->
<script lang="ts">
  let className: string | undefined = undefined
  export { className as class }
</script>

<div data-slot="popover-anchor" class={className} {...$$restProps}>
  <slot />
</div>
