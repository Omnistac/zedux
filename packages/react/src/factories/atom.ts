import { Atom, AtomConfig, AtomInstance, ReadonlyAtom } from '../types'
import { useAtomWithSubscription } from '../hooks/useAtomWithSubscription'
import { injectAtomWithSubscription } from '../injectors/injectAtomWithSubscription'

import { injectAtomWithoutSubscription } from '../injectors/injectAtomWithoutSubscription'
import { useAtomWithoutSubscription } from '../hooks'
import { createReadonlyAtom } from '../utils/createReadonlyAtom'

export const atom: {
  <State, Params extends any[], Exports extends Record<string, any>>(
    key: string,
    value?: Atom<State, Params, Exports>['value'],
    config?: AtomConfig & { readonly: true }
  ): ReadonlyAtom<State, Params, Exports>
  <State, Params extends any[], Exports extends Record<string, any>>(
    key: string,
    value?: Atom<State, Params, Exports>['value'],
    config?: AtomConfig
  ): Atom<State, Params, Exports>
} = <State, Params extends any[], Exports extends Record<string, any>>(
  key: string,
  value?: Atom<State, Params, Exports>['value'],
  config?: AtomConfig
) => {
  if (!key) {
    throw new TypeError('Zedux - All atoms must have a key')
  }

  const options = { key, value: value as any, ...config }
  const readonlyAtom = createReadonlyAtom<State, Params, Exports>(options)

  if (options.readonly) return readonlyAtom

  const newAtom = (readonlyAtom as unknown) as Atom<State, Params, Exports>
  newAtom.readonly = false

  newAtom.injectDispatch = (...params: Params) =>
    injectAtomWithoutSubscription<
      State,
      Params,
      AtomInstance<State, Params, Exports>
    >(newAtom, params).dispatch

  newAtom.injectSetState = (...params: Params) =>
    injectAtomWithoutSubscription<
      State,
      Params,
      AtomInstance<State, Params, Exports>
    >(newAtom, params).setState

  newAtom.injectState = (...params: Params) => {
    const instance = injectAtomWithSubscription(
      'injectState()',
      newAtom,
      params
    )

    return [
      instance.internals.stateStore.getState(),
      instance.internals.stateStore.setState,
      instance.internals.stateStore,
    ] as const
  }

  newAtom.injectStore = (...params: Params) =>
    injectAtomWithoutSubscription<
      State,
      Params,
      AtomInstance<State, Params, Exports>
    >(newAtom, params).store

  newAtom.override = (newValue: Atom<State, Params, Exports>['value']) =>
    atom(key, newValue, options)

  newAtom.useDispatch = (...params: Params) =>
    useAtomWithoutSubscription<
      State,
      Params,
      AtomInstance<State, Params, Exports>
    >(newAtom, params).dispatch

  newAtom.useSetState = (...params: Params) =>
    useAtomWithoutSubscription<
      State,
      Params,
      AtomInstance<State, Params, Exports>
    >(newAtom, params).setState

  newAtom.useState = (...params: Params) => {
    const instance = useAtomWithSubscription<
      State,
      Params,
      AtomInstance<State, Params, Exports>
    >(newAtom, params)

    return [instance.store.getState(), instance.setState] as const
  }

  newAtom.useStore = (...params: Params) =>
    useAtomWithoutSubscription<
      State,
      Params,
      AtomInstance<State, Params, Exports>
    >(newAtom, params).store

  return newAtom as any // the overloads of this function give consumers all the type info they need
}
