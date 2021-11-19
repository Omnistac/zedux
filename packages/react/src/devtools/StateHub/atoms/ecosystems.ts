import {
  atom,
  injectAtomValue,
  injectEffect,
  injectStore,
  zeduxGlobalStore,
} from '@zedux/react'
import { devtoolsPlugin } from './devtoolsPlugin'

export const ecosystems = atom('ecosystems', () => {
  const plugin = injectAtomValue(devtoolsPlugin)
  const store = injectStore(
    Object.keys(zeduxGlobalStore.getState().ecosystems).sort()
  )

  injectEffect(() => {
    // add any ecosystems that were created between atom evaluation and this effect running
    store.setState(Object.keys(zeduxGlobalStore.getState().ecosystems).sort())

    // register the devtools plugin in all ecosystems
    const subscription = zeduxGlobalStore.subscribe((newState, oldState) => {
      if (newState.ecosystems === oldState?.ecosystems) return

      // unregister devtools plugin from any ecosystems that are destroyed
      if (oldState) {
        Object.keys(oldState.ecosystems).forEach(key => {
          if (newState.ecosystems[key]) return

          oldState.ecosystems[key].unregisterPlugin(plugin)
        })
      }

      // register plugin in all current ecosystems (this is ignored if the
      // ecosystem already has this plugin registered)
      Object.values(newState.ecosystems).forEach(ecosystem => {
        ecosystem.registerPlugin(plugin)
      })

      store.setState(Object.keys(newState.ecosystems).sort())
    })

    return () => {
      subscription.unsubscribe()

      // unregister devtools plugin from all ecosystems
      Object.values(zeduxGlobalStore.getState().ecosystems).forEach(
        ecosystem => {
          ecosystem.unregisterPlugin(plugin)
        }
      )
    }
  }, [])

  return store
})
