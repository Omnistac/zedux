import { ActiveState } from '@zedux/react'
import styled, { useTheme } from '@zedux/react/ssc'
import React from 'react'

const Circle = styled.circle<{ $isActive: boolean }>`
  filter: ${({ $isActive }) => ($isActive ? 'none' : 'grayscale(0.5)')};
  opacity: ${({ $isActive }) => ($isActive ? 1 : 0.5)};
  stroke: ${({ theme }) => theme.colors.primary};
  stroke-width: 4;
`

const G = styled.g<{ index: number }>`
  transform-origin: center;
  transform: rotate(${({ index }) => index * 90}deg);
`

const GreyableGroup = styled.g<{ $isActive: boolean }>`
  filter: ${({ $isActive }) => ($isActive ? 'none' : 'grayscale(0.5)')};
  opacity: ${({ $isActive }) => ($isActive ? 1 : 0.5)};
`

const Grid = styled.div`
  display: grid;
  place-items: center;
`

const Line = styled.line`
  stroke: ${({ theme }) => theme.colors.primary};
  stroke-width: 4;
`

const Polygon = styled.polygon`
  fill: ${({ theme }) => theme.colors.primary};
`

const Svg = styled.svg`
  font-size: 11em;
`

const Text = styled.text<{ index: number; $isActive: boolean }>`
  fill: ${({ $isActive, theme }) =>
    $isActive ? '#222' : theme.colors.primary};
  filter: ${({ $isActive }) => ($isActive ? 'none' : 'grayscale(0.5)')};
  font-family: Arial, Helvetica, sans-serif;
  font-size: 12px;
  opacity: ${({ $isActive }) => ($isActive ? 1 : 0.5)};
  text-transform: uppercase;
  transform: rotate(${({ index }) => -(index * 90)}deg);
  transform-box: fill-box;
  transform-origin: center;
`

const isSkipTransition = (state: ActiveState, prevState?: ActiveState) =>
  state === ActiveState.Destroyed && prevState === ActiveState.Active

const Group = ({
  index,
  prevState,
  state,
  text,
}: {
  index: number
  prevState?: ActiveState
  state: ActiveState
  text: ActiveState
}) => {
  const { primary } = useTheme().colors
  const isActive = state === text || prevState === text
  const isActiveTransition = isSkipTransition(state, prevState)
    ? false
    : prevState === text

  return (
    <G index={index}>
      <Circle
        cx="45"
        cy="120"
        $isActive={state === text}
        r="43"
        fill={isActive ? primary : 'none'}
      />
      <Text
        x="45"
        y="120"
        dominantBaseline="middle"
        index={index}
        $isActive={isActive}
        textAnchor="middle"
      >
        {text}
      </Text>
      {index !== 3 && (
        <GreyableGroup $isActive={isActiveTransition}>
          <path
            d="M45 71 Q45 45 71 45"
            fill="none"
            stroke={primary}
            strokeWidth="4"
          />
          <Polygon points="65,35 75,45 65,55" />
        </GreyableGroup>
      )}
    </G>
  )
}

export const ActiveStateGraphic = ({
  className,
  prevState,
  state,
}: {
  className?: string
  prevState?: ActiveState
  state: ActiveState
}) => {
  const lineIsActive = isSkipTransition(state, prevState)

  return (
    <Grid>
      <Svg className={className} height="1em" viewBox="0 0 240 240" width="1em">
        {[
          ActiveState.Initializing,
          ActiveState.Active,
          ActiveState.Stale,
          ActiveState.Destroyed,
        ].map((text, index) => (
          <Group
            index={index}
            key={text}
            text={text as ActiveState}
            prevState={prevState}
            state={state}
          />
        ))}
        <GreyableGroup $isActive={lineIsActive}>
          <Line x1="120" x2="120" y1="94" y2="146" />
          <Polygon points="130,140 120,150 110,140" />
        </GreyableGroup>
      </Svg>
    </Grid>
  )
}
