import { Subscriber } from '@zedux/core'
import { AtomBaseProperties } from '../types'
import { EvaluationType, EvaluationTargetType } from '../utils'
import { diContext } from '../utils/csContexts'
import { injectAtomWithoutSubscription } from './injectAtomWithoutSubscription'
import { injectEffect } from './injectEffect'

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
  Methods extends Record<string, () => any> = Record<string, () => any>
>(
  operation: string,
  atom: AtomBaseProperties<State, Params>,
  params?: Params
) => {
  const { scheduleEvaluation } = diContext.consume()

  const atomInstance = injectAtomWithoutSubscription<State, Params, Methods>(
    atom,
    params
  )

  injectEffect(() => {
    const subscriber: Subscriber<State> = (newState, oldState) =>
      scheduleEvaluation({
        newState,
        oldState,
        operation,
        targetType: EvaluationTargetType.Atom,
        targetKey: atom.key,
        targetParams: params,
        type: EvaluationType.StateChanged,
      })
    const subscription = atomInstance.stateStore.subscribe(subscriber)

    return () => {
      subscription.unsubscribe()
    }
  }, [atomInstance])

  return atomInstance
}
