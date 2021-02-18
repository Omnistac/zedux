import { Subscriber } from '@zedux/core'
import { AtomBaseProperties, Scope } from '../types'
import { EvaluationType, EvaluationTargetType, getKeyHash } from '../utils'
import { diContext } from '../utils/diContext'
import { getAtomInstance } from '../utils/getAtomInstance'
import { injectEffect } from './injectEffect'
import { injectMemo } from './injectMemo'

/*
  injectAtomSubscription is a low-level injector that probably shouldn't be used directly.
  Use the injectors built into atoms - e.g. `myAtom.injectState()`
*/
export const injectAtomSubscription = <
  State = any,
  Params extends any[] = [],
  Methods extends Record<string, () => any> = Record<string, () => any>
>(
  operation: string,
  atom: AtomBaseProperties<State, Params>,
  params?: Params
) => {
  const { appId, dependencies, scheduleEvaluation } = diContext.consume()
  const keyHash = injectMemo(
    () => getKeyHash(atom, params),
    atom.scope === Scope.Local ? [atom] : [atom, params]
  )

  // NOTE: We don't want to re-run when params change - the array could change every time
  // Calculate the full key from the params and use that to determine when items in the params list change.
  const atomInstance = injectMemo(
    () => getAtomInstance<State, Params, Methods>(appId, atom, keyHash, params),
    [appId, atom, keyHash] // TODO: Changing the atom is _probably_ not supported. Maybe. Mmmm maybe.
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

  dependencies[atomInstance.keyHash] = atomInstance.internalId

  return atomInstance
}
