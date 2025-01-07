# hanzoui/react-sdk
- `@hanzo/ui`
- `@hanzo/auth`
- `@hanzo/commerce`

Accessible and customizable components that you can use to build your AI apps.


## `@hanzo/ui` Documentation

Visit http://ui.hanzo.ai for general documentation on `@hanzo/ui/primitives` which is an enhanced superset of [`@shadcn/ui`](https://ui.shadcn.com/).  

#### Differences from `shadcn` and other notes:
- **Enhancments to use of Tailwind**: Shadcn uses it's own set of [Tailwind](https://tailwindcss.com/) style classes.  These are adequate as a starting point, but do not fully meet the needs of a framework that can be used to build highly branded and individualized performant web-apps.  Our components use a more flexible and complete set of styles.  Have a look in `ui/tailwind` and `ui/style` for a more complete sense of our design system and it's uses.
- **Expanded set of utility components and types** We also have several components that take our handy and useful config objects, like `LinkDef` and `ImageDef` that can be used to specify entire nav menus easily.  The components that render them are also in `primitives`.  Some of these, like those that have to do with navigation, and image optimization may be specific to `nextjs` are to be found in that subdirectory.  We plan to create analogs for `remix` and other frameworks. But for now at least, one can import `primitives` cleanly without any `next` cruft by importing `@hanzo/ui/primitives-common`, which is the general subset that does not import or use anything from `next`.  

#### Blocks and Block Component
(coming soon)


## Contributing

Please read the [contributing guide](/CONTRIBUTING.md).

## License

Licensed under the [BSD 3 Clause](./LICENSE.md) License.
