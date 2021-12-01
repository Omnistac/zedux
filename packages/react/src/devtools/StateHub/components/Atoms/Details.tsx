import { useEcosystem } from '@zedux/react'
import styled from '@zedux/react/ssc'
import React, { FC, useRef } from 'react'
import { stateHub } from '../../atoms/stateHub'
import {
  Code,
  DetailsGridWrapper,
  DetailsScreen,
  IconButton,
  IconLog,
  IconX,
  Pre,
} from '../../styles'
import { AtomInstanceSnapshot } from '../../types'
import { logAtomInstance } from '../../utils/logging'

const HeaderGrid = styled.div`
  column-gap: 0.5em;
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
`

const CurrentState = ({ snapshot }: { snapshot: AtomInstanceSnapshot }) => {
  let json = ''

  try {
    json = JSON.stringify(snapshot.state, null, 2)
  } catch (err) {
    return (
      <IconButton
        onClick={() => logAtomInstance(snapshot.instance, snapshot.state)}
      >
        <span>Log State</span> <IconLog />
      </IconButton>
    )
  }

  return <Pre>{json}</Pre>
}

export const Details: FC<{ snapshot?: AtomInstanceSnapshot }> = ({
  snapshot,
}) => {
  const ecosystem = useEcosystem()
  const prevSnapshot = useRef(snapshot)
  if (snapshot) prevSnapshot.current = snapshot

  const displayedSnapshot = snapshot || prevSnapshot.current

  return (
    <DetailsScreen isOpen={!!snapshot} width={50}>
      {displayedSnapshot ? (
        <DetailsGridWrapper>
          <HeaderGrid>
            <Pre>{displayedSnapshot.instance.keyHash}</Pre>
            <IconButton
              onClick={() =>
                ecosystem.getInstance(stateHub).store.setStateDeep({
                  selectedAtomInstanceKeyHash: undefined,
                })
              }
            >
              <IconX />
            </IconButton>
          </HeaderGrid>
          <div>
            Active State: <Code>{displayedSnapshot.activeState}</Code>
          </div>
          <div>
            <CurrentState snapshot={displayedSnapshot} />
          </div>
        </DetailsGridWrapper>
      ) : null}
    </DetailsScreen>
  )
}
