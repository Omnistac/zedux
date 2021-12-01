import { useAtomInstance, useAtomSelector } from '@zedux/react'
import React from 'react'
import { stateHub } from '../../atoms/stateHub'
import styled, { useTheme } from '@zedux/react/ssc'

const Color = styled.input<{ color: string }>`
  appearance: none;
  background: ${({ color }) => color};
  border: none;
  border-radius: 6px;
  cursor: pointer;
  margin: 0;
  outline: none;
  padding: 0;
  transition: transform 0.1s;

  &:checked {
    border: 1px solid ${({ theme }) => theme.colors.white};
    transform: scale(1.1);
    z-index: 1;
  }

  &:not(:checked):hover {
    transform: scale(1.05);
  }
`

const ColorsGrid = styled.div`
  background: ${({ theme }) => theme.colors.alphas.white[4]};
  display: grid;
  grid-auto-flow: column;
  grid-template-rows: minmax(0, 1fr);
  justify-self: stretch;
  padding: 0.5em;
  transform: translateZ(3em) rotate3d(1, 0, 0, 20deg) scale(0.7);
`

const Description = styled.span`
  color: ${({ theme }) => theme.colors.alphas.white[4]};
  font-size: 0.9em;
`

const Grid = styled.div`
  column-gap: 0.5em;
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  grid-template-rows: repeat(3, minmax(0, 1fr));
  padding: 0.5em;
  row-gap: 0.5em;
`

const Setting = styled.div`
  background: ${({ theme }) => theme.colors.alphas.white[0]};
  display: grid;
  grid-template-rows: auto auto 1fr;
  justify-items: center;
  padding: 0.5em;
  perspective: 20em;
  transform-style: preserve-3d;
  row-gap: 0.5em;
`

export const Settings = () => {
  const { colors } = useTheme()
  const { background, primary, secondary } = useAtomSelector(
    ({ get }) => get(stateHub).colors
  )

  // we can't dereference the Store class's `setStateDeep` method (it isn't a property like setState)
  const { store } = useAtomInstance(stateHub)

  return (
    <Grid>
      <Setting>
        <span>Background</span>
        <Description>The thing behind all the things</Description>
        <ColorsGrid>
          {colors.bgs.map(color => (
            <Color
              color={color}
              checked={color === background}
              key={color}
              name="zedux-state-hub-select-background"
              onChange={() => {
                store.setStateDeep({ colors: { background: color } })
              }}
              type="radio"
            />
          ))}
        </ColorsGrid>
      </Setting>
      <Setting>
        <span>Primary</span>
        <Description>The main accent color</Description>
        <ColorsGrid>
          {colors.fgs.map(color => (
            <Color
              color={color}
              checked={color === primary}
              key={color}
              name="zedux-state-hub-select-primary"
              onChange={() => {
                store.setStateDeep({ colors: { primary: color } })
              }}
              type="radio"
            />
          ))}
        </ColorsGrid>
      </Setting>
      <Setting>
        <span>Secondary</span>
        <Description>The secondary accent color</Description>
        <ColorsGrid>
          {colors.fgs.map(color => (
            <Color
              color={color}
              checked={color === secondary}
              key={color}
              name="zedux-state-hub-select-secondary"
              onChange={() => {
                store.setStateDeep({ colors: { secondary: color } })
              }}
              type="radio"
            />
          ))}
        </ColorsGrid>
      </Setting>
    </Grid>
  )
}
