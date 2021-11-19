import { EcosystemProvider, useEcosystem } from '@zedux/react'
import React, { useEffect, useState } from 'react'
import { ecosystems } from './atoms/ecosystems'
import { stateHub } from './atoms/stateHub'
import { Header } from './components/Header'
import { Main } from './components/Main'
import { Position } from './components/Position'
import { Sidebar } from './components/Sidebar'

// a global variable :O - there should only be one StateHub rendered in a window
let idCounter = 0
let renderedId: number | undefined

export const StateHub = () => {
  const [hubId] = useState(() => ++idCounter)
  const parentEcosystem = useEcosystem()

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
        // make the StateHub open by default to the parent ecosystem
        ecosystem.getInstance(stateHub).setState(state => ({
          ...state,
          ecosystem: parentEcosystem.ecosystemId,
        }))

        ecosystem.getInstance(ecosystems)
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
