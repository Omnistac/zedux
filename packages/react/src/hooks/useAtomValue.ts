import {
  AnyAtomGenerics,
  AnyAtomInstance,
  AnyAtomTemplate,
  AtomTemplateBase,
  ParamlessTemplate,
  ParamsOf,
  ResolvedStateOf,
  Selectable,
  StateOf,
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
 * Returns the current state of the resolved atom instance.
 *
 * The 3rd param is a `config` object which can be given `operation` and
 * `suspend` fields:
 *
 * ```ts
 * const state = useAtomValue(myAtom, [], {
 *   operation: 'myUsageDescription', // helps with debugging
 *   suspend: false, // disable React suspense if the atom set a promise
 * })
 * ```
 */
export const useAtomValue: {
  // no suspense
  <A extends AnyAtomTemplate>(
    template: A,
    params: ParamsOf<A>,
    config: Omit<ZeduxHookConfig, 'subscribe' | 'suspend'> & { suspend: false }
  ): StateOf<A>

  // suspense
  <A extends AnyAtomTemplate>(
    template: A,
    params: ParamsOf<A>,
    config?: Omit<ZeduxHookConfig, 'subscribe'>
  ): ResolvedStateOf<A>

  <A extends AnyAtomTemplate<{ Params: [] }>>(template: A): ResolvedStateOf<A>

  <A extends AnyAtomTemplate>(
    template: ParamlessTemplate<A>
  ): ResolvedStateOf<A>

  <I extends AnyAtomInstance>(
    instance: I,
    params: [],
    config: Omit<ZeduxHookConfig, 'subscribe' | 'suspend'> & { suspend: false }
  ): StateOf<I>

  <I extends AnyAtomInstance>(
    instance: I,
    params?: [],
    config?: Omit<ZeduxHookConfig, 'subscribe'>
  ): ResolvedStateOf<I>

  <S extends Selectable>(
    template: S,
    params: ParamsOf<S>,
    config?: Omit<ZeduxHookConfig, 'subscribe'>
  ): StateOf<S>

  <S extends Selectable<any, []>>(template: S): StateOf<S>

  <S extends Selectable>(template: ParamlessTemplate<S>): StateOf<S>
} = <G extends AnyAtomGenerics>(
  atom: AtomTemplateBase<G>,
  params?: G['Params'],
  config: Omit<ZeduxHookConfig, 'subscribe'> = { operation: 'useAtomValue' }
) =>
  useAtomInstance(atom, params, {
    ...config,
    subscribe: true,
  }).v
