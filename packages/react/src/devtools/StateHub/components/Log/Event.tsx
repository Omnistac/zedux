import { Mod } from '@zedux/react'
import React, { FC } from 'react'
import { EdgeBadges, PreviewText, Title } from '../../styles'
import { Importance, LogEvent } from '../../types'
import { Event } from './styles'

const EcosystemDestroyed: FC<{ event: LogEvent<'ecosystemDestroyed'> }> = ({
  event,
}) => {
  const { ecosystem } = event.action.payload

  return (
    <Event
      event={event}
      importance={Importance.High}
      preview={
        <>
          <Title>Ecosystem Destroyed</Title>
          <PreviewText>
            The current ecosystem &quot;{ecosystem.ecosystemId}&quot; was
            destroyed
          </PreviewText>
        </>
      }
    />
  )
}

const EcosystemWiped: FC<{ event: LogEvent<'ecosystemWiped'> }> = ({
  event,
}) => {
  const { ecosystem } = event.action.payload

  return (
    <Event
      event={event}
      importance={Importance.High}
      preview={
        <>
          <Title>Ecosystem Wiped</Title>
          <PreviewText>
            All atom instances in the current ecosystem &quot;
            {ecosystem.ecosystemId}&quot; were destroyed
          </PreviewText>
        </>
      }
    />
  )
}

const EdgeCreated: FC<{ event: LogEvent<'edgeCreated'> }> = ({ event }) => {
  const { dependency, dependent, edge } = event.action.payload

  return (
    <Event
      event={event}
      importance={Importance.Low}
      preview={
        <>
          <Title>Edge Created</Title>
          <div>
            <EdgeBadges edge={edge} />
          </div>
          <PreviewText>
            {typeof dependent === 'string' ? dependent : dependent.keyHash} &gt;{' '}
            {dependency.keyHash}
          </PreviewText>
        </>
      }
    ></Event>
  )
}

const EdgeRemoved: FC<{ event: LogEvent<'edgeRemoved'> }> = ({ event }) => {
  const { dependency, dependent, edge } = event.action.payload

  return (
    <Event
      event={event}
      importance={Importance.Medium}
      preview={
        <>
          <Title>Edge Removed</Title>
          <div>
            <EdgeBadges edge={edge} />
          </div>
          <PreviewText>
            {typeof dependent === 'string' ? dependent : dependent.keyHash} &gt;{' '}
            {dependency.keyHash}
          </PreviewText>
        </>
      }
    />
  )
}

const GhostEdgeCreated: FC<{ event: LogEvent<'ghostEdgeCreated'> }> = ({
  event,
}) => {
  const { ghost } = event.action.payload
  const { dependency, dependent } = ghost

  return (
    <Event
      event={event}
      importance={Importance.Dirt}
      preview={
        <>
          <Title>Ghost Edge Created</Title>
          <div>
            <EdgeBadges edge={ghost.edge} />
          </div>
          <PreviewText>
            {dependent} &gt; {dependency.keyHash}
          </PreviewText>
        </>
      }
    />
  )
}

const GhostEdgeDestroyed: FC<{ event: LogEvent<'ghostEdgeDestroyed'> }> = ({
  event,
}) => {
  const { ghost } = event.action.payload
  const { dependency, dependent } = ghost

  return (
    <Event
      event={event}
      importance={Importance.High}
      preview={
        <>
          <Title>Ghost Edge Destroyed Before Materializing</Title>
          <div>
            <EdgeBadges edge={ghost.edge} />
          </div>
          <PreviewText>
            {dependent} &gt; {dependency.keyHash}
          </PreviewText>
        </>
      }
    />
  )
}

const InstanceActiveStateChanged: FC<{
  event: LogEvent<'instanceActiveStateChanged'>
}> = ({ event }) => {
  const { instance, newActiveState, oldActiveState } = event.action.payload
  return (
    <Event
      event={event}
      importance={Importance.Medium}
      preview={
        <>
          <Title>Atom Instance Active State Changed</Title>
          <PreviewText>
            {instance.keyHash} - {oldActiveState} &gt; {newActiveState}
          </PreviewText>
        </>
      }
    />
  )
}

const InstanceStateChanged: FC<{ event: LogEvent<'instanceStateChanged'> }> = ({
  event,
}) => {
  const { instance } = event.action.payload

  return (
    <Event
      event={event}
      importance={Importance.Medium}
      preview={
        <>
          <Title>Atom Instance State Changed</Title>
          <PreviewText>{instance.keyHash}</PreviewText>
        </>
      }
    />
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
