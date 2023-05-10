import {
  AnyAtomInstance,
  AnyAtomTemplate,
  AtomExportsType,
  AtomParamsType,
  AtomStateType,
  ParamlessTemplate,
  StateHookTuple,
} from '@zedux/atoms'
import { ZeduxHookConfig } from '../types'
import { useAtomInstance } from './useAtomInstance'

/**
 * Creates an atom instance for the passed atom template based on the passed
 * params. If an instance has already been created for the passed params, reuses
 * the existing instance.
 *
 * Registers a dynamic graph dependency on the atom instance. This means
 * components that use this hook will rerender when the resolved atom instance's
 * state changes.
 *
 * Also accepts an atom instance and subscribes to updates in the passed
 * instance.
 *
 * If the atom doesn't take params or an instance is passed, pass an empty array
 * for the 2nd param when you need to supply the 3rd `config` param.
 *
 * Returns a [state, setState] tuple. The `setState` function is
 * "export-infused", meaning it has all of the atom instance's `exports`
 * attached directly to the function. These can be destructured for convenience:
 *
 * ```ts
 * const [state, { decrement, increment }] = useAtomState(myCounterAtom)
 * ```
 *
 * The 3rd param is a `config` object which can be given `operation` and
 * `suspend` fields:
 *
 * ```ts
 * const [state, setState] = useAtomState(myAtom, [], {
 *   operation: 'myUsageDescription', // helps with debugging
 *   suspend: false, // disable React suspense if the atom set a promise
 * })
 * ```
 */
export const useAtomState: {
  <A extends AnyAtomTemplate>(
    template: A,
    params: AtomParamsType<A>,
    config?: Omit<ZeduxHookConfig, 'subscribe'>
  ): StateHookTuple<AtomStateType<A>, AtomExportsType<A>>

  <A extends AnyAtomTemplate<{ Params: [] }>>(template: A): StateHookTuple<
    AtomStateType<A>,
    AtomExportsType<A>
  >

  <A extends AnyAtomTemplate>(template: ParamlessTemplate<A>): StateHookTuple<
    AtomStateType<A>,
    AtomExportsType<A>
  >

  <I extends AnyAtomInstance>(
    instance: I,
    params?: [],
    config?: Omit<ZeduxHookConfig, 'subscribe'>
  ): StateHookTuple<AtomStateType<I>, AtomExportsType<I>>
} = <A extends AnyAtomTemplate>(
  atom: A,
  params?: AtomParamsType<A>,
  config: Omit<ZeduxHookConfig, 'subscribe'> = { operation: 'useAtomState' }
): StateHookTuple<AtomStateType<A>, AtomExportsType<A>> => {
  const instance = useAtomInstance(atom, params as AtomParamsType<A>, {
    ...config,
    subscribe: true,
  })

  return [instance.getState(), instance._infusedSetter]
}
