import React from 'react'
import styled, { keyframes } from '@site/src/ssc'

const swing = keyframes`
  0% {
    transform: rotateZ(0);
  }
  100% {
    transform: rotateZ(20deg);
  }
`

const Ring = styled.circle`
  fill: none;
  stroke: var(--color-primary);
  stroke-width: 20;
`

const Group = styled.g<{ rotate: number }>`
  transform: rotateZ(${({ rotate }) => rotate}deg) rotateY(80deg);
  transform-origin: center;
  transform-style: preserve-3d;
`

const OuterGroup = styled.g<{ index?: number }>`
  animation: ${swing} 6s ${({ index }) => (index || 0) * 2}s alternate infinite
    ease;
  transform-origin: center;
`

const Svg = styled.svg`
  display: block;
`

export const Atom = () => {
  return (
    <Svg viewBox="0 0 240 240">
      <OuterGroup>
        <Group rotate={0}>
          <Ring cx="120" cy="120" r="100" />
        </Group>
      </OuterGroup>
      <OuterGroup index={1}>
        <Group rotate={120}>
          <Ring cx="120" cy="120" r="100" />
        </Group>
      </OuterGroup>
      <OuterGroup index={2}>
        <Group rotate={240}>
          <Ring cx="120" cy="120" r="100" />
        </Group>
      </OuterGroup>
    </Svg>
  )
}
