import { useAtomValue } from '@zedux/react'
import React from 'react'
import { BsChevronExpand } from 'react-icons/bs'
import { stateHub } from '../atoms/stateHub'
import styled from '../simple-styled-components'
import { colors } from '../styles'

const Control = styled.button`
  align-items: center;
  appearance: none;
  background: ${colors.alphas.main[1]};
  border: none;
  color: ${colors.white};
  cursor: pointer;
  display: flex;
  flex-flow: row nowrap;
  font-size: inherit;
  height: 100%;
  overflow: hidden;
  padding: 0 0.5em;
  text-overflow: ellipsis;
  width: 8em;

  &:hover {
    background: ${colors.alphas.main[2]};
  }
`

const Text = styled.span`
  flex: 1;
`

const Wrapper = styled.div`
  display: grid;
  grid-template-columns: 1fr;
`

export const EcosystemSelector = () => {
  const { ecosystem } = useAtomValue(stateHub)

  return (
    <Wrapper>
      <Control>
        <Text>{ecosystem}</Text>
        <BsChevronExpand />
      </Control>
    </Wrapper>
  )
}
