import { atom, injectAtomInstance, ZeduxPlugin } from '@zedux/react'
import { MonitorLogEventType } from '../types'
import { monitor } from './monitor'

export const devtoolsPlugin = atom('devtoolsPlugin', () => {
  const monitorInstance = injectAtomInstance(monitor)

  const plugin: ZeduxPlugin = {
    onEcosystemWiped: ecosystem => {
      if (!monitorInstance.store.getState().settings.onEcosystemWiped) return

      monitorInstance.exports.log({ type: MonitorLogEventType.EcosystemWiped })
    },
    onEdgeCreated: () => {},
    onEdgeRemoved: () => {},
    onGhostEdgeCreated: () => {},
    onGhostEdgeRemoved: () => {},
    onInstanceActiveStateChanged: () => {},
    onInstanceCreated: () => {},
    onInstanceDestroyed: () => {},
    onInstanceUpdated: () => {},
  }

  return plugin
})
