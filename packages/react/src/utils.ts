import { AnyAtomTemplate, AtomTemplateBase, Ecosystem, is } from '@zedux/atoms'
import React, { Context, createContext, use } from 'react'

export const ecosystemContext = createContext('@@global')

/**
 * These are copied from packages/atoms/src/utils/general.ts
 *
 * IMPORTANT: keep these in-sync with the ones in the atoms package
 */
export const TopPrio = 0
export const Eventless = 1
export const Explicit = 2
export const External = 4
export const Static = 8
export const OutOfRange = 16 // not a flag; use a value bigger than any flag
export const ExplicitExternal = Explicit | External
export const EventlessStatic = Eventless | Static

export const destroyed = Symbol.for(`@@zedux/destroyed`)

export const getReactContext = (
  ecosystem: Ecosystem,
  template: AnyAtomTemplate
) => {
  const reactStorage: {
    contexts: WeakMap<typeof createContext, Record<string, React.Context<any>>>
  } = (ecosystem._storage.react ||= {})

  const contexts = (reactStorage.contexts ||= new WeakMap())
  const windowContexts =
    contexts.get(createContext) ||
    (contexts.set(createContext, {}).get(createContext) as Record<
      string,
      React.Context<any>
    >)

  return (windowContexts[template.key] ||= createContext(
    undefined
  ) as React.Context<any>)
}

export const reactContextScope = (
  ecosystem: Ecosystem,
  context: Record<string, any>
) =>
  use(
    is(context, AtomTemplateBase)
      ? getReactContext(ecosystem, context as AtomTemplateBase)
      : (context as Context<any>)
  )
