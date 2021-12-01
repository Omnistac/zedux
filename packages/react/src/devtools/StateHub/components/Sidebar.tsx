import { useAtomState } from '@zedux/react'
import React from 'react'
import { AiOutlineApartment } from 'react-icons/ai'
import { BsGearFill } from 'react-icons/bs'
import { IoMdList } from 'react-icons/io'
import styled, { css } from '@zedux/react/ssc'
import { stateHub } from '../atoms/stateHub'
import { IconAtom, iconStyles, IconWorld } from '../styles'
import { Route } from '../types'

const Aside = styled('aside')`
  align-content: start;
  background: ${({ theme }) => theme.colors.alphas.white[0]};
  display: grid;
  grid-row: span 2;
  width: 3em;
`

const IconGear = styled(BsGearFill)`
  ${iconStyles}
`
const IconGraph = styled(AiOutlineApartment)`
  ${iconStyles}
`
const IconList = styled(IoMdList)`
  ${iconStyles}
`

const IconButton = styled('button')<{ isActive?: boolean }>`
  background: ${({ isActive, theme }) =>
    isActive ? theme.colors.alphas.white[2] : 'none'};
  border: none;
  cursor: pointer;
  font-size: inherit;
  height: 3em;
  outline: none;
  position: relative;
  width: 3em;

  ${({ isActive }) =>
    !isActive &&
    css`
      &:hover {
        background: ${({ theme }) => theme.colors.alphas.white[1]};
      }
    `}
`

export const Sidebar = () => {
  const [{ route }, setState] = useAtomState(stateHub)
  const setRoute = (route: Route) => setState(state => ({ ...state, route }))

  return (
    <Aside>
      <IconButton
        isActive={route === Route.Dashboard}
        onClick={() => setRoute(Route.Dashboard)}
        title="Dashboard"
      >
        <IconWorld />
      </IconButton>
      <IconButton
        isActive={route === Route.Atoms}
        onClick={() => setRoute(Route.Atoms)}
        title="Atoms"
      >
        <IconAtom />
      </IconButton>
      <IconButton
        isActive={route === Route.Log}
        onClick={() => setRoute(Route.Log)}
        title="Log"
      >
        <IconList />
      </IconButton>
      <IconButton
        isActive={route === Route.Graph}
        onClick={() => setRoute(Route.Graph)}
        title="Graph"
      >
        <IconGraph />
      </IconButton>
      <IconButton
        isActive={route === Route.Settings}
        onClick={() => setRoute(Route.Settings)}
        title="Settings"
      >
        <IconGear />
      </IconButton>
    </Aside>
  )
}
