import { Context, createContext } from 'react'
import {
  Atom,
  AtomBase,
  AtomConfig,
  AtomInstance,
  AtomValue,
  ReadonlyAppAtom,
  ReadonlyAppAtomConfig,
  ReadonlyGlobalAtom,
  ReadonlyGlobalAtomConfig,
  ReadonlyLocalAtom,
  ReadonlyLocalAtomConfig,
  Scope,
} from '../types'
import { useAtomSubscription } from '../hooks/useAtomSubscription'
import { injectAtomSubscription } from '../injectors/injectAtomSubscription'
import {
  EMPTY_CONTEXT,
  generateImplementationId,
  getInstanceMethods,
} from '../utils'
import { createAtom } from '../utils/createAtom'

export const selector: {
  // Basic atom(key, val) overload:
  <
    State = any,
    Params extends any[] = [],
    Methods extends Record<string, () => any> = Record<string, () => any>
  >(
    key: string,
    value: AtomValue<State> | ((...params: Params) => AtomValue<State>)
  ): ReadonlyAppAtom<State, Params, Methods>
  // ReadonlyGlobalAtom:
  <
    State = any,
    Params extends any[] = [],
    Methods extends Record<string, () => any> = Record<string, () => any>
  >(
    options: Omit<ReadonlyGlobalAtomConfig<State, Params>, 'readonly'>
  ): ReadonlyGlobalAtom<State, Params, Methods>
  // ReadonlyAppAtom:
  <
    State = any,
    Params extends any[] = [],
    Methods extends Record<string, () => any> = Record<string, () => any>
  >(
    options: Omit<ReadonlyAppAtomConfig<State, Params>, 'readonly'>
  ): ReadonlyAppAtom<State, Params, Methods>
  // ReadonlyLocalAtom:
  <
    State = any,
    Params extends any[] = [],
    Methods extends Record<string, () => any> = Record<string, () => any>
  >(
    options: Omit<ReadonlyLocalAtomConfig<State, Params>, 'readonly'>
  ): ReadonlyLocalAtom<State, Params, Methods>
} = <State, Params extends any[], Methods extends Record<string, () => any>>(
  paramA: string | AtomConfig<State, Params>,
  maybeFactory?: Atom<State>['value']
) => {
  let options: AtomConfig<State, Params>

  if (!paramA) {
    throw new TypeError('Zedux - All atoms must have a key')
  }

  if (typeof paramA === 'object') {
    options = paramA
  } else {
    options = { value: maybeFactory, key: paramA }
  }

  const { flags, key, readonly, scope = Scope.App, value } = options

  let reactContext: Context<AtomInstance<State>>
  const getReactContext = () => {
    if (reactContext) return reactContext

    return (reactContext = createContext(EMPTY_CONTEXT as any))
  }

  const injectInstance = (...params: Params) => {
    const atomInstance = injectAtomSubscription<State, Params, Methods>(
      'injectInstance()',
      newAtom,
      params
    )

    const { injectMethods, injectValue } = atomInstance
    return { injectMethods, injectValue }
  }

  const injectMethods = (...params: Params) => {
    const atomInstance = injectAtomSubscription<State, Params, Methods>(
      'injectMethods()',
      newAtom,
      params
    )

    return getInstanceMethods(atomInstance)
  }

  const injectValue = (...params: Params) => {
    const atomInstance = injectAtomSubscription<State, Params, Methods>(
      'injectValue()',
      newAtom,
      params
    )

    return atomInstance.stateStore.getState()
  }

  const override: Atom<State, Params>['override'] = newValue =>
    selector({ ...(options as any), value: newValue })

  const useInstance = (...params: Params) => {
    const atomInstance = useAtomSubscription<State, Params, Methods>(
      newAtom,
      params
    )

    const { useMethods, useValue } = atomInstance
    return { useMethods, useValue }
  }

  const useMethods = (...params: Params) => {
    const atomInstance = useAtomSubscription<State, Params, Methods>(
      newAtom,
      params
    )

    return getInstanceMethods(atomInstance)
  }

  const useValue = (...params: Params) => {
    const atomInstance = useAtomSubscription<State, Params, Methods>(
      newAtom,
      params
    )

    return atomInstance.stateStore.getState()
  }

  const newAtom: AtomBase<State, Params, Methods> = {
    getReactContext,
    injectInstance,
    injectMethods,
    injectValue,
    internalId: generateImplementationId(),
    flags,
    key,
    override,
    readonly,
    scope,
    useInstance,
    useMethods,
    useValue,
    value,
  }

  createAtom<State, Params>(newAtom, options)

  return newAtom as any // the overloads of this function give consumers all the type info they need
}

/*
  when an atom is created:
  set a timeout to dispatch a createAtom action so we can track all atom implementations
*/
