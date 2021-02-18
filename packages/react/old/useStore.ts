import { useEffect, useState } from 'react'
import { Store } from '@zedux/core'

export const useStore: <T = any>(
  store: Store<T>
) => [T, Store<T>['setState']] = <T>(store: Store<T>) => {
  const [state, setState] = useState(store.getState())

  useEffect(() => {
    const { unsubscribe } = store.subscribe(setState)

    return unsubscribe
  })

  return [state, store.setState] as [T, Store<T>['setState']]
}
