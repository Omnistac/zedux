import { useAtomInstance, useAtomSelector, useAtomValue } from '@zedux/react'
import React, { FC, useLayoutEffect } from 'react'
import { rect } from '../atoms/rect'
import { getIsOpen, getPosition, stateHub } from '../atoms/stateHub'
import styled from '@zedux/react/ssc'
import { GridNum, Size } from '../types'
import { getGridColumn, getGridRow, getTemplate } from '../utils/position'

const Positionee = styled.div<{ col: GridNum; row: GridNum }>`
  background: ${({ theme }) => theme.colors.background};
  color: ${({ theme }) => theme.colors.white};
  display: grid;
  grid-template-columns: 3em minmax(0, 1fr);
  grid-template-rows: 3em minmax(0, 1fr);
  grid-column: ${getGridColumn};
  grid-row: ${getGridRow};
  pointer-events: all;
`

const Positioner = styled.div<{ col: GridNum; row: GridNum; size: Size }>`
  ${props => getTemplate(props.row, props.col, props.size)}
  display: grid;
  font-family: Arial, Helvetica, sans-serif;
  font-size: ${({ size }) => size + 10}px;
  height: 100%;
  line-height: 1.3;
  pointer-events: none;
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  z-index: 1000000;

  & *::-webkit-scrollbar {
    height: 0.8em;
    width: 0.8em;
  }

  & *::-webkit-scrollbar-track {
    background: ${({ theme }) => theme.colors.alphas.white[1]};
  }

  & *::-webkit-scrollbar-thumb {
    background: ${({ theme }) => theme.colors.alphas.secondary[3]};
  }
`

export const Position: FC = ({ children }) => {
  const position = useAtomSelector(getPosition)
  const isOpen = useAtomSelector(getIsOpen)
  const { positioneeRef, recalculate } = useAtomInstance(rect).exports
  const stateHubInstance = useAtomInstance(stateHub)
  const { col, row, size } = position

  useLayoutEffect(() => {
    const keydownListener = (event: KeyboardEvent) => {
      if (!event.ctrlKey || event.key !== ' ') return

      stateHubInstance.store.setStateDeep(state => ({
        isOpen: !state.isOpen,
      }))
    }

    document.addEventListener('keydown', keydownListener, { capture: true })
    window.addEventListener('resize', recalculate)

    return () => {
      document.removeEventListener('keydown', keydownListener)
      window.removeEventListener('resize', recalculate)
    }
  }, [])

  useLayoutEffect(() => {
    if (isOpen) recalculate()
  }, [isOpen, position])

  if (!isOpen) return null

  return (
    <Positioner col={col} row={row} size={size}>
      <Positionee col={col} ref={positioneeRef} row={row}>
        {children}
      </Positionee>
    </Positioner>
  )
}
