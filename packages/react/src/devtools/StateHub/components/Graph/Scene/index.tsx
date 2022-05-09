import { EdgeFlag, useAtomInstance, useAtomValue, useEcosystem } from '@zedux/react'
import styled from '@zedux/react/ssc'
import React, { Fragment, useMemo, useRef } from 'react'
import { ecosystemAtomInstances } from '../../../atoms/ecosystemWrapper'
import { rect } from '../../../atoms/rect'
import { stateHub } from '../../../atoms/stateHub'
import { Route } from '../../../types'
import { graph, nodeRadius, nodeSize, size } from '../atom'
import { NodeIcon } from './NodeIcon'
import { useFilteredInstances } from './useFilteredInstances'
import { usePositioning } from './usePositioning'

const Arrow = styled.polygon<{ $angle: number }>`
  fill: ${({ theme }) => theme.colors.secondary};
  transform: rotate(${({ $angle }) => $angle}deg);
  transform-box: fill-box;
  transform-origin: center bottom;
`

const Edge = styled.path`
  fill: none;
  stroke: ${({ theme }) => theme.colors.secondary};
`

const Node = styled.g<{
  $isHighlighted: boolean
  $transformX: number
  $transformY: number
}>`
  cursor: pointer;
  filter: grayscale(${({ $isHighlighted }) => ($isHighlighted ? 0 : 1)});
  transform: translate(
      ${({ $transformX, $transformY }) => `${$transformX}px, ${$transformY}px`}
    )
    scale(${({ $isHighlighted }) => ($isHighlighted ? 1 : 0.5)});
  transition: transform 0.1s;

  &:hover {
    & > circle {
      stroke: ${({ theme }) => theme.colors.alphas.primary[5]};
    }
    & > text {
      fill: ${({ theme }) => theme.colors.alphas.primary[5]};
    }
  }
`

const NodeText = styled.text<{ scale: number }>`
  dominant-baseline: middle;
  fill: ${({ theme }) => theme.colors.primary};
  filter: ${({ scale, theme }) =>
    Array(3)
      .fill(`drop-shadow(0px 0px ${4 * scale}px ${theme.colors.background})`)
      .join(' ')};
  font-size: ${({ scale }) => 12 * scale}px;
  text-anchor: middle;
`

const Svg = styled.svg`
  cursor: grab;
  user-select: none;
`

const levelSize = 6
const middle = size / 2
const levelThresholds: Record<number, number> = {
  0: levelSize,
}

const getLevel = (index: number) => {
  let level = 0
  while (index > levelThresholds[level]) {
    levelThresholds[++level] =
      levelThresholds[level - 1] + Math.floor(levelSize * 2 ** (level * 0.6))
  }
  return level
}

const getCoords = (
  index: number,
  distancePerLevel: number,
  graphSize: number
) => {
  if (index === 0) return [middle, middle]

  const level = getLevel(index)
  const prevLevelThreshold = levelThresholds[level - 1] || 0
  let numOnLevel = levelThresholds[level] - prevLevelThreshold
  const levelIndex = index - prevLevelThreshold

  if (graphSize < index + numOnLevel - levelIndex) {
    numOnLevel = graphSize - prevLevelThreshold - 1
  }

  const degreeIncrement = 360 / numOnLevel
  const angleDegrees =
    degreeIncrement * levelIndex + (level % 2 ? degreeIncrement / 2 : 0)
  const angleRadians = (angleDegrees * Math.PI) / 180
  const distance = (level + 1) * distancePerLevel
  const x = Math.cos(angleRadians) * distance
  const y = Math.sin(angleRadians) * distance

  return [x + middle, y + middle]
}

const translate = (coord: number, by: number) => {
  if (!coord) return 0

  return coord > 0 ? coord + by : coord - by
}

