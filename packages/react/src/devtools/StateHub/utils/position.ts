import { GridNum, GridProps, Size } from '../types'
import { css } from '@zedux/react/ssc'

const minHeight = 244
const minWidth = 324

const sizeMap: Record<Size, number> = {
  0: 0.8,
  1: 1.3,
  2: 2.5,
  3: 7,
  4: 16,
  5: 1, // 5 is full screen anyway
}

export const getGridColumn = (props: GridProps) => {
  const isWide = getIsWide(props)

  return isWide ? '1 / span 3' : `${props.col + 1} / span 1`
}

export const getGridRow = (props: GridProps) => {
  const isTall = getIsTall(props)

  return isTall ? '1 / span 3' : `${props.row + 1} / span 1`
}

export const getIsWide = ({ col, row }: GridProps) =>
  (row === 0 && col === 1) || (row === 2 && col === 1)

export const getIsTall = ({ col, row }: GridProps) =>
  row === 1 && (col === 0 || col === 2)

export const getTemplate = (row: GridNum, col: GridNum, size: Size) => {
  const fillStr = size === 5 ? '0' : '1fr'
  const rows = Array(3).fill(fillStr)
  const cols = Array(3).fill(fillStr)
  const isTall = size === 5 ? false : getIsTall({ col, row })
  const isWide = size === 5 ? false : getIsWide({ col, row })
  const mappedSize = sizeMap[size]

  cols[col] = isTall
    ? `minmax(${minWidth}px, ${mappedSize - 0.4}fr)`
    : `minmax(${minWidth}px, ${mappedSize}fr)`

  rows[row] = isWide
    ? `minmax(${minHeight}px, ${mappedSize - 0.4}fr)`
    : `minmax(${minHeight}px, ${mappedSize}fr)`

  return css`
    grid-template-columns: ${cols.join(' ')};
    grid-template-rows: ${rows.join(' ')};
  `
}
