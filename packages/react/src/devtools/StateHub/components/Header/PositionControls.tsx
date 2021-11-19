import { useAtomState } from '@zedux/react'
import React from 'react'
import { stateHub } from '../../atoms/stateHub'
import styled from '../../simple-styled-components'
import { colors } from '../../styles'
import { GridNum, GridProps, Pos } from '../../types'
import { getGridColumn, getGridRow } from '../../utils/position'

const positionMap: Record<Pos, [GridNum, GridNum]> = {
  topLeft: [0, 0],
  top: [0, 1],
  topRight: [0, 2],
  left: [1, 0],
  center: [1, 1],
  right: [1, 2],
  bottomLeft: [2, 0],
  bottom: [2, 1],
  bottomRight: [2, 2],
}

const Grid = styled.div`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  grid-template-rows: repeat(3, 1fr);
`

const PositionControl = styled.input`
  appearance: none;
  background: ${colors.alphas.white[0]};
  border: none;
  border-radius: 0;
  cursor: pointer;
  font-size: inherit;
  grid-column: 1 / span 3;
  grid-row: 1 / span 3;
  margin: 0;
  outline: none;
  padding: 0;
  width: 100%;

  &:hover {
    background: ${colors.alphas.white[2]};
  }

  &:checked {
    background: ${colors.alphas.main[3]};
  }
`

const PositionWrapper = styled.div<GridProps>`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  grid-template-rows: repeat(3, 1fr);
  width: 1em;

  &::before {
    background: ${colors.alphas.white[4]};
    content: '';
    grid-column: ${getGridColumn};
    grid-row: ${getGridRow};
  }
`

const Position = ({ position }: { position: Pos }) => {
  const [
    {
      position: { col, row },
    },
    setState,
  ] = useAtomState(stateHub)
  const [mappedRow, mappedCol] = positionMap[position]
  const isChecked = mappedRow === row && mappedCol === col

  return (
    <PositionWrapper col={mappedCol} row={mappedRow}>
      <PositionControl
        checked={isChecked}
        name="zedux-state-hub-select-position"
        onChange={() => {
          setState(state => ({
            ...state,
            position: { ...state.position, col: mappedCol, row: mappedRow },
          }))
        }}
        type="radio"
      />
    </PositionWrapper>
  )
}

export const PositionControls = () => {
  return (
    <Grid>
      {Object.keys(positionMap).map(position => (
        <Position key={position} position={position as Pos} />
      ))}
    </Grid>
  )
}
