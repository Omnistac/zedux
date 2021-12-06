import { useAtomInstance, useAtomSelector, useEcosystem } from '@zedux/react'
import styled from '@zedux/react/ssc'
import React, { FC, useRef } from 'react'
import { getLoggingMode, stateHub } from '../../atoms/stateHub'
import {
  Checkbox,
  Code,
  DetailsGridWrapper,
  DetailsScreen,
  IconButton,
  IconList,
  IconLog,
  IconX,
  Pre,
} from '../../styles'
import {
  AtomInstanceSnapshot,
  GlobalFilter,
  RectType,
  Route,
} from '../../types'
import { logAtomInstance } from '../../utils/logging'
import { SettingsButton } from '../SettingsLink'

const ActionsGrid = styled.div`
  display: grid;
  grid-gap: 0.5em;
  grid-template-columns: ${({ theme }) =>
    theme.width < RectType.Lg
      ? 'repeat(2, minmax(0, 1fr))'
      : 'repeat(3, minmax(0, 1fr))'};
`

const Faded = styled.span`
  color: #888;
`

const HeaderGrid = styled.div`
  align-items: center;
  column-gap: 0.5em;
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
`

const CurrentState = ({ snapshot }: { snapshot: AtomInstanceSnapshot }) => {
  let json = ''

  try {
    const start = Date.now()

    json = JSON.stringify(
      snapshot.state,
      (_, param) => {
        // limit the thread-blockage to 30 milliseconds
        if (Date.now() - start > 30) throw 'too long'
        return param
      },
      2
    )

    if (json?.length > 2000) throw 'too long'
  } catch (err) {
    return <Faded>(state couldn&apos;t be stringified)</Faded>
  }

  return <Pre>{json || 'undefined'}</Pre>
}

export const Details: FC<{ snapshot?: AtomInstanceSnapshot }> = ({
  snapshot,
}) => {
  const ecosystem = useEcosystem()
  const prevSnapshot = useRef(snapshot)
  if (snapshot) prevSnapshot.current = snapshot

  const displayedSnapshot = snapshot || prevSnapshot.current
  const { setLoggingMode } = useAtomInstance(stateHub).exports
  const loggingMode = useAtomSelector(
    getLoggingMode,
    displayedSnapshot?.instance.keyHash
  )

  return (
    <DetailsScreen isOpen={!!snapshot} width={50}>
      {displayedSnapshot ? (
        <DetailsGridWrapper>
          <HeaderGrid>
            <Pre>{displayedSnapshot.instance.keyHash}</Pre>
            <IconButton
              onClick={() =>
                ecosystem
                  .getInstance(stateHub)
                  .exports.setSelectedAtomInstance()
              }
              padding={0.5}
            >
              <IconX size={1.3} />
            </IconButton>
          </HeaderGrid>
          <div>
            Active State: <Code>{displayedSnapshot.activeState}</Code>
          </div>
          <ActionsGrid>
            <IconButton
              hasBg
              onClick={() =>
                logAtomInstance(
                  displayedSnapshot.instance,
                  displayedSnapshot.state
                )
              }
              padding={0.7}
            >
              <span>Log State</span>
              <IconLog />
            </IconButton>
            <SettingsButton
              hasBg
              to={state => ({
                ecosystemConfig: {
                  [state.ecosystemId]: {
                    route: Route.Log,
                    filters: {
                      [GlobalFilter.AtomInstance]: [
                        displayedSnapshot.instance.keyHash,
                      ],
                    },
                  },
                },
              })}
              padding={0.7}
            >
              <span>Monitor</span>
              <IconList />
            </SettingsButton>
            <Checkbox
              isChecked={typeof loggingMode !== 'undefined'}
              onChange={isChecked => {
                setLoggingMode(
                  displayedSnapshot.instance.keyHash,
                  isChecked ? 'expanded-minimal' : undefined
                )
              }}
              textOn="Logging On"
              textOff="Logging Off"
            />
          </ActionsGrid>
          <div>
            <CurrentState snapshot={displayedSnapshot} />
          </div>
        </DetailsGridWrapper>
      ) : null}
    </DetailsScreen>
  )
}
