import { useAtomSelector, useAtomValue } from '@zedux/react'
import styled from '@zedux/react/ssc'
import React from 'react'
import { BsChevronLeft } from 'react-icons/bs'
import { BsChevronRight } from 'react-icons/bs'
import { getStateHubHistoryInstance } from '../../atoms/history'

const BackIcon = styled(BsChevronLeft)``

const Button = styled.button`
  align-items: center;
  appearance: none;
  background: none;
  border: none;
  color: ${({ theme }) => theme.colors.primary};
  cursor: pointer;
  display: grid;
  justify-content: center;
  padding: 0;

  &:disabled {
    color: ${({ theme }) => theme.colors.alphas.primary[4]};
    cursor: default;
    transform: scale(0.9);
  }

  &:not(:disabled):hover {
    background: ${({ theme }) => theme.colors.alphas.white[1]};
  }
`

const ForwardIcon = styled(BsChevronRight)``

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
        <BackIcon />
      </Button>
      <Button disabled={!canGoForward()} onClick={forward}>
        <ForwardIcon />
      </Button>
    </Grid>
  )
}
