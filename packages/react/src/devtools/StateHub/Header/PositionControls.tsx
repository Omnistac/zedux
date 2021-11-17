import { useAtomInstance, useAtomValue } from '@zedux/react'
import React from 'react'
import styled from 'styled-components'
import { positionAtom } from '../atoms/position'
import { whiteAlphas } from '../styles'
import { GridNum } from '../types'

const positionMap: Record<string, [GridNum, GridNum]> = {
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
  background: ${whiteAlphas[0]};
  border: none;
  border-radius: 0;
  cursor: pointer;
  font-size: inherit;
  margin: 0;
  outline: none;
  padding: 0;
  width: 1em;

  &:hover {
    background: ${whiteAlphas[1]};
  }

  &:checked {
    background: ${whiteAlphas[2]};
  }
`

const Position = ({ position }: { position: keyof typeof positionMap }) => {
  const { col, row } = useAtomValue(positionAtom)
  const { setCol, setRow } = useAtomInstance(positionAtom).exports
  const [mappedRow, mappedCol] = positionMap[position]
  const isChecked = mappedRow === row && mappedCol === col

  return (
    <PositionControl
      checked={isChecked}
      name="zedux-state-hub-select-position"
      onChange={({ currentTarget }) => {
        if (!currentTarget.checked) return

        setCol(mappedCol)
        setRow(mappedRow)
      }}
      type="radio"
    />
  )
}

export const PositionControls = () => {
  return (
    <Grid>
      {Object.keys(positionMap).map(position => (
        <Position key={position} position={position} />
      ))}
    </Grid>
  )
}
