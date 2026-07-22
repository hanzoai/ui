<!-- Textarea — standard-token multiline field; mirrors the shadcn backend. -->
<script lang="ts">
  import { cn } from '../../core/cn'

  let className: string | undefined = undefined
  export { className as class }
  export let value = ''
  export let disabled = false
  export let readonly = false
  export let placeholder: string | undefined = undefined
</script>

<textarea
  bind:value
  {disabled}
  {readonly}
  {placeholder}
  data-slot="textarea"
  class={cn(
    'flex min-h-16 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm text-foreground shadow-xs transition-colors outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-destructive/20 field-sizing-content',
    className,
  )}
  on:input
  on:change
  on:keydown
  on:focus
  on:blur
  {...$$restProps}
></textarea>
