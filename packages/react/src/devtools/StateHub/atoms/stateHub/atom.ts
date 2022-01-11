import {
  ActiveState,
  api,
  atom,
  injectEffect,
  injectStore,
  Mod,
} from '@zedux/react'
import { GlobalFilter, GridNum, LogFilter, Route, Size } from '../../types'

export type LoggingMode =
  | 'collapsed-minimal'
  | 'collapsed-detailed'
  | 'expanded-minimal'
  | 'expanded-detailed'

export interface StateHubEcosystemConfig {
  colors?: {
    background?: string
    primary?: string
    secondary?: string
  }
  filters?: {
    [GlobalFilter.Atom]?: string[]
    [GlobalFilter.AtomFlags]?: string[]
    [GlobalFilter.AtomInstance]?: string[]
    [GlobalFilter.AtomInstanceActiveState]?: ActiveState[]
    [GlobalFilter.AtomInstanceKeyHash]?: string[]
  }
  instanceConfig?: Record<string, StateHubEcosystemInstanceConfig | undefined>
  logFilters?: {
    [LogFilter.EdgeType]?: {
      isExplicit?: boolean
      isExternal?: boolean
      isStatic?: boolean
    }
    [LogFilter.EventType]?: Mod[]
  }
  logLimit?: number
  route?: Route
  selectedAtomInstanceKeyHash?: string
  selectedLogEventId?: string
}

export interface StateHubEcosystemInstanceConfig {
  loggingMode?: LoggingMode
  timeTravelMode?: 'actions' | 'state'
}

export interface StateHubState {
  ecosystemConfig: Record<string, StateHubEcosystemConfig | undefined>
  ecosystemId: string
  isOpen: boolean
  isPersistingToLocalStorage: boolean
  isWatchingStateHub: boolean
  position: {
    col: GridNum
    row: GridNum
    size: Size
  }
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
  ecosystemConfig: {},
  ecosystemId: 'global',
  isOpen: false,
  isPersistingToLocalStorage: true,
  isWatchingStateHub: false,
  position: {
    col: 1,
    row: 1,
    size: 4,
  },
}

const localStorageKey = '@@zedux/StateHub/settings'

export const stateHub = atom('stateHub', () => {
  const localStorageState = getLocalStorageState()
  const store = injectStore(initialState, { shouldSubscribe: false })

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
      localStorage.setItem(
        localStorageKey,
        JSON.stringify({ isPersistingToLocalStorage: false })
      )
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

    setColors: (colors: Partial<StateHubEcosystemConfig['colors']>) => {
      store.setStateDeep(state => ({
        ecosystemConfig: {
          [state.ecosystemId]: { colors },
        },
      }))
    },

    setFilter: <K extends GlobalFilter>(
      key: K,
      getVal: (
        state: NonNullable<StateHubEcosystemConfig['filters']>[K]
      ) => NonNullable<StateHubEcosystemConfig['filters']>[K]
    ) => {
      store.setStateDeep(state => ({
        ecosystemConfig: {
          [state.ecosystemId]: {
            filters: {
              [key]: getVal(
                state.ecosystemConfig[state.ecosystemId]?.filters?.[key]
              ),
            },
          },
        },
      }))
    },

    setLoggingMode: (keyHash: string, loggingMode?: LoggingMode) => {
      store.setStateDeep(state => ({
        ecosystemConfig: {
          [state.ecosystemId]: {
            instanceConfig: {
              [keyHash]: {
                loggingMode,
              },
            },
          },
        },
      }))
    },

    setLogFilter: <K extends LogFilter>(
      key: K,
      getVal: (
        state: NonNullable<StateHubEcosystemConfig['logFilters']>[K]
      ) => NonNullable<StateHubEcosystemConfig['logFilters']>[K]
    ) => {
      store.setStateDeep(state => ({
        ecosystemConfig: {
          [state.ecosystemId]: {
            logFilters: {
              [key]: getVal(
                state.ecosystemConfig[state.ecosystemId]?.logFilters?.[key]
              ),
            },
          },
        },
      }))
    },

    setRoute: (route?: Route) => {
      store.setStateDeep(state => ({
        ecosystemConfig: {
          [state.ecosystemId]: { route },
        },
      }))
    },

    setSelectedAtomInstance: (
      getKeyHash?: (state?: string) => string | undefined
    ) => {
      store.setStateDeep(state => ({
        ecosystemConfig: {
          [state.ecosystemId]: {
            selectedAtomInstanceKeyHash: getKeyHash?.(
              state.ecosystemConfig[state.ecosystemId]
                ?.selectedAtomInstanceKeyHash
            ),
          },
        },
      }))
    },

    setSelectedLogEvent: (getId?: (state?: string) => string | undefined) => {
      store.setStateDeep(state => ({
        ecosystemConfig: {
          [state.ecosystemId]: {
            selectedLogEventId: getId?.(
              state.ecosystemConfig[state.ecosystemId]?.selectedLogEventId
            ),
          },
        },
      }))
    },

    wereSettingsSaved: !!localStorageState,
  })
})
