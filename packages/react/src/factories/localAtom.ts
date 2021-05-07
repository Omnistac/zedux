import {
  Context,
  createContext,
  useContext,
  useLayoutEffect,
  useState,
} from 'react'
import { useAtomWithoutSubscription } from '../hooks'
import { injectAtomWithoutSubscription } from '../injectors'
import {
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

    return (reactContext = createContext<
      ReadonlyAtomInstance<State, Params, Exports>
    >(EMPTY_CONTEXT as any))
  }

  const injectInstance = (...params: Params) =>
    injectAtomWithoutSubscription<
      State,
      Params,
      ReadonlyAtomInstance<State, Params, Exports>
    >('injectInstance', newAtom, params)

  const override = (
    newValue: ReadonlyLocalAtom<State, Params, Exports>['value']
  ) =>
    createReadonlyLocalAtom<State, Params, Exports>({
      ...atomConfig,
      value: newValue,
    })[1]

  const useConsumer = () => useContext(getReactContext())

  const useConsumerWithSubscription = () => {
    const instance = useConsumer()
    const [, setState] = useState(instance.internals.stateStore.getState())

    // TODO: not this - register a graph dependency
    useLayoutEffect(() => {
      const subscription = instance.internals.stateStore.subscribe(setState)

      return () => subscription.unsubscribe()
    }, [instance])

    return instance
  }

  const useExports = () => useConsumer().exports

  const useInstance = (...params: Params) =>
    useAtomWithoutSubscription<
      State,
      Params,
      ReadonlyAtomInstance<State, Params, Exports>
    >(newAtom, params)

  const useSelector = <D = any>(selector: (state: State) => D) => {
    return useConsumerWithSubscription().useSelector(selector)
  }

  const useValue = () =>
    useConsumerWithSubscription().internals.stateStore.getState()

  const newAtom: ReadonlyLocalAtom<State, Params, Exports> = {
    flags: atomConfig.flags,
    getReactContext,
    injectInstance,
    internalId: generateImplementationId(),
    key: atomConfig.key,
    molecules: atomConfig.molecules,
    override,
    readonly: true as const,
    type: AtomType.Local,
    useConsumer,
    useExports,
    useInstance,
    useSelector,
    useValue,
    value: atomConfig.value,
  }

  return [useConsumerWithSubscription, newAtom] as const
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
  const [
    useConsumerWithSubscription,
    readonlyLocalAtom,
  ] = createReadonlyLocalAtom<State, Params, Exports>(options)

  if (options.readonly) return readonlyLocalAtom

  const newLocalAtom = (readonlyLocalAtom as unknown) as LocalAtom<
    State,
    Params,
    Exports
  >

  newLocalAtom.override = newValue => localAtom(key, newValue, config)
  newLocalAtom.readonly = false

  newLocalAtom.useDispatch = () => newLocalAtom.useConsumer().dispatch
  newLocalAtom.useSetState = () => newLocalAtom.useConsumer().setState
  newLocalAtom.useState = () => {
    const instance = useConsumerWithSubscription()

    return [
      instance.internals.stateStore.getState(),
      instance.internals.stateStore.setState,
    ] as const
  }

  newLocalAtom.useStore = () => newLocalAtom.useConsumer().store

  return newLocalAtom as any // the overloads of this function give consumers all the type info they need
}
