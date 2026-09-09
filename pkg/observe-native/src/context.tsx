// React context for the native binding: the @hanzo/event client, the shared
// playback stream, the redaction policy, and — the native equivalent of walking
// the DOM ancestry — a Scope stack. ObserveScope wraps a screen/section with a
// name; nested scopes compose the semantic hierarchy that each captured tap
// carries, auto-derived from the React tree.

import { createContext, createElement, useContext, useMemo, useRef, type ReactNode } from 'react'
import { Stream } from '@hanzo/observe'
import type { Interaction, RedactionPolicy, SemanticNode } from '@hanzo/observe'
import type { Analytics } from '@hanzo/event'
import { scopeNode } from './semantic'

export const ClientCtx = createContext<Analytics | null>(null)
export const StreamCtx = createContext<Stream<Interaction> | null>(null)
export const ScopeCtx = createContext<SemanticNode[]>([])
export const RedactionCtx = createContext<RedactionPolicy | undefined>(undefined)

export interface ObserveProviderProps {
  /** The @hanzo/event client every captured interaction is emitted through. */
  client: Analytics
  /** Privacy policy (input masking, extra sensitive patterns). */
  redaction?: RedactionPolicy
  children: ReactNode
}

/** ObserveProvider seeds the client, a shared playback stream, and the redaction
 *  policy for its subtree. Wrap the app root once. */
export function ObserveProvider(props: ObserveProviderProps): ReactNode {
  const { client, redaction, children } = props
  const stream = useRef<Stream<Interaction> | null>(null)
  if (!stream.current) stream.current = new Stream<Interaction>()
  return createElement(
    ClientCtx.Provider,
    { value: client },
    createElement(
      StreamCtx.Provider,
      { value: stream.current },
      createElement(RedactionCtx.Provider, { value: redaction }, children),
    ),
  )
}

export interface ObserveScopeProps {
  /** The scope's name — a screen or section (e.g. "Dashboard", "UserCard"). */
  name: string
  /** Optional role (default "group"). */
  role?: string
  /** Optional test id. */
  testid?: string
  children: ReactNode
}

/** ObserveScope pushes a named node onto the semantic path for its subtree. Nest
 *  them to build the hierarchy a tap is reported within. */
export function ObserveScope(props: ObserveScopeProps): ReactNode {
  const { name, role, testid, children } = props
  const parent = useContext(ScopeCtx)
  const scope = useMemo(() => [...parent, scopeNode({ name, role, testid })], [parent, name, role, testid])
  return createElement(ScopeCtx.Provider, { value: scope }, children)
}
