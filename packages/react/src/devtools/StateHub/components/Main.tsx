import { useAtomValue } from '@zedux/react'
import React from 'react'
import { Route, stateHub } from '../atoms/stateHub'
import { Dashboard } from './Dashboard'
import { Inspect } from './Inspect'
import { Monitor } from './Monitor'

const routeMap = {
  [Route.Dashboard]: Dashboard,
  [Route.Monitor]: Monitor,
  [Route.Inspect]: Inspect,
}

export const Main = () => {
  const { route } = useAtomValue(stateHub)

  const RouteComponent = routeMap[route]

  return (
    <main>
      <RouteComponent />
    </main>
  )
}
