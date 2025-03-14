import {
  AnyAtomGenerics,
  AnyAtomTemplate,
  AtomInstance,
  AtomTemplateBase,
  ExportsOf,
  ParamlessTemplate,
  ParamsOf,
  StateHookTuple,
  StateOf,
} from '@zedux/atoms'
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
// `useAtomState` is currently only compatible with templates that create
// instances of Zedux's internal AtomInstance (like Zedux's own AtomTemplate and
// IonTemplate). TODO: change this.
export const useAtomState: {
  <A extends AnyAtomTemplate<{ Node: AtomInstance }>>(
    template: A,
    params: ParamsOf<A>
  ): StateHookTuple<StateOf<A>, ExportsOf<A>>

  <A extends AnyAtomTemplate<{ Node: AtomInstance; Params: [] }>>(
    template: A
  ): StateHookTuple<StateOf<A>, ExportsOf<A>>

  <A extends AnyAtomTemplate<{ Node: AtomInstance }>>(
    template: ParamlessTemplate<A>
  ): StateHookTuple<StateOf<A>, ExportsOf<A>>

  <I extends AtomInstance>(instance: I): StateHookTuple<
    StateOf<I>,
    ExportsOf<I>
  >
} = <G extends AnyAtomGenerics<{ Node: AtomInstance }>>(
  atom: AtomTemplateBase<G>,
  params?: G['Params']
): StateHookTuple<G['State'], G['Exports']> => {
  const instance = useAtomInstance(atom, params, {
    operation: 'useAtomState',
    subscribe: true,
  })

  return [instance.v, instance.x]
}
