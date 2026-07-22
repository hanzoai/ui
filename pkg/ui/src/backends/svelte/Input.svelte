<!-- Input — standard-token text field; class string mirrors the shadcn backend. -->
<script lang="ts">
  import { cn } from '../../core/cn'

  let className: string | undefined = undefined
  export { className as class }
  export let value: string | number = ''
  export let type = 'text'
  export let disabled = false
  export let readonly = false
  export let placeholder: string | undefined = undefined

  // Svelte forbids `bind:value` together with a dynamic `type`; set the type via
  // an action and keep `value` controlled so a consumer's `bind:value` still
  // receives updates through the exported prop.
  function typeAttr(node: HTMLInputElement, t: string) {
    node.type = t
    return { update: (next: string) => { node.type = next } }
  }
</script>

<input
  use:typeAttr={type}
  {value}
  {disabled}
  {readonly}
  {placeholder}
  data-slot="input"
  class={cn(
    'flex h-9 w-full min-w-0 rounded-md border border-input bg-transparent px-3 py-1 text-sm text-foreground shadow-xs transition-colors outline-none file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-destructive/20',
    className,
  )}
  on:input={(e) => (value = e.currentTarget.value)}
  on:input
  on:change
  on:keydown
  on:focus
  on:blur
  {...$$restProps}
/>
