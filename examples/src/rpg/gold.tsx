import { createStore, createReducer, createActorFactory } from '@zedux'
import React, { useMemo, useContext, useEffect } from 'react'
import { useZeduxState } from '../hooks/useZeduxState'
import { RootContext } from './root-store'

const createActor = createActorFactory('@gold')

// These actions will need to be dispatched at the root store (lifted up)
// so they affect both this store and the store controlling the inventory
export const buy = createActor<{ name: string; cost: number }>('buy')
export const sell = createActor<{ name: string; cost: number }>('sell')

const reducer = createReducer(900)
  .reduce(buy, (state, { cost }) => state - cost)
  .reduce(sell, (state, { cost }) => state + cost)

export const Gold = () => {
  const { registerChildStore } = useContext(RootContext)
  const store = useMemo(() => createStore(reducer), [])
  const gold = useZeduxState(store)

  useEffect(() => {
    registerChildStore('gold', store)
  }, [registerChildStore, store])

  return (
    <section>
      <h2>Gold</h2>
      <p>Current amount: {gold}</p>
    </section>
  )
}
