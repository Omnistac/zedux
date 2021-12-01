import { DependentEdge } from '@zedux/react'
import styled from '@zedux/react/ssc'
import React, { FC } from 'react'

export const alphas = ['0.04', '0.07', '0.15', '0.25', '0.4', '0.7']

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

export const Code = styled('code')`
  background: ${({ theme }) => theme.colors.alphas.white[0]};
  color: ${({ theme }) => theme.colors.white};
  padding: 1px 3px;
`

export const DetailsGridWrapper = styled.div`
  align-content: start;
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  row-gap: 1em;
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
      {!edge.isExplicit && <Badge variant="primary">implicit</Badge>}
      {edge.isExplicit && <Badge variant="secondary">explicit</Badge>}
      {(!edge.isExternal || edge.isAtomSelector) && (
        <Badge variant="primary">internal</Badge>
      )}
      {edge.isExternal && !edge.isAtomSelector && (
        <Badge variant="secondary">external</Badge>
      )}
      {!edge.isStatic && <Badge variant="primary">dynamic</Badge>}
      {edge.isStatic && <Badge variant="secondary">static</Badge>}
    </>
  )
}

export const ListScreen = styled.div`
  display: grid;
  flex: 1;
  grid-template-rows: auto minmax(0, 1fr);
  padding: 0.5em;
`

export const Pre = styled('pre')`
  background: ${({ theme }) => theme.colors.alphas.white[1]};
  margin: 0;
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
  align-items: center;
  background: ${({ theme }) => theme.colors.secondary};
  border-radius: 1em;
  color: #555;
  display: grid;
  font-size: 0.8em;
  height: 1.1em;
  justify-items: center;
  pointer-events: none;
  position: absolute;
  right: -0.2em;
  top: -0.2em;
  width: 1.2em;
  z-index: 1;
`

export const Title = styled.span`
  white-space: nowrap;
`
