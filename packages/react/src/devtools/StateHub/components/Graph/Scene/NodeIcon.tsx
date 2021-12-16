import React from 'react'
import styled from '@zedux/react/ssc'

const Ellipse = styled.ellipse<{ rotate: number; scale: number }>`
  fill: ${({ theme }) => theme.colors.background};
  stroke: ${({ theme }) => theme.colors.primary};
  stroke-width: ${({ scale }) => 2 * scale};
  transform: rotate(${({ rotate }) => rotate}deg);
  transition: transform 0.1s;
`

export const NodeIcon = ({
  scale,
  type,
}: {
  scale: number
  type: 'atom' | 'ion'
}) => {
  return (
    <g>
      <Ellipse
        cx={0}
        cy={0}
        rotate={type === 'atom' ? 0 : 45}
        rx={15 * scale}
        ry={50 * scale}
        scale={scale}
      />
      <Ellipse
        cx={0}
        cy={0}
        rotate={type === 'atom' ? 120 : 135}
        rx={15 * scale}
        ry={50 * scale}
        scale={scale}
      />
      {type === 'atom' && (
        <Ellipse
          cx={0}
          cy={0}
          rotate={240}
          rx={15 * scale}
          ry={50 * scale}
          scale={scale}
        />
      )}
    </g>
  )
}
