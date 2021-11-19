import { useAtomState, useAtomValue } from '@zedux/react'
import React from 'react'
import styled from '../../simple-styled-components'
import { GridProps, Size } from '../../types'
import { colors } from '../../styles'
import { getIsTall, getIsWide } from '../../utils/position'
import { stateHub, StateHubState } from '../../atoms/stateHub'

const getHeight = (props: StateHubState['position']) => {
  const isTall = getIsTall(props)
  return isTall ? '3em' : `${(props.size + 1) * 0.5}em`
}

const getWidth = (props: StateHubState['position']) => {
  const isWide = getIsWide(props)
  return isWide ? '3em' : `${(props.size + 1) * 0.5}em`
}

const gridMap = {
  0: 'start',
  1: 'center',
  2: 'end',
}

const sizes = Array(6)
  .fill(0)
  .map((_, i) => i as Size)

const Grid = styled.div<GridProps>`
  align-items: ${({ row }) => gridMap[row]};
  display: grid;
  grid-template-columns: 1fr;
  grid-template-rows: 1fr;
  justify-items: ${({ col }) => gridMap[col]};
`

const SizeControl = styled.input<StateHubState['position']>`
  appearance: none;
  background: ${colors.alphas.white[0]};
  border: none;
  border-radius: 0;
  cursor: pointer;
  font-size: inherit;
  grid-column: 1;
  grid-row: 1;
  height: ${getHeight};
  outline: none;
  margin: 0;
  padding: 0;
  width: ${getWidth};

  &:hover {
    background: ${colors.alphas.white[2]};
  }

  &:checked {
    background: ${colors.alphas.main[4]};
  }
`

const SizeWrapper = ({ size }: { size: Size }) => {
  const [
    {
      position: { col, row, size: activeSize },
    },
    setState,
  ] = useAtomState(stateHub)
  const isChecked = size === activeSize

  return (
    <SizeControl
      checked={isChecked}
      col={col}
      name="zedux-state-hub-select-size"
      onChange={() => {
        setState(state => ({ ...state, position: { ...state.position, size } }))
      }}
      row={row}
      size={size}
      type="radio"
    />
  )
}

export const SizeControls = () => {
  const { col, row } = useAtomValue(stateHub).position

  return (
    <Grid col={col} row={row}>
      {sizes.map(size => (
        <SizeWrapper key={5 - size} size={(5 - size) as Size} />
      ))}
    </Grid>
  )
}
