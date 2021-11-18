import {
  EcosystemProvider,
  useAtomInstance,
  useEcosystem,
  zeduxGlobalStore,
  ZeduxPlugin,
} from '@zedux/react'
import React, { useEffect, useState } from 'react'
import { stateHub } from './atoms/stateHub'
import { Header } from './Header'
import { Main } from './Main'
import { Position } from './Position'
import { Sidebar } from './Sidebar'

const devtoolsPlugin: ZeduxPlugin = {}

// a global variable :O - there should only be one StateHub rendered in a window
let idCounter = 0
let renderedId: number | undefined

export const StateHub = () => {
  const [hubId] = useState(() => ++idCounter)
  const parentEcosystem = useEcosystem()
  const stateHubAtomInstance = useAtomInstance(stateHub)

  if (renderedId && renderedId !== hubId) return null

  renderedId = hubId

  useEffect(() => () => {
    renderedId = undefined
  })

  return (
    <EcosystemProvider
      context={{ parentEcosystem }}
      id="@@zedux/StateHub"
      preload={ecosystem => {
        console.log(
          'setting state..',
          parentEcosystem,
          zeduxGlobalStore.getState()
        )
        stateHubAtomInstance.setState(state => ({
          ...state,
          ecosystem: parentEcosystem.ecosystemId,
        }))

        ecosystem.registerExternalAtomInstance(stateHubAtomInstance)

        const subscription = zeduxGlobalStore.subscribe(
          (newState, oldState) => {
            if (newState.ecosystems === oldState?.ecosystems) return

            // unregister devtools plugin from any ecosystems that are destroyed
            if (oldState) {
              Object.keys(oldState.ecosystems).forEach(key => {
                if (newState.ecosystems[key]) return

                oldState.ecosystems[key].unregisterPlugin(devtoolsPlugin)
              })
            }

            // register plugin in all current ecosystems (this is ignored if the
            // ecosystem already has this plugin registered)
            Object.values(newState.ecosystems).forEach(ecosystem => {
              ecosystem.registerPlugin(devtoolsPlugin)
            })
          }
        )

        return () => {
          ecosystem.unregisterExternalAtomInstance(stateHubAtomInstance)
          subscription.unsubscribe()

          // unregister devtools plugin from all ecosystems
          Object.values(zeduxGlobalStore.getState().ecosystems).forEach(
            ecosystem => {
              ecosystem.unregisterPlugin(devtoolsPlugin)
            }
          )
        }
      }}
    >
      <Position>
        <Sidebar />
        <Header />
        <Main />
      </Position>
    </EcosystemProvider>
  )
}
