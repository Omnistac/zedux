import { useAtomState, useAtomValue } from '@zedux/react'
import React, { useMemo } from 'react'
import { ecosystems } from '../../atoms/ecosystems'
import { stateHub } from '../../atoms/stateHub'
import { Select } from '../../styles'

export const EcosystemSelector = () => {
  const [{ ecosystemId }, setState] = useAtomState(stateHub)
  const ecosystemIds = useAtomValue(ecosystems)

  const options = useMemo(
    () =>
      ecosystemIds.reduce((obj, id) => {
        obj[id] = id
        return obj
      }, {} as Record<string, string>),
    [ecosystemIds]
  )

  return (
    <Select
      onSelect={id => {
        setState(state =>
          id === state.ecosystemId ? state : { ...state, ecosystemId: id }
        )
      }}
      options={options}
      selected={ecosystemId}
      width="13em"
    />
  )
}
