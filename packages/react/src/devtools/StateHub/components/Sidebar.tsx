import { useAtomInstance, useAtomSelector } from '@zedux/react'
import React from 'react'
import styled, { css } from '@zedux/react/ssc'
import { getRoute, stateHub } from '../atoms/stateHub'
import { styledIcons } from '../styles'
import { Route } from '../types'

const Aside = styled.aside`
  align-content: start;
  background: ${({ theme }) => theme.colors.alphas.white[0]};
  display: grid;
  grid-auto-rows: 3em;
  grid-row: span 2;
  width: 3em;
`

const IconButton = styled.button<{ isActive?: boolean }>`
  background: ${({ isActive, theme }) =>
    isActive ? theme.colors.alphas.white[2] : 'none'};
  border: none;
  cursor: pointer;
  display: grid;
  font-size: 1.7em;
  outline: none;
  padding: 0;
  place-items: center;
  position: relative;

  ${({ isActive }) =>
    !isActive &&
    css`
      &:hover {
        background: ${({ theme }) => theme.colors.alphas.white[1]};
      }
    `}
`

export const Sidebar = () => {
  const route = useAtomSelector(getRoute)
  const { setRoute } = useAtomInstance(stateHub).exports

  return (
    <Aside>
      <IconButton
        isActive={route === Route.Dashboard}
        onClick={() => setRoute(Route.Dashboard)}
        title="Dashboard"
      >
        <styledIcons.World />
      </IconButton>
      <IconButton
        isActive={route === Route.Atoms}
        onClick={() => setRoute(Route.Atoms)}
        title="Atoms"
      >
        <styledIcons.Atom />
      </IconButton>
      <IconButton
        isActive={route === Route.Log}
        onClick={() => setRoute(Route.Log)}
        title="Log"
      >
        <styledIcons.List />
      </IconButton>
      <IconButton
        isActive={route === Route.Graph}
        onClick={() => setRoute(Route.Graph)}
        title="Graph"
      >
        <styledIcons.Graph />
      </IconButton>
      <IconButton
        isActive={route === Route.Settings}
        onClick={() => setRoute(Route.Settings)}
        title="Settings"
      >
        <styledIcons.Gear />
      </IconButton>
    </Aside>
  )
}
