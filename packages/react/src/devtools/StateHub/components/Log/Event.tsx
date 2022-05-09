import { Mod } from '@zedux/react'
import { AnyAtomInstanceBase } from '@zedux/react/types'
import { AtomSelectorCache } from '@zedux/react/utils'
import React, { FC } from 'react'
import { Code, PreviewText, Title } from '../../styles'
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
            The current ecosystem <Code>{ecosystem.ecosystemId}</Code> was
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
            All atom instances in the current ecosystem{' '}
            <Code>{ecosystem.ecosystemId}</Code> were destroyed
          </PreviewText>
        </>
      }
    />
  )
}

const EdgeCreated: FC<{ event: LogEvent<'edgeCreated'> }> = ({ event }) => {
  const { dependency, dependent } = event.action.payload

  return (
    <Event
      event={event}
      importance={Importance.Low}
      preview={
        <>
          <Title>Edge Created</Title>
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
  const { dependency, dependent } = event.action.payload
  const key = ((dependent as AnyAtomInstanceBase).keyHash || (dependent as AtomSelectorCache).cacheKey)

  return (
    <Event
      event={event}
      importance={Importance.Medium}
      preview={
        <>
          <Title>Edge Removed</Title>
          <PreviewText>
            {typeof dependent === 'string' ? dependent : key} &gt;{' '}
            {key}
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

const StateChanged: FC<{ event: LogEvent<'stateChanged'> }> = ({
  event,
}) => {
  const { instance, selectorCache } = event.action.payload

  return (
    <Event
      event={event}
      importance={Importance.Medium}
      preview={
        <>
          <Title>Graph Node State Changed</Title>
          <PreviewText>{instance ? 'Instance' : 'Selector'} - {instance?.keyHash || selectorCache?.cacheKey}</PreviewText>
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
  instanceActiveStateChanged: InstanceActiveStateChanged,
  stateChanged: StateChanged,
}
