import { useEcosystem } from '@zedux/react'
import React, { ComponentProps, FC, useContext } from 'react'
import { stateHub } from '../../atoms/stateHub'
import { IconButton, ListScreenItem, styledIcons } from '../../styles'
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
              `"${event.action.type}" Event`,
              'Payload:',
              event.action.payload
            )
          }
        >
          <styledIcons.Log />
        </IconButton>
      }
      isActive={event.id === selectedLogEventId}
      onClick={() =>
        ecosystem
          .getInstance(stateHub)
          .exports.setSelectedLogEvent(id =>
            id === event.id ? undefined : event.id
          )
      }
    />
  )
}
