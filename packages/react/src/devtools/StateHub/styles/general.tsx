import { DependentEdge, EdgeFlag } from '@zedux/react'
import styled from '@zedux/react/ssc'
import React, { FC } from 'react'

export const alphas = ['0.04', '0.07', '0.15', '0.25', '0.4', '0.7']
export const bgs = [
  '#0c1f30',
  '#0a142e',
  '#240e15',
  '#261709',
  '#0c2823',
  '#222222',
]
export const fgs = [
  '#ffd6b9',
  '#ffb9d6',
  '#d6ffb9',
  '#d6b9ff',
  '#b9ffd6',
  '#b9d6ff',
]

let seed = Math.floor(Math.random() * fgs.length)
const randomColor = (colors: string[]) => colors[seed++ % colors.length]

export const defaultColors = {
  background: randomColor(bgs),
  primary: randomColor(fgs),
  secondary: randomColor(fgs),
}

export const hexToAlpha = (str: string, alpha: number | string) => {
  const rgb = str
    .slice(1)
    .replace(/\w{2}/g, match => `${parseInt(match, 16)}, `)

  return `rgba(${rgb}${alpha})`
}

export const Badge = styled.span<{
  variant?: 0 | 1 | 2 | 3 | 4 | 5 | 'primary' | 'secondary'
}>`
  background: ${({ theme, variant = 'primary' }) =>
    typeof variant === 'string'
      ? theme.colors[variant]
      : theme.colors.fgs[variant]};
  border-radius: 4px;
  color: #555;
  font-size: 0.9em;
  padding: 1px 3px;
  white-space: nowrap;
`

export const Code = styled.code`
  background: ${({ theme }) => theme.colors.alphas.white[0]};
  color: ${({ theme }) => theme.colors.white};
  font-family: ${({ theme }) => theme.fonts.monospace};
  padding: 1px 3px;
`

export const DetailsGridWrapper = styled.div`
  align-content: start;
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  row-gap: 0.5em;
`

export const DetailsScreen = styled.div<{ isOpen: boolean; width: number }>`
  border-left: 1px solid ${({ theme }) => theme.colors.primary};
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  margin-right: ${({ isOpen, width }) => (isOpen ? '0' : `-${width}%`)};
  overflow: auto;
  padding: ${({ isOpen }) => (isOpen ? '0.5em' : '0.5em 0')};
  transition: border 0.15s, margin 0.15s, padding 0.15s;
  width: ${({ width }) => width}%;
`

export const EdgeBadges: FC<{ edge: DependentEdge }> = ({ edge }) => {
  return (
    <>
      {!(edge.flags & EdgeFlag.Explicit) && <Badge variant="primary">implicit</Badge>}
      {edge.flags & EdgeFlag.Explicit && <Badge variant="secondary">explicit</Badge>}
      {!(edge.flags & EdgeFlag.External) && (
        <Badge variant="primary">internal</Badge>
      )}
      {edge.flags & EdgeFlag.External && (
        <Badge variant="secondary">external</Badge>
      )}
      {!(edge.flags & EdgeFlag.Static) && <Badge variant="primary">dynamic</Badge>}
      {edge.flags & EdgeFlag.Static && <Badge variant="secondary">static</Badge>}
    </>
  )
}

export const GridStretch = styled.div`
  display: grid;
`

export const ListScreen = styled.div`
  display: grid;
  flex: 1;
  grid-template-rows: auto minmax(0, 1fr);
  padding: 0.5em;
`

export const Pre = styled.pre`
  background: ${({ theme }) => theme.colors.alphas.white[1]};
  font-family: ${({ theme }) => theme.fonts.monospace};
  margin: 0;
  overflow: auto;
  padding: 0.5em;
`

export const PreviewText = styled.span`
  color: #888;
  font-size: 0.8em;
`

export const SplitScreen = styled.div`
  display: flex;
  flex-flow: row nowrap;
  overflow: hidden;
`

export const SupBadge = styled.span`
  background: ${({ theme }) => theme.colors.secondary};
  border-radius: 1em;
  color: #555;
  display: grid;
  font-size: 0.8em;
  height: 1.1em;
  place-items: center;
  pointer-events: none;
  position: absolute;
  right: -0.2em;
  top: -0.2em;
  width: calc(1.1em + 1px); // for some reason this looks better usually
  z-index: 1;
`

export const Title = styled.span`
  white-space: nowrap;
`
