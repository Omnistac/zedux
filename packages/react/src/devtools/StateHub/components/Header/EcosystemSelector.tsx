import { useAtomState, useAtomValue } from '@zedux/react'
import React, { useState } from 'react'
import { BsChevronExpand } from 'react-icons/bs'
import { ecosystems } from '../../atoms/ecosystems'
import { stateHub } from '../../atoms/stateHub'
import styled, { css } from '@zedux/react/ssc'

const Backdrop = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  height: 100%;
  width: 100%;
`

const Control = styled.button`
  align-items: center;
  appearance: none;
  background: ${({ theme }) => theme.colors.alphas.primary[1]};
  border: none;
  color: ${({ theme }) => theme.colors.white};
  cursor: pointer;
  display: flex;
  flex-flow: row nowrap;
  font-size: inherit;
  grid-column: 1;
  grid-row: 1;
  height: 100%;
  max-width: 13em;
  padding: 0 0.5em;

  &:hover {
    background: ${({ theme }) => theme.colors.alphas.primary[2]};
  }
`

const Item = styled.button<{ isActive: boolean }>`
  appearance: none;
  border: none;
  color: ${({ theme }) => theme.colors.white};
  cursor: pointer;
  display: block;
  font-size: inherit;
  padding: 0.5em;
  position: relative;
  width: 100%;

  ${({ isActive }) =>
    isActive
      ? css`
          background: ${({ theme }) => theme.colors.alphas.primary[4]};
        `
      : css`
          background: ${({ theme }) => theme.colors.alphas.primary[1]};

          &:hover {
            background: ${({ theme }) => theme.colors.alphas.primary[2]};
          }
        `}
`

const List = styled('ul')`
  background: ${({ theme }) => theme.colors.background};
  grid-column: 1;
  grid-row: 1;
  list-style: none;
  margin: 0;
  padding: 0;
  z-index: 1;
`

const Text = styled.span`
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`

const Wrapper = styled.div`
  display: grid;
  grid-template-columns: 1fr;
  grid-template-rows: 1fr;
  width: 13em;
`

export const EcosystemSelector = () => {
  const [isOpen, setIsOpen] = useState(false)
  const [{ ecosystemId }, setState] = useAtomState(stateHub)
  const ecosystemIds = useAtomValue(ecosystems)

  return (
    <Wrapper>
      {!isOpen ? (
        <Control onClick={() => setIsOpen(true)}>
          <Text title={ecosystemId}>{ecosystemId}</Text>
          <BsChevronExpand />
        </Control>
      ) : (
        <List>
          <Backdrop onClick={() => setIsOpen(false)} />
          {ecosystemIds.map(id => (
            <Item
              isActive={id === ecosystemId}
              key={id}
              onClick={() => {
                setState(state =>
                  id === state.ecosystemId
                    ? state
                    : { ...state, ecosystemId: id }
                )
                setIsOpen(false)
              }}
            >
              {id}
            </Item>
          ))}
        </List>
      )}
    </Wrapper>
  )
}
