import styled from '@zedux/react/ssc'
import React, { ComponentProps, FC } from 'react'
import { SupBadge } from './general'

const StyledButton = styled.button<{ isActive: boolean }>`
  appearance: none;
  background: ${({ isActive, theme }) =>
    isActive ? theme.colors.alphas.primary[3] : theme.colors.alphas.white[0]};
  border: none;
  cursor: pointer;
  display: grid;
  font-size: 1.1em;
  padding: 0;
  place-items: center;
  position: relative;

  &:hover {
    background: ${({ theme }) => theme.colors.alphas.white[2]};
  }
`

export const ControlButton: FC<
  { numSelected: number | undefined } & ComponentProps<typeof StyledButton>
> = ({ children, numSelected, ...buttonProps }) => {
  return (
    <StyledButton {...buttonProps}>
      {children}
      {numSelected ? <SupBadge>{numSelected}</SupBadge> : null}
    </StyledButton>
  )
}

export const ControlGrid = styled.div`
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  grid-template-rows: auto auto;
  row-gap: 0.5em;
`

export const ControlGroup = styled.div`
  display: grid;
  grid-auto-columns: 1fr;
  grid-auto-flow: column;
  grid-template-rows: minmax(0, 1fr);
`

export const ControlList = styled.div`
  display: flex;
  gap: 0.5em;
`

export const ControlSelected = styled.div`
  padding-bottom: 0.5em;
`
