import { useAtomValue } from '@zedux/react'
import React, { FC } from 'react'
import styled, { css } from 'styled-components'
import { positionAtom } from './atoms/position'
import { white } from './styles'
import { GridNum, Size } from './types'

const sizeMap: Record<Size, number> = {
  0: 0.8,
  1: 1.3,
  2: 2.5,
  3: 7,
  4: 16,
  5: 1, // 5 is full screen anyway
}

interface GridProps {
  col: GridNum
  row: GridNum
}

const getGridColumn = (props: GridProps) => {
  const isWide = getIsWide(props)

  return isWide ? `1 / span 3` : `${props.col + 1} / span 1`
}

const getGridRow = (props: GridProps) => {
  const isTall = getIsTall(props)

  return isTall ? `1 / span 3` : `${props.row + 1} / span 1`
}

const getIsWide = ({ col, row }: GridProps) =>
  (row === 0 && col === 1) || (row === 2 && col === 1)

const getIsTall = ({ col, row }: GridProps) =>
  row === 1 && (col === 0 || col === 2)

const getTemplate = (row: GridNum, col: GridNum, size: Size) => {
  const fillStr = size === 5 ? '0' : '1fr'
  const rows = Array(3).fill(fillStr)
  const cols = Array(3).fill(fillStr)
  const sizeStr = `${sizeMap[size]}fr`

  rows[row] = sizeStr
  cols[col] = sizeStr

  return css`
    grid-template-columns: ${cols.join(' ')};
    grid-template-rows: ${rows.join(' ')};
  `
}

const Positionee = styled.div<{ col: GridNum; row: GridNum }>`
  background: #0a142e;
  color: ${white};
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
  const { col, row, size } = useAtomValue(positionAtom)

  return (
    <Positioner col={col} row={row} size={size}>
      <Positionee col={col} row={row}>
        {children}
      </Positionee>
    </Positioner>
  )
}
