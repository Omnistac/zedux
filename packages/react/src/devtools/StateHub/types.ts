export type GridNum = 0 | 1 | 2

export interface GridProps {
  col: GridNum
  row: GridNum
}

export type Pos =
  | 'topLeft'
  | 'top'
  | 'topRight'
  | 'left'
  | 'center'
  | 'right'
  | 'bottomLeft'
  | 'bottom'
  | 'bottomRight'

export type Size = 0 | 1 | 2 | 3 | 4 | 5
