import { createStore, Store } from '@zedux/core'
import { ecosystemsReducer } from './ecosystems'

export * from './actions'

const eventType = '@@zedux/register-child-window'

type GlobalStore = Store<{ ecosystems: ReturnType<typeof ecosystemsReducer> }>

const getGlobalStore = (): GlobalStore => {
  if (typeof window === 'undefined') {
    return createStore({ ecosystems: ecosystemsReducer })
  }

  if (typeof window.addEventListener !== 'undefined') {
    window.addEventListener(eventType, event => {
      if (typeof (event as CustomEvent).detail?.callback === 'function') {
        ;(event as CustomEvent).detail.callback(globalStore)
      }
    })
  }

  if (window.opener && (window as any).dispatchEvent && window.CustomEvent) {
    let store: Store | undefined = undefined
    const callback = (storeFromAbove: Store) => (store = storeFromAbove)

    const event = new window.CustomEvent(eventType, { detail: { callback } })
    window.opener.dispatchEvent(event)

    if (store) return store
  }

  return createStore({
    ecosystems: ecosystemsReducer,
  })
}

export const globalStore = getGlobalStore()
