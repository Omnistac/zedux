import { EcosystemProvider } from '@zedux/react'
import React, { useEffect, useState } from 'react'
import { Header } from './Header'
import { Main } from './Main'
import { Position } from './Position'
import { Sidebar } from './Sidebar'

// a global variable :O - there should only be one StateHub rendered in a window
let idCounter = 0
let renderedId: number | undefined

export const StateHub = () => {
  const [hubId] = useState(() => ++idCounter)

  if (renderedId && renderedId !== hubId) return null

  renderedId = hubId

  useEffect(() => () => {
    renderedId = undefined
  })

  return (
    <EcosystemProvider id="@@zedux/StateHub">
      <Position>
        <Sidebar />
        <Header />
        <Main />
      </Position>
    </EcosystemProvider>
  )
}
