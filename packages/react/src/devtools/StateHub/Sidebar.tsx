import { useAtomState } from '@zedux/react'
import React from 'react'
import { BiNetworkChart } from 'react-icons/bi'
import { FiGlobe } from 'react-icons/fi'
import { GiAtom } from 'react-icons/gi'
import styled, { css } from './simple-styled-components'
import { Route, stateHub } from './atoms/stateHub'
import { colors } from './styles'

const Aside = styled('aside')`
  background: ${colors.alphas.white[0]};
  grid-row: span 2;
  width: 3em;
`

const iconStyles = css`
  color: ${colors.main};
  font-size: 2em;
  text-shadow: 6px 6px 4px ${colors.alphas.white[2]};
`

const IconAtom = styled(GiAtom)`
  ${iconStyles}
`
const IconMolecule = styled(BiNetworkChart)`
  ${iconStyles}
`
const IconWorld = styled(FiGlobe)`
  ${iconStyles}
`

const IconButton = styled('button')<{ isActive?: boolean }>`
  background: ${({ isActive }) => (isActive ? colors.alphas.white[2] : 'none')};
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
        background: ${colors.alphas.white[1]};
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
      >
        <IconWorld />
      </IconButton>
      <IconButton
        isActive={route === Route.Monitor}
        onClick={() => setRoute(Route.Monitor)}
      >
        <IconAtom />
      </IconButton>
      <IconButton
        isActive={route === Route.Inspect}
        onClick={() => setRoute(Route.Inspect)}
      >
        <IconMolecule />
      </IconButton>
    </Aside>
  )
}
