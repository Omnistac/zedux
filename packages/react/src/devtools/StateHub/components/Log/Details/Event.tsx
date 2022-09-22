import {
  AnyAtomInstanceBase,
  DependentEdge,
  Mod,
  useEcosystem,
} from '@zedux/react'
import styled from '@zedux/react/ssc'
import { AnyAtomInstance } from '@zedux/react/types'
import { AtomSelectorCache } from '@zedux/react/utils'
import React, { FC, PropsWithChildren } from 'react'
import { stateHub } from '../../../atoms/stateHub'
import {
  Code,
  DetailsGridWrapper,
  EdgeBadges,
  GridStretch,
  IconButton,
  rawIcons,
  styledIcons,
} from '../../../styles'
import { LogEvent, Route } from '../../../types'
import { ActiveStateGraphic } from '../../ActiveStateGraphic'
import { SettingsButton, SettingsLink } from '../../SettingsLink'

const StyledX = styled(rawIcons.X)`
  color: ${({ theme }) => theme.colors.primary};
  height: 1.4em;
  width: 1.4em;
`

const Title = styled.div`
  align-items: center;
  display: grid;
  grid-template-columns: 1fr auto;
  font-size: 1.1em;
  font-weight: normal;
  margin: 0;
`

const DetailsGrid = ({
  children,
  text,
}: PropsWithChildren<{ text: string }>) => {
  const ecosystem = useEcosystem()

  return (
    <DetailsGridWrapper>
      <Title>
        <span>{text}</span>
        <IconButton
          onClick={() =>
            ecosystem.getInstance(stateHub).exports.setSelectedLogEvent()
          }
        >
          <StyledX />
        </IconButton>
      </Title>
      {children}
    </DetailsGridWrapper>
  )
}

const EdgeDetails = ({
  dependency,
  dependent,
  edge,
}: {
  dependency: AnyAtomInstanceBase | AtomSelectorCache
  dependent: string | AnyAtomInstanceBase | AtomSelectorCache
  edge: DependentEdge
}) => {
  const date = new Date(edge.createdAt)
  const hour = date.getHours()
  const minute = date.getMinutes().toString().padStart(2, '0')
  const second = date.getMinutes().toString().padStart(2, '0')
  const dependencyKey =
    (dependency as AnyAtomInstanceBase).keyHash ||
    (dependency as AtomSelectorCache).cacheKey
  const dependentKey =
    (dependent as AnyAtomInstanceBase).keyHash ||
    (dependent as AtomSelectorCache).cacheKey

  return (
    <>
      <div>Created at {`${hour}:${minute}:${second}`}</div>
      <div>
        <span>Dependency: </span>
        <SettingsLink
          to={state => ({
            ecosystemConfig: {
              [state.ecosystemId]: {
                route: Route.Atoms,
                selectedAtomInstanceKeyHash: dependencyKey,
              },
            },
          })}
        >
          {dependencyKey}
        </SettingsLink>
      </div>
      <div>
        <span>Dependent: </span>
        {typeof dependent === 'string' ? (
          <Code>{dependent}</Code>
        ) : (
          <SettingsLink
            to={state => ({
              ecosystemConfig: {
                [state.ecosystemId]: {
                  route: Route.Atoms,
                  selectedAtomInstanceKeyHash: dependentKey,
                },
              },
            })}
          >
            {dependentKey}
          </SettingsLink>
        )}
      </div>
      <div>
        <span>Edge Type: </span>
        <EdgeBadges edge={edge} />
      </div>
    </>
  )
}

const EcosystemDestroyed: FC<{ event: LogEvent<'ecosystemDestroyed'> }> = ({
  event,
}) => {
  const { ecosystem } = event.action.payload

  return (
    <DetailsGrid text="Ecosystem Destroyed">
      <div>
        The current ecosystem <Code>{ecosystem.ecosystemId}</Code> was
        destroyed. All its instances and plugins have been cleaned up.
      </div>
    </DetailsGrid>
  )
}

const EcosystemWiped: FC<{ event: LogEvent<'ecosystemWiped'> }> = ({
  event,
}) => {
  const { ecosystem } = event.action.payload

  return (
    <DetailsGrid text="Ecosystem Wiped">
      <div>
        All atom instances in the current ecosystem{' '}
        <Code>{ecosystem.ecosystemId}</Code> were destroyed
      </div>
    </DetailsGrid>
  )
}

const EdgeCreated: FC<{ event: LogEvent<'edgeCreated'> }> = ({ event }) => {
  const { dependency, dependent, edge } = event.action.payload

  return (
    <DetailsGrid text="Edge Created">
      <EdgeDetails dependency={dependency} dependent={dependent} edge={edge} />
    </DetailsGrid>
  )
}

const EdgeRemoved: FC<{ event: LogEvent<'edgeRemoved'> }> = ({ event }) => {
  const { dependency, dependent, edge } = event.action.payload

  return (
    <DetailsGrid text="Edge Removed">
      <EdgeDetails dependency={dependency} dependent={dependent} edge={edge} />
    </DetailsGrid>
  )
}

const activeStateChanged: FC<{
  event: LogEvent<'activeStateChanged'>
}> = ({ event }) => {
  const { instance, newActiveState, oldActiveState } = event.action.payload
  return (
    <DetailsGrid text="Atom Instance Active State Changed">
      <GridStretch>
        <SettingsButton
          padding={1}
          to={state => ({
            ecosystemConfig: {
              [state.ecosystemId]: {
                route: Route.Atoms,
                selectedAtomInstanceKeyHash: instance.keyHash,
              },
            },
          })}
        >
          <styledIcons.Atom />
          <span>{instance.keyHash}</span>
        </SettingsButton>
      </GridStretch>
      <ActiveStateGraphic prevState={oldActiveState} state={newActiveState} />
    </DetailsGrid>
  )
}

const StateChanged: FC<{ event: LogEvent<'stateChanged'> }> = ({ event }) => {
  const { instance, selectorCache } = event.action.payload
  const key = instance?.keyHash || selectorCache?.cacheKey

  return (
    <DetailsGrid text="Atom Instance State Changed">
      <div>
        <span>Atom Instance: </span>
        <SettingsLink
          to={state => ({
            ecosystemConfig: {
              [state.ecosystemId]: {
                route: Route.Atoms,
                selectedAtomInstanceKeyHash: key,
              },
            },
          })}
        >
          {key}
        </SettingsLink>
      </div>
    </DetailsGrid>
  )
}

export const eventMap: Record<Mod, FC<{ event: LogEvent }>> = {
  ecosystemDestroyed: EcosystemDestroyed,
  ecosystemWiped: EcosystemWiped,
  edgeCreated: EdgeCreated,
  edgeRemoved: EdgeRemoved,
  activeStateChanged: activeStateChanged,
  stateChanged: StateChanged,
}
