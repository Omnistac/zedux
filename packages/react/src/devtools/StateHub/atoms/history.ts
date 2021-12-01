import {
  ActiveState,
  AnyAtomInstance,
  api,
  atom,
  AtomGetters,
  injectEffect,
  injectRef,
  injectStore,
} from '@zedux/react'
import { stateHub, StateHubState } from './stateHub'

export interface HistoryMod<State, SerializedState> {
  isEqual: (newState: SerializedState, oldState: SerializedState) => boolean
  isPartial: boolean
  parse: (serializedState: SerializedState) => State
  serialize: (state: State) => SerializedState
}

/**
 * Add undo/redo (time travel) to any atom instance. The instance can come from
 * outside this ecosystem, so don't pass it to any injectors or AtomGetters
 */
export const history = atom('history', (instance: AnyAtomInstance) => {
  const isFromHistory = injectRef<boolean>(false)
  const modRef = injectRef<HistoryMod<any, any>>()
  const store = injectStore({ pointer: 0, stack: [instance.store.getState()] })

  injectEffect(() => {
    const subscription = instance.store.subscribe(newState => {
      // store updates are synchronous. Take advantage of that just 'cause:
      if (
        isFromHistory.current ||
        instance._activeState === ActiveState.Destroyed
      ) {
        return
      }

      const serializedState = modRef.current
        ? modRef.current.serialize(newState)
        : newState

      if (modRef.current) {
        const { pointer, stack } = store.getState()
        if (modRef.current.isEqual(serializedState, stack[pointer])) return
      }

      store.setState(state => ({
        pointer: state.pointer + 1,
        stack: [...state.stack.slice(0, state.pointer + 1), serializedState],
      }))
    })

    return () => subscription.unsubscribe()
  }, [])

  const goTo = (index: number) => {
    const { pointer, stack } = store.getState()
    if (
      index < 0 ||
      index >= stack.length ||
      index === pointer ||
      instance._activeState === ActiveState.Destroyed
    ) {
      return
    }

    const parsedState = modRef.current
      ? modRef.current.parse(stack[index])
      : stack[index]

    isFromHistory.current = true
    modRef.current?.isPartial
      ? instance.store.setStateDeep(parsedState)
      : instance.store.setState(parsedState)
    isFromHistory.current = false

    store.setStateDeep({ pointer: index })
  }

  return api(store).setExports({
    back: () => goTo(store.getState().pointer - 1),
    canGoBack: () => store.getState().pointer > 0,
    canGoForward: () => {
      const { pointer, stack } = store.getState()
      return pointer < stack.length - 1
    },
    forward: () => goTo(store.getState().pointer + 1),
    goTo,
    hasMod: () => !!modRef.current,
    setMod: (mod: HistoryMod<any, any>) => {
      modRef.current = mod
      store.setStateDeep({ stack: [mod.serialize(instance.store.getState())] })
    },
  })
})

type StateHubHistoryState = Pick<StateHubState, 'ecosystemId' | 'route'>

export const getStateHubHistoryInstance = ({ getInstance }: AtomGetters) => {
  const stateHubInstance = getInstance(stateHub)
  const historyInstance = getInstance(history, [stateHubInstance])

  if (!historyInstance.exports.hasMod()) {
    historyInstance.exports.setMod({
      isEqual: (
        newState: StateHubHistoryState,
        oldState: StateHubHistoryState
      ) =>
        newState.ecosystemId === oldState.ecosystemId &&
        newState.route === oldState.route,
      isPartial: true,
      parse: state => state,
      serialize: (state: StateHubState) => {
        const { ecosystemId, route } = state

        return { ecosystemId, route }
      },
    })
  }

  return historyInstance
}
