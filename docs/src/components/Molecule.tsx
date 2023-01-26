import { AnimatePresence, motion } from 'framer-motion'
import React, { useEffect, useState } from 'react'
import styled from 'styled-components'

const Circle = motion(styled.circle`
  box-shadow: inset -5 -5 8 rgba(0, 0, 0, 0.5);
  fill: var(--color-primary);
  transform-box: fill-box;
  transform-origin: center;
`)

const Line = styled.line`
  stroke: var(--color-primary);
  stroke-width: 5;
`

const Svg = styled.svg`
  display: block;
`

const animation = {
  animate: { scale: 1 },
  exit: { scale: 0 },
  initial: { scale: 0 },
  transition: { type: 'spring', stiffness: 100 },
}

export const Molecule = ({ speed = 1500 }: { speed?: number }) => {
  const [i, setI] = useState(0)

  useEffect(() => {
    const handle = setInterval(() => {
      setI(state => (state + 1) % 5)
    }, speed)

    return () => clearInterval(handle)
  }, [speed])

  return (
    <Svg speed={speed} viewBox="0 0 240 240">
      <AnimatePresence>
        {i !== 0 && <Circle {...animation} cx="25" cy="50" r="20" />}
      </AnimatePresence>
      <AnimatePresence>
        {i !== 0 && <Line x1="25" y1="50" x2="50" y2="120" />}
      </AnimatePresence>
      <Circle {...animation} cx="50" cy="120" r="15" />
      <Line x1="50" y1="120" x2="120" y2="120" />
      <AnimatePresence>
        {i !== 1 && <Line x1="50" y1="120" x2="25" y2="190" />}
      </AnimatePresence>
      <AnimatePresence>
        {i !== 1 && <Circle {...animation} cx="25" cy="190" r="20" />}
      </AnimatePresence>
      <Circle {...animation} cx="120" cy="120" r="20" />
      <Line x1="120" y1="120" x2="160" y2="180" />
      <AnimatePresence>
        {i !== 2 && <Line x1="120" y1="120" x2="155" y2="70" />}
      </AnimatePresence>
      <AnimatePresence>
        {i !== 2 && <Circle {...animation} cx="155" cy="70" r="15" />}
      </AnimatePresence>
      <AnimatePresence>
        {i !== 2 && i !== 3 && <Line x1="155" y1="70" x2="120" y2="25" />}
      </AnimatePresence>
      <AnimatePresence>
        {i !== 2 && i !== 3 && (
          <Circle {...animation} cx="120" cy="25" r="20" />
        )}
      </AnimatePresence>
      <Circle {...animation} cx="160" cy="180" r="15" />
      <Line x1="160" y1="180" x2="215" y2="180" />
      <AnimatePresence>
        {i === 4 && <Line x1="160" y1="180" x2="120" y2="215" />}
      </AnimatePresence>
      <AnimatePresence>
        {i === 4 && <Circle {...animation} cx="120" cy="215" r="20" />}
      </AnimatePresence>
      <Circle {...animation} cx="215" cy="180" r="20" />
    </Svg>
  )
}
