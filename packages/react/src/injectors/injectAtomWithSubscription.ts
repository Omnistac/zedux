import { Subscriber } from '@zedux/core'
import { AtomBaseProperties, AtomInstanceBase } from '../types'
import {
  EvaluationType,
  EvaluationTargetType,
  EvaluationReason,
  split,
  AtomWithSubscriptionInjectorDescriptor,
  InjectorType,
} from '../utils'
import { diContext } from '../utils/csContexts'
import { injectAtomWithoutSubscription } from './injectAtomWithoutSubscription'

/**
 * injectAtomWithSubscription
 *
 * Creates an atom instance for the passed atom based on the passed params. If
 * an instance has already been created for the passed params, reuses the
 * existing instance.
 *
 * Subscribes to the instance's store.
 *
 * This is a low-level injector that probably shouldn't be used directly. Use
 * the injectors built into atoms - e.g.
 *
 * ```ts
 * const [state, setState, store] = myAtom.injectState()
 * ```
 */
export const injectAtomWithSubscription = <
  State = any,
  Params extends any[] = [],
  InstanceType extends AtomInstanceBase<State, Params> = AtomInstanceBase<
    State,
    Params
  >
>(
  operation: string,
  atom: AtomBaseProperties<State, Params, InstanceType>,
  params: Params
) => {
  const { scheduleEvaluation } = diContext.consume()

  const atomInstance = injectAtomWithoutSubscription(atom, params)

  const subscriber: Subscriber<State> = (newState, oldState) => {
    const reasons = atomInstance.internals.getEvaluationReasons()
    const reason: EvaluationReason = {
      newState,
      oldState,
      operation,
      targetType: EvaluationTargetType.Atom,
      targetKey: atom.key,
      targetParams: params,
      type: EvaluationType.StateChanged,
    }

    if (reasons.length) reason.reasons = reasons

    scheduleEvaluation(reason)
  }

  split<AtomWithSubscriptionInjectorDescriptor>(
    'injectAtomWithSubscription',
    InjectorType.AtomWithSubscription,
    () => {
      const subscription = atomInstance.internals.stateStore.subscribe(
        subscriber
      )

      return {
        cleanup: () => subscription.unsubscribe(),
        instanceId: atomInstance.internals.keyHash,
        type: InjectorType.AtomWithSubscription,
      }
    },
    prevDescriptor => {
      if (prevDescriptor.instanceId === atomInstance.internals.keyHash) {
        return prevDescriptor
      }

      prevDescriptor.cleanup?.()

      const subscription = atomInstance.internals.stateStore.subscribe(
        subscriber
      )

      prevDescriptor.cleanup = () => subscription.unsubscribe()

      return prevDescriptor
    }
  )

  return atomInstance
}
