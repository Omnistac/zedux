import { useEffect, useMemo } from 'react'
import { Subject } from 'rxjs'
import { AtomBase } from '../classes/atoms/AtomBase'
import { AtomInstanceBase } from '../classes/instances/AtomInstanceBase'
import { useAtomWithoutSubscription } from './useAtomWithoutSubscription'

export const useState$ = <State, Params extends any[]>(
  atom: AtomBase<State, Params, AtomInstanceBase<State, Params, any>>,
  ...params: Params
) => {
  const instance = useAtomWithoutSubscription(atom, params)
  const subject = useMemo(() => new Subject<State>(), [])

  useEffect(() => {
    const subscription = instance._stateStore.subscribe(newState =>
      subject.next(newState)
    )

    return () => subscription.unsubscribe()
  }, [instance, subject])

  return subject
}
