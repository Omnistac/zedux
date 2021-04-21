import { useEffect, useState } from 'react'
import { AtomBaseProperties } from '../types'
import { useAtomWithoutSubscription } from './useAtomWithoutSubscription'

export const useStore = <State, Params extends any[]>(
  atom: AtomBaseProperties<State, Params>,
  ...params: Params
) => {
  const instance = useAtomWithoutSubscription(atom, params)
  const [state, setState] = useState(instance.internals.stateStore.getState())

  useEffect(() => {
    const subscription = instance.internals.stateStore.subscribe(newState =>
      setState(newState)
    )

    return () => subscription.unsubscribe()
  }, [instance])

  return state
}
