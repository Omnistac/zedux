import {
  AnyAtomInstanceBase,
  DependentEdge,
  Mod,
  useEcosystem,
} from '@zedux/react'
import styled from '@zedux/react/ssc'
import React, { FC } from 'react'
import { stateHub } from '../../../atoms/stateHub'
import {
  Code,
  DetailsGridWrapper,
  EdgeBadges,
  IconButton,
  XIcon,
} from '../../../styles'
import { LogEvent, Route } from '../../../types'
import { SettingsLink } from '../../SettingsLink'

const DetailsGrid: FC = ({ children }) => {
  const ecosystem = useEcosystem()

  return (
    <DetailsGridWrapper>
      <H4>
        <span>Event Details</span>
        <IconButton
          onClick={() =>
            ecosystem.getInstance(stateHub).exports.setSelectedLogEvent()
          }
        >
          <IconX />
        </IconButton>
      </H4>
      {children}
    </DetailsGridWrapper>
  )
}

const EdgeDetails: FC<{
  dependency: AnyAtomInstanceBase
  dependent: string | AnyAtomInstanceBase
  edge: DependentEdge
}> = ({ dependency, dependent, edge }) => {
  const date = new Date(edge.createdAt)
  const hour = date.getHours()
  const minute = date.getMinutes().toString().padStart(2, '0')
  const second = date.getMinutes().toString().padStart(2, '0')

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
                selectedAtomInstanceKeyHash: dependency.keyHash,
              },
            },
          })}
        >
          {dependency.keyHash}
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
                  selectedAtomInstanceKeyHash: dependent.keyHash,
                },
              },
            })}
          >
            {dependent.keyHash}
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

const H4 = styled('h4')`
  align-items: center;
  display: grid;
  grid-template-columns: 1fr auto;
  font-size: 1.2em;
  font-weight: normal;
  margin: 0;
`

const IconX = styled(XIcon)`
  color: ${({ theme }) => theme.colors.primary};
  height: 1.4em;
  width: 1.4em;
`

const EcosystemDestroyed: FC<{ event: LogEvent<'ecosystemDestroyed'> }> = ({
  event,
}) => {
  const { ecosystem } = event.action.payload

  return (
    <DetailsGrid>
      <div>Ecosystem Destroyed</div>
      <div>
        The current ecosystem &quot;{ecosystem.ecosystemId}&quot; was destroyed.
        All its instances are gone. Finished. Destruido. And the ecosystem has
        been removed from Zedux&apos; internal store. And um yep that&apos;s all
        I got. Um. How you doin&apos;?
      </div>
    </DetailsGrid>
  )
}

const EcosystemWiped: FC<{ event: LogEvent<'ecosystemWiped'> }> = ({
  event,
}) => {
  const { ecosystem } = event.action.payload

  return (
    <DetailsGrid>
      <div>Ecosystem Wiped</div>
      <div>
        All atom instances in the current ecosystem &quot;
        {ecosystem.ecosystemId}&quot; were destroyed
      </div>
    </DetailsGrid>
  )
}

const EdgeCreated: FC<{ event: LogEvent<'edgeCreated'> }> = ({ event }) => {
  const { dependency, dependent, edge } = event.action.payload

  return (
    <DetailsGrid>
      <div>Edge Created</div>
      <EdgeDetails dependency={dependency} dependent={dependent} edge={edge} />
    </DetailsGrid>
  )
}

const EdgeRemoved: FC<{ event: LogEvent<'edgeRemoved'> }> = ({ event }) => {
  const { dependency, dependent, edge } = event.action.payload

  return (
    <DetailsGrid>
      <div>Edge Removed</div>
      <EdgeDetails dependency={dependency} dependent={dependent} edge={edge} />
    </DetailsGrid>
  )
}

const GhostEdgeCreated: FC<{ event: LogEvent<'ghostEdgeCreated'> }> = ({
  event,
}) => {
  const { ghost } = event.action.payload
  const { dependency, dependent } = ghost

  return (
    <DetailsGrid>
      <div>Ghost Edge Created</div>
      <EdgeDetails
        dependency={dependency}
        dependent={dependent}
        edge={ghost.edge}
      />
    </DetailsGrid>
  )
}

const GhostEdgeDestroyed: FC<{ event: LogEvent<'ghostEdgeDestroyed'> }> = ({
  event,
}) => {
  const { ghost } = event.action.payload
  const { dependency, dependent } = ghost

  return (
    <DetailsGrid>
      <div>Ghost Edge Destroyed</div>
      <div>
        This ghost edge was destroyed without materializing. This usually means
        a React fiber took a long time to commit its changes. Consider
        increasing the <Code>ghostTtlMs</Code> in your ecosystem&apos;s config
      </div>
      <EdgeDetails
        dependency={dependency}
        dependent={dependent}
        edge={ghost.edge}
      />
    </DetailsGrid>
  )
}

const InstanceActiveStateChanged: FC<{
  event: LogEvent<'instanceActiveStateChanged'>
}> = ({ event }) => {
  const { instance, newActiveState, oldActiveState } = event.action.payload
  return (
    <DetailsGrid>
      <div>Atom Instance Active State Changed</div>
      <div>
        <span>Atom Instance: </span>
        <SettingsLink
          to={state => ({
            ecosystemConfig: {
              [state.ecosystemId]: {
                route: Route.Atoms,
                selectedAtomInstanceKeyHash: instance.keyHash,
              },
            },
          })}
        >
          {instance.keyHash}
        </SettingsLink>
      </div>
      <div>
        <span>
          Previous ActiveState: <Code>{oldActiveState}</Code>
        </span>
      </div>
      <div>
        <span>
          New ActiveState: <Code>{newActiveState}</Code>
        </span>
      </div>
    </DetailsGrid>
  )
}

const InstanceStateChanged: FC<{ event: LogEvent<'instanceStateChanged'> }> = ({
  event,
}) => {
  const { instance } = event.action.payload

  return (
    <DetailsGrid>
      <div>Atom Instance State Changed</div>
      <div>
        <span>Atom Instance: </span>
        <SettingsLink
          to={state => ({
            ecosystemConfig: {
              [state.ecosystemId]: {
                route: Route.Atoms,
                selectedAtomInstanceKeyHash: instance.keyHash,
              },
            },
          })}
        >
          {instance.keyHash}
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
  ghostEdgeCreated: GhostEdgeCreated,
  ghostEdgeDestroyed: GhostEdgeDestroyed,
  instanceActiveStateChanged: InstanceActiveStateChanged,
  instanceStateChanged: InstanceStateChanged,
}
