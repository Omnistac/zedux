import { Store } from '@zedux'
import { useEffect, useState } from 'react'

export const useZeduxState = <S = any>(store: Store<S>) => {
  const [state, setState] = useState<S>(store.getState())

  useEffect(() => {
    // Set the state again, in case the store was updated in other effects
    // before this effect runs (but after useState was initialized)
    const storeState = store.getState()
    setState(() => storeState)

    const subscription = store.subscribe(setState)

    return subscription.unsubscribe
  }, [store])

  return state
}
