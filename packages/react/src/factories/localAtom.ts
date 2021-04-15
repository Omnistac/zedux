import { Context, createContext, useContext } from 'react'
import { useAtomWithoutSubscription, useAtomWithSubscription } from '../hooks'
import { injectAtomWithoutSubscription } from '../injectors'
import {
  AtomInstance,
  AtomType,
  LocalAtom,
  LocalAtomConfig,
  ReadonlyAtomInstance,
  ReadonlyLocalAtom,
} from '../types'
import { EMPTY_CONTEXT, generateImplementationId } from '../utils'

const createReadonlyLocalAtom = <
  State,
  Params extends any[],
  Exports extends Record<string, any>
>(
  atomConfig: LocalAtomConfig & {
    key: string
    value: ReadonlyLocalAtom<State, Params, Exports>['value']
  }
) => {
  let reactContext: Context<ReadonlyAtomInstance<State, Params, Exports>>
  const getReactContext = () => {
    if (reactContext) return reactContext

    return (reactContext = createContext(EMPTY_CONTEXT as any))
  }

  const injectInstance = (...params: Params) =>
    injectAtomWithoutSubscription<
      State,
      Params,
      ReadonlyAtomInstance<State, Params, Exports>
    >(newAtom, params)

  const override = (
    newValue: ReadonlyLocalAtom<State, Params, Exports>['value']
  ) => createReadonlyLocalAtom({ ...atomConfig, value: newValue })

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

  const newAtom: ReadonlyLocalAtom<State, Params, Exports> = {
    flags: atomConfig.flags,
    getReactContext,
    injectInstance,
    internalId: generateImplementationId(),
    key: atomConfig.key,
    molecules: atomConfig.molecules,
    override: override as any, // handles both readonly and normal atoms
    readonly: true as const,
    type: AtomType.Local,
    useConsumer,
    useExports,
    useInstance,
    useInvalidate,
    useSelector: useSelector as any,
    useValue,
    value: atomConfig.value,
  }

  return newAtom
}

export const localAtom: {
  <State, Params extends any[], Exports extends Record<string, any>>(
    key: string,
    value?: LocalAtom<State, Params, Exports>['value'],
    config?: LocalAtomConfig & { readonly: true }
  ): ReadonlyLocalAtom<State, Params, Exports>
  <State, Params extends any[], Exports extends Record<string, any>>(
    key: string,
    value?: LocalAtom<State, Params, Exports>['value'],
    config?: LocalAtomConfig
  ): LocalAtom<State, Params, Exports>
} = <State, Params extends any[], Exports extends Record<string, any>>(
  key: string,
  value?: LocalAtom<State, Params, Exports>['value'],
  config?: LocalAtomConfig
) => {
  if (!key) {
    throw new TypeError('Zedux - All atoms must have a key')
  }

  const options = { key, value: value as any, ...config }
  const readonlyLocalAtom = createReadonlyLocalAtom<State, Params, Exports>(
    options
  )

  if (options.readonly) return readonlyLocalAtom

  const newLocalAtom = (readonlyLocalAtom as unknown) as LocalAtom<
    State,
    Params,
    Exports
  >

  newLocalAtom.override = newValue => localAtom(key, newValue, options)
  newLocalAtom.readonly = false

  newLocalAtom.useDispatch = (...params: Params) =>
    useAtomWithoutSubscription<
      State,
      Params,
      AtomInstance<State, Params, Exports>
    >(newLocalAtom, params).dispatch

  newLocalAtom.useSetState = (...params: Params) =>
    useAtomWithoutSubscription<
      State,
      Params,
      AtomInstance<State, Params, Exports>
    >(newLocalAtom, params).setState

  newLocalAtom.useState = (...params: Params) => {
    const instance = useAtomWithSubscription<
      State,
      Params,
      AtomInstance<State, Params, Exports>
    >(newLocalAtom, params)

    return [instance.store.getState(), instance.store.setState] as const
  }

  newLocalAtom.useStore = (...params: Params) =>
    useAtomWithoutSubscription<
      State,
      Params,
      AtomInstance<State, Params, Exports>
    >(newLocalAtom, params).store

  return newLocalAtom as any // the overloads of this function give consumers all the type info they need
}
