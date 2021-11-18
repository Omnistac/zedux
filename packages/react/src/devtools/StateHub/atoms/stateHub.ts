import { api, atom, injectStore, zeduxGlobalStore } from '@zedux/react'
import { GridNum, Size } from '../types'

export enum Route {
  Dashboard = 'Dashboard',
  Inspect = 'Inspect',
  Monitor = 'Monitor',
}

export interface StateHubState {
  ecosystem: string
  isOpen: boolean
  position: {
    col: GridNum
    row: GridNum
    size: Size
  }
  route: Route
}

const initialState: StateHubState = {
  ecosystem: 'global',
  isOpen: false,
  position: {
    col: 1,
    row: 1,
    size: 4,
  },
  route: Route.Dashboard,
}

export const positionAtom = atom('position', () => {
  const store = injectStore({
    ...initialState,
    ecosystem: Object.keys(zeduxGlobalStore.getState().ecosystems)[0],
  })

  return api(store).setExports({
    close: () => store.setStateDeep({ isOpen: false }),
    open: (state: Partial<typeof initialState>) =>
      store.setStateDeep({
        isOpen: true,
        ...state,
      }),
  })
})

export const stateHub = atom('stateHub', () => {
  const store = injectStore(initialState)

  return store
})
