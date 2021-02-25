import { Context, createContext, useContext } from 'react'
import {
  AppAtom,
  AppAtomConfig,
  Atom,
  AtomBase,
  AtomConfig,
  AtomInstance,
  AtomValue,
  GlobalAtom,
  GlobalAtomConfig,
  LocalAtom,
  LocalAtomConfig,
  ReadonlyAppAtom,
  ReadonlyAppAtomConfig,
  ReadonlyGlobalAtom,
  ReadonlyGlobalAtomConfig,
  ReadonlyLocalAtom,
  ReadonlyLocalAtomConfig,
  Scope,
} from '../types'
import { useAtomWithSubscription } from '../hooks/useAtomWithSubscription'
import { injectAtomWithSubscription } from '../injectors/injectAtomWithSubscription'
import {
  EMPTY_CONTEXT,
  EvaluationTargetType,
  EvaluationType,
  generateImplementationId,
  getInstanceMethods,
  getKeyHash,
} from '../utils'
import { createAtom } from '../utils/createAtom'
import { injectAtomWithoutSubscription } from '../injectors/injectAtomWithoutSubscription'
import { useAtomWithoutSubscription } from '../hooks'
import { appCsContext, diContext } from '../utils/csContexts'
import { getAtomInstance } from '../utils/getAtomInstance'
import { appContext } from '../components'

export const atom: {
  // Basic atom(key, val) overload:
  <
    State = any,
    Params extends any[] = [],
    Methods extends Record<string, () => any> = Record<string, () => any>
  >(
    key: string,
    value: AtomValue<State> | ((...params: Params) => AtomValue<State>)
  ): AppAtom<State, Params, Methods>
  // ReadonlyGlobalAtom:
  <
    State = any,
    Params extends any[] = [],
    Methods extends Record<string, () => any> = Record<string, () => any>
  >(
    options: ReadonlyGlobalAtomConfig<State, Params>
  ): ReadonlyGlobalAtom<State, Params, Methods>
  // GlobalAtom:
  <
    State = any,
    Params extends any[] = [],
    Methods extends Record<string, () => any> = Record<string, () => any>
  >(
    options: GlobalAtomConfig<State, Params>
  ): GlobalAtom<State, Params, Methods>
  // ReadonlyAppAtom:
  <
    State = any,
    Params extends any[] = [],
    Methods extends Record<string, () => any> = Record<string, () => any>
  >(
    options: ReadonlyAppAtomConfig<State, Params>
  ): ReadonlyAppAtom<State, Params, Methods>
  // AppAtom:
  <
    State = any,
    Params extends any[] = [],
    Methods extends Record<string, () => any> = Record<string, () => any>
  >(
    options: AppAtomConfig<State, Params>
  ): AppAtom<State, Params, Methods>
  // ReadonlyLocalAtom:
  <
    State = any,
    Params extends any[] = [],
    Methods extends Record<string, () => any> = Record<string, () => any>
  >(
    options: ReadonlyLocalAtomConfig<State, Params>
  ): ReadonlyLocalAtom<State, Params, Methods>
  // LocalAtom:
  <
    State = any,
    Params extends any[] = [],
    Methods extends Record<string, () => any> = Record<string, () => any>
  >(
    options: LocalAtomConfig<State, Params>
  ): LocalAtom<State, Params, Methods>
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

  let reactContext: Context<AtomInstance<State, Params, Methods>>
  const getReactContext = () => {
    if (reactContext) return reactContext

    return (reactContext = createContext(EMPTY_CONTEXT as any))
  }

  const injectInstance = (...params: Params) => {
    // TODO: This should be withoutSubscription. Update instance injectors(/hooks) to subscribe themselves
    const atomInstance = injectAtomWithSubscription<State, Params, Methods>(
      'injectInstance()',
      newAtom,
      params
    )

    const { injectMethods, injectValue } = atomInstance
    return { injectMethods, injectValue }
  }

  const injectInvalidate = (...params: Params) => {
    const atomInstance = injectAtomWithoutSubscription<State, Params, Methods>(
      newAtom,
      params
    )

    return () => {
      atomInstance.invalidate({
        operation: 'injectInvalidate()',
        targetType: EvaluationTargetType.External,
        type: EvaluationType.CacheInvalidated,
      })
    }
  }

  const injectLazy = () => {
    const initialContext = diContext.consume()

    return (...params: Params) => {
      const newContext = appCsContext.consume()
      const { appId } = newContext || initialContext
      const keyHash = getKeyHash(newAtom, params)

      const atomInstance = getAtomInstance<State, Params, Methods>(
        appId,
        newAtom,
        keyHash,
        params
      )

      return atomInstance.stateStore
    }
  }

  const injectMethods = (...params: Params) => {
    const atomInstance = injectAtomWithoutSubscription<State, Params, Methods>(
      newAtom,
      params
    )

    return getInstanceMethods(atomInstance)
  }

  const injectValue = (...params: Params) => {
    const atomInstance = injectAtomWithSubscription<State, Params, Methods>(
      'injectValue()',
      newAtom,
      params
    )

    return atomInstance.stateStore.getState()
  }

  const override: Atom<State, Params, Methods>['override'] = newValue =>
    atom({ ...(options as any), value: newValue })

  const useConsumer = () => {
    const context = getReactContext()
    return useContext(context)
  }

  const useInstance = (...params: Params) => {
    // TODO: Don't subscribe here
    const atomInstance = useAtomWithSubscription<State, Params, Methods>(
      newAtom,
      params
    )

    const { Provider, useMethods, useValue } = atomInstance
    return { Provider, useMethods, useValue }
  }

  const useInvalidate = (...params: Params) => {
    const atomInstance = injectAtomWithoutSubscription<State, Params, Methods>(
      newAtom,
      params
    )

    return () => {
      atomInstance.invalidate({
        operation: 'useInvalidate()',
        targetType: EvaluationTargetType.External,
        type: EvaluationType.CacheInvalidated,
      })
    }
  }

  const useLazy = () => {
    const initialAppId = useContext(appContext)

    return (...params: Params) => {
      const newAppId = appCsContext.consume()?.appId
      const appId = newAppId || initialAppId
      const keyHash = getKeyHash(newAtom, params)

      const atomInstance = getAtomInstance<State, Params, Methods>(
        appId,
        newAtom,
        keyHash,
        params
      )

      return atomInstance.stateStore
    }
  }

  const useMethods = (...params: Params) => {
    const atomInstance = useAtomWithoutSubscription<State, Params, Methods>(
      newAtom,
      params
    )

    return getInstanceMethods(atomInstance)
  }

  const useValue = (...params: Params) => {
    const atomInstance = useAtomWithSubscription<State, Params, Methods>(
      newAtom,
      params
    )

    return atomInstance.stateStore.getState()
  }

  const newAtom: AtomBase<State, Params, Methods> = {
    getReactContext,
    injectInstance,
    injectInvalidate,
    injectLazy,
    injectMethods,
    injectValue,
    internalId: generateImplementationId(),
    flags,
    key,
    override,
    readonly,
    scope,
    useConsumer,
    useInstance,
    useInvalidate,
    useLazy,
    useMethods,
    useValue,
    value,
  }

  createAtom<State, Params, Methods>(newAtom, options)

  return newAtom as any // the overloads of this function give consumers all the type info they need
}

/*
  when an atom is created:
  set a timeout to dispatch a createAtom action so we can track all atom implementations
*/
