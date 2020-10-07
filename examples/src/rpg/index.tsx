import { createStore, Store } from '@zedux'
import React, { useCallback, useMemo } from 'react'

import { Gold } from './gold'
import { Inventory } from './inventory'
import { Market } from './market'
import { StoreDump } from './store-dump'
import { RootContext, RootState, weaponsReducer } from './root-store'

export const Rpg = () => {
  const rootStore = useMemo(
    () =>
      createStore<RootState>({
        entities: {
          weapons: weaponsReducer,
        },
      }),
    []
  )

  const registerChildStore = useCallback(
    (id: string, childStore: Store) => {
      rootStore.use({ [id]: childStore })
    },
    [rootStore]
  )

  const rootContextValue = useMemo(() => ({ registerChildStore, rootStore }), [
    registerChildStore,
    rootStore,
  ])

  return (
    <RootContext.Provider value={rootContextValue}>
      <Gold />
      <Inventory />
      <Market />
      <StoreDump />
    </RootContext.Provider>
  )
}
