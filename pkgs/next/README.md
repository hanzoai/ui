
## Opening what is on screen in the editor

`@hanzo/source` keeps each element's file and line in development and opens
it on Alt + right click through Next's own `/__nextjs_launch-editor`. Name the
runtime in `tsconfig.json`, which SWC reads:

```json
{ "compilerOptions": { "jsx": "preserve", "jsxImportSource": "@hanzo/source" } }
```

and render `<Source />` from `@hanzo/source/react` once, in the root layout.
