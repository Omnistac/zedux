import { useAtomValue } from '@zedux/react'
import React from 'react'
import { routeAtom } from './atoms/route'

export const Main = () => {
  const route = useAtomValue(routeAtom)

  return <main>The route: {route}</main>
}
