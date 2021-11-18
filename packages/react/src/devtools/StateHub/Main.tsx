import { useAtomValue } from '@zedux/react'
import React from 'react'
import { stateHub } from './atoms/stateHub'

export const Main = () => {
  const { route } = useAtomValue(stateHub)

  return <main>The route: {route}</main>
}
