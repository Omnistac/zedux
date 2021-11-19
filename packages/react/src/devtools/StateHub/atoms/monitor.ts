import { api, atom, injectStore, ZeduxPlugin } from '@zedux/react'
import { MonitorLogEvent } from '../types'

export const monitor = atom('monitor', () => {
  const store = injectStore<{
    log: MonitorLogEvent[]
    settings: Record<keyof ZeduxPlugin, boolean> & { history: number }
  }>({
    log: [],
    settings: {
      history: 300,
      onEdgeCreated: false,
      onEdgeRemoved: false,
      onGhostEdgeCreated: false,
      onGhostEdgeRemoved: false,
      onInstanceCreated: false,
      onInstanceUpdated: false,
      onInstanceDestroyed: false,
      onInstanceActiveStateChanged: false,
      onEcosystemWiped: false,
    },
  })

  return api(store).setExports({
    log: (event: Omit<MonitorLogEvent, 'timestamp'>) => {
      const eventWithTimestamp = { ...event, timestamp: Date.now() }

      store.setState(state => ({
        ...state,
        log: [eventWithTimestamp, ...state.log],
      }))
    },
  })
})
