import {
  ecosystem,
  Ecosystem,
  getEcosystem,
  zeduxGlobalStore,
  ZeduxPlugin,
} from '@zedux/react'
import { ecosystemWrapper } from './atoms/ecosystemWrapper'
import { stateHub } from './atoms/stateHub'

const getPlugin = (stateHubEcosystem: Ecosystem) => {
  const plugin = new ZeduxPlugin({
    registerEcosystem: ecosystem => {
      const ecosystemWrapperInstance = stateHubEcosystem.getInstance(
        ecosystemWrapper,
        [ecosystem.ecosystemId]
      )

      // register an explicit dependent on the ecosystemWrapper instance
      const edge = ecosystemWrapperInstance.addDependent('registerEcosystem')
      const subscription = ecosystem.modsMessageBus.subscribe({
        effects: ({ action }) => {
          if (action) ecosystemWrapperInstance.exports.log(action as any)
        },
      })

      // trigger cleanup on the ecosystemWrapper instance if this edge
      // destruction sends its refCount to 0
      return () => {
        subscription.unsubscribe()
        edge.destroy()
      }
    },
  })

  return plugin
}

export const stateHubEcosystemId = '@@zedux/StateHub'

export const getStateHubEcosystem = () => {
  const existingEcosystem = getEcosystem(stateHubEcosystemId)
  if (existingEcosystem) return existingEcosystem

  return ecosystem({
    context: {} as { plugin?: ZeduxPlugin },
    id: stateHubEcosystemId,
    preload: (stateHubEcosystem, prevContext) => {
      // preload the stateHub atom instance before registering plugins
      const stateHubInstance = stateHubEcosystem.getInstance(stateHub)

      // we're gonna be doing all these side effects here, even though this runs
      // during React render :O We can do this because 1) we know this will only
      // evaluate once (idempotency); and 2) we would want all these side
      // effects to run immediately even during SSR.
      const plugin = prevContext?.plugin || getPlugin(stateHubEcosystem)

      // mutation of the context inside onReady is allowed. Probably don't do it
      // anywhere else.
      stateHubEcosystem.context.plugin = plugin

      if (stateHubInstance.store.getState().isWatchingStateHub) {
        stateHubEcosystem.registerPlugin(plugin) // make sure this is registered first
      }

      const registerPlugin = (ecosystems: Record<string, Ecosystem>) => {
        Object.values(ecosystems).forEach(ecosystem => {
          if (
            !stateHubInstance.store.getState().isWatchingStateHub &&
            ecosystem.ecosystemId === stateHubEcosystemId
          ) {
            return
          }

          ecosystem.registerPlugin(plugin)
        })
      }

      // register the stateHub plugin in all current ecosystems
      registerPlugin(zeduxGlobalStore.getState().ecosystems)

      // register the stateHub plugin in all ecosystems that ever get added
      // while this stateHub ecosystem exists
      const subscription = zeduxGlobalStore.subscribe((newState, oldState) => {
        if (newState.ecosystems === oldState?.ecosystems) return

        // we don't need to unregister plugins from destroyed ecosystems - all
        // necessary cleanup will happen as part of that destruction

        // register plugin in all current ecosystems (this is ignored if the
        // ecosystem already has this plugin registered)
        registerPlugin(newState.ecosystems)
      })

      return () => {
        subscription.unsubscribe()

        // unregister stateHub plugin from all current ecosystems
        Object.values(zeduxGlobalStore.getState().ecosystems).forEach(
          ecosystem => {
            ecosystem.unregisterPlugin(plugin)
          }
        )
      }
    },
  })
}
