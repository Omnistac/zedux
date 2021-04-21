import { useEffect, useMemo } from 'react'
import { Subject } from 'rxjs'
import { AtomBaseProperties } from '../types'
import { useAtomWithoutSubscription } from './useAtomWithoutSubscription'

export const useState$ = <State, Params extends any[]>(
  atom: AtomBaseProperties<State, Params>,
  ...params: Params
) => {
  const instance = useAtomWithoutSubscription(atom, params)
  const subject = useMemo(() => new Subject<State>(), [])

  useEffect(() => {
    const subscription = instance.internals.stateStore.subscribe(newState =>
      subject.next(newState)
    )

    return () => subscription.unsubscribe()
  }, [instance, subject])

  return subject
}
