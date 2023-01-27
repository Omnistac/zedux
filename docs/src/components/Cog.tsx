import React from 'react'
import styled, { keyframes } from '@site/src/ssc'

const spin = (size: number) => keyframes`
  0% {
    transform: scale(${size}) rotate(0);
  }
  100% {
    transform: scale(${size}) rotate(360deg);
  }
`

const Circle = styled.circle`
  fill: none;
  stroke: var(--color-primary);
  stroke-width: 30;
`

const Group = styled.g<{ speed: number; size: number }>`
  animation: ${({ size }) => spin(size)} ${({ speed }) => speed}s infinite
    linear;
  transform-origin: center;
`

const Rect = styled.rect<{ rotate?: boolean }>`
  fill: var(--color-primary);
  transform: ${({ rotate }) => (rotate ? 'rotate(45deg)' : '')};
  transform-box: fill-box;
  transform-origin: center;
`

const Svg = styled.svg`
  display: block;
`

export const Cog = ({ speed }: { speed: number }) => {
  const cog = (
    <>
      <Circle cx="120" cy="120" r="80" />
      {Array(8)
        .fill(null)
        .map((_, i) => {
          const x = 100 + 100 * Math.sin(i * (Math.PI * 0.25))
          const y = 100 + 100 * Math.cos(i * (Math.PI * 0.25))

          return (
            <Rect
              key={i}
              x={x}
              y={y}
              height={40}
              style={i % 2 ? { transform: 'rotate(45deg)' } : {}}
              width={40}
            />
          )
        })}
    </>
  )

  return (
    <Svg viewBox="0 0 240 240">
      <Group speed={speed} size={0.25} x="40">
        {cog}
      </Group>
      <Group speed={speed * 2} size={0.5} x="180">
        {cog}
      </Group>
      <Group speed={speed * 4} size={1} x="120">
        {cog}
      </Group>
    </Svg>
  )
}
