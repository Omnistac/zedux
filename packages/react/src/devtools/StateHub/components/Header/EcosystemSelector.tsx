import { useAtomState, useAtomValue } from '@zedux/react'
import React, { useState } from 'react'
import { BsChevronExpand } from 'react-icons/bs'
import { ecosystems } from '../../atoms/ecosystems'
import { stateHub } from '../../atoms/stateHub'
import styled, { css } from '../../simple-styled-components'
import { colors } from '../../styles'

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
  background: ${colors.alphas.main[1]};
  border: none;
  color: ${colors.white};
  cursor: pointer;
  display: flex;
  flex-flow: row nowrap;
  font-size: inherit;
  grid-column: 1;
  grid-row: 1;
  height: 100%;
  padding: 0 0.5em;

  &:hover {
    background: ${colors.alphas.main[2]};
  }
`

const Item = styled.button<{ isActive: boolean }>`
  appearance: none;
  border: none;
  color: ${colors.white};
  cursor: pointer;
  display: block;
  font-size: inherit;
  padding: 0.5em;
  position: relative;
  width: 100%;

  ${({ isActive }) =>
    isActive
      ? css`
          background: ${colors.alphas.main[4]};
        `
      : css`
          background: transparent;

          &:hover {
            background: ${colors.alphas.main[2]};
          }
        `}
`

const List = styled('ul')`
  background: ${colors.alphas.main[1]};
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
  width: 11em;
`

export const EcosystemSelector = () => {
  const [isOpen, setIsOpen] = useState(false)
  const [{ ecosystem }, setState] = useAtomState(stateHub)
  const ecosystemIds = useAtomValue(ecosystems)

  return (
    <Wrapper>
      {!isOpen ? (
        <Control onClick={() => setIsOpen(true)}>
          <Text title={ecosystem}>{ecosystem}</Text>
          <BsChevronExpand />
        </Control>
      ) : (
        <List>
          <Backdrop onClick={() => setIsOpen(false)} />
          {ecosystemIds.map(id => (
            <Item
              isActive={id === ecosystem}
              key={id}
              onClick={() => {
                setState(state => ({ ...state, ecosystem: id }))
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
