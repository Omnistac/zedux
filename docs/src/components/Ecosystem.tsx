import { AnimatePresence, motion } from 'framer-motion'
import React, { useEffect, useState } from 'react'
import styled, { keyframes } from '@site/src/ssc'

const swing = keyframes`
  0% {
    transform: rotateZ(0);
  }
  100% {
    transform: rotateZ(20deg);
  }
`

const Group = styled.g`
  animation: ${swing} 6s alternate infinite ease;
  transform-origin: center;
`

const Ring = styled.circle<{ index: number }>`
  fill: none;
  stroke: var(--color-primary);
  stroke-width: 20;
  transform: rotateZ(${({ index }) => index * 70}deg) rotateY(80deg);
  transform-origin: center;
`

const Svg = styled.svg`
  display: block;
`

const NUM_RINGS = 8

const animation = {
  animate: { scale: 1 },
  exit: { scale: 0 },
  initial: { scale: 0 },
  transition: { stiffness: 100, type: 'spring' },
}

export const Ecosystem = ({ speed = 1500 }: { speed?: number }) => {
  const [counter, setCounter] = useState(0)

  useEffect(() => {
    const handle = setInterval(() => {
      setCounter(state => (state + 1) % NUM_RINGS)
    }, speed)

    return () => clearInterval(handle)
  }, [speed])

  return (
    <Svg viewBox="0 0 240 240">
      {Array(NUM_RINGS)
        .fill(null)
        .map((_, i) => (
          <AnimatePresence key={i}>
            {counter >= i && (
              <motion.g {...animation}>
                <Group>
                  <Ring
                    cx="120"
                    cy="120"
                    r={(90 / NUM_RINGS) * (i + 1) + 10}
                    index={i}
                  />
                </Group>
              </motion.g>
            )}
          </AnimatePresence>
        ))}
    </Svg>
  )
}
