import styled from '@zedux/react/ssc'
import React, { FC, ReactElement } from 'react'

const Label = styled.label<{ isChecked?: boolean }>`
  align-items: center;
  background: ${({ isChecked, theme }) =>
    isChecked ? theme.colors.alphas.primary[3] : theme.colors.alphas.white[1]};
  color: ${({ isChecked }) => (isChecked ? 'inherit' : '#888')};
  column-gap: 0.5em;
  cursor: pointer;
  display: grid;
  grid-template-columns: auto auto;
  justify-content: center;
  padding: 0.7em;
  position: relative;

  &:hover {
    background: ${({ theme }) => theme.colors.alphas.white[2]};
  }
`

const Input = styled.input`
  appearance: none;
  cursor: pointer;
  height: 100%;
  left: 0;
  margin: 0;
  position: absolute;
  top: 0;
  width: 100%;
`

const Text = styled.span<{ isVisible?: boolean }>`
  grid-column: 2;
  grid-row: 1;
  overflow: hidden;
  position: relative;
  text-overflow: ellipsis;
  visibility: ${({ isVisible }) => (isVisible ? 'visible' : 'hidden')};
  white-space: nowrap;
`

const ToggleKnob = styled.span<{ isChecked?: boolean }>`
  background: ${({ theme }) => theme.colors.white};
  display: inline-block;
  height: 1em;
  margin-left: ${({ isChecked }) => (isChecked ? '100%' : 0)};
  transform: translateX(${({ isChecked }) => (isChecked ? '-100%' : 0)})
    scale(1.5);
  transition: margin 0.1s, transform 0.1s;
  width: 0.5em;
`

const ToggleTrack = styled.span<{ isChecked?: boolean }>`
  background: ${({ isChecked, theme }) =>
    isChecked ? theme.colors.primary : '#888'};
  line-height: 0;
  width: 2em;
`

export const Checkbox: FC<{
  isChecked?: boolean
  onChange: (isChecked: boolean) => void
  textOff: string | ReactElement
  textOn: string | ReactElement
}> = ({ isChecked, onChange, textOff, textOn }) => {
  return (
    <Label isChecked={isChecked}>
      <Input
        checked={!!isChecked}
        onChange={event => onChange(event.currentTarget.checked)}
        type="checkbox"
      />
      <ToggleTrack isChecked={isChecked}>
        <ToggleKnob isChecked={isChecked} />
      </ToggleTrack>
      <Text isVisible={!isChecked}>{textOff}</Text>
      <Text isVisible={isChecked}>{textOn}</Text>
    </Label>
  )
}
