import { useAtomSelector, useAtomValue } from '@zedux/react'
import styled from '@zedux/react/ssc'
import React from 'react'
import { getStateHubHistoryInstance } from '../../atoms/history'

const Button = styled.button`
  appearance: none;
  background: none;
  border: none;
  color: ${({ theme }) => theme.colors.primary};
  cursor: pointer;
  display: grid;
  padding: 0;
  place-items: center;

  &:disabled {
    color: ${({ theme }) => theme.colors.alphas.primary[4]};
    cursor: default;
    transform: scale(0.9);
  }

  &:not(:disabled):hover {
    background: ${({ theme }) => theme.colors.alphas.white[1]};
  }
`

const Grid = styled.div`
  display: grid;
  grid-template-columns: 1.5em 1.5em;
  grid-template-rows: 1fr;
`

export const HistoryControls = () => {
  const historyInstance = useAtomSelector(getStateHubHistoryInstance)
  useAtomValue(historyInstance) // make edge dynamic

  const { back, canGoBack, canGoForward, forward } = historyInstance.exports

  return (
    <Grid>
      <Button disabled={!canGoBack()} onClick={back}>
        <span>&lt;</span>
      </Button>
      <Button disabled={!canGoForward()} onClick={forward}>
        <span>&gt;</span>
      </Button>
    </Grid>
  )
}
