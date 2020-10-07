import { Store, createReducer } from '@zedux'
import { createContext } from 'react'

export interface RootState {
  entities: {
    [key: string]: {
      [key: string]: {
        cost: number
      }
    }
  }
  gold?: number
  inventory?: string[]
  market?: string[]
}

export const selectGold = (state: RootState) => state.gold || 0

export const selectWeaponCost = (weaponName: string) => (state: RootState) =>
  state.entities.weapons[weaponName].cost

// Simulate some data already fetched from a db somewhere
export const weaponsReducer = createReducer({
  broadsword: {
    cost: 680,
  },
  crossbow: {
    cost: 1200,
  },
  dagger: {
    cost: 50,
  },
  katana: {
    cost: 450,
  },
  staff: {
    cost: 200,
  },
})

export const RootContext = createContext<{
  registerChildStore: (id: string, childStore: Store) => void
  rootStore: Store
}>(null)
