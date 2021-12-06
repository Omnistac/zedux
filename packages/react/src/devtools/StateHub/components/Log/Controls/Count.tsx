import { useAtomSelector } from '@zedux/react'
import styled from '@zedux/react/ssc'
import React from 'react'
import { getLogLength } from '../../../atoms/ecosystemWrapper'
import { getLogLimit } from '../../../atoms/stateHub'
import { Route } from '../../../types'
import { SettingsLink } from '../../SettingsLink'

const Wrapper = styled.div`
  align-self: center;
  flex: 1;
  text-align: right;
`

export const Count = () => {
  const count = useAtomSelector(getLogLength)
  const limit = useAtomSelector(getLogLimit)

  return (
    <Wrapper>
      {count} /{' '}
      <SettingsLink
        to={state => ({
          ecosystemConfig: {
            [state.ecosystemId]: {
              route: Route.Settings,
            },
          },
        })}
      >
        {limit}
      </SettingsLink>
    </Wrapper>
  )
}
