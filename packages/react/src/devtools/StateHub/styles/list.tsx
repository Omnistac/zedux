import styled, { css } from '@zedux/react/ssc'
import React, { FC, ReactElement } from 'react'
import { Importance } from '../types'

const importanceColorMap = {
  [Importance.High]: '#f88',
  [Importance.Medium]: '#d97',
  [Importance.Low]: '#976',
  [Importance.Dirt]: '#555',
}

const Actions = styled.div`
  display: grid;
  font-size: 1.2em;
  grid-auto-columns: 1.7em;
  grid-auto-flow: column;
`

const ListItemWrapper = styled('li')<{ isActive: boolean }>`
  display: grid;
  display: grid;
  font-size: 0.9em;
  grid-template-columns: 1fr auto;
  grid-template-rows: 2em;

  ${({ isActive }) =>
    isActive
      ? css`
          background: ${({ theme }) => theme.colors.alphas.primary[2]};
          grid-template-rows: 3em;
        `
      : css`
          background: ${({ theme }) => theme.colors.alphas.white[0]};
          grid-template-rows: 2em;

          &:nth-of-type(2n) {
            background: ${({ theme }) => theme.colors.alphas.white[1]};
          }
        `}
`

const PreviewTextWrapper = styled.div<{ importance?: Importance }>`
  align-items: center;
  border-left: 3px solid
    ${({ importance }) =>
      importance ? importanceColorMap[importance] : 'transparent'};
  column-gap: 0.5em;
  cursor: pointer;
  display: grid;
  grid-auto-flow: column;
  justify-content: start;
  overflow: hidden;
  padding: 0 0.5em;
  text-overflow: ellipsis;
  white-space: nowrap;

  &:hover {
    background: ${({ theme }) => theme.colors.alphas.white[2]};
  }
`

export const ListScreenItem: FC<{
  actions: ReactElement
  importance?: Importance
  isActive: boolean
  onClick: () => void
  preview: ReactElement
}> = ({ actions, importance, isActive, onClick, preview }) => {
  return (
    <ListItemWrapper isActive={isActive}>
      <PreviewTextWrapper importance={importance} onClick={onClick}>
        {preview}
      </PreviewTextWrapper>
      <Actions>{actions}</Actions>
    </ListItemWrapper>
  )
}

export const ListScreenList = styled('ul')`
  display: flex;
  flex-flow: column nowrap;
  grid-column: 1;
  list-style: none;
  margin: 0;
  overflow: auto;
  padding: 0;
`
