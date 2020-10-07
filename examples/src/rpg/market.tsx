import { createStore, createReducer } from '@zedux'
import React, {
  useMemo,
  useContext,
  useCallback,
  SyntheticEvent,
  useEffect,
} from 'react'
import { useZeduxState } from '../hooks/useZeduxState'
import { buy, sell } from './gold'
import { RootContext, selectWeaponCost, selectGold } from './root-store'

const marketReducer = createReducer([
  'broadsword',
  'crossbow',
  'katana',
  'staff',
])
  .reduce(buy, (state, { name }) => state.filter(weapon => weapon !== name))
  .reduce(sell, (state, { name }) => [...state, name])

export const Market = () => {
  const { registerChildStore, rootStore } = useContext(RootContext)
  const store = useMemo(() => createStore(marketReducer), [])
  const market = useZeduxState(store)

  useEffect(() => {
    registerChildStore('market', store)
  }, [registerChildStore, store])

  const handleBuy = useCallback(
    (event: SyntheticEvent<HTMLButtonElement>) => {
      const weaponName = event.currentTarget.name
      const rootState = rootStore.getState()
      const cost = selectWeaponCost(weaponName)(rootState)
      const gold = selectGold(rootState)

      if (gold - cost < 0) return alert('you cannot afford that')

      rootStore.dispatch(buy({ cost, name: weaponName }))
    },
    [rootStore]
  )

  return (
    <section>
      <h2>Market</h2>
      <ul>
        {market.map(weaponName => (
          <li key={weaponName}>
            <span>{weaponName}</span>
            <button onClick={handleBuy} name={weaponName}>
              Buy
            </button>
          </li>
        ))}
      </ul>
    </section>
  )
}
