/// <reference types="vite/client" />

// `vite/client` types `*.css` by path; a package that publishes a stylesheet
// under an exports key is a bare specifier, and TypeScript has no file
// extension to go on. The import is a side effect with no value to type.
declare module "@hanzo/font/css"
