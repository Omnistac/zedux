import { useAtomSelector } from '@zedux/react'
import React from 'react'
import { getRoute } from '../atoms/stateHub'
import styled from '@zedux/react/ssc'
import { Atoms } from './Atoms'
import { Dashboard } from './Dashboard'
import { Graph } from './Graph'
import { Log } from './Log'
import { Settings } from './Settings'
import { Toasts } from './Toasts'
import { Route } from '../types'

const routeMap = {
  [Route.Atoms]: Atoms,
  [Route.Dashboard]: Dashboard,
  [Route.Graph]: Graph,
  [Route.Log]: Log,
  [Route.Settings]: Settings,
}

const StyledMain = styled.main`
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  grid-template-rows: minmax(0, 1fr);
  position: relative;
`

export const Main = () => {
  const route = useAtomSelector(getRoute)

  const RouteComponent = routeMap[route]

  return (
    <StyledMain>
      <Toasts />
      <RouteComponent />
    </StyledMain>
  )
}
