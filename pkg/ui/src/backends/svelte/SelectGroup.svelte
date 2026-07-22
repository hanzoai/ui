<!-- SelectGroup — groups options for assistive tech. -->
<script lang="ts">
  let className: string | undefined = undefined
  export { className as class }
</script>

<div role="group" data-slot="select-group" class={className} {...$$restProps}>
  <slot />
</div>
