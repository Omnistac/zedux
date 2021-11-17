import { useAtomState } from '@zedux/react'
import React from 'react'
import { BiNetworkChart } from 'react-icons/bi'
import { FiGlobe } from 'react-icons/fi'
import { GiAtom } from 'react-icons/gi'
import styled, { css } from 'styled-components'
import { Route, routeAtom } from './atoms/route'
import { randomColor } from './styles'

const Aside = styled.aside`
  background: rgba(255, 255, 255, 0.04);
  grid-row: span 2;
  width: 3em;
`

const iconStyles = css`
  color: ${randomColor()};
  font-size: 2em;
  text-shadow: 6px 6px 4px rgba(255, 255, 255, 0.1);
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

const IconButton = styled.button<{ isActive?: boolean }>`
  background: ${({ isActive }) =>
    isActive ? 'rgba(255, 255, 255, 0.15)' : 'none'};
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
        background: rgba(255, 255, 255, 0.07);
      }
    `}
`

export const Sidebar = () => {
  const [route, setRoute] = useAtomState(routeAtom)

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
