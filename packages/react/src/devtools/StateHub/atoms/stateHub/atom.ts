import { ActiveState, api, atom, injectEffect, injectStore } from '@zedux/react'
import { GlobalFilter, GridNum, Route, Size } from '../../types'

export interface Filters {
  [GlobalFilter.Atom]?: string[]
  [GlobalFilter.AtomFlags]?: string[]
  [GlobalFilter.AtomInstance]?: string[]
  [GlobalFilter.AtomInstanceActiveState]?: ActiveState[]
  [GlobalFilter.AtomInstanceKeyHash]?: string[]
}

export interface StateHubState {
  colors: {
    background?: string
    primary?: string
    secondary?: string
  }
  ecosystemId: string
  filters: Record<string, Filters>
  isOpen: boolean
  isPersistingToLocalStorage: boolean
  position: {
    col: GridNum
    row: GridNum
    size: Size
  }
  route: Route
  selectedAtomInstanceKeyHash?: string
  selectedLogEventId?: string
}

const getLocalStorageState = () => {
  const settingsStr = localStorage.getItem(localStorageKey)

  if (!settingsStr) return

  try {
    return JSON.parse(settingsStr) as StateHubState
  } catch (err) {
    console.error(
      'Zedux StateHub - Failed to parse saved settings:',
      settingsStr,
      err
    )
  }
}

const initialState: StateHubState = {
  colors: {},
  ecosystemId: 'global',
  filters: {},
  isOpen: false,
  isPersistingToLocalStorage: true,
  position: {
    col: 1,
    row: 1,
    size: 4,
  },
  route: Route.Dashboard,
}

const localStorageKey = '@@zedux/StateHub/settings'

export const stateHub = atom('stateHub', () => {
  const localStorageState = getLocalStorageState()
  const store = injectStore(initialState)

  // use the Zedux store built-in `setStateDeep` method to deeply merge any
  // saved settings into the default settings
  if (localStorageState) store.setStateDeep(localStorageState)

  injectEffect(() => {
    const subscription = store.subscribe((newState, oldState) => {
      if (newState.isPersistingToLocalStorage) {
        localStorage.setItem(localStorageKey, JSON.stringify(newState))
        return
      }

      if (!oldState?.isPersistingToLocalStorage) return

      // we were persisting but now we're not. Delete saved stuff
      localStorage.removeItem(localStorageKey)
    })

    return () => subscription.unsubscribe()
  }, [])

  return api(store).setExports({
    /**
     * "Close" the StateHub (hide it).
     */
    close: () => store.setStateDeep({ isOpen: false }),

    /**
     * Open the StateHub. Pass any partial of StateHubState. Example:
     *
     * ```ts
     * import { getStateHub } from '@zedux/react/devtools'
     *
     * // open to a specific ecosystem:
     * getStateHub().exports.open({ ecosystemId: myEcosystem.ecosystemId })
     * ```
     */
    open: (state: Partial<typeof initialState>) =>
      store.setStateDeep({
        isOpen: true,
        ...state,
      }),

    setFilter: <K extends GlobalFilter>(
      key: K,
      getVal: (state: Filters[K]) => Filters[K]
    ) => {
      store.setStateDeep(state => ({
        filters: {
          [state.ecosystemId]: {
            [key]: getVal(state.filters[state.ecosystemId]?.[key]),
          },
        },
      }))
    },

    wereSettingsSaved: !!localStorageState,
  })
})
