import { useAtomInstance, useAtomSelector } from '@zedux/react'
import React from 'react'
import {
  getColors,
  getFlags,
  getLogLimit,
  stateHub,
} from '../../atoms/stateHub'
import styled, { DefaultTheme, useTheme } from '@zedux/react/ssc'
import { Checkbox, Input } from '../../styles'
import { RectType } from '../../types'

const getSettingRows = ({ theme }: { theme?: DefaultTheme }) =>
  theme && theme.width < RectType.Lg ? 'auto 1fr' : 'auto auto 1fr'

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
  align-self: stretch;
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
  display: ${({ theme }) => (theme.width < RectType.Lg ? 'none' : 'inline')};
  font-size: 0.9em;
`

const Grid = styled.div`
  column-gap: 0.5em;
  display: grid;
  grid-auto-rows: minmax(0, 1fr);
  grid-template-columns: repeat(12, minmax(0, 1fr));
  grid-template-rows: repeat(12, minmax(0, 1fr));
  padding: 0.5em;
  row-gap: 0.5em;
`

const SettingBig = styled.div`
  background: ${({ theme }) => theme.colors.alphas.white[0]};
  display: grid;
  grid-column: span ${({ theme }) => (theme.width < RectType.Md ? 6 : 4)};
  grid-row: span ${({ theme }) => (theme.height < RectType.Md ? 6 : 4)};
  grid-template-rows: ${getSettingRows};
  padding: 0.5em;
  perspective: 20em;
  place-items: center;
  transform-style: preserve-3d;
  row-gap: 0.5em;
`

const SettingMedium = styled.div`
  background: ${({ theme }) => theme.colors.alphas.white[0]};
  display: grid;
  grid-column: span
    ${({ theme }) =>
      theme.width < RectType.Md ? 6 : theme.width < RectType.Lg ? 4 : 3};
  grid-row: span
    ${({ theme }) =>
      theme.height < RectType.Md ? 6 : theme.height < RectType.Lg ? 4 : 3};
  grid-template-rows: ${getSettingRows};
  padding: 0.5em;
  place-items: center;
  row-gap: 0.5em;
`

export const Settings = () => {
  const stateHubInstance = useAtomInstance(stateHub)
  const { colors } = useTheme()
  const { background, primary, secondary } = useAtomSelector(getColors)
  const { isPersistingToLocalStorage, isWatchingStateHub } = useAtomSelector(
    getFlags
  )
  const logLimit = useAtomSelector(getLogLimit)

  return (
    <Grid>
      <SettingBig>
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
                stateHubInstance.exports.setColors({ background: color })
              }}
              type="radio"
            />
          ))}
        </ColorsGrid>
      </SettingBig>
      <SettingBig>
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
                stateHubInstance.exports.setColors({ primary: color })
              }}
              type="radio"
            />
          ))}
        </ColorsGrid>
      </SettingBig>
      <SettingBig>
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
                stateHubInstance.exports.setColors({ secondary: color })
              }}
              type="radio"
            />
          ))}
        </ColorsGrid>
      </SettingBig>
      <SettingMedium>
        <span>Watch StateHub</span>
        <Description>
          You can use the StateHub to inspect the StateHub itself. While this is
          cool and meta and all, there is some overhead. You should typically
          keep this off.
        </Description>
        <Checkbox
          isChecked={isWatchingStateHub}
          onChange={isChecked => {
            const { ecosystem } = stateHubInstance

            stateHubInstance.store.setStateDeep({
              isWatchingStateHub: isChecked,
            })

            isChecked
              ? ecosystem.registerPlugin(ecosystem.context?.plugin)
              : ecosystem.unregisterPlugin(ecosystem.context?.plugin)
          }}
          textOff="Off"
          textOn="Watching"
        />
      </SettingMedium>
      <SettingMedium>
        <span>Persist to localStorage</span>
        <Description>
          The StateHub saves lots of stuff to this page&apos;s localStorage.
          Disable this to reset the StateHub to its default state every reload
          (not recommended).
        </Description>
        <Checkbox
          isChecked={isPersistingToLocalStorage}
          onChange={isChecked => {
            stateHubInstance.store.setStateDeep({
              isPersistingToLocalStorage: isChecked,
            })
          }}
          textOff="Off"
          textOn="Persisting"
        />
      </SettingMedium>
      <SettingMedium>
        <span>Log Limit</span>
        <Description>
          The log is cool, but it prevents stuff from being garbage collected.
          Limit the history size to reduce the log&apos;s memory footprint.
        </Description>
        <Input
          onChange={event => {
            const { value } = event.currentTarget
            const asNum = +value
            if (typeof asNum !== 'number') return

            stateHubInstance.store.setStateDeep(state => ({
              ecosystemConfig: {
                [state.ecosystemId]: {
                  logLimit: asNum,
                },
              },
            }))
          }}
          value={logLimit}
        />
      </SettingMedium>
    </Grid>
  )
}
