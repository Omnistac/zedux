import { useAtomInstance, useAtomValue } from '@zedux/react'
import React from 'react'
import styled from 'styled-components'
import { positionAtom } from '../atoms/position'
import { Size } from '../types'

const sizes = Array(6)
  .fill(0)
  .map((_, i) => i as Size)

const Line = styled.div`
  align-items: flex-start;
  display: flex;
  flex-flow: row nowrap;
  margin-right: 1em;
`

const SizeControl = styled.input<{ size: Size }>`
  appearance: none;
  background: rgba(255, 255, 255, 0.1);
  border: none;
  border-radius: 0;
  cursor: pointer;
  height: ${({ size }) => (80 / 5) * size + 20}%;
  outline: none;
  margin: 0;
  padding: 0;
  width: 1em;

  &:hover {
    background: rgba(255, 255, 255, 0.2);
  }

  &:checked {
    background: rgba(255, 255, 255, 0.4);
  }
`

const SizeWrapper = ({ size }: { size: Size }) => {
  const { size: activeSize } = useAtomValue(positionAtom)
  const { setSize } = useAtomInstance(positionAtom).exports
  const isChecked = size === activeSize

  return (
    <SizeControl
      checked={isChecked}
      name="zedux-state-hub-select-size"
      onChange={({ currentTarget }) => {
        if (!currentTarget.checked) return

        setSize(size)
      }}
      size={size}
      type="radio"
    />
  )
}

export const SizeControls = () => {
  return (
    <Line>
      {sizes.map(size => (
        <SizeWrapper key={size} size={size} />
      ))}
    </Line>
  )
}
