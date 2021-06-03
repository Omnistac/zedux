import { Settable } from '@zedux/core'
import { AtomInstance, AtomInstanceBase } from '../classes'
import { AtomInstanceStateType } from '../types'
import { InjectorType, split, StateInjectorDescriptor } from '../utils'

export const injectAtomInstanceState = <
  AI extends AtomInstanceBase<any, any, any>
>(
  instance: AI
): [
  AtomInstanceStateType<AI>,
  (settable: Settable<AtomInstanceStateType<AI>>) => AtomInstanceStateType<AI>
] => {
  split<StateInjectorDescriptor>(
    'injectState',
    InjectorType.State,
    ({ instance }) => {
      const edge = instance.ecosystem._graph.addDependency(
        instance.keyHash,
        instance.keyHash,
        'injectState',
        false
      )

      const cleanup = () => {
        instance.ecosystem._graph.removeDependency(
          instance.keyHash,
          instance.keyHash,
          edge
        )
      }

      return {
        cleanup,
        store: instance._stateStore, // just 'cause we're reusing this injector descriptor type. It's fine.
        type: InjectorType.State,
      }
    }
  )

  const setState =
    instance instanceof AtomInstance
      ? instance.setState
      : instance._stateStore.setState

  return [instance._stateStore.getState(), setState]
}
