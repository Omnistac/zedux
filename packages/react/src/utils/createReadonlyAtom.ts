import { Context, createContext, useContext } from 'react'
import {
  AtomConfig,
  AtomType,
  ReadonlyAtom,
  ReadonlyAtomInstance,
} from '../types'
import { useAtomWithSubscription } from '../hooks/useAtomWithSubscription'
import { injectAtomWithSubscription } from '../injectors/injectAtomWithSubscription'
import { EMPTY_CONTEXT, generateImplementationId, getKeyHash } from '../utils'
import { injectAtomWithoutSubscription } from '../injectors/injectAtomWithoutSubscription'
import { useAtomWithoutSubscription } from '../hooks'
import { appCsContext, diContext } from '../utils/csContexts'
import { getAtomInstance } from '../instance-helpers/getAtomInstance'
import { appContext } from '../components'

export const createReadonlyAtom = <
  State,
  Params extends any[],
  Exports extends Record<string, any>
>(
  atomConfig: AtomConfig & {
    key: string
    value: ReadonlyAtom<State, Params, Exports>['value']
  }
) => {
  let reactContext: Context<ReadonlyAtomInstance<State, Params, Exports>>
  const getReactContext = () => {
    if (reactContext) return reactContext

    return (reactContext = createContext(EMPTY_CONTEXT as any))
  }

  const injectExports = (...params: Params) =>
    injectAtomWithoutSubscription<
      State,
      Params,
      ReadonlyAtomInstance<State, Params, Exports>
    >(newAtom, params).exports

  const injectInstance = (...params: Params) =>
    injectAtomWithoutSubscription<
      State,
      Params,
      ReadonlyAtomInstance<State, Params, Exports>
    >(newAtom, params)

  const injectInvalidate = (...params: Params) =>
    injectAtomWithoutSubscription<
      State,
      Params,
      ReadonlyAtomInstance<State, Params, Exports>
    >(newAtom, params).invalidate

  const injectLazy = () => {
    const initialContext = diContext.consume()

    return (...params: Params) => {
      const newContext = appCsContext.consume(false)
      const { appId } = newContext || initialContext
      const keyHash = getKeyHash(appId, newAtom, params)

      return getAtomInstance<
        State,
        Params,
        ReadonlyAtomInstance<State, Params, Exports>
      >(appId, newAtom, keyHash, params)
    }
  }

  const injectSelector = <D = any>(
    paramsArg: Params | ((state: State) => D),
    selectorArg?: (state: State) => D
  ) => {
    const params = selectorArg
      ? (paramsArg as Params)
      : (([] as unknown) as Params)

    return injectAtomWithoutSubscription<
      State,
      Params,
      ReadonlyAtomInstance<State, Params, Exports>
    >(newAtom, params).useSelector(
      selectorArg || (paramsArg as (state: State) => D)
    )
  }

  const injectValue = (...params: Params) =>
    injectAtomWithSubscription<
      State,
      Params,
      ReadonlyAtomInstance<State, Params, Exports>
    >('injectValue()', newAtom, params).internals.stateStore.getState()

  const override = (newValue: ReadonlyAtom<State, Params, Exports>['value']) =>
    createReadonlyAtom({ ...atomConfig, value: newValue })

  const useConsumer = () => useContext(getReactContext())

  const useExports = (...params: Params) =>
    useAtomWithoutSubscription<
      State,
      Params,
      ReadonlyAtomInstance<State, Params, Exports>
    >(newAtom, params).exports

  const useInstance = (...params: Params) =>
    useAtomWithoutSubscription<
      State,
      Params,
      ReadonlyAtomInstance<State, Params, Exports>
    >(newAtom, params)

  const useInvalidate = (...params: Params) =>
    useAtomWithoutSubscription<
      State,
      Params,
      ReadonlyAtomInstance<State, Params, Exports>
    >(newAtom, params).invalidate

  const useLazy = () => {
    const initialAppId = useContext(appContext)

    return (...params: Params) => {
      const newAppId = appCsContext.consume(false)?.appId
      const appId = newAppId || initialAppId
      const keyHash = getKeyHash(appId, newAtom, params)

      return getAtomInstance<
        State,
        Params,
        ReadonlyAtomInstance<State, Params, Exports>
      >(appId, newAtom, keyHash, params)
    }
  }

  const useSelector = <D = any>(
    paramsArg: Params | ((state: State) => D),
    selectorArg?: (state: State) => D
  ) => {
    const params = selectorArg
      ? (paramsArg as Params)
      : (([] as unknown) as Params)

    return useAtomWithoutSubscription<
      State,
      Params,
      ReadonlyAtomInstance<State, Params, Exports>
    >(newAtom, params).useSelector(
      selectorArg || (paramsArg as (state: State) => D)
    )
  }

  const useValue = (...params: Params) =>
    useAtomWithSubscription<
      State,
      Params,
      ReadonlyAtomInstance<State, Params, Exports>
    >(newAtom, params).internals.stateStore.getState()

  const newAtom: ReadonlyAtom<State, Params, Exports> = {
    flags: atomConfig.flags,
    getReactContext,
    injectExports,
    injectInstance,
    injectInvalidate,
    injectLazy,
    injectSelector: injectSelector as any,
    injectValue,
    internalId: generateImplementationId(),
    key: atomConfig.key,
    molecules: atomConfig.molecules,
    override: override as any, // handles both readonly and normal atoms
    readonly: true as const,
    ttl: atomConfig.ttl,
    type: AtomType.Standard,
    useConsumer,
    useExports,
    useInstance,
    useInvalidate,
    useLazy,
    useSelector: useSelector as any,
    useValue,
    value: atomConfig.value,
  }

  return newAtom
}
