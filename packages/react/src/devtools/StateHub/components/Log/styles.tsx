import { useEcosystem } from '@zedux/react'
import React, { ComponentProps, FC, useContext } from 'react'
import { stateHub } from '../../atoms/stateHub'
import { IconButton, IconLog, ListScreenItem } from '../../styles'
import { LogEvent } from '../../types'
import { selectedLogEventIdContext } from '../../atoms/stateHub'
import { logGroup } from '../../utils/logging'

export const Event: FC<
  Pick<ComponentProps<typeof ListScreenItem>, 'importance' | 'preview'> & {
    event: LogEvent
  }
> = ({ event, ...props }) => {
  const ecosystem = useEcosystem()
  const selectedLogEventId = useContext(selectedLogEventIdContext)

  return (
    <ListScreenItem
      {...props}
      actions={
        <IconButton
          onClick={() =>
            logGroup(
              'Event',
              'Type:',
              event.action.type,
              'Payload:',
              event.action.payload
            )
          }
        >
          <IconLog />
        </IconButton>
      }
      isActive={event.id === selectedLogEventId}
      onClick={() =>
        ecosystem.getInstance(stateHub).store.setStateDeep(state => ({
          selectedLogEventId:
            state.selectedLogEventId === event.id ? undefined : event.id,
        }))
      }
    />
  )
}
