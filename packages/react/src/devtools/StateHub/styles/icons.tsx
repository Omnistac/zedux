import styled, { css } from '@zedux/react/ssc'
import React, { ComponentType, FC } from 'react'
import {
  AtomIcon,
  AtomInstanceIcon,
  ClearIcon,
  CycleIcon,
  EdgeIcon,
  ExpandIcon,
  FilterIcon,
  FlagIcon,
  GearIcon,
  GraphIcon,
  KeyIcon,
  ListIcon,
  LogIcon,
  RemoveItemIcon,
  WorldIcon,
  XIcon,
} from './icons-raw'

const DoubleIconGrid = styled.span<{ inverted?: boolean }>`
  background: ${({ inverted, theme }) =>
    inverted ? theme.colors.primary : theme.colors.background};
  color: ${({ theme }) => theme.colors.white};
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  grid-template-rows: repeat(4, 1fr);
  padding: 0.3em;
`

const DoubleIconOne = styled.span`
  grid-column: 1 / span 3;
  grid-row: 1 / span 3;
  height: 1em;
  width: 1em;
`

const DoubleIconTwo = styled.span<{ inverted?: boolean }>`
  filter: ${({ inverted, theme }) =>
    Array(3)
      .fill(
        `drop-shadow(0 0 1px ${
          inverted ? theme.colors.primary : theme.colors.background
        })`
      )
      .join(' ')};
  grid-column: 2 / span 3;
  grid-row: 2 / span 3;
  height: 1.1em;
  width: 1.1em;
`

export const DoubleIcon: FC<{
  iconOne: ComponentType<{ inverted?: boolean }>
  iconTwo: ComponentType<{ inverted?: boolean }>
  inverted?: boolean
}> = ({ iconOne: IconOne, iconTwo: IconTwo, inverted }) => {
  return (
    <DoubleIconGrid inverted={inverted}>
      <DoubleIconOne>
        <IconOne inverted={inverted} />
      </DoubleIconOne>
      <DoubleIconTwo inverted={inverted}>
        <IconTwo inverted={inverted} />
      </DoubleIconTwo>
    </DoubleIconGrid>
  )
}

export const IconButton = styled.button<{ hasBg?: boolean; padding?: number }>`
  align-items: center;
  appearance: none;
  background: ${({ hasBg, theme }) =>
    hasBg ? theme.colors.alphas.white[1] : 'none'};
  border: none;
  color: inherit;
  column-gap: 0.5em;
  cursor: pointer;
  display: grid;
  font-size: inherit;
  grid-auto-flow: column;
  justify-content: center;
  padding: ${({ padding = 0 }) => padding}em;

  &:hover {
    background: ${({ hasBg, theme }) =>
      theme.colors.alphas.white[hasBg ? 2 : 1]};
  }
`

const iconStyles = css<{ inverted?: boolean; size?: number }>`
  color: ${({ inverted, theme }) =>
    inverted ? theme.colors.background : theme.colors.primary};
  ${({ size }) =>
    size &&
    css`
      font-size: ${size}em;
    `}
`

export const IconAtom = styled(AtomIcon)`
  ${iconStyles}
`

export const IconAtomInstance = styled(AtomInstanceIcon)`
  ${iconStyles}
`

export const IconClear = styled(ClearIcon)`
  ${iconStyles}

  & > path {
    stroke: ${({ theme }) => theme.colors.primary};
  }
`

export const IconCycle = styled(CycleIcon)`
  ${iconStyles}

  & > path {
    stroke: ${({ theme }) => theme.colors.primary};
  }
`

export const IconEdge = styled(EdgeIcon)`
  ${iconStyles}
`

export const IconExpand = styled(ExpandIcon)`
  ${iconStyles}
`

export const IconFilter = styled(FilterIcon)`
  ${iconStyles}
`

export const IconFlag = styled(FlagIcon)`
  ${iconStyles}
`

export const IconGear = styled(GearIcon)`
  ${iconStyles}
`

export const IconGraph = styled(GraphIcon)`
  ${iconStyles}
`

export const IconKey = styled(KeyIcon)`
  ${iconStyles}
`

export const IconList = styled(ListIcon)`
  ${iconStyles}
`

export const IconLog = styled(LogIcon)`
  ${iconStyles}
`

export const IconRemoveItem = styled(RemoveItemIcon)`
  ${iconStyles}
`

export const IconWorld = styled(WorldIcon)`
  ${iconStyles}
`

export const IconX = styled(XIcon)`
  ${iconStyles}
`
