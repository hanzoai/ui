'use client'

import { createContext, useContext, type ReactNode } from 'react'

/** A connected host lends its account usage control to every composer. */
const Status = /* @__PURE__ */ createContext<ReactNode>(null)
export const ComposerStatusProvider = Status.Provider
export const useComposerStatus = () => useContext(Status)