export const Scene = () => {
  const ecosystem = useEcosystem()
  const atomInstances = useAtomValue(ecosystemAtomInstances)
  const pos = useAtomValue(rect)
  const svgRef = useRef<SVGSVGElement>(null)
  const { offsetX, offsetY, zoom } = useAtomValue(graph)
  const { store } = useAtomInstance(graph)

  usePositioning(store, svgRef)
  const filteredInstances = useFilteredInstances(atomInstances)

  const sortedInstances = useMemo(
    () =>
      atomInstances.sort((a, b) => {
        const nodeA = a.ecosystem._graph.nodes[a.keyHash]
        const nodeB = b.ecosystem._graph.nodes[b.keyHash]

        return (
          Object.keys(nodeB.dependents).length -
          Object.keys(nodeA.dependents).length
        )
      }),
    [atomInstances]
  )

  // a logarithmic curve with a horizontal asymptote at y=0 (+ 2 removes
  // division by zero and -Infinity nonsense)
  const scale = (1 / Math.log(sortedInstances.length + 2)) * 2
  const scaledRadius = nodeRadius * scale
  const scaledSize = nodeSize * scale

  return (
    <Svg
      height="100%"
      ref={svgRef}
      viewBox={`${offsetX} ${offsetY} ${zoom} ${zoom}`}
      width="100%"
    >
      {sortedInstances.map((instance, index) => {
        const {
          atom,
          ecosystem: { _graph },
          keyHash,
        } = instance
        const isHighlighted = filteredInstances[keyHash]
        const [x, y] = getCoords(index, scaledSize, sortedInstances.length)
        const { dependents } = _graph.nodes[keyHash]

        return (
          <Fragment key={keyHash}>
            {Object.entries(dependents).map(([key, edge]) => {
              if (edge.flags & EdgeFlag.External) return null

              const radius = isHighlighted ? scaledRadius : scaledRadius / 2
              const [dependentX, dependentY] = getCoords(
                sortedInstances.findIndex(instance => instance.keyHash === key),
                scaledSize,
                sortedInstances.length
              )
              const xDiff = dependentX - x
              const yDiff = dependentY - y
              const controlPointX = xDiff * 0.75
              const controlPointY = yDiff * 0.25
              const xStraight = xDiff * 0.5
              const yStraight = yDiff * 0.5
              const middleX = (controlPointX + xStraight) / 2
              const middleY = (controlPointY + yStraight) / 2
              const distance = Math.sqrt(middleX ** 2 + middleY ** 2)
              const distancePercent = (distance - radius) / distance
              const targetX =
                (controlPointX - middleX) * distancePercent + middleX
              const targetY =
                (controlPointY - middleY) * distancePercent + middleY
              const max = Math.max(Math.abs(targetX), Math.abs(targetY))
              const squareX = targetX / max
              const squareY = targetY / max
              const d =
                Math.sqrt(
                  squareX ** 2 + squareY ** 2 - squareX ** 2 * squareY ** 2
                ) / Math.sqrt(squareX ** 2 + squareY ** 2)
              const unitCircleX = squareX * d
              const unitCircleY = squareY * d
              const circleX = unitCircleX * (radius + 10 * scale)
              const circleY = unitCircleY * (radius + 10 * scale)
              const shiftedAngleX = translate(
                controlPointX,
                (radius + 8 * scale) / 2
              )
              const shiftedAngleY = translate(
                controlPointY,
                (radius + 8 * scale) / 2
              )
              const angle =
                (Math.atan(circleY / circleX) * 180) / Math.PI +
                (circleX < 0 ? 180 : 0)

              return (
                <g key={key}>
                  <Edge
                    d={`M${x + unitCircleX * (radius + 8 * scale)} ${
                      y + unitCircleY * (radius + 8 * scale)
                    } Q${x + shiftedAngleX} ${
                      y + shiftedAngleY
                    } ${dependentX} ${dependentY}`}
                    strokeWidth={1 * scale}
                  />
                  <Arrow
                    $angle={angle - 90}
                    points={`${x + circleX},${y + circleY - 5 * scale} ${
                      x + circleX + 4 * scale
                    },${y + circleY}, ${x + circleX - 4 * scale},${
                      y + circleY
                    }`}
                  />
                </g>
              )
            })}
            <Node
              onClick={() => {
                ecosystem.getInstance(stateHub).store.setStateDeep(state => ({
                  ecosystemConfig: {
                    [state.ecosystemId]: {
                      route: Route.Atoms,
                      selectedAtomInstanceKeyHash: keyHash,
                    },
                  },
                }))
              }}
              $isHighlighted={isHighlighted}
              $transformX={x}
              $transformY={y}
            >
              <NodeIcon
                scale={scale}
                type={atom.constructor.name === 'Ion' ? 'ion' : 'atom'}
              />
              <NodeText scale={scale} x="0" y="0">
                {`${keyHash.slice(0, 30)}${keyHash.length > 30 ? '...' : ''}`}
              </NodeText>
            </Node>
          </Fragment>
        )
      })}
    </Svg>
  )
}
