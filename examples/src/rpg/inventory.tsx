import { createStore, createReducer } from '@zedux'
import React, {
  useMemo,
  useContext,
  SyntheticEvent,
  useCallback,
  useEffect,
} from 'react'
import { useZeduxState } from '../hooks/useZeduxState'
import { buy, sell } from './gold'
import { RootContext, selectWeaponCost } from './root-store'

const weaponsReducer = createReducer(['dagger'])
  .reduce(buy, (state, { name }) => [...state, name])
  .reduce(sell, (state, { name }) => state.filter(weapon => weapon !== name))

export const Inventory = () => {
  const { registerChildStore, rootStore } = useContext(RootContext)
  const store = useMemo(() => createStore(weaponsReducer), [])
  const weapons = useZeduxState(store)

  useEffect(() => {
    registerChildStore('inventory', store)
  }, [registerChildStore, store])

  const handleSell = useCallback(
    (event: SyntheticEvent<HTMLButtonElement>) => {
      const weaponName = event.currentTarget.name
      const cost = selectWeaponCost(weaponName)(rootStore.getState())

      rootStore.dispatch(sell({ cost, name: weaponName }))
    },
    [rootStore]
  )

  return (
    <section>
      <h2>Weapons</h2>
      <ul>
        {weapons.map(weaponName => (
          <li key={weaponName}>
            <span>{weaponName}</span>
            <button onClick={handleSell} name={weaponName}>
              Sell
            </button>
          </li>
        ))}
      </ul>
    </section>
  )
}
