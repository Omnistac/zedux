import { useAtomValue } from '@zedux/react'
import React, { FC } from 'react'
import { stateHub } from '../atoms/stateHub'
import styled from '../simple-styled-components'
import { colors } from '../styles'
import { GridNum, Size } from '../types'
import { getGridColumn, getGridRow, getTemplate } from '../utils/position'

const Positionee = styled.div<{ col: GridNum; row: GridNum }>`
  background: ${colors.bgs[0]};
  color: ${colors.white};
  display: grid;
  grid-template-columns: 3em 1fr;
  grid-template-rows: 3em 1fr;
  grid-column: ${getGridColumn};
  grid-row: ${getGridRow};
  pointer-events: all;
`

const Positioner = styled.div<{ col: GridNum; row: GridNum; size: Size }>`
  ${props => getTemplate(props.row, props.col, props.size)}
  display: grid;
  font-size: ${({ size }) => size + 10}px;
  height: 100%;
  pointer-events: none;
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  z-index: 1000000;
`

export const Position: FC = ({ children }) => {
  const { col, row, size } = useAtomValue(stateHub).position

  return (
    <Positioner col={col} row={row} size={size}>
      <Positionee col={col} row={row}>
        {children}
      </Positionee>
    </Positioner>
  )
}
