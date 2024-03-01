# Next related Lux helpers

### no `index.ts` file, and `load-and-return-lux-next-fonts-on-import.ts`

Next font loading requires the fonts to be assigned to const's in module scope (ie, loaded when the module is evaluated, exactly once).

If there was an `index.ts` "barrel file", and the client code imported anything from this package, it would have resulted in evaluting all the packages imported including the that loaded the fonts. Without the index, the client code knows what modules import it and thus when it happens.

tl;dr: See [this article from Vercel](https://vercel.com/blog/how-we-optimized-package-imports-in-next-js) about this issue. 

(Previously, not having this safegaurd caused a serious bug becuase the fonts were loaded far too early.)