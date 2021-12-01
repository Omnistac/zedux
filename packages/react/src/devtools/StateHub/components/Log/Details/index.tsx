import React, { FC, useRef } from 'react'
import { DetailsScreen } from '../../../styles'
import { LogEvent } from '../../../types'
import { eventMap } from './Event'

export const Details: FC<{ event?: LogEvent }> = ({ event }) => {
  const prevEvent = useRef(event)
  if (event) prevEvent.current = event

  const displayedEvent = event || prevEvent.current

  const EventComponent = displayedEvent
    ? eventMap[displayedEvent.action.type]
    : null

  return (
    <DetailsScreen isOpen={!!event} width={35}>
      {EventComponent && displayedEvent && (
        <EventComponent event={displayedEvent} />
      )}
    </DetailsScreen>
  )
}
