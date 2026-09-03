/**
 * The production JSX runtime is React's own. A `jsxImportSource` names one
 * package for both runtimes, so this one exists to be found; it adds nothing,
 * and a production bundle carries no source positions.
 */
export { Fragment, jsx, jsxs } from 'react/jsx-runtime'
