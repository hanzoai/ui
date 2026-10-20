/**
 * hanzo.ai's header for every site that wears it: `Masthead` draws the nav tree
 * in `./nav` — the company under the wordmark, the five menus, search, Log in
 * and Try Hanzo — and `footer()` hands `@hanzo/ui/marketing`'s `Footer` the
 * same tree's six doors. A server component that needs only the tree imports
 * `@hanzo/ui/masthead/nav`, which is data.
 */
export { HEADER, Masthead, type MastheadProps, type Person, type Tree } from './Masthead'
export * from './nav'
