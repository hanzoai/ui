<!-- Label — standard-token form label; mirrors the shadcn backend. -->
<script lang="ts">
  import { cn } from '../../core/cn'

  let className: string | undefined = undefined
  export { className as class }
  /** Associate the label with a control by its id. */
  export let forId: string | undefined = undefined
</script>

<label
  for={forId}
  data-slot="label"
  class={cn(
    'flex items-center gap-2 text-sm leading-none font-medium select-none group-data-[disabled=true]:pointer-events-none group-data-[disabled=true]:opacity-50 peer-disabled:cursor-not-allowed peer-disabled:opacity-50',
    className,
  )}
  on:click
  {...$$restProps}
>
  <slot />
</label>
