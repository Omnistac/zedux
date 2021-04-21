import { ActionChain } from '@zedux/core'
import { useEffect, useMemo } from 'react'
import { Subject } from 'rxjs'
import { AtomBaseProperties } from '../types'
import { useAtomWithoutSubscription } from './useAtomWithoutSubscription'

export const useState$ = <State, Params extends any[]>(
  atom: AtomBaseProperties<State, Params>,
  ...params: Params
) => {
  const instance = useAtomWithoutSubscription(atom, params)
  const subject = useMemo(() => new Subject<ActionChain>(), [])

  useEffect(() => {
    const subscription = instance.internals.stateStore.subscribe({
      effects: ({ action }) => {
        subject.next(action)
      },
    })

    return () => subscription.unsubscribe()
  }, [instance, subject])

  return subject
}
