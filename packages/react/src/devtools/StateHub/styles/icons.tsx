import styled, { css, StylerProps } from '@zedux/react/ssc'
import React, { ComponentType, FC } from 'react'
import { rawIcons } from './icons-raw'

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
  grid-auto-columns: minmax(0, auto);
  grid-auto-flow: column;
  justify-content: center;
  overflow: hidden;
  padding: ${({ padding = 0 }) => padding}em;
  white-space: nowrap;

  &:hover {
    background: ${({ hasBg, theme }) =>
      theme.colors.alphas.white[hasBg ? 2 : 1]};
  }

  & > span {
    overflow: hidden;
    text-overflow: ellipsis;
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

  & > path {
    stroke: ${({ inverted, theme }) =>
      inverted ? theme.colors.background : theme.colors.primary};
  }
`

export const styledIcons = Object.entries(rawIcons).reduce(
  (obj, [key, Icon]) => {
    obj[key as keyof typeof rawIcons] = styled(Icon)`
      ${iconStyles}
    ` as any
    return obj
  },
  {} as Record<
    keyof typeof rawIcons,
    FC<StylerProps & { inverted?: boolean; size?: number }>
  >
)
